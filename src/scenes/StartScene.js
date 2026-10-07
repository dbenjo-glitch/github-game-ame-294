// StartScene.js
// Title, rules, difficulty picker, the snake color shop, and the "Click or press Space to start"
// gate that unlocks browser audio before any sound is needed.

class StartScene extends Phaser.Scene {
  constructor() { super('Start'); }

  create() {
    const W = CONFIG.WIDTH;
    const C = CONFIG.COLORS;
    this.cameras.main.setBackgroundColor(C.bg);
    this.cameras.main.fadeIn(250, 0, 0, 0);

    UI.text(this, W / 2, 58, CONFIG.TITLE, 56, C.text);
    UI.text(this, W / 2, 100, CONFIG.SUBTITLE, 17, C.textAccent);

    const rules = [
      'Clear the board without touching a mine.',
      'Hit a bomb and you get tunneled into SNAKE.',
      'Eat 10, then 20, then 30 apples to get back.',
      'There is no redemption 4.'
    ];
    UI.text(this, W / 2, 164, rules.join('\n'), 14, C.textDim).setLineSpacing(6);

    this.buildDifficulty();
    this.buildShop();

    // ---- Sound settings (music and effect volume sliders) ----
    this.settingsOpen = false;
    const gear = UI.button(this, W - 50, 18, 84, 26, 'SOUND', () => this.openSettings(), C.field);
    gear.label.setFontSize(12);

    // ---- Start gate ----
    const start = UI.button(this, W / 2, 566, 400, 64, 'CLICK OR PRESS SPACE TO START', () => this.startGame(), C.panel);
    start.bg.setStrokeStyle(3, C.accent);
    start.label.setColor(C.textAccent).setFontSize(19);
    this.tweens.add({ targets: start.label, alpha: 0.35, duration: 650, yoyo: true, repeat: -1 });

    UI.text(this, W / 2, 630, 'Tap to reveal. Right-click or FLAG MODE to flag.', 12, C.textDim);
    UI.text(this, W / 2, 650, 'Snake: arrow keys, WASD, swipe, or the D-pad.', 12, C.textDim);
    UI.text(this, W / 2, 670, 'The snake gets 5% faster every 5 seconds.', 12, C.textDim);

    this.input.keyboard.on('keydown-SPACE', () => this.startGame());
    this.input.keyboard.on('keydown-ENTER', () => this.startGame());
  }

  // ---- Sound settings panel ----
  // Opening it counts as a user gesture, so audio is unlocked and the music
  // starts right away. That lets the player hear the sliders as they move.
  openSettings() {
    if (this.settingsOpen || this.started) return;
    this.settingsOpen = true;
    SFX.unlock(this.game);
    SFX.startMusic(this.game);

    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;
    const C = CONFIG.COLORS;
    const D = 100;                       // draw above everything on the start screen
    const cy = H / 2;
    const parts = [];
    const keep = (o) => { parts.push(o); return o; };

    // Dark backdrop that also swallows clicks meant for the screen underneath.
    keep(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72).setDepth(D).setInteractive());
    keep(this.add.rectangle(W / 2, cy, 420, 330, C.panel).setStrokeStyle(3, C.accent).setDepth(D + 1));
    keep(UI.text(this, W / 2, cy - 130, 'SOUND SETTINGS', 22, C.textAccent).setDepth(D + 2));

    const pct = (v) => Math.round(v * 100) + '%';
    const sx = 70;                       // slider left edge
    const sw = W - 140;                  // slider width

    keep(UI.text(this, sx, cy - 82, 'MUSIC', 15, C.text, 0, 0.5).setDepth(D + 2));
    const musicPct = keep(UI.text(this, sx + sw, cy - 82, pct(State.musicLevel), 15, C.textAccent, 1, 0.5).setDepth(D + 2));
    const musicSlider = UI.slider(this, sx, cy - 48, sw, State.musicLevel, (v) => {
      SFX.setMusicLevel(v);
      musicPct.setText(pct(v));
    }, () => State.save(), D + 2);

    keep(UI.text(this, sx, cy + 8, 'GAME SOUNDS', 15, C.text, 0, 0.5).setDepth(D + 2));
    const sfxPct = keep(UI.text(this, sx + sw, cy + 8, pct(State.sfxLevel), 15, C.textAccent, 1, 0.5).setDepth(D + 2));
    const sfxSlider = UI.slider(this, sx, cy + 42, sw, State.sfxLevel, (v) => {
      SFX.setSfxLevel(v);
      sfxPct.setText(pct(v));
    }, () => {
      State.save();
      SFX.play(this.game, 'thump');      // a quick sample at the new level
    }, D + 2);
    keep(UI.text(this, W / 2, cy + 78, 'Let go of the slider to hear a sample.', 12, C.textDim).setDepth(D + 2));

