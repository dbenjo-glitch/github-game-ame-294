// MinesweeperScene.js
// The main game. Draws the board from State (so it comes back exactly as the
// player left it after a trip to Snake) and owns three things:
//   REWARD  points for every safe tile revealed
//   DAMAGE  hitting a bomb: boom, lose a redemption, get tunneled into Snake
//   END     clearing the board (win) or hitting a 4th bomb (loss)

class MinesweeperScene extends Phaser.Scene {
  constructor() { super('Minesweeper'); }

  init(data) {
    this.returned = !!(data && data.returned);   // true when coming back from Snake
  }

  create() {
    const W = CONFIG.WIDTH;
    const C = CONFIG.COLORS;
    this.run = State.run;
    this.board = this.run.board;
    this.locked = false;       // true while an explosion or transition plays
    this.flagMode = false;

    this.cameras.main.setBackgroundColor(C.bg);
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.input.mouse.disableContextMenu();

    // ---- HUD ----
    UI.text(this, W / 2, 30, CONFIG.TITLE, 18, C.textDim);
    UI.text(this, 24, 66, 'SCORE', 12, C.textDim, 0, 0.5);
    this.scoreText = UI.text(this, 24, 90, '0', 24, C.text, 0, 0.5);
    UI.text(this, W / 2, 66, 'TIME', 12, C.textDim);
    this.timeText = UI.text(this, W / 2, 90, '00:00', 24, C.text);
    UI.text(this, W - 24, 66, 'REDEMPTIONS LEFT', 12, C.textDim, 1, 0.5);
    this.pips = [];
    for (let i = 0; i < CONFIG.REDEMPTION_TARGETS.length; i++) {
      this.pips.push(this.add.circle(W - 36 - i * 28, 90, 10, C.good).setStrokeStyle(2, C.grid));
    }
    this.minesText = UI.text(this, 24, 128, '', 13, C.textDim, 0, 0.5);
    this.statusText = UI.text(this, W - 24, 128, '', 13, C.textAccent, 1, 0.5);

    // ---- Board ----
    this.tiles = [];
    const T = CONFIG.TILE;
    for (let i = 0; i < this.board.cells.length; i++) {
      const col = Board.col(this.board, i);
      const row = Board.row(this.board, i);
      const p = UI.tileCenter(col, row);
      const rect = this.add.rectangle(p.x, p.y, T - 4, T - 4, C.tile);
      rect.setInteractive({ useHandCursor: true });
      const label = UI.text(this, p.x, p.y, '', 26);
      const mine = UI.mine(this, p.x, p.y, 11).setVisible(false);
      const flag = UI.flag(this, p.x - 2, p.y + 2, 13).setVisible(false);
      rect.on('pointerover', () => this.hover(i, true));
      rect.on('pointerout', () => this.hover(i, false));
      rect.on('pointerdown', (pointer) => this.tapTile(i, pointer));
      this.tiles.push({ rect, label, mine, flag });
      this.refreshTile(i);
    }

    // ---- Flag mode toggle (the mobile replacement for right-click) ----
    this.flagButton = UI.button(this, W / 2, 628, 300, 52, '', () => this.toggleFlagMode());
    UI.text(this, W / 2, 678, 'Right-click also flags. Press F to toggle.', 12, C.textDim);
    this.input.keyboard.on('keydown-F', () => this.toggleFlagMode());
    this.refreshFlagButton();

    this.refreshHud();

    if (State.redemptionsLeft() === 0) {
      // Out of redemptions: keep the warning up for the rest of the run.
      this.statusText.setText('NEXT BOMB ENDS THE RUN').setColor(C.textBad);
    } else if (this.returned) {
      this.statusText.setText('REDEEMED. KEEP SWEEPING.');
      this.time.delayedCall(2200, () => { if (!this.locked) this.statusText.setText(''); });
    } else if (!this.board.minesPlaced) {
      this.statusText.setText('FIRST TAP IS ALWAYS SAFE');
    }
  }

  update(time, delta) {
    // The clock starts on the first reveal and pauses during transitions.
    if (!this.locked && this.board.minesPlaced) {
      this.run.elapsedMs += delta;
      this.timeText.setText(UI.formatTime(this.run.elapsedMs));
    }
  }

  // ---------- Input ----------

  hover(i, on) {
    const cell = this.board.cells[i];
    if (cell.revealed || this.locked) return;
    this.tiles[i].rect.setFillStyle(on ? CONFIG.COLORS.tileHover : CONFIG.COLORS.tile);
  }

  tapTile(i, pointer) {
    if (this.locked) return;
    const cell = this.board.cells[i];
    if (cell.revealed) return;
    const wantsFlag = this.flagMode || pointer.rightButtonDown();
    if (wantsFlag) {
      cell.flagged = !cell.flagged;
      this.refreshTile(i);
      this.refreshHud();
      return;
    }
    if (cell.flagged) return;   // flagged tiles are protected from misclicks
    this.reveal(i);
  }

  toggleFlagMode() {
    if (this.locked) return;
    this.flagMode = !this.flagMode;
    this.refreshFlagButton();
  }

  // ---------- Core loop ----------

  reveal(i) {
    if (!this.board.minesPlaced) {
      Board.placeMines(this.board, i);
      this.statusText.setText('');
    }
    if (this.board.cells[i].mine) {
      this.hitBomb(i);
      return;
    }

    // REWARD: points for every tile this click opened.
    const opened = Board.floodReveal(this.board, i);
    const gained = opened.length * CONFIG.POINTS_PER_TILE;
    this.run.score += gained;
    opened.forEach((n, order) => {
      this.refreshTile(n);
      const t = this.tiles[n];
      t.rect.setScale(0.6);
      this.tweens.add({ targets: t.rect, scale: 1, duration: 160, delay: Math.min(order * 12, 240), ease: 'Back.Out' });
    });
    this.floatText(i, '+' + gained, CONFIG.COLORS.textGood);
    this.refreshHud();

    if (Board.isCleared(this.board)) this.win();
  }

