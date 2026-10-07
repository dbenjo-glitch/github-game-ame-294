// audio.js
// Loads and plays the five sound effects. Every call checks that the file
// actually loaded, so a missing sound never crashes the game.
//
//   boom.mp3     DAMAGE  bomb hit in Minesweeper
//   thump.mp3    DAMAGE  snake hits a wall or itself
//   womp.mp3     END     loss sting, chained after thump or the final boom
//   redeem.mp3   REWARD  apple target reached, the hole opens
//   victory.mp3  END     board cleared

const SFX = {
  KEYS: ['boom', 'thump', 'womp', 'redeem', 'victory'],

  preload(scene) {
    this.KEYS.forEach(key => scene.load.audio(key, 'assets/audio/' + key + '.mp3'));
  },

  has(game, key) {
    return game.cache.audio.exists(key);
  },

  // Browsers keep audio suspended until the player interacts with the page.
  // Called from the "Click or press Space to start" handler.
  unlock(game) {
    const ctx = game.sound.context;
    if (ctx && ctx.state === 'suspended') ctx.resume();
  },

  play(game, key) {
    if (!this.has(game, key)) return false;
    game.sound.play(key, { volume: CONFIG.VOLUME[key] });
    return true;
  },

  // Plays `first`, then `second` as soon as the first one finishes.
  // Used for "thump then womp" and "boom then womp".
  chain(game, first, second) {
    if (!this.has(game, first)) {
      this.play(game, second);
      return;
    }
    const sound = game.sound.add(first, { volume: CONFIG.VOLUME[first] });
    sound.once('complete', () => {
      sound.destroy();
      this.play(game, second);
    });
    sound.play();
  }
};
