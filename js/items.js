// ============================================================
// items.js — Catálogo completo de itens da Fase 1 (Floresta)
// Tipos: material | consumable | weapon | armor | accessory
// Raridade: comum | incomum | raro | épico
// Todos os itens são tradable (preparado para marketplace futuro)
// ============================================================

const RARITY = {
  comum:   { label: 'Comum',   color: '#c8c8c8' },
  incomum: { label: 'Incomum', color: '#4a90d9' },
  raro:    { label: 'Raro',    color: '#f0c419' },
  epico:   { label: 'Épico',   color: '#a855f7' },
};

// ── Catálogo completo ─────────────────────────────────────────
const ITEM_CATALOG = {

  // ── Materiais (drops de mobs, sem efeito agora) ───────────
  forest_herb: {
    id: 'forest_herb', name: 'Erva da Floresta',
    type: 'material', rarity: 'comum',
    desc: 'Erva medicinal encontrada na floresta. Útil para alquimia.',
    value: 5, tradable: true, icon: '🌿',
  },
  goblin_coin: {
    id: 'goblin_coin', name: 'Moeda de Goblin',
    type: 'material', rarity: 'comum',
    desc: 'Moeda surrupiada por goblins. Vale pouco, mas é algo.',
    value: 8, tradable: true, icon: '🪙',
  },
  bone_fragment: {
    id: 'bone_fragment', name: 'Fragmento de Osso',
    type: 'material', rarity: 'comum',
    desc: 'Osso quebradiço de esqueleto. Pode ter alguma utilidade.',
    value: 6, tradable: true, icon: '🦴',
  },
  wolf_pelt: {
    id: 'wolf_pelt', name: 'Pele de Lobo',
    type: 'material', rarity: 'incomum',
    desc: 'Pele espessa de lobo da floresta. Boa para fabricar armaduras.',
    value: 20, tradable: true, icon: '🐺',
  },
  wolf_fang: {
    id: 'wolf_fang', name: 'Presa de Lobo',
    type: 'material', rarity: 'incomum',
    desc: 'Presa afiada de lobo. Pode ser usada em amuletos.',
    value: 18, tradable: true, icon: '🦷',
  },
  orc_tooth: {
    id: 'orc_tooth', name: 'Dente de Orc',
    type: 'material', rarity: 'incomum',
    desc: 'Dente massivo de um orc guerreiro. Assustador.',
    value: 22, tradable: true, icon: '⚔️',
  },
  armor_shard: {
    id: 'armor_shard', name: 'Fragmento de Armadura',
    type: 'material', rarity: 'raro',
    desc: 'Pedaço de armadura orcana de boa qualidade.',
    value: 45, tradable: true, icon: '🛡️',
  },
  soul_gem: {
    id: 'soul_gem', name: 'Gema da Alma',
    type: 'material', rarity: 'raro',
    desc: 'Gema que brilha com energia espectral. Muito valiosa.',
    value: 60, tradable: true, icon: '💎',
  },
  ancient_coin: {
    id: 'ancient_coin', name: 'Moeda Antiga',
    type: 'material', rarity: 'epico',
    desc: 'Moeda de uma civilização esquecida. Colecionadores pagam bem.',
    value: 150, tradable: true, icon: '🏅',
  },

  // ── Consumíveis ───────────────────────────────────────────
  minor_potion: {
    id: 'minor_potion', name: 'Poção Menor de Vida',
    type: 'consumable', rarity: 'comum',
    desc: 'Restaura 20 HP imediatamente.',
    value: 12, tradable: true, icon: '🧪',
    effect: { type: 'heal', amount: 20 },
  },
  health_potion: {
    id: 'health_potion', name: 'Poção de Vida',
    type: 'consumable', rarity: 'incomum',
    desc: 'Restaura 50 HP imediatamente.',
    value: 30, tradable: true, icon: '⚗️',
    effect: { type: 'heal', amount: 50 },
  },
  strength_elixir: {
    id: 'strength_elixir', name: 'Elixir de Força',
    type: 'consumable', rarity: 'raro',
    desc: 'Aumenta ATK em +5 por 60 segundos.',
    value: 55, tradable: true, icon: '🔥',
    effect: { type: 'buff', stat: 'attack', amount: 5, duration: 60000 },
  },

  // ── Armas (slot: weapon) ──────────────────────────────────
  wooden_sword: {
    id: 'wooden_sword', name: 'Espada de Madeira',
    type: 'weapon', rarity: 'comum', slot: 'weapon',
    desc: 'Espada talhada em madeira resistente. Melhor que nada.',
    value: 15, tradable: true, icon: '🗡️',
    bonus: { attack: 2 },
  },
  iron_dagger: {
    id: 'iron_dagger', name: 'Adaga de Ferro',
    type: 'weapon', rarity: 'comum', slot: 'weapon',
    desc: 'Lâmina curta de ferro. Leve e eficaz.',
    value: 22, tradable: true, icon: '🗡️',
    bonus: { attack: 3 },
  },
  iron_sword: {
    id: 'iron_sword', name: 'Espada de Ferro',
    type: 'weapon', rarity: 'incomum', slot: 'weapon',
    desc: 'Espada forjada em ferro sólido. Confiável em combate.',
    value: 50, tradable: true, icon: '⚔️',
    bonus: { attack: 6 },
  },
  orc_axe: {
    id: 'orc_axe', name: 'Machado Orcano',
    type: 'weapon', rarity: 'raro', slot: 'weapon',
    desc: 'Machado pesado de um orc derrotado. Dano brutal.',
    value: 90, tradable: true, icon: '🪓',
    bonus: { attack: 10 },
  },
  shadow_blade: {
    id: 'shadow_blade', name: 'Lâmina das Sombras',
    type: 'weapon', rarity: 'epico', slot: 'weapon',
    desc: 'Lâmina forjada em trevas. Corta além do visível.',
    value: 200, tradable: true, icon: '🌑',
    bonus: { attack: 16 },
  },

  // ── Armaduras (slot: armor) ───────────────────────────────
  leather_armor: {
    id: 'leather_armor', name: 'Armadura de Couro',
    type: 'armor', rarity: 'comum', slot: 'armor',
    desc: 'Proteção básica de couro curtido.',
    value: 18, tradable: true, icon: '🧥',
    bonus: { maxHp: 15 },
  },
  wolf_cape: {
    id: 'wolf_cape', name: 'Capa de Lobo',
    type: 'armor', rarity: 'incomum', slot: 'armor',
    desc: 'Capa feita de pele de lobo. Intimidante e resistente.',
    value: 45, tradable: true, icon: '🦺',
    bonus: { maxHp: 25, attack: 1 },
  },
  chainmail: {
    id: 'chainmail', name: 'Cota de Malha',
    type: 'armor', rarity: 'raro', slot: 'armor',
    desc: 'Armadura de anéis de ferro entrelaçados. Boa proteção.',
    value: 85, tradable: true, icon: '🛡️',
    bonus: { maxHp: 40 },
  },

  // ── Acessórios (slot: accessory) ──────────────────────────
  forest_amulet: {
    id: 'forest_amulet', name: 'Amuleto da Floresta',
    type: 'accessory', rarity: 'incomum', slot: 'accessory',
    desc: 'Amuleto imbuído com energia da floresta.',
    value: 40, tradable: true, icon: '📿',
    bonus: { attack: 2, maxHp: 10 },
  },
  fang_necklace: {
    id: 'fang_necklace', name: 'Colar de Presas',
    type: 'accessory', rarity: 'raro', slot: 'accessory',
    desc: 'Colar feito de presas de lobo. Aumenta a ferocidade.',
    value: 75, tradable: true, icon: '📿',
    bonus: { attack: 4, maxHp: 5 },
  },
  soul_ring: {
    id: 'soul_ring', name: 'Anel da Alma',
    type: 'accessory', rarity: 'epico', slot: 'accessory',
    desc: 'Anel imbuído com uma gema espectral. Poder misterioso.',
    value: 180, tradable: true, icon: '💍',
    bonus: { attack: 5, maxHp: 30 },
  },
};

