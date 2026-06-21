// ============================================================
// vault.js — Baú Seguro: persiste itens entre mortes do herói
//
// CAMADA DE ABSTRAÇÃO: hoje usa localStorage.
// Para migrar para backend, substitua _read() e _write() por
// chamadas fetch() à sua API — o resto do jogo não muda.
// ============================================================

const VAULT_KEY = 'dqh_vault_v1';

const Vault = {

  // ── Storage backend (trocar aqui para migrar para API) ────
  _read() {
    try { return JSON.parse(localStorage.getItem(VAULT_KEY)) ?? []; }
    catch { return []; }
  },

  _write(items) {
    localStorage.setItem(VAULT_KEY, JSON.stringify(items));
  },

  // ── API pública ──────────────────────────────────────────

  // Retorna todos os itens do baú como objetos completos
  getAll() {
    return this._read()
      .map(entry => ({ item: Items.get(entry.id), qty: entry.qty }))
      .filter(e => e.item);
  },

  // Deposita toda a pilha de um item (qty = quantidade atual na bag)
  deposit(itemId, qty) {
    const items = this._read();
    const existing = items.find(e => e.id === itemId);
    if (existing) existing.qty += qty;
    else items.push({ id: itemId, qty });
    this._write(items);
  },

  // Retira qty unidades de um item do baú para o inventário do herói
  withdraw(itemId, qty, hero) {
    const items = this._read();
    const entry = items.find(e => e.id === itemId);
    if (!entry || entry.qty < qty) return false;
    entry.qty -= qty;
    if (entry.qty <= 0) items.splice(items.indexOf(entry), 1);
    this._write(items);
    for (let i = 0; i < qty; i++) {
      const obj = Items.get(itemId);
      if (obj) hero.inventory.push({ ...obj });
    }
    return true;
  },

  clear() {
    localStorage.removeItem(VAULT_KEY);
  },
};
