// ============================================================
// dayCycle.js — Relógio de jogo: 1s real = 1min de jogo
// Hora inicial sorteada dentro do período, com margem de 55min
// para nunca ultrapassar o fim do período no mesmo BG.
// ============================================================

const DayCycle = {

  // Hora atual em minutos (ex: 11h30 = 690)
  _gameMinutes: 0,

  PERIODS: {
    'Manhã':      { name: 'Manhã',      key: 'morning',   icon: '🌅', skyTop: '#ffd89b', skyBottom: '#f9a857', groundTint: '#3a5a32', ambientAlpha: 0 },
    'Tarde':      { name: 'Tarde',      key: 'afternoon', icon: '☀️', skyTop: '#5ba8e0', skyBottom: '#bde3f4', groundTint: '#2e5530', ambientAlpha: 0 },
    'Entardecer': { name: 'Entardecer', key: 'dusk',      icon: '🌇', skyTop: '#3b3b6b', skyBottom: '#d9743a', groundTint: '#23381f', ambientAlpha: 0.15 },
    'Noite':      { name: 'Noite',      key: 'night',     icon: '🌙', skyTop: '#05050f', skyBottom: '#101030', groundTint: '#10180f', ambientAlpha: 0.45 },
  },

  // Limites de sorteio por período (início e máximo = fim - 55min)
  _PERIOD_RANGES: {
    'Manhã':      { startH: 6,  startM: 0,  endH: 11, endM: 5  },
    'Tarde':      { startH: 12, startM: 0,  endH: 17, endM: 5  },
    'Entardecer': { startH: 18, startM: 0,  endH: 21, endM: 5  },
    'Noite':      { startH: 22, startM: 0,  endH: 29, endM: 5  }, // 29h = 05h05 do dia seguinte
  },

  // Sorteia hora inicial para um período e inicializa o relógio
  initForPeriod(periodName) {
    const r = this._PERIOD_RANGES[periodName];
    if (!r) return;
    const startMin = r.startH * 60 + r.startM;
    const endMin   = r.endH   * 60 + r.endM;
    this._gameMinutes = startMin + Math.floor(Math.random() * (endMin - startMin));
  },

  // Avança o relógio — chamar a cada frame com deltaMs
  tick(deltaMs) {
    // 1000ms real = 1 minuto de jogo
    this._gameMinutes += deltaMs / 1000;
  },

  // Retorna o período atual com base nos minutos de jogo
  getCurrentPeriod() {
    const h = (this._gameMinutes / 60) % 24;
    const C = CONFIG.dayCycle;
    if (h >= C.morningStart   && h < C.afternoonStart) return this.PERIODS['Manhã'];
    if (h >= C.afternoonStart && h < C.duskStart)      return this.PERIODS['Tarde'];
    if (h >= C.duskStart      && h < C.nightStart)     return this.PERIODS['Entardecer'];
    return this.PERIODS['Noite'];
  },

  // Formata HH:MM para exibição no HUD
  getFormattedTime() {
    const totalMin = Math.floor(this._gameMinutes) % (24 * 60);
    const h = Math.floor(totalMin / 60) % 24;
    const m = totalMin % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  },
};
