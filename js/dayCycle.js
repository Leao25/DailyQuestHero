// ============================================================
// dayCycle.js — Determina o período do dia baseado no horário
// REAL do jogador, e fornece a paleta de cores pro cenário.
// ============================================================

const DayCycle = {

  /**
   * Retorna um objeto descrevendo o período atual:
   * { name, icon, skyTop, skyBottom, groundTint, ambientAlpha }
   */
  getCurrentPeriod() {
    const hour = new Date().getHours();
    const { morningStart, afternoonStart, eveningStart, nightStart } = CONFIG.dayCycle;

    if (hour >= morningStart && hour < afternoonStart) {
      return {
        name: 'Manhã',
        icon: '🌅',
        skyTop: '#ffd89b',
        skyBottom: '#f9a857',
        groundTint: '#3a5a32',
        ambientAlpha: 0, // 0 = sem escurecimento
      };
    }

    if (hour >= afternoonStart && hour < eveningStart) {
      return {
        name: 'Tarde',
        icon: '☀️',
        skyTop: '#5ba8e0',
        skyBottom: '#bde3f4',
        groundTint: '#2e5530',
        ambientAlpha: 0,
      };
    }

    if (hour >= eveningStart && hour < nightStart) {
      return {
        name: 'Entardecer',
        icon: '🌇',
        skyTop: '#3b3b6b',
        skyBottom: '#d9743a',
        groundTint: '#23381f',
        ambientAlpha: 0.15,
      };
    }

    // Noite (cobre o resto das horas, incluindo madrugada)
    return {
      name: 'Noite',
      icon: '🌙',
      skyTop: '#05050f',
      skyBottom: '#101030',
      groundTint: '#10180f',
      ambientAlpha: 0.45,
    };
  },

  /** Retorna a hora atual formatada HH:MM, pro display do HUD */
  getFormattedTime() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
};