// ── Tabela de drops por tipo de mob ──────────────────────────
const MOB_DROP_TABLE = {
  goblin: [
    { itemId: 'forest_herb',   chance: 0.40 },
    { itemId: 'goblin_coin',   chance: 0.35 },
    { itemId: 'wooden_sword',  chance: 0.12 },
    { itemId: 'minor_potion',  chance: 0.08 },
    { itemId: 'ancient_coin',  chance: 0.02 },
  ],
  wolf: [
    { itemId: 'wolf_pelt',     chance: 0.45 },
    { itemId: 'wolf_fang',     chance: 0.30 },
    { itemId: 'wolf_cape',     chance: 0.10 },
    { itemId: 'minor_potion',  chance: 0.10 },
    { itemId: 'fang_necklace', chance: 0.05 },
  ],
  orc: [
    { itemId: 'orc_tooth',     chance: 0.40 },
    { itemId: 'armor_shard',   chance: 0.25 },
    { itemId: 'orc_axe',       chance: 0.08 },
    { itemId: 'chainmail',     chance: 0.06 },
    { itemId: 'health_potion', chance: 0.12 },
    { itemId: 'ancient_coin',  chance: 0.03 },
  ],
  skeleton: [
    { itemId: 'bone_fragment', chance: 0.50 },
    { itemId: 'soul_gem',      chance: 0.15 },
    { itemId: 'iron_sword',    chance: 0.10 },
    { itemId: 'soul_ring',     chance: 0.04 },
    { itemId: 'ancient_coin',  chance: 0.03 },
  ],
};

// ── API pública ───────────────────────────────────────────────
const Items = {

  get(id) {
    return ITEM_CATALOG[id] ?? null;
  },

  getRarityColor(rarity) {
    return RARITY[rarity]?.color ?? '#fff';
  },

  // Rola drops para um mob específico pelo tipo
  rollDrops(mobType = 'goblin') {
    const table = MOB_DROP_TABLE[mobType] ?? MOB_DROP_TABLE.goblin;
    const drops = [];
    for (const entry of table) {
      if (Math.random() < entry.chance) {
        const item = ITEM_CATALOG[entry.itemId];
        if (item) drops.push({ ...item }); // cópia para não mutar o catálogo
      }
    }
    return drops;
  },

  // Aplica bônus de um equipável no hero
  applyBonus(hero, item) {
    if (!item.bonus) return;
    if (item.bonus.attack) hero.attack  += item.bonus.attack;
    if (item.bonus.maxHp)  { hero.maxHp += item.bonus.maxHp; hero.hp += item.bonus.maxHp; }
  },

  // Remove bônus ao desequipar
  removeBonus(hero, item) {
    if (!item.bonus) return;
    if (item.bonus.attack) hero.attack  = Math.max(1, hero.attack - item.bonus.attack);
    if (item.bonus.maxHp)  { hero.maxHp = Math.max(1, hero.maxHp  - item.bonus.maxHp); hero.hp = Math.min(hero.hp, hero.maxHp); }
  },
};
