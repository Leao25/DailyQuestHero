const ExcelJS = require('exceljs');

const wb = new ExcelJS.Workbook();

// ── Listas para dropdowns ─────────────────────────────────────
const MOBS_FASE1  = ['goblin', 'lobo', 'orc', 'esqueleto', 'Guardião da Floresta (Boss)', 'Todos da Fase', 'TBD'];
const TODOS_ITENS = [
  // Materiais
  'Erva da Floresta', 'Moeda de Goblin', 'Fragmento de Osso', 'Pele de Lobo',
  'Presa de Lobo', 'Dente de Orc', 'Fragmento de Armadura', 'Moeda com Runa',
  // Consumíveis
  'Poção Menor de Vida', 'Poção de Mana', 'Elixir de Força', 'Elixir de XP',
  // Armas
  'Espada de Madeira', 'Espada Longa de Madeira', 'Arco de Madeira', 'Cajado de Madeira', 'Maça de Madeira',
  // Armaduras
  'Armadura de Couro', 'Capa de Lobo', 'Cota de Malha',
  // Acessórios
  'Amuleto da Floresta', 'Colar de Presas', 'Anel da Alma',
  // Key Gems
  'Pedra do Guerreiro', 'Pedra do Cavaleiro das Trevas', 'Pedra da Caçadora',
  'Pedra do Mago', 'Pedra da Clérига',
];

const HDR_BG     = 'FF1a1a2e';
const HDR_FG     = 'FFFFD700';
const ROW_COLORS = ['FF0f3460', 'FF16213e'];
const TEXT_FG    = 'FFe0e0e0';

function styleHeader(cell, text) {
  cell.value     = text;
  cell.font      = { bold: true, color: { argb: HDR_FG }, name: 'Arial', size: 10 };
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: HDR_BG } };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
}

function styleCell(cell, value, rowIdx) {
  cell.value     = value;
  cell.font      = { color: { argb: TEXT_FG }, name: 'Arial', size: 9 };
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: ROW_COLORS[rowIdx % 2] } };
  cell.alignment = { vertical: 'middle', wrapText: true };
}

function addDropdown(ws, col, fromRow, toRow, list) {
  for (let r = fromRow; r <= toRow; r++) {
    ws.getCell(r, col).dataValidation = {
      type: 'list', allowBlank: true,
      formulae: [`"${list.join(',')}"`],
      showErrorMessage: true, errorTitle: 'Valor inválido',
      error: 'Selecione uma opção da lista.',
    };
  }
}

// ════════════════════════════════════════════════════════════
// ABA 1 — MATERIAIS
// ════════════════════════════════════════════════════════════
const ws1 = wb.addWorksheet('Materiais', { properties: { tabColor: { argb: 'FF888888' } } });
const headers1 = ['Arquivo', 'Nome', 'Mob que dropa', 'Drop chance (%)', 'Fase', 'Valor', 'Uso'];
const widths1  = [32, 24, 28, 16, 8, 10, 28];
ws1.getRow(1).height = 30;
headers1.forEach((h, i) => { styleHeader(ws1.getCell(1, i+1), h); ws1.getColumn(i+1).width = widths1[i]; });

const rows1 = [
  ['itm_herb.png',          'Erva da Floresta',      'goblin',    '40%', '1', '5',  ''],
  ['itm_goblin_coin.png',   'Moeda de Goblin',       'goblin',    '35%', '1', '8',  ''],
  ['itm_bone_fragment.png', 'Fragmento de Osso',     'esqueleto', '50%', '1', '6',  ''],
  ['itm_wolf_pelt.png',     'Pele de Lobo',          'lobo',      '45%', '1', '20', ''],
  ['itm_wolf_fang.png',     'Presa de Lobo',         'lobo',      '30%', '1', '18', ''],
  ['itm_orc_tooth.png',     'Dente de Orc',          'orc',       '40%', '1', '22', ''],
  ['itm_shard_metal.png',   'Fragmento de Armadura', 'orc',       '25%', '1', '45', ''],
  ['itm_rune_coin.png',     'Moeda com Runa',        'TBD',       '2%',  '1', '150',''],
];
rows1.forEach((row, ri) => {
  const exRow = ws1.getRow(ri+2); exRow.height = 20;
  row.forEach((val, ci) => styleCell(exRow.getCell(ci+1), val, ri));
});
addDropdown(ws1, 3, 2, rows1.length+1, MOBS_FASE1);
addDropdown(ws1, 7, 2, rows1.length+1, TODOS_ITENS);

