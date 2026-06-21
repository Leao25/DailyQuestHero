// ============================================================
// hud.js — Atualiza os elementos de DOM (barras, relógio, log).
// ============================================================

const CLASS_META = {
  warrior: { label: 'Guerreiro',  symbol: '⚔',  css: 'cls-warrior' },
  hunter:  { label: 'Caçadora',   symbol: '🏹', css: 'cls-hunter'  },
  mage:    { label: 'Mago',       symbol: '✦',  css: 'cls-mage'    },
  cleric:  { label: 'Clérigo',    symbol: '✝',  css: 'cls-cleric'  },
};

const PASSIVE_META = {
  warrior: { label: 'FÚRIA',  color: '#ff8844' },
  hunter:  { label: 'FOCO',   color: '#88ffaa' },
  mage:    { label: 'COLHEITA', color: '#cc99ff' },
  cleric:  { label: 'BÊNÇÃO', color: '#ffdd88' },
};

const Hud = {
  els: {},

  init() {
    this.els.heroLevel     = document.getElementById('hero-level');
    this.els.hpBar         = document.getElementById('hp-bar');
    this.els.hpText        = document.getElementById('hp-text');
    this.els.xpBar         = document.getElementById('xp-bar');
    this.els.xpText        = document.getElementById('xp-text');
    this.els.clockTime     = document.getElementById('clock-time');
    this.els.periodName    = document.getElementById('period-name');
    this.els.arcFill       = document.getElementById('clock-arc-fill');
    this.els.heroStats     = document.getElementById('hero-stats');
    this.els.eventLog      = document.getElementById('event-log');
    this.els.classBadge    = document.getElementById('class-badge');
    this.els.classLabel    = document.getElementById('hero-class-label');
    this.els.atkValue      = document.getElementById('atk-value');
    this.els.goldValue     = document.getElementById('gold-value');
    this.els.passiveInd    = document.getElementById('passive-indicator');
    // zone bar removida
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

  // Chamado uma vez ao iniciar o jogo (troca de classe ou start)
  setClass(heroClass) {
    const meta = CLASS_META[heroClass] ?? { label: heroClass, symbol: '?', css: '' };
    const badge = this.els.classBadge;
    badge.textContent = meta.symbol;
    badge.className   = `cls-${heroClass}`;
    this.els.classLabel.textContent = meta.label;

    // cor da passiva
    const pm = PASSIVE_META[heroClass];
    if (pm && this.els.passiveInd) {
      this.els.passiveInd.style.color = pm.color;
    }
  },

  updateHeroStats(hero) {
    this.els.heroLevel.textContent = hero.level;

    const hpRatio = Math.max(0, hero.hp / hero.maxHp) * 100;
    this.els.hpBar.style.width  = `${hpRatio}%`;
    this.els.hpText.textContent = `${hero.hp}/${hero.maxHp}`;

    // muda cor da HP conforme nível de perigo
    if (hpRatio < 25)      this.els.hpBar.style.filter = 'brightness(1.4) saturate(1.5)';
    else if (hpRatio < 50) this.els.hpBar.style.filter = 'brightness(1.1)';
    else                   this.els.hpBar.style.filter = '';

    const xpRatio = (hero.xp / hero.xpToNextLevel) * 100;
    this.els.xpBar.style.width  = `${Math.min(xpRatio, 100)}%`;
    this.els.xpText.textContent = `${hero.xp}/${hero.xpToNextLevel}`;

    this.els.atkValue.textContent  = hero.attack;
    if (this.els.goldValue) this.els.goldValue.textContent = hero.gold ?? 0;

    // indicador de passiva
    this._updatePassive(hero);
  },

  _updatePassive(hero) {
    const el  = this.els.passiveInd;
    const pm  = PASSIVE_META[hero.heroClass];
    if (!el || !pm) return;

    if (hero.heroClass === 'warrior') {
      const stacks = hero.passiveStacks ?? 0;
      if (stacks > 0) {
        el.textContent = `${pm.label} ${'█'.repeat(stacks)}${'░'.repeat(10 - stacks)}`;
      } else {
        el.textContent = `${pm.label} ${'░'.repeat(10)}`;
      }
    } else if (hero.heroClass === 'hunter') {
      const hits = hero.passiveStacks ?? 0;
      const filled = hits % 5;
      el.textContent = `${pm.label} ${'█'.repeat(filled)}${'░'.repeat(5 - filled)}`;
    } else {
      el.textContent = pm.label;
    }
  },

  // Atualiza a barra de progresso da zona
  // heroWorldX: posição atual do herói
  // portalX: posição do portal (world units)
  // bossWorldX: posição do boss (null se não ativo)
  // portalOpen: boolean
  updateZone(heroWorldX, portalX, bossWorldX, portalOpen) {
    const pct    = Math.min(heroWorldX / portalX, 1);
    const pctPx  = `${(pct * 100).toFixed(1)}%`;

    this.els.zoneFill.style.width    = pctPx;
    this.els.zoneHeroDot.style.left  = pctPx;

    // marcador do boss
    if (bossWorldX !== null) {
      const bossPct = Math.min(bossWorldX / portalX, 1);
      this.els.zoneBoss.style.left = `${(bossPct * 100).toFixed(1)}%`;
      this.els.zoneBoss.classList.remove('hidden');
    } else {
      this.els.zoneBoss.classList.add('hidden');
    }

    // marcador do portal
    if (portalOpen) {
      this.els.zonePortal.classList.remove('hidden');
    } else {
      this.els.zonePortal.classList.add('hidden');
    }

    this.els.zoneDistLabel.textContent = '';
  },

  updateClock(period) {
    const now = DayCycle._forcedHour !== null
      ? DayCycle._forcedHour
      : new Date().getHours() + new Date().getMinutes() / 60;
    this.els.clockTime.textContent  = DayCycle.getFormattedTime();

    this.els.periodName.textContent = period.name;

    // Progresso dentro do período atual (0–1)
    const C = CONFIG.dayCycle;
    const PERIODS = [
      { start: C.morningStart,   end: C.afternoonStart }, // Manhã      06–12
      { start: C.afternoonStart, end: C.duskStart      }, // Tarde      12–18
      { start: C.duskStart,      end: C.nightStart     }, // Entardecer 18–22
      { start: C.nightStart,     end: 24               }, // Noite      22–24
    ];
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    const seg = PERIODS.find(p => h >= p.start && h < p.end) ?? PERIODS[3];
    const pct = (h - seg.start) / (seg.end - seg.start);

    const arcColors = {
      'Manhã':      'linear-gradient(90deg, #f0a030, #ffe080)',
      'Tarde':      'linear-gradient(90deg, #40a0e0, #80d0ff)',
      'Entardecer': 'linear-gradient(90deg, #c04828, #f08040)',
      'Noite':      'linear-gradient(90deg, #2030a0, #5060e0)',
    };
    this.els.arcFill.style.width      = `${Math.round(Math.min(pct, 1) * 100)}%`;
    this.els.arcFill.style.background = arcColors[period.name] ?? '#888';
  },

  logEvent(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className   = `log-entry ${type}`;
    entry.textContent = message;
    this.els.eventLog.appendChild(entry);

    const maxEntries = 6;
    while (this.els.eventLog.children.length > maxEntries) {
      this.els.eventLog.removeChild(this.els.eventLog.firstChild);
    }

    setTimeout(() => {
      entry.style.transition = 'opacity 0.6s';
      entry.style.opacity    = '0';
      setTimeout(() => entry.remove(), 620);
    }, 4000);
  },
};
