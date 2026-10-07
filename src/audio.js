// audio.js
// Loads and plays the five sound effects. Every call checks that the file
// actually loaded, so a missing sound never crashes the game.
//
//   boom.mp3     DAMAGE  bomb hit in Minesweeper
//   thump.mp3    DAMAGE  snake hits a wall or itself
//   womp.mp3     END     loss sting, chained after thump or the final boom
//   redeem.mp3   REWARD  apple target reached, the hole opens
//   victory.mp3  END     board cleared
//   music.ogg    background loop, quiet, under everything else (music.mp3 fallback)

const SFX = {
  KEYS: ['boom', 'thump', 'womp', 'redeem', 'victory'],

  music: null,

  preload(scene) {
    this.KEYS.forEach(key => scene.load.audio(key, 'assets/audio/' + key + '.mp3'));
    // OGG first because it loops without a gap; MP3 is the fallback for
    // browsers that cannot play OGG.
    scene.load.audio('music', ['assets/audio/music.ogg', 'assets/audio/music.mp3']);
  },

  // Starts the background loop once. The sound manager belongs to the game,
  // not to a scene, so the music keeps playing across scene changes.
  startMusic(game) {
    if (this.music || !this.has(game, 'music')) return;
    this.music = game.sound.add('music', { loop: true, volume: this.musicVolume() });
    this.music.play();
  },

  // The mix in CONFIG.VOLUME scaled by the player's two sliders. At the
  // default slider positions these return the CONFIG values unchanged.
  musicVolume() {
    return CONFIG.VOLUME.music * (State.musicLevel / CONFIG.DEFAULT_MUSIC_LEVEL);
  },

  sfxVolume(key) {
    return Math.min(1, CONFIG.VOLUME[key] * (State.sfxLevel / CONFIG.DEFAULT_SFX_LEVEL));
  },

  // Called by the SOUND panel sliders.
  setMusicLevel(level) {
    State.musicLevel = level;
    if (this.music) this.music.setVolume(this.musicVolume());
  },

  setSfxLevel(level) {
    State.sfxLevel = level;
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
    game.sound.play(key, { volume: this.sfxVolume(key) });
    return true;
  },

  // Plays `first`, then `second` as soon as the first one finishes.
  // Used for "thump then womp" and "boom then womp".
  chain(game, first, second) {
    if (!this.has(game, first)) {
      this.play(game, second);
      return;
    }
    const sound = game.sound.add(first, { volume: this.sfxVolume(first) });
    sound.once('complete', () => {
      sound.destroy();
      this.play(game, second);
    });
    sound.play();
  }
};
