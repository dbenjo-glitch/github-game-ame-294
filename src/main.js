// main.js
// Phaser configuration and the scene list. Loaded last.

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  backgroundColor: '#0f1226',
  scale: {
    mode: Phaser.Scale.FIT,                 // fits desktop windows and phones in portrait
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  audio: {
    // Web Audio is used whenever the game is served over http(s). Browsers
    // block Web Audio file loading for pages opened straight from disk, so
    // in that one case Phaser falls back to HTML5 audio tags.
    disableWebAudio: window.location.protocol === 'file:'
  },
  render: { antialias: true, roundPixels: false },
  scene: [BootScene, StartScene, MinesweeperScene, SnakeScene, EndScene]
});
