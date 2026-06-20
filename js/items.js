// ============================================================
// items.js — Catálogo de itens e lógica de drop
// ============================================================

const ITEM_CATALOG = [
  { id: 'wolf_pelt',    name: 'Pele de Lobo',        rarity: 'comum',     dropChance: 0.45, color: '#a98b6b' },
  { id: 'rusty_dagger',  name: 'Adaga Enferrujada',   rarity: 'comum',     dropChance: 0.30, color: '#8c8c8c' },
  { id: 'forest_herb',  name: 'Erva da Floresta',    rarity: 'comum',     dropChance: 0.35, color: '#5ca85c' },
  { id: 'mob_fang',     name: 'Presa Afiada',        rarity: 'incomum',   dropChance: 0.18, color: '#e8e8e8' },
  { id: 'shadow_core',  name: 'Núcleo Sombrio',      rarity: 'raro',      dropChance: 0.06, color: '#7b4fb5' },
  { id: 'ancient_coin', name: 'Moeda Antiga',        rarity: 'épico',     dropChance: 0.02, color: '#f0c419' },
];

const Items = {

  /**
   * Roda a tabela de drop e retorna um array de itens dropados
   * (pode ser vazio — nem todo mob dropa algo).
   */
  rollDrops() {
    const drops = [];
    for (const item of ITEM_CATALOG) {
      if (Math.random() < item.dropChance) {
        drops.push(item);
      }
    }
    return drops;
  }
};