  // DAMAGE: the bomb goes off, a redemption is spent, and the player is
  // tunneled into Snake. A 4th bomb has no redemption and ends the run.
  hitBomb(i) {
    const cell = this.board.cells[i];
    cell.revealed = true;
    cell.exploded = true;
    cell.flagged = false;
    this.run.bombsHit += 1;
    this.locked = true;
    this.refreshTile(i);
    this.refreshHud();

    const p = UI.tileCenter(Board.col(this.board, i), Board.row(this.board, i));
    this.explosion(p.x, p.y);
    this.cameras.main.shake(350, 0.012);
    this.cameras.main.flash(180, 255, 120, 80);

    const outOfRedemptions = this.run.bombsHit > CONFIG.REDEMPTION_TARGETS.length;
    if (outOfRedemptions) {
      SFX.chain(this.game, 'boom', 'womp');       // boom, then the loss sting
      this.statusText.setText('NO REDEMPTIONS LEFT').setColor(CONFIG.COLORS.textBad);
      this.revealAllMines();
      this.time.delayedCall(1700, () => {
        this.scene.start('End', { result: 'lose', reason: 'bombs' });
      });
      return;
    }

    SFX.play(this.game, 'boom');
    const target = CONFIG.REDEMPTION_TARGETS[this.run.bombsHit - 1];
    this.statusText.setText('BOOM! EAT ' + target + ' APPLES').setColor(CONFIG.COLORS.textBad);

    // The tunnel: zoom into the crater, fade to black, land in Snake.
    this.time.delayedCall(900, () => {
      const cam = this.cameras.main;
      cam.pan(p.x, p.y, 550, 'Sine.easeIn');
      cam.zoomTo(7, 550, 'Sine.easeIn');
      cam.fadeOut(550, 0, 0, 0);
      cam.once('camerafadeoutcomplete', () => this.scene.start('Snake'));
    });
  }

  // END (win): every safe tile is open.
  win() {
    this.locked = true;
    const coins = State.payoutForWin();
    State.addCoins(coins);
    SFX.play(this.game, 'victory');
    this.time.delayedCall(450, () => {
      this.scene.start('End', { result: 'win', coinsEarned: coins });
    });
  }

  // ---------- Drawing ----------

  refreshTile(i) {
    const C = CONFIG.COLORS;
    const cell = this.board.cells[i];
    const t = this.tiles[i];
    t.flag.setVisible(cell.flagged && !cell.revealed);
    if (!cell.revealed) {
      t.rect.setFillStyle(C.tile);
      t.label.setText('');
      t.mine.setVisible(false);
      return;
    }
    t.rect.disableInteractive();
    if (cell.mine) {
      t.rect.setFillStyle(cell.exploded ? C.tileBoom : C.tileOpen);
      t.mine.setVisible(true);
      t.label.setText('');
    } else {
      t.rect.setFillStyle(C.tileOpen);
      t.label.setText(cell.adjacent > 0 ? String(cell.adjacent) : '');
      t.label.setColor(CONFIG.NUMBER_COLORS[cell.adjacent] || C.text);
    }
  }

  refreshHud() {
    const C = CONFIG.COLORS;
    this.scoreText.setText(String(this.run.score));
    this.timeText.setText(UI.formatTime(this.run.elapsedMs));
    const left = State.redemptionsLeft();
    this.pips.forEach((pip, idx) => {
      // Pips are drawn right to left, so the leftmost one is spent first.
      const alive = (this.pips.length - 1 - idx) < left;
      pip.setFillStyle(alive ? C.good : C.tileOpen);
    });
    const remaining = Board.minesHidden(this.board) - Board.flagsUsed(this.board);
    this.minesText.setText('MINES: ' + remaining);
  }

  refreshFlagButton() {
    const C = CONFIG.COLORS;
    this.flagButton.label.setText(this.flagMode ? 'FLAG MODE: ON' : 'FLAG MODE: OFF');
    this.flagButton.label.setColor(this.flagMode ? C.textAccent : C.text);
    this.flagButton.bg.setFillStyle(this.flagMode ? C.tileBoom : C.tile);
    this.flagButton.bg.setStrokeStyle(2, this.flagMode ? C.accent : C.wall);
  }

  revealAllMines() {
    Board.mineIndexes(this.board).forEach(i => {
      this.board.cells[i].revealed = true;
      this.refreshTile(i);
    });
  }

  floatText(i, str, color) {
    const p = UI.tileCenter(Board.col(this.board, i), Board.row(this.board, i));
    const t = UI.text(this, p.x, p.y - 8, str, 20, color).setDepth(20);
    this.tweens.add({ targets: t, y: p.y - 46, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  explosion(x, y) {
    const ring = this.add.circle(x, y, 8, 0xffb347, 0.9).setDepth(15);
    this.tweens.add({ targets: ring, scale: 9, alpha: 0, duration: 520, ease: 'Cubic.Out', onComplete: () => ring.destroy() });
    for (let k = 0; k < 10; k++) {
      const a = (Math.PI * 2 * k) / 10;
      const bit = this.add.rectangle(x, y, 7, 7, k % 2 ? 0xff4d5a : 0xffd23f).setDepth(15);
      this.tweens.add({
        targets: bit,
        x: x + Math.cos(a) * 70,
        y: y + Math.sin(a) * 70,
        alpha: 0,
        angle: 180,
        duration: 600,
        ease: 'Cubic.Out',
        onComplete: () => bit.destroy()
      });
    }
  }
}
