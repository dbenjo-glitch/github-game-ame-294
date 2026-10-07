// state.js
// One shared state object. Scenes are thrown away and rebuilt when the game
// switches between Minesweeper and Snake, so anything that must survive the
// trip (the board, the score, the timer) lives here instead of in a scene.

const State = {
  // ---- Saved between sessions (browser localStorage) ----
  coins: 0,
  ownedSkins: ['green'],
  selectedSkin: 'green',
  difficulty: CONFIG.DEFAULT_DIFFICULTY,
  musicLevel: CONFIG.DEFAULT_MUSIC_LEVEL,   // 0 to 1, set in the SOUND panel
  sfxLevel: CONFIG.DEFAULT_SFX_LEVEL,       // 0 to 1, set in the SOUND panel

  // ---- The current run. Reset by newRun(). ----
  run: null,

  newRun() {
    const d = this.diff();
    this.run = {
      difficulty: d.id,
      score: 0,
      bombsHit: 0,       // also the number of redemptions used
      elapsedMs: 0,      // total play time across Minesweeper and Snake
      board: Board.create(d.size, d.mines)
    };
  },

  // The settings for the selected difficulty (board size, mines, snake speed).
  diff() {
    return CONFIG.DIFFICULTIES.find(d => d.id === this.difficulty) ||
           CONFIG.DIFFICULTIES.find(d => d.id === CONFIG.DEFAULT_DIFFICULTY);
  },

  setDifficulty(id) {
    if (!CONFIG.DIFFICULTIES.some(d => d.id === id)) return;
    this.difficulty = id;
    this.save();
  },

  redemptionsLeft() {
    return Math.max(0, CONFIG.REDEMPTION_TARGETS.length - this.run.bombsHit);
  },

  skin() {
    return CONFIG.SKINS.find(s => s.id === this.selectedSkin) || CONFIG.SKINS[0];
  },

  // Coins for a win: 4, minus 1 for each redemption used, never below 0.
  payoutForWin() {
    const pay = CONFIG.COINS_PER_WIN - this.run.bombsHit * CONFIG.COIN_PENALTY_PER_REDEMPTION;
    return Math.max(0, pay);
  },

  addCoins(n) {
    this.coins += n;
    this.save();
  },

  // Returns 'selected', 'bought' or 'poor'.
  chooseSkin(id) {
    const skin = CONFIG.SKINS.find(s => s.id === id);
    if (!skin) return 'poor';
    if (this.ownedSkins.includes(id)) {
      this.selectedSkin = id;
      this.save();
      return 'selected';
    }
    if (this.coins >= skin.price) {
      this.coins -= skin.price;
      this.ownedSkins.push(id);
      this.selectedSkin = id;
      this.save();
      return 'bought';
    }
    return 'poor';
  },

  // localStorage can be blocked (private windows, some embeds), so every
  // access is wrapped and the game still works without it.
  save() {
    try {
      localStorage.setItem('msr_save', JSON.stringify({
        coins: this.coins,
        ownedSkins: this.ownedSkins,
        selectedSkin: this.selectedSkin,
        difficulty: this.difficulty,
        musicLevel: this.musicLevel,
        sfxLevel: this.sfxLevel
      }));
    } catch (e) { /* play on without saving */ }
  },

  load() {
    try {
      const raw = localStorage.getItem('msr_save');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.coins === 'number') this.coins = data.coins;
      if (Array.isArray(data.ownedSkins)) this.ownedSkins = data.ownedSkins;
      if (typeof data.selectedSkin === 'string') this.selectedSkin = data.selectedSkin;
      if (CONFIG.DIFFICULTIES.some(d => d.id === data.difficulty)) this.difficulty = data.difficulty;
      if (typeof data.musicLevel === 'number') this.musicLevel = Math.min(1, Math.max(0, data.musicLevel));
      if (typeof data.sfxLevel === 'number') this.sfxLevel = Math.min(1, Math.max(0, data.sfxLevel));
    } catch (e) { /* start fresh */ }
  }
};
