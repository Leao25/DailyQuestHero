// ============================================================
// hud.js — Atualiza os elementos de DOM (barras, relógio, log).
// Mantido separado do canvas pra não misturar DOM com render 2D.
// ============================================================

const Hud = {
  els: {}, // cache dos elementos DOM

  init() {
    this.els.heroLevel  = document.getElementById('hero-level');
    this.els.hpBar      = document.getElementById('hp-bar');
    this.els.hpText     = document.getElementById('hp-text');
    this.els.xpBar      = document.getElementById('xp-bar');
    this.els.xpText     = document.getElementById('xp-text');
    this.els.clockTime  = document.getElementById('clock-time');
    this.els.periodIcon = document.getElementById('period-icon');
    this.els.periodName = document.getElementById('period-name');
    this.els.arcFill    = document.getElementById('clock-arc-fill');
    this.els.heroStats  = document.getElementById('hero-stats');
    this.els.eventLog   = document.getElementById('event-log');
    this.hideStats();
  },

  hideStats() {
    if (this.els.heroStats) this.els.heroStats.style.visibility = 'hidden';
    if (this.els.eventLog)  this.els.eventLog.style.visibility  = 'hidden';
  },

  showStats() {
    if (this.els.heroStats) this.els.heroStats.style.visibility = 'visible';
    if (this.els.eventLog)  this.els.eventLog.style.visibility  = 'visible';
  },

  updateHeroStats(hero) {
    this.els.heroLevel.textContent = hero.level;

    const hpRatio = Math.max(0, hero.hp / hero.maxHp) * 100;
    this.els.hpBar.style.width = `${hpRatio}%`;
    this.els.hpText.textContent = `${hero.hp}/${hero.maxHp}`;

    const xpRatio = (hero.xp / hero.xpToNextLevel) * 100;
    this.els.xpBar.style.width = `${xpRatio}%`;
    this.els.xpText.textContent = `${hero.xp}/${hero.xpToNextLevel} XP`;
  },

  updateClock(period) {
    this.els.clockTime.textContent  = DayCycle.getFormattedTime();
    this.els.periodIcon.textContent = period.icon;
    this.els.periodName.textContent = period.name;

    // barra de progresso dentro do período atual
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    const { morningStart, afternoonStart, eveningStart, nightStart } = CONFIG.dayCycle;
    let pct = 0;
    const C = CONFIG.dayCycle;
    if      (h >= C.morningStart   && h < C.afternoonStart) pct = (h - C.morningStart)   / (C.afternoonStart - C.morningStart);
    else if (h >= C.afternoonStart && h < C.eveningStart)   pct = (h - C.afternoonStart) / (C.eveningStart   - C.afternoonStart);
    else if (h >= C.eveningStart   && h < C.nightStart)     pct = (h - C.eveningStart)   / (C.nightStart     - C.eveningStart);
    else {
      const nightLen = 24 - C.nightStart + C.morningStart;
      const intoNight = h >= C.nightStart ? h - C.nightStart : h + (24 - C.nightStart);
      pct = intoNight / nightLen;
    }

    // cor da barra muda por período
    const arcColors = {
      'Manhã':      'linear-gradient(90deg, #f0a030, #ffe080)',
      'Tarde':      'linear-gradient(90deg, #40a0e0, #80d0ff)',
      'Entardecer': 'linear-gradient(90deg, #c04828, #f08040)',
      'Noite':      'linear-gradient(90deg, #2030a0, #5060e0)',
    };
    this.els.arcFill.style.width      = `${Math.round(pct * 100)}%`;
    this.els.arcFill.style.background = arcColors[period.name] ?? '#888';
  },

  /**
   * Adiciona uma entrada no log de eventos (canto inferior esquerdo).
   * type: 'drop' | 'levelup' | 'damage' | 'info'
   */
  logEvent(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = message;
    this.els.eventLog.appendChild(entry);

    // mantém só as últimas N entradas
    const maxEntries = 6;
    while (this.els.eventLog.children.length > maxEntries) {
      this.els.eventLog.removeChild(this.els.eventLog.firstChild);
    }

    // auto-remove após 4 segundos com fade
    setTimeout(() => {
      entry.style.transition = 'opacity 0.6s';
      entry.style.opacity = '0';
      setTimeout(() => entry.remove(), 620);
    }, 4000);
  }
};
