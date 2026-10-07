// SnakeScene.js
// The redemption game. The player lands here after hitting a bomb and must
// eat the target number of apples (10, 20 or 30) to get back to Minesweeper.
//   REWARD  points per apple, then the "redeemed" escape through the wall
//   DAMAGE  hitting a wall or your own tail: thump, then womp
//   END     dying here ends the whole run

class SnakeScene extends Phaser.Scene {
  constructor() { super('Snake'); }

  create() {
    const W = CONFIG.WIDTH;
    const C = CONFIG.COLORS;
    const S = CONFIG.SNAKE;
    this.run = State.run;
    this.level = this.run.bombsHit;                              // 1, 2 or 3
    this.target = CONFIG.REDEMPTION_TARGETS[this.level - 1];
    this.apples = 0;
    this.mode = 'intro';                                         // intro, play, exit, dead
    this.tickAcc = 0;
    this.dir = { x: 1, y: 0 };
    this.turnQueue = [];                                         // buffered turns, max 2
    const midRow = Math.floor(S.ROWS / 2);
    this.snake = [{ x: 5, y: midRow }, { x: 4, y: midRow }, { x: 3, y: midRow }];
    this.skinColor = State.skin().color;
    this.hole = null;

    this.cameras.main.setBackgroundColor(C.bg);
    this.cameras.main.fadeIn(350, 0, 0, 0);

    // ---- HUD ----
    UI.text(this, 24, 28, 'REDEMPTION ' + this.level + ' OF ' + CONFIG.REDEMPTION_TARGETS.length, 16, C.textAccent, 0, 0.5);
    this.scoreText = UI.text(this, W - 24, 28, '', 16, C.text, 1, 0.5);
    this.appleText = UI.text(this, W / 2, 68, '', 28, C.text);
    // Progress bar toward the apple target.
    this.add.rectangle(W / 2, 94, 432, 8, C.tileOpen);
    this.bar = this.add.rectangle(24, 94, 0, 8, C.good).setOrigin(0, 0.5);

    // ---- Field and walls ----
    const fw = S.COLS * S.CELL;
    const fh = S.ROWS * S.CELL;
    this.add.rectangle(S.X - S.WALL, S.Y - S.WALL, fw + S.WALL * 2, fh + S.WALL * 2, C.wall).setOrigin(0, 0);
    this.add.rectangle(S.X, S.Y, fw, fh, C.field).setOrigin(0, 0);
    this.holeGfx = this.add.graphics();       // the escape hole is painted over the wall
    this.gfx = this.add.graphics();           // snake and apple

    // The snake is only visible inside the field and the wall strip, so it
    // disappears as it slides out through the hole.
    const maskShape = this.make.graphics();
    maskShape.fillRect(S.X - S.WALL, S.Y - S.WALL, fw + S.WALL * 2, fh + S.WALL * 2);
    this.gfx.setMask(maskShape.createGeometryMask());

    this.spawnApple();
    this.buildControls();
    this.refreshHud();
    this.draw();

    // ---- Intro card ----
    const card = this.add.container(W / 2, S.Y + fh / 2).setDepth(30);
    card.add(this.add.rectangle(0, 0, 360, 130, C.panel, 0.95).setStrokeStyle(3, C.bad));
    card.add(UI.text(this, 0, -30, 'YOU HIT A BOMB', 24, C.textBad));
    card.add(UI.text(this, 0, 8, 'EAT ' + this.target + ' APPLES TO GET BACK', 17, C.text));
    card.add(UI.text(this, 0, 38, 'Crash and the run is over.', 13, C.textDim));
    this.time.delayedCall(1700, () => {
      this.tweens.add({ targets: card, alpha: 0, duration: 200, onComplete: () => card.destroy() });
      if (this.mode === 'intro') this.mode = 'play';
    });
  }

  // ---------- Controls: keyboard, swipe and an on-screen D-pad ----------

  buildControls() {
    const W = CONFIG.WIDTH;
    const C = CONFIG.COLORS;
    const kb = this.input.keyboard;
    const bind = (keys, x, y) => keys.forEach(k => kb.on('keydown-' + k, () => this.queueTurn(x, y)));
    bind(['UP', 'W'], 0, -1);
    bind(['DOWN', 'S'], 0, 1);
    bind(['LEFT', 'A'], -1, 0);
    bind(['RIGHT', 'D'], 1, 0);

    // Swipe anywhere on the screen.
    this.input.on('pointerup', (p) => {
      const dx = p.upX - p.downX;
      const dy = p.upY - p.downY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) this.queueTurn(dx > 0 ? 1 : -1, 0);
      else this.queueTurn(0, dy > 0 ? 1 : -1);
    });

