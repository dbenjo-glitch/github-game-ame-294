// EndScene.js
// The two terminal states of the game.
//   WIN   a panel pops up with the time taken while a snake crawls across
//         the solved board and eats every mine.
//   LOSS  game over, either from a 4th bomb or from crashing in Snake.

class EndScene extends Phaser.Scene {
  constructor() { super('End'); }

  init(data) {
    this.result = data.result;                 // 'win' or 'lose'
    this.reason = data.reason || '';           // 'bombs' or 'snake'
    this.coinsEarned = data.coinsEarned || 0;
  }

  create() {
    const W = CONFIG.WIDTH;
    const C = CONFIG.COLORS;
    const run = State.run;
    const won = this.result === 'win';
    this.cameras.main.setBackgroundColor(C.bg);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.mineIcons = {};
    this.drawBoard(run.board, won);

    // ---- Pop-up panel above the board ----
    const panel = this.add.container(W / 2, 74).setDepth(40);
    panel.add(this.add.rectangle(0, 0, 432, 124, C.panel).setStrokeStyle(3, won ? C.good : C.bad));
    if (won) {
      panel.add(UI.text(this, 0, -36, 'BOARD CLEARED!', 28, C.textGood));
      panel.add(UI.text(this, 0, 2, 'YOUR TIME', 13, C.textDim));
      panel.add(UI.text(this, 0, 32, UI.formatTime(run.elapsedMs), 38, C.textAccent));
    } else {
      panel.add(UI.text(this, 0, -30, 'GAME OVER', 36, C.textBad));
      const why = this.reason === 'snake' ? 'The snake crashed. No redemption.' : 'Fourth bomb. There is no redemption 4.';
      panel.add(UI.text(this, 0, 14, why, 15, C.text));
      panel.add(UI.text(this, 0, 40, 'Time ' + UI.formatTime(run.elapsedMs), 13, C.textDim));
    }
    panel.setScale(0.2);
    this.tweens.add({ targets: panel, scale: 1, duration: 380, delay: 150, ease: 'Back.Out' });

    // ---- Stats and buttons below the board ----
    const used = Math.min(run.bombsHit, CONFIG.REDEMPTION_TARGETS.length);
    UI.text(this, W / 2, 606, 'SCORE ' + run.score + '    REDEMPTIONS USED ' + used + '/' + CONFIG.REDEMPTION_TARGETS.length, 14, C.text);
    if (won) {
      UI.text(this, W / 2, 630, '+' + this.coinsEarned + ' COINS   (TOTAL ' + State.coins + ')', 15, C.textAccent);
    } else {
      UI.text(this, W / 2, 630, 'Clear the board to earn coins.', 13, C.textDim);
    }
    UI.button(this, W / 2 - 112, 680, 208, 50, 'PLAY AGAIN', () => this.again());
    UI.button(this, W / 2 + 112, 680, 208, 50, 'MENU', () => this.menu(), C.panel);
    this.input.keyboard.once('keydown-SPACE', () => this.again());

    if (won) this.time.delayedCall(700, () => this.startMineEater(run.board));
  }

  again() {
    State.newRun();
    this.scene.start('Minesweeper');
  }

  menu() {
    this.scene.start('Start');
  }

  // The finished board, drawn dim, with every mine showing.
  drawBoard(board, won) {
    const C = CONFIG.COLORS;
    const T = CONFIG.TILE;
    board.cells.forEach((cell, i) => {
      const p = UI.tileCenter(Board.col(board, i), Board.row(board, i));
      let fill = C.tileOpen;
      if (cell.exploded) fill = C.tileBoom;
      else if (!cell.revealed && !cell.mine) fill = C.tile;
      this.add.rectangle(p.x, p.y, T - 4, T - 4, fill).setAlpha(0.85);
      if (cell.mine) {
        this.mineIcons[i] = UI.mine(this, p.x, p.y, 11);
      } else if (cell.revealed && cell.adjacent > 0) {
        UI.text(this, p.x, p.y, String(cell.adjacent), 26, CONFIG.NUMBER_COLORS[cell.adjacent]).setAlpha(won ? 0.35 : 0.6);
      }
    });
  }

  // WIN animation: a snake enters from the left, visits every mine by the
  // nearest-next route, eats each one, then leaves off the right edge.
  startMineEater(board) {
    const N = board.size;
    const T = CONFIG.TILE;
    const mines = Board.mineIndexes(board).map(i => ({ i, c: Board.col(board, i), r: Board.row(board, i) }));
    if (!mines.length) return;

    // Order the mines: always go to the closest one that is left.
    const route = [];
    let cur = { c: -1, r: mines[0].r };
    const left = mines.slice();
    while (left.length) {
      left.sort((a, b) => (Math.abs(a.c - cur.c) + Math.abs(a.r - cur.r)) - (Math.abs(b.c - cur.c) + Math.abs(b.r - cur.r)));
      cur = left.shift();
      route.push(cur);
    }

    // Turn the route into single-tile steps: sideways first, then up or down.
    const path = [];
    let pos = { c: -3, r: route[0].r };
    const walkTo = (c, r) => {
      while (pos.c !== c) { pos = { c: pos.c + Math.sign(c - pos.c), r: pos.r }; path.push(pos); }
      while (pos.r !== r) { pos = { c: pos.c, r: pos.r + Math.sign(r - pos.r) }; path.push(pos); }
    };
    route.forEach(m => walkTo(m.c, m.r));
    walkTo(N + 6, pos.r);

    const gfx = this.add.graphics().setDepth(10);
    const maskShape = this.make.graphics();
    maskShape.fillRect(CONFIG.GRID_X, CONFIG.GRID_Y, N * T, N * T);
    gfx.setMask(maskShape.createGeometryMask());

    const color = State.skin().color;
    const body = [];
    const maxLen = 5;
    let step = 0;
    this.time.addEvent({
      delay: 75,
      repeat: path.length - 1,
      callback: () => {
        const cell = path[step++];
        body.unshift(cell);
        if (body.length > maxLen) body.pop();

        // Eat the mine on this tile, if there is one.
        if (cell.c >= 0 && cell.c < N && cell.r >= 0 && cell.r < N) {
          const idx = Board.index(board, cell.c, cell.r);
          const icon = this.mineIcons[idx];
          if (icon) {
            delete this.mineIcons[idx];
            this.tweens.add({ targets: icon, scale: 0, duration: 140, onComplete: () => icon.destroy() });
            const p = UI.tileCenter(cell.c, cell.r);
            const pop = UI.text(this, p.x, p.y - 6, 'CHOMP', 13, CONFIG.COLORS.textGood).setDepth(12);
            this.tweens.add({ targets: pop, y: p.y - 34, alpha: 0, duration: 600, onComplete: () => pop.destroy() });
          }
        }

        gfx.clear();
        for (let k = body.length - 1; k >= 0; k--) {
          const p = UI.tileCenter(body[k].c, body[k].r);
          gfx.fillStyle(color, k === 0 ? 1 : 0.8);
          gfx.fillRoundedRect(p.x - T / 2 + 5, p.y - T / 2 + 5, T - 10, T - 10, 10);
        }
        const h = UI.tileCenter(body[0].c, body[0].r);
        gfx.fillStyle(0x0b0d1c, 1);
        gfx.fillCircle(h.x - 8, h.y - 6, 4);
        gfx.fillCircle(h.x + 8, h.y - 6, 4);
      }
    });
  }
}
