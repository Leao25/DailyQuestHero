// ============================================================
// save.js — Persistência local com localStorage
// Salva: classe, nível, XP, HP, ataque, inventário, equipamento
// NÃO salva: posição no mundo, estado de combate (reinicia sempre)
// ============================================================

const SAVE_KEY = 'dqh_save_v1';

const SaveSystem = {

  exists() {
    return !!localStorage.getItem(SAVE_KEY);
  },

  save(hero, phase) {
    const data = {
      heroClass:      hero.heroClass,
      level:          hero.level,
      xp:             hero.xp,
      xpToNextLevel:  hero.xpToNextLevel,
      maxHp:          hero.maxHp,
      hp:             hero.hp,
      attack:         hero.attack,
      gold:           hero.gold,
      inventory:      hero.inventory.map(item => item.id),
      equipment:      hero.equipment ?? {},
      phase:          phase ?? 'village',
      savedAt:        Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  },

  load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch { return null; }
  },

  delete() {
    localStorage.removeItem(SAVE_KEY);
  },

  // Aplica dados salvos em uma instância de Hero já criada
  applyToHero(hero, data) {
    hero.gold          = data.gold ?? 0;
    hero.level         = data.level;
    hero.xp            = data.xp;
    hero.xpToNextLevel = data.xpToNextLevel;
    hero.maxHp         = data.maxHp;
    hero.hp            = data.hp;
    hero.attack        = data.attack;
    hero.equipment     = data.equipment ?? {};

    // reconstrói inventário a partir dos IDs salvos
    hero.inventory = (data.inventory ?? [])
      .map(id => Items.get(id))
      .filter(Boolean);
  },
};
