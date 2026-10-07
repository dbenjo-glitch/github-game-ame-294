// BootScene.js
// Loads the saved coins and the five sound files, then hands off to the
// start screen. Missing audio files are skipped, never fatal.

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    State.load();
    const msg = UI.text(this, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'LOADING...', 20, CONFIG.COLORS.textDim);
    this.load.on('complete', () => msg.destroy());
    SFX.preload(this);
  }

  create() {
    this.scene.start('Start');
  }
}