    const close = UI.button(this, W / 2, cy + 124, 180, 46, 'DONE', () => {
      musicSlider.destroy();
      sfxSlider.destroy();
      parts.forEach(o => o.destroy());
      this.settingsOpen = false;
    });
    close.bg.setDepth(D + 2);
    close.label.setDepth(D + 3);
    keep(close.bg);
    keep(close.label);
  }

  // ---- Difficulty: board size, mine count and snake speed ----
  buildDifficulty() {
    const C = CONFIG.COLORS;
    UI.text(this, 28, 228, 'DIFFICULTY', 14, C.text, 0, 0.5);
    this.diffButtons = [];
    CONFIG.DIFFICULTIES.forEach((d, i) => {
      const b = UI.button(this, 78 + i * 108, 262, 100, 42, d.short, () => {
        State.setDifficulty(d.id);
        this.refreshDifficulty();
      }, C.field);
      b.label.setFontSize(15);
      this.diffButtons.push({ d, b });
    });
    this.diffInfo = UI.text(this, CONFIG.WIDTH / 2, 298, '', 12, C.textDim);
    this.refreshDifficulty();
  }

  refreshDifficulty() {
    const C = CONFIG.COLORS;
    this.diffButtons.forEach(({ d, b }) => {
      const on = State.difficulty === d.id;
      b.bg.setStrokeStyle(on ? 3 : 2, on ? C.accent : C.tile);
      b.bg.setFillStyle(on ? C.tile : C.field);
      b.label.setColor(on ? C.textAccent : C.text);
    });
    const d = State.diff();
    this.diffInfo.setText(d.name + ': ' + d.size + 'x' + d.size + ' board, ' + d.mines + ' mines, ' + d.snakeLabel + ' snake');
  }

  // ---- Snake color shop: spend coins earned from wins ----
  buildShop() {
    const W = CONFIG.WIDTH;
    const C = CONFIG.COLORS;
    const y = 420;

    this.add.rectangle(W / 2, y, 432, 190, C.panel).setStrokeStyle(2, C.tile);
    UI.text(this, 40, y - 76, 'SNAKE COLORS', 16, C.text, 0, 0.5);
    this.coinText = UI.text(this, W - 40, y - 76, '', 16, C.textAccent, 1, 0.5);
    this.shopMsg = UI.text(this, W / 2, y + 76, 'Win = 4 coins, minus 1 per redemption used.', 12, C.textDim);

    this.swatches = [];
    const gap = 104;
    const startX = W / 2 - gap * 1.5;
    CONFIG.SKINS.forEach((skin, i) => {
      const x = startX + i * gap;
      const box = this.add.rectangle(x, y - 12, 84, 92, C.field).setStrokeStyle(2, C.tile);
      box.setInteractive({ useHandCursor: true });
      // A tiny three-segment snake as the preview.
      for (let s = 0; s < 3; s++) {
        this.add.rectangle(x - 20 + s * 20, y - 30, 18, 18, skin.color).setAlpha(s === 2 ? 1 : 0.8);
      }
      UI.text(this, x, y - 2, skin.name, 12, C.text);
      const status = UI.text(this, x, y + 18, '', 12, C.textDim);
      box.on('pointerdown', () => this.pickSkin(skin));
      this.swatches.push({ skin, box, status });
    });
    this.refreshShop();
  }

  pickSkin(skin) {
    const result = State.chooseSkin(skin.id);
    if (result === 'bought') {
      this.shopMsg.setText('Unlocked ' + skin.name + '!').setColor(CONFIG.COLORS.textGood);
    } else if (result === 'selected') {
      this.shopMsg.setText(skin.name + ' selected.').setColor(CONFIG.COLORS.textDim);
    } else {
      const need = skin.price - State.coins;
      this.shopMsg.setText('Need ' + need + ' more coin' + (need === 1 ? '' : 's') + ' for ' + skin.name + '.').setColor(CONFIG.COLORS.textBad);
      this.cameras.main.shake(120, 0.004);
    }
    this.refreshShop();
  }

  refreshShop() {
    const C = CONFIG.COLORS;
    this.coinText.setText('COINS: ' + State.coins);
    this.swatches.forEach(({ skin, box, status }) => {
      const owned = State.ownedSkins.includes(skin.id);
      const selected = State.selectedSkin === skin.id;
      box.setStrokeStyle(selected ? 3 : 2, selected ? C.accent : C.tile);
      if (selected) status.setText('IN USE').setColor(C.textAccent);
      else if (owned) status.setText('OWNED').setColor(C.textGood);
      else status.setText(skin.price + ' coins').setColor(C.textDim);
    });
  }

  startGame() {
    if (this.started || this.settingsOpen) return;
    this.started = true;
    SFX.unlock(this.game);          // resume the Web Audio context on this user gesture
    SFX.startMusic(this.game);      // background loop starts only after that gesture
    State.newRun();
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.started = false;
      this.scene.start('Minesweeper');
    });
  }
}
