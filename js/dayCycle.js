// ============================================================
// dayCycle.js — 4 períodos: Manhã · Tarde · Entardecer · Noite
// ============================================================

const DayCycle = {

  // ----------------------------------------------------------
  // MODO DE TESTE: ciclo de 4 minutos (1 min por período)
  // Para versão final, comente o bloco TEST e descomente REAL
  // ----------------------------------------------------------

  // TEST — 10 minutos por ciclo completo (~2,5 min por BG)
  _getSimulatedHour() {
    const CYCLE_MS = 10 * 60 * 1000;
    const t = Date.now() % CYCLE_MS;
    return Math.floor((t / CYCLE_MS) * 24);
  },

  // REAL — hora do relógio do PC (usar na versão final)
  // _getSimulatedHour() { return new Date().getHours(); },

  // REAL — descomente para versão final
  // _getRealHour() { return new Date().getHours(); },

  getCurrentPeriod() {
    const hour = this._getSimulatedHour(); // troque por _getRealHour() na versão final
    const C = CONFIG.dayCycle;

    if (hour >= C.morningStart && hour < C.afternoonStart)
      return { name: 'Manhã', key: 'morning', icon: '🌅',
        skyTop: '#ffd89b', skyBottom: '#f9a857', groundTint: '#3a5a32', ambientAlpha: 0 };

    if (hour >= C.afternoonStart && hour < C.duskStart)
      return { name: 'Tarde', key: 'afternoon', icon: '☀️',
        skyTop: '#5ba8e0', skyBottom: '#bde3f4', groundTint: '#2e5530', ambientAlpha: 0 };

    if (hour >= C.duskStart && hour < C.nightStart)
      return { name: 'Entardecer', key: 'dusk', icon: '🌇',
        skyTop: '#3b3b6b', skyBottom: '#d9743a', groundTint: '#23381f', ambientAlpha: 0.15 };

    // Noite 22–05
    return { name: 'Noite', key: 'night', icon: '🌙',
      skyTop: '#05050f', skyBottom: '#101030', groundTint: '#10180f', ambientAlpha: 0.45 };
  },

  getFormattedTime() {
    // TEST — mostra hora simulada
    const hour = this._getSimulatedHour();
    return `${String(hour).padStart(2,'0')}:00`;

    // REAL — descomente para versão final
    // const now = new Date();
    // return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  }
};