// ════════════════════════════════════════════════════════════
// ABA 2 — CONSUMÍVEIS
// ════════════════════════════════════════════════════════════
const ws2 = wb.addWorksheet('Consumíveis', { properties: { tabColor: { argb: 'FFFF5c5c' } } });
const headers2 = ['Arquivo', 'Nome', 'Efeito', 'Valor do efeito', 'Duração (s)', 'Drop chance (%)', 'Mob que dropa', 'Fase', 'Valor'];
const widths2  = [32, 24, 20, 16, 12, 16, 28, 8, 10];
ws2.getRow(1).height = 30;
headers2.forEach((h, i) => { styleHeader(ws2.getCell(1, i+1), h); ws2.getColumn(i+1).width = widths2[i]; });

const rows2 = [
  ['itm_small_health_potion.png', 'Poção Menor de Vida', 'Cura HP',   '20', '-',  '8%',  'goblin / lobo', '1', '12'],
  ['itm_small_mana_potion.png',   'Poção de Mana',       '?',         '',   '-',  '',    'TBD',            '',  '30'],
  ['itm_strength_elixir.png',     'Elixir de Força',     '+ATK temp', '5',  '60', '',    'TBD',            '',  '55'],
  ['itm_xp_elixir.png',           'Elixir de XP',        '+XP',       '50', '-',  '',    'TBD',            '',  '60'],
];
rows2.forEach((row, ri) => {
  const exRow = ws2.getRow(ri+2); exRow.height = 20;
  row.forEach((val, ci) => styleCell(exRow.getCell(ci+1), val, ri));
});
addDropdown(ws2, 7, 2, rows2.length+1, MOBS_FASE1);

// ════════════════════════════════════════════════════════════
// ABA 3 — ARMAS
// ════════════════════════════════════════════════════════════
const ws3 = wb.addWorksheet('Armas', { properties: { tabColor: { argb: 'FFF0C419' } } });
const headers3 = ['Arquivo', 'Nome', 'Hero(s)', 'Raridade', 'Bonus ATK', 'Drop chance (%)', 'Mob que dropa', 'Fase', 'Valor'];
const widths3  = [32, 24, 28, 12, 10, 16, 28, 8, 10];
ws3.getRow(1).height = 30;
headers3.forEach((h, i) => { styleHeader(ws3.getCell(1, i+1), h); ws3.getColumn(i+1).width = widths3[i]; });

const rows3 = [
  ['itm_small_wooden_sword.png', 'Espada de Madeira',    'Warrior, Dark Knight', 'Comum', '2', '12%', 'goblin', '1', '15'],
  ['itm_long_wooden_sword.png',  'Espada Longa Madeira', 'Warrior, Dark Knight', 'Comum', '3', '',    'TBD',    '1', '20'],
  ['itm_small_wooden_bow.png',   'Arco de Madeira',      'Hunter',               'Comum', '3', '',    'TBD',    '1', '18'],
  ['itm_wooden_staff.png',       'Cajado de Madeira',    'Mage, Cleric',         'Comum', '3', '',    'TBD',    '1', '18'],
  ['itm_wooden_mace.png',        'Maça de Madeira',      'Warrior, Cleric',      'Comum', '2', '',    'TBD',    '1', '16'],
];
rows3.forEach((row, ri) => {
  const exRow = ws3.getRow(ri+2); exRow.height = 20;
  row.forEach((val, ci) => styleCell(exRow.getCell(ci+1), val, ri));
});
addDropdown(ws3, 7, 2, rows3.length+1, MOBS_FASE1);

// ════════════════════════════════════════════════════════════
// ABA 4 — ARMADURAS
// ════════════════════════════════════════════════════════════
const ws4 = wb.addWorksheet('Armaduras', { properties: { tabColor: { argb: 'FF4A90D9' } } });
const headers4 = ['Arquivo', 'Nome', 'Hero(s)', 'Raridade', 'Bonus HP', 'Bonus ATK', 'Drop chance (%)', 'Mob que dropa', 'Fase', 'Valor'];
const widths4  = [32, 24, 28, 12, 10, 10, 16, 28, 8, 10];
ws4.getRow(1).height = 30;
headers4.forEach((h, i) => { styleHeader(ws4.getCell(1, i+1), h); ws4.getColumn(i+1).width = widths4[i]; });

