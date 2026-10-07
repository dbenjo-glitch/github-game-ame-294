// config.js
// Every tunable number in the game lives here. Change the feel of the game
// by editing this file only.

const CONFIG = {
  TITLE: 'BOOM SNAKE',
  SUBTITLE: 'MINESWEEPER WITH A SECOND CHANCE',

  WIDTH: 480,
  HEIGHT: 720,

  // ---- Difficulty ----
  // Harder modes use a bigger board with denser mines and a faster snake.
  // snakeTick is the time between snake steps in milliseconds (lower = faster).
  DIFFICULTIES: [
    { id: 'easy',   short: 'EASY',   name: 'EASY',       size: 8,  mines: 8,  snakeTick: 150, snakeLabel: 'slow' },
    { id: 'medium', short: 'MEDIUM', name: 'MEDIUM',     size: 8,  mines: 10, snakeTick: 125, snakeLabel: 'normal' },
    { id: 'hard',   short: 'HARD',   name: 'HARD',       size: 10, mines: 18, snakeTick: 105, snakeLabel: 'fast' },
    { id: 'ultra',  short: 'ULTRA',  name: 'ULTRA HARD', size: 12, mines: 30, snakeTick: 90,  snakeLabel: 'very fast' }
  ],
  DEFAULT_DIFFICULTY: 'medium',

  // ---- Minesweeper ----
  // The board always fills the same square on screen; tiles shrink as the
  // board grows (8x8 = 54px tiles, 10x10 = 43px, 12x12 = 36px).
  GRID_PIXELS: 432,
  GRID_Y: 150,
  POINTS_PER_TILE: 10,   // REWARD: points for each safe tile revealed

  // ---- Redemption (Snake) ----
  // Bomb 1 = eat 10 apples, bomb 2 = 20, bomb 3 = 30. There is no fourth.
  REDEMPTION_TARGETS: [10, 20, 30],
  POINTS_PER_APPLE: 5,   // REWARD: points for each apple eaten
  SNAKE: {
    COLS: 16,
    ROWS: 16,
    CELL: 27,
    X: 24,               // top-left corner of the play field
    Y: 112,
    WALL: 10,            // wall thickness in pixels
    SPEEDUP_EVERY_MS: 5000,  // every 5 seconds spent in Snake...
    SPEEDUP_FACTOR: 1.05,    // ...the snake gets 5% faster (it compounds)
    MIN_TICK_MS: 55,         // speed ceiling so the game stays humanly playable
    EXIT_TICK_MS: 45         // speed while escaping through the hole
  },

  // ---- Coins and snake colors ----
  COINS_PER_WIN: 4,
  COIN_PENALTY_PER_REDEMPTION: 1,
  SKINS: [
    { id: 'green',  name: 'Classic', color: 0x3ddc84, price: 0 },
    { id: 'blue',   name: 'Ice',     color: 0x4cc9f0, price: 4 },
    { id: 'purple', name: 'Venom',   color: 0xb388ff, price: 10 },
    { id: 'gold',   name: 'Gold',    color: 0xffd23f, price: 20 }
  ],

  // ---- Audio mix (0 to 1). Balanced so nothing clips when two sounds chain. ----
  VOLUME: {
    boom: 0.7,
    thump: 0.8,
    womp: 0.6,
    redeem: 0.6,
    victory: 0.6,
    music: 0.22          // background loop sits well under the effects
  },
  // Player-adjustable levels (0 to 1) from the SOUND settings panel. At these
  // defaults the mix above plays exactly as written.
  DEFAULT_MUSIC_LEVEL: 0.5,
  DEFAULT_SFX_LEVEL: 0.8,

  // ---- Palette ----
  COLORS: {
    bg: 0x0f1226,
    panel: 0x1a1f3d,
    tile: 0x3b4a7a,
    tileHover: 0x5368a8,
    tileOpen: 0x1b2040,
    tileBoom: 0x7a1f2b,
    grid: 0x0b0d1c,
    wall: 0x8892c8,
    field: 0x141833,
    apple: 0xff4d5a,
    mine: 0x0b0d1c,
    flag: 0xff4d5a,
    accent: 0xffd23f,
    good: 0x3ddc84,
    bad: 0xff4d5a,
    text: '#e8ecff',
    textDim: '#8f98c7',
    textAccent: '#ffd23f',
    textGood: '#3ddc84',
    textBad: '#ff4d5a'
  },

  // Classic minesweeper number colors, brightened for a dark board.
  NUMBER_COLORS: ['', '#6ea8ff', '#3ddc84', '#ff6b6b', '#b388ff', '#ffb347', '#4cc9f0', '#f8f8f8', '#aaaaaa'],

  FONT: '"Courier New", Courier, monospace'
};