    // D-pad below the field.
    const cx = W / 2;
    const size = 58;
    const pad = (x, y, glyph, dx, dy) => {
      const b = this.add.rectangle(x, y, size, size, C.tile).setStrokeStyle(2, C.wall);
      b.setInteractive({ useHandCursor: true });
      b.on('pointerdown', () => { this.queueTurn(dx, dy); b.setFillStyle(C.tileHover); });
      b.on('pointerup', () => b.setFillStyle(C.tile));
      b.on('pointerout', () => b.setFillStyle(C.tile));
      UI.text(this, x, y, glyph, 26);
    };
    pad(cx, 596, '^', 0, -1);
    pad(cx - 64, 660, '<', -1, 0);
    pad(cx, 660, 'v', 0, 1);
    pad(cx + 64, 660, '>', 1, 0);
  }

  // Turns are buffered so two quick presses (a U-turn around a corner) both
  // register. Reversing straight into your own neck is ignored.
  queueTurn(x, y) {
    if (this.mode === 'intro') this.mode = 'play';   // any input skips the intro
    if (this.mode !== 'play') return;
    const last = this.turnQueue.length ? this.turnQueue[this.turnQueue.length - 1] : this.dir;
    if (last.x === x && last.y === y) return;
    if (last.x === -x && last.y === -y) return;
    if (this.turnQueue.length < 2) this.turnQueue.push({ x, y });
  }

  // ---------- Loop ----------

  update(time, delta) {
    const S = CONFIG.SNAKE;
    if (this.mode === 'play') {
      this.run.elapsedMs += delta;
      this.tickAcc += delta;
      while (this.tickAcc >= S.TICK_MS && this.mode === 'play') {
        this.tickAcc -= S.TICK_MS;
        this.step();
      }
    } else if (this.mode === 'exit') {
      this.tickAcc += delta;
      while (this.tickAcc >= S.EXIT_TICK_MS && this.mode === 'exit') {
        this.tickAcc -= S.EXIT_TICK_MS;
        this.exitStep();
      }
    }
  }

  step() {
    const S = CONFIG.SNAKE;
    if (this.turnQueue.length) this.dir = this.turnQueue.shift();
    const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };

    // DAMAGE: wall.
    if (head.x < 0 || head.y < 0 || head.x >= S.COLS || head.y >= S.ROWS) {
      this.die();
      return;
    }
    const eating = head.x === this.apple.x && head.y === this.apple.y;
    // DAMAGE: own body. The tail tip is about to move away, so it only
    // counts when the snake is growing this step.
    const body = eating ? this.snake : this.snake.slice(0, -1);
    if (body.some(seg => seg.x === head.x && seg.y === head.y)) {
      this.die();
      return;
    }

    this.snake.unshift(head);
    if (eating) {
      // REWARD: an apple.
      this.apples += 1;
      this.run.score += CONFIG.POINTS_PER_APPLE;
      this.popText(head, '+' + CONFIG.POINTS_PER_APPLE);
      this.refreshHud();
      if (this.apples >= this.target) {
        this.beginExit();
        return;
      }
      this.spawnApple();
    } else {
      this.snake.pop();
    }
    this.draw();
  }

  spawnApple() {
    const S = CONFIG.SNAKE;
    const free = [];
    for (let y = 0; y < S.ROWS; y++) {
      for (let x = 0; x < S.COLS; x++) {
        if (!this.snake.some(seg => seg.x === x && seg.y === y)) free.push({ x, y });
      }
    }
    this.apple = free[Math.floor(Math.random() * free.length)];
  }

  // REWARD: target reached. A hole opens in the wall straight ahead and the
  // snake drives itself out through it, back to Minesweeper.
  beginExit() {
    const S = CONFIG.SNAKE;
    const C = CONFIG.COLORS;
    this.mode = 'exit';
    this.tickAcc = 0;
    this.apple = null;
    this.turnQueue.length = 0;
    SFX.play(this.game, 'redeem');

    const head = this.snake[0];
    const g = this.holeGfx;
    g.fillStyle(C.field, 1);
    if (this.dir.x === 1) g.fillRect(S.X + S.COLS * S.CELL, S.Y + head.y * S.CELL, S.WALL, S.CELL);
    else if (this.dir.x === -1) g.fillRect(S.X - S.WALL, S.Y + head.y * S.CELL, S.WALL, S.CELL);
    else if (this.dir.y === 1) g.fillRect(S.X + head.x * S.CELL, S.Y + S.ROWS * S.CELL, S.CELL, S.WALL);
    else g.fillRect(S.X + head.x * S.CELL, S.Y - S.WALL, S.CELL, S.WALL);

    this.cameras.main.flash(200, 61, 220, 132);
    const banner = UI.text(this, CONFIG.WIDTH / 2, S.Y + (S.ROWS * S.CELL) / 2, 'REDEEMED!', 44, C.textGood).setDepth(30).setScale(0.3);
    this.tweens.add({ targets: banner, scale: 1, duration: 350, ease: 'Back.Out' });
    this.draw();
  }

  // The escape: the snake keeps moving straight, ignoring collisions, until
  // its whole body has left the field.
  exitStep() {
    const S = CONFIG.SNAKE;
    const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };
    this.snake.unshift(head);
    this.snake.pop();
    this.draw();
    const inside = seg => seg.x >= 0 && seg.y >= 0 && seg.x < S.COLS && seg.y < S.ROWS;
    if (!this.snake.some(inside)) {
      this.mode = 'done';
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Minesweeper', { returned: true });
      });
    }
  }

  // DAMAGE + END: crashing in Snake ends the run. Thump first, then womp.
  die() {
    this.mode = 'dead';
    SFX.chain(this.game, 'thump', 'womp');
    this.cameras.main.shake(300, 0.014);
    this.draw(CONFIG.COLORS.bad);
    this.time.delayedCall(1600, () => {
      this.scene.start('End', { result: 'lose', reason: 'snake' });
    });
  }

  // ---------- Drawing ----------

  draw(overrideColor) {
    const S = CONFIG.SNAKE;
    const C = CONFIG.COLORS;
    const g = this.gfx;
    g.clear();

    if (this.apple) {
      const ax = S.X + this.apple.x * S.CELL + S.CELL / 2;
      const ay = S.Y + this.apple.y * S.CELL + S.CELL / 2;
      g.fillStyle(C.apple, 1);
      g.fillCircle(ax, ay, S.CELL * 0.36);
      g.fillStyle(C.good, 1);
      g.fillRect(ax - 1, ay - S.CELL * 0.5, 3, 6);
    }

    const color = overrideColor || this.skinColor;
    for (let i = this.snake.length - 1; i >= 0; i--) {
      const seg = this.snake[i];
      const x = S.X + seg.x * S.CELL;
      const y = S.Y + seg.y * S.CELL;
      g.fillStyle(color, i === 0 ? 1 : 0.82);
      g.fillRoundedRect(x + 1.5, y + 1.5, S.CELL - 3, S.CELL - 3, 6);
    }

    // Eyes on the head, facing the direction of travel.
    const head = this.snake[0];
    const hx = S.X + head.x * S.CELL + S.CELL / 2;
    const hy = S.Y + head.y * S.CELL + S.CELL / 2;
    const fx = this.dir.x * 5;
    const fy = this.dir.y * 5;
    const sx = this.dir.y !== 0 ? 6 : 0;
    const sy = this.dir.x !== 0 ? 6 : 0;
    g.fillStyle(0x0b0d1c, 1);
    g.fillCircle(hx + fx + sx, hy + fy + sy, 3);
    g.fillCircle(hx + fx - sx, hy + fy - sy, 3);
  }

  refreshHud() {
    this.scoreText.setText('SCORE ' + this.run.score);
    this.appleText.setText('APPLES ' + this.apples + ' / ' + this.target);
    this.bar.width = 432 * Math.min(1, this.apples / this.target);
  }

  popText(cell, str) {
    const S = CONFIG.SNAKE;
    const x = S.X + cell.x * S.CELL + S.CELL / 2;
    const y = S.Y + cell.y * S.CELL;
    const t = UI.text(this, x, y, str, 16, CONFIG.COLORS.textGood).setDepth(20);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 550, onComplete: () => t.destroy() });
  }
}