const rows4 = [
  ['itm_brown_leather_armor.png', 'Armadura de Couro', 'Todos',           'Comum',   '15', '-',  '',    'TBD',    '1', '18'],
  ['itm_dark_wolf_cape.png',      'Capa de Lobo',      'Hunter, Warrior', 'Incomum', '25', '+1', '10%', 'lobo',   '1', '45'],
  ['iron_chainmail_armor.png',    'Cota de Malha',     'Warrior, Knight', 'Raro',    '40', '-',  '6%',  'orc',    '1', '85'],
];
rows4.forEach((row, ri) => {
  const exRow = ws4.getRow(ri+2); exRow.height = 20;
  row.forEach((val, ci) => styleCell(exRow.getCell(ci+1), val, ri));
});
addDropdown(ws4, 8, 2, rows4.length+1, MOBS_FASE1);

// ════════════════════════════════════════════════════════════
// ABA 5 — ACESSÓRIOS
// ════════════════════════════════════════════════════════════
const ws5 = wb.addWorksheet('Acessórios', { properties: { tabColor: { argb: 'FFA855F7' } } });
const headers5 = ['Arquivo', 'Nome', 'Hero(s)', 'Raridade', 'Bonus ATK', 'Bonus HP', 'Drop chance (%)', 'Mob que dropa', 'Fase', 'Valor'];
const widths5  = [32, 24, 28, 12, 10, 10, 16, 28, 8, 10];
ws5.getRow(1).height = 30;
headers5.forEach((h, i) => { styleHeader(ws5.getCell(1, i+1), h); ws5.getColumn(i+1).width = widths5[i]; });

const rows5 = [
  ['itm_green_forest_amulet.png', 'Amuleto da Floresta', 'Todos',   'Incomum', '+2', '+10', '',   'TBD',       '1', '40'],
  ['itm_wolf_fangs_necklace.png', 'Colar de Presas',     'Todos',   'Raro',    '+4', '+5',  '5%', 'lobo',      '1', '75'],
  ['itm_gold_ring_purple.png',    'Anel da Alma',        'Todos',   'Épico',   '+5', '+30', '4%', 'esqueleto', '1', '180'],
];
rows5.forEach((row, ri) => {
  const exRow = ws5.getRow(ri+2); exRow.height = 20;
  row.forEach((val, ci) => styleCell(exRow.getCell(ci+1), val, ri));
});
addDropdown(ws5, 8, 2, rows5.length+1, MOBS_FASE1);

// ════════════════════════════════════════════════════════════
// ABA 6 — KEY GEMS
// ════════════════════════════════════════════════════════════
const ws6 = wb.addWorksheet('Key Gems', { properties: { tabColor: { argb: 'FF4ade80' } } });
const headers6 = ['Arquivo', 'Nome', 'Herói', 'Raridade', 'Drops de', 'Level mínimo (boss)', 'Fase'];
const widths6  = [32, 30, 20, 12, 32, 20, 8];
ws6.getRow(1).height = 30;
headers6.forEach((h, i) => { styleHeader(ws6.getCell(1, i+1), h); ws6.getColumn(i+1).width = widths6[i]; });

const rows6 = [
  ['itm_keygem_warrior.png',   'Pedra do Guerreiro',          'Warrior',    'Épico', 'Guardião da Floresta (Boss)', '10', '1'],
  ['itm_keygem_darknight.png', 'Pedra do Cavaleiro das Trevas','Dark Knight','Épico', 'Guardião da Floresta (Boss)', '10', '1'],
  ['itm_keygem_hunter.png',    'Pedra da Caçadora',           'Hunter',     'Épico', 'Guardião da Floresta (Boss)', '10', '1'],
  ['itm_keygem_mage.png',      'Pedra do Mago',               'Mage',       'Épico', 'Guardião da Floresta (Boss)', '10', '1'],
  ['itm_keygem_cleric.png',    'Pedra da Clérига',            'Cleric',     'Épico', 'Guardião da Floresta (Boss)', '10', '1'],
];
rows6.forEach((row, ri) => {
  const exRow = ws6.getRow(ri+2); exRow.height = 20;
  row.forEach((val, ci) => styleCell(exRow.getCell(ci+1), val, ri));
});

wb.xlsx.writeFile('assets/items/items_database.xlsx').then(() => {
  console.log('items_database.xlsx atualizado com sucesso!');
});
