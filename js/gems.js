// ============================================================
// gems.js — Persistência das Key Gems por classe (Fase 1)
// Save separado do herói: sobrevive à morte e troca de classe.
// ============================================================

const GemSystem = {
  _KEY: 'dqh_gems_v1',
  _CLASSES: ['warrior', 'hunter', 'mage', 'cleric'],

  load() {
    try { return JSON.parse(localStorage.getItem(this._KEY)) || {}; }
    catch { return {}; }
  },

  save(data) {
    localStorage.setItem(this._KEY, JSON.stringify(data));
  },

  // Marca a gem de uma classe como consumida
  consume(heroClass) {
    const data = this.load();
    data[heroClass] = true;
    this.save(data);
  },

  // Retorna true se essa classe já consumiu a gem
  isConsumed(heroClass) {
    return !!this.load()[heroClass];
  },

  // Retorna true se TODAS as 5 classes consumiram suas gems
  allConsumed() {
    const data = this.load();
    return this._CLASSES.every(c => !!data[c]);
  },

  // Quantas gems já foram consumidas
  count() {
    const data = this.load();
    return this._CLASSES.filter(c => !!data[c]).length;
  },

  // Reseta tudo (para testes ou reset de fase)
  reset() {
    localStorage.removeItem(this._KEY);
  },
};
