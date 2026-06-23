// ============================================================
// audio.js — Música de fundo e efeitos sonoros
// Música: <audio> element. SFX: Web Audio API (não sofre throttle em background)
// ============================================================

const Audio = (() => {
  const BASE = 'assets/audio/';

  // ── Web Audio API (SFX) ──────────────────────────────────
  const _ctx = new (window.AudioContext || window.webkitAudioContext)();
  const _buffers = {};
  let _musicVolume = 0.7;
  let _sfxVolume   = 0.7;

  // resume contexto após interação do usuário (política do browser)
  document.addEventListener('click',   () => { if (_ctx.state === 'suspended') _ctx.resume(); });
  document.addEventListener('keydown', () => { if (_ctx.state === 'suspended') _ctx.resume(); });
  // resume ao voltar para a aba
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && _ctx.state === 'suspended') _ctx.resume();
  });

  async function _load(key, file) {
    try {
      const res = await fetch(BASE + file);
      const arr = await res.arrayBuffer();
      _buffers[key] = await _ctx.decodeAudioData(arr);
    } catch (_) {}
  }

  async function _play(key, volume) {
    const buf = _buffers[key];
    if (!buf) return;
    if (_ctx.state === 'suspended') await _ctx.resume();
    const src  = _ctx.createBufferSource();
    const gain = _ctx.createGain();
    gain.gain.value = volume * _sfxVolume;
    src.buffer = buf;
    src.connect(gain);
    gain.connect(_ctx.destination);
    src.start(0);
  }

  // pré-carrega todos os SFX
  _load('arrow',           'sfx_arrow.wav');
  _load('dodge',           'sfx_dodge.wav');
  _load('hunterHurt',      'sfx_hunter_hurt.wav');
  _load('mobMeleeAttack',  'sfx_mob_melee_attack.wav');
  _load('goblinHurt',      'sfx_goblin_hurt.mp3');
  _load('goblinSpawn',     'sfx_goblin_spawn.wav');
  _load('wolfAttack',      'sfx_wolf_attack.wav');
  _load('wolfDeath',       'sfx_wolf_death.ogg');
  _load('wolfSpawn',       'sfx_wolf_spawn.wav');
  _load('levelUp',         'sfx_levelup.wav');
  _load('drop',            'sfx_drop.wav');
  _load('bossSpawn',       'sfx_goblin_rider_spawn.wav');

  // ── Música de fundo (<audio> element, loop com pausa) ───
  const music     = new window.Audio(BASE + 'bg_village.mp3');
  const bossMusic = new window.Audio(BASE + 'bg_village_boss.mp3');
  music.volume     = 0.5 * _musicVolume;
  bossMusic.volume = 0.5 * _musicVolume;
  music.loop     = false;
  bossMusic.loop = true;

  let _pauseTimer  = null;
  let _bossPlaying = false;

  music.addEventListener('ended', () => {
    if (_bossPlaying) return;
    _pauseTimer = setTimeout(() => music.play().catch(() => {}), 5 * 60 * 1000);
  });

  return {
    stopMusic() {
      if (_pauseTimer) { clearTimeout(_pauseTimer); _pauseTimer = null; }
      music.pause();
      music.currentTime = 0;
    },

    startMusic() {
      if (_pauseTimer) { clearTimeout(_pauseTimer); _pauseTimer = null; }
      _bossPlaying = false;
      bossMusic.pause();
      bossMusic.currentTime = 0;
      _ctx.resume();
      music.currentTime = 0;
      music.play().catch(() => {});
    },

    playBossMusic() {
      if (_bossPlaying) return;
      _bossPlaying = true;
      music.pause();
      bossMusic.volume = 0.5 * _musicVolume;
      bossMusic.currentTime = 0;
      bossMusic.play().catch(() => {});
    },

    stopBossMusic() {
      if (!_bossPlaying) return;
      _bossPlaying = false;
      bossMusic.pause();
      bossMusic.currentTime = 0;
      music.currentTime = 0;
      music.play().catch(() => {});
    },

    setMusicVolume(v) {
      _musicVolume     = v;
      music.volume     = 0.5 * v;
      bossMusic.volume = 0.5 * v;
    },

    setSfxVolume(v) {
      _sfxVolume = v;
    },

    playArrow()          { _play('arrow',          0.7);  },
    playDodge()          { _play('dodge',          0.6);  },
    playHunterHurt()     { _play('hunterHurt',     0.6);  },
    playMobMeleeAttack() { _play('mobMeleeAttack', 0.65); },
    playGoblinHurt()     { _play('goblinHurt',     0.55); },
    playGoblinSpawn()    { _play('goblinSpawn',    0.70); },
    playWolfAttack()     { _play('wolfAttack',     0.65); },
    playWolfDeath()      { _play('wolfDeath',      0.60); },
    playWolfSpawn()      { _play('wolfSpawn',      0.65); },
    playBossSpawn()      { _play('bossSpawn',      0.85); },
    playLevelUp()        { _play('levelUp',        0.8);  },
    playDrop()           { _play('drop',           0.6);  },
  };
})();
