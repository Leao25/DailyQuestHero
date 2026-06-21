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
  _load('arrow',        'sfx_arrow.wav');
  _load('dodge',        'sfx_dodge.wav');
  _load('hunterHurt',   'sfx_hunter_hurt.wav');
  _load('goblinAttack', 'sfx_goblin_attack.wav');
  _load('goblinHurt',   'sfx_goblin_hurt.mp3');
  _load('levelUp',      'sfx_levelup.wav');
  _load('drop',         'sfx_drop.wav');

  // ── Música de fundo (<audio> element, loop com pausa) ───
  const music = new window.Audio(BASE + 'bg_forest.mp3');
  music.volume = 0.5 * _masterVolume;
  music.loop   = false;

  let _pauseTimer = null;
  music.addEventListener('ended', () => {
    _pauseTimer = setTimeout(() => music.play().catch(() => {}), 5 * 60 * 1000);
  });

  return {
    startMusic() {
      if (_pauseTimer) { clearTimeout(_pauseTimer); _pauseTimer = null; }
      _ctx.resume();
      music.currentTime = 0;
      music.play().catch(() => {});
    },

    setMusicVolume(v) {
      _musicVolume  = v;
      music.volume  = 0.5 * v;
    },

    setSfxVolume(v) {
      _sfxVolume = v;
    },

    playArrow()        { _play('arrow',        0.7);  },
    playDodge()        { _play('dodge',        0.6);  },
    playHunterHurt()   { _play('hunterHurt',   0.6);  },
    playGoblinAttack() { _play('goblinAttack', 0.65); },
    playGoblinHurt()   { _play('goblinHurt',   0.55); },
    playLevelUp()      { _play('levelUp',      0.8);  },
    playDrop()         { _play('drop',         0.6);  },
  };
})();
