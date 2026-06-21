// ============================================================
// dayCycle.js — 4 períodos: Manhã · Tarde · Entardecer · Noite
// ============================================================

const DayCycle = {

  // ----------------------------------------------------------
  // MODO DE TESTE: ciclo de 4 minutos (1 min por período)
  // Para versão final, comente o bloco TEST e descomente REAL
  // ----------------------------------------------------------

  // REAL — hora do relógio do PC
  _getSimulatedHour() { return new Date().getHours(); },

  // REAL — descomente para versão final
  // _getRealHour() { return new Date().getHours(); },

  PERIODS: {
    'Manhã':      { name: 'Manhã',      key: 'morning',   icon: '🌅', skyTop: '#ffd89b', skyBottom: '#f9a857', groundTint: '#3a5a32', ambientAlpha: 0 },
    'Tarde':      { name: 'Tarde',      key: 'afternoon', icon: '☀️', skyTop: '#5ba8e0', skyBottom: '#bde3f4', groundTint: '#2e5530', ambientAlpha: 0 },
    'Entardecer': { name: 'Entardecer', key: 'dusk',      icon: '🌇', skyTop: '#3b3b6b', skyBottom: '#d9743a', groundTint: '#23381f', ambientAlpha: 0.15 },
    'Noite':      { name: 'Noite',      key: 'night',     icon: '🌙', skyTop: '#05050f', skyBottom: '#101030', groundTint: '#10180f', ambientAlpha: 0.45 },
  },

  getCurrentPeriod() {
    const hour = this._getSimulatedHour();
    const C = CONFIG.dayCycle;
    if (hour >= C.morningStart && hour < C.afternoonStart) return this.PERIODS['Manhã'];
    if (hour >= C.afternoonStart && hour < C.duskStart)    return this.PERIODS['Tarde'];
    if (hour >= C.duskStart && hour < C.nightStart)        return this.PERIODS['Entardecer'];
    return this.PERIODS['Noite'];
  },

  getFormattedTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  }
};
