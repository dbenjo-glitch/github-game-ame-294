// ui.js
// Small drawing helpers shared by every scene: text, buttons, time format,
// and the mine and flag icons (all drawn from shapes, no image files).

const UI = {
  text(scene, x, y, str, size, color, originX, originY) {
    return scene.add.text(x, y, str, {
      fontFamily: CONFIG.FONT,
      fontSize: size + 'px',
      fontStyle: 'bold',
      color: color || CONFIG.COLORS.text,
      align: 'center',
      resolution: 2
    }).setOrigin(originX === undefined ? 0.5 : originX, originY === undefined ? 0.5 : originY);
  },

  // A rectangle button with a label. Returns { bg, label } so callers can restyle it.
  button(scene, x, y, w, h, label, onClick, fill) {
    const base = fill === undefined ? CONFIG.COLORS.tile : fill;
    const bg = scene.add.rectangle(x, y, w, h, base).setStrokeStyle(2, CONFIG.COLORS.wall);
    bg.setInteractive({ useHandCursor: true });
    const txt = this.text(scene, x, y, label, Math.min(20, Math.floor(h * 0.42)));
    bg.on('pointerover', () => bg.setAlpha(0.8));
    bg.on('pointerout', () => bg.setAlpha(1));
    bg.on('pointerdown', () => onClick());
    return { bg, label: txt };
  },

  formatTime(ms) {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  },

  // A round mine with four spikes. Returns a container.
  mine(scene, x, y, r) {
    const g = scene.add.graphics();
    g.lineStyle(3, 0x0b0d1c, 1);
    g.lineBetween(-r - 4, 0, r + 4, 0);
    g.lineBetween(0, -r - 4, 0, r + 4);
    g.lineBetween(-r, -r, r, r);
    g.lineBetween(-r, r, r, -r);
    g.fillStyle(0x0b0d1c, 1);
    g.fillCircle(0, 0, r);
    g.fillStyle(0xffffff, 0.75);
    g.fillCircle(-r * 0.35, -r * 0.35, r * 0.22);
    return scene.add.container(x, y, [g]);
  },

  // A red flag on a pole. Returns a container.
  flag(scene, x, y, s) {
    const g = scene.add.graphics();
    g.fillStyle(0xe8ecff, 1);
    g.fillRect(-s * 0.1, -s, s * 0.16, s * 2);
    g.fillStyle(CONFIG.COLORS.flag, 1);
    g.fillTriangle(s * 0.06, -s, s * 0.06, 0, s * 0.95, -s * 0.5);
    return scene.add.container(x, y, [g]);
  },

  // A horizontal slider. value is 0 to 1. onChange fires while dragging,
  // onRelease once when the player lets go. Returns { destroy }.
  slider(scene, x, y, w, value, onChange, onRelease, depth) {
    const C = CONFIG.COLORS;
    const track = scene.add.rectangle(x, y, w, 8, C.tileOpen).setOrigin(0, 0.5).setDepth(depth);
    const fill = scene.add.rectangle(x, y, w * value, 8, C.accent).setOrigin(0, 0.5).setDepth(depth);
    const knob = scene.add.circle(x + w * value, y, 13, C.accent).setStrokeStyle(3, 0x0b0d1c).setDepth(depth + 1);
    // A tall invisible strip so the slider is easy to grab on a phone.
    const hit = scene.add.rectangle(x - 16, y, w + 32, 46, 0x000000, 0).setOrigin(0, 0.5).setDepth(depth + 2);
    hit.setInteractive({ useHandCursor: true });
    let dragging = false;
    const set = (px) => {
      const v = Phaser.Math.Clamp((px - x) / w, 0, 1);
      fill.width = w * v;
      knob.x = x + w * v;
      onChange(v);
    };
    const move = (p) => { if (dragging) set(p.x); };
    const up = () => { if (dragging) { dragging = false; if (onRelease) onRelease(); } };
    hit.on('pointerdown', (p) => { dragging = true; set(p.x); });
    scene.input.on('pointermove', move);
    scene.input.on('pointerup', up);
    return {
      destroy() {
        scene.input.off('pointermove', move);
        scene.input.off('pointerup', up);
        [track, fill, knob, hit].forEach(o => o.destroy());
      }
    };
  },

  // A pop-up with the music and game sound sliders plus any buttons the
  // caller wants under them. The start screen uses it as SOUND SETTINGS and
  // the two game scenes use it as the PAUSED menu. Every button closes the
  // panel first, then runs its own action. Returns { close }.
  soundPanel(scene, title, buttons) {
    // Opening a panel is a user gesture, so audio can be unlocked here. That
    // lets the player hear the sliders even before the game has started.
    SFX.unlock(scene.game);
    SFX.startMusic(scene.game);

    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;
    const C = CONFIG.COLORS;
    const D = 100;                               // above everything else in the scene
    const h = 274 + 56 * buttons.length;
    const top = H / 2 - h / 2;
    const parts = [];
    const keep = (o) => { parts.push(o); return o; };

    // Dark backdrop that also swallows clicks meant for whatever is underneath.
    keep(scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72).setDepth(D).setInteractive());
    keep(scene.add.rectangle(W / 2, H / 2, 420, h, C.panel).setStrokeStyle(3, C.accent).setDepth(D + 1));
    keep(this.text(scene, W / 2, top + 35, title, 22, C.textAccent).setDepth(D + 2));

    const pct = (v) => Math.round(v * 100) + '%';
    const sx = 70;
    const sw = W - 140;

    keep(this.text(scene, sx, top + 83, 'MUSIC', 15, C.text, 0, 0.5).setDepth(D + 2));
    const musicPct = keep(this.text(scene, sx + sw, top + 83, pct(State.musicLevel), 15, C.textAccent, 1, 0.5).setDepth(D + 2));
    const musicSlider = this.slider(scene, sx, top + 117, sw, State.musicLevel, (v) => {
      SFX.setMusicLevel(v);
      musicPct.setText(pct(v));
    }, () => State.save(), D + 2);

    keep(this.text(scene, sx, top + 173, 'GAME SOUNDS', 15, C.text, 0, 0.5).setDepth(D + 2));
    const sfxPct = keep(this.text(scene, sx + sw, top + 173, pct(State.sfxLevel), 15, C.textAccent, 1, 0.5).setDepth(D + 2));
    const sfxSlider = this.slider(scene, sx, top + 207, sw, State.sfxLevel, (v) => {
      SFX.setSfxLevel(v);
      sfxPct.setText(pct(v));
    }, () => {
      State.save();
      SFX.play(scene.game, 'thump');             // a quick sample at the new level
    }, D + 2);
    keep(this.text(scene, W / 2, top + 243, 'Let go of the slider to hear a sample.', 12, C.textDim).setDepth(D + 2));

    const close = () => {
      musicSlider.destroy();
      sfxSlider.destroy();
      parts.forEach(o => o.destroy());
    };
    buttons.forEach((b, i) => {
      const btn = this.button(scene, W / 2, top + 289 + i * 56, 250, 46, b.label, () => { close(); b.onClick(); }, b.fill);
      btn.bg.setDepth(D + 2);
      btn.label.setDepth(D + 3);
      keep(btn.bg);
      keep(btn.label);
    });
    return { close };
  },

  // Where the current board sits on screen. The board always fills the same
  // square, so the tile size depends on how many tiles the difficulty uses.
  grid() {
    const size = State.run.board.size;
    const tile = Math.floor(CONFIG.GRID_PIXELS / size);
    return {
      size,
      tile,
      x: Math.round((CONFIG.WIDTH - tile * size) / 2),
      y: CONFIG.GRID_Y
    };
  },

  // Center of a Minesweeper tile in screen pixels.
  tileCenter(col, row) {
    const g = this.grid();
    return {
      x: g.x + col * g.tile + g.tile / 2,
      y: g.y + row * g.tile + g.tile / 2
    };
  }
};
