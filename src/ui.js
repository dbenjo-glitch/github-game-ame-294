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
