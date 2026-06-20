// ============================================================
// config.js — Configurações globais do jogo
// Mantenha "números mágicos" aqui pra facilitar balanceamento
// ============================================================

const CONFIG = {
  canvas: {
    width: 960,
    height: 540,
    groundY: 450, // linha onde os "pés" do hero/mob ficam (ajustado ao chão do BG)
  },

  hero: {
    // posição FIXA do hero na tela (ele não anda lateralmente; quem se move é o mundo)
    screenX: 260,
    walkSpeed: 1.6,        // velocidade com que o "mundo" avança (px por frame, ajustado por delta depois)
    baseMaxHp: 100,
    baseAttack: 12,
    attackRange: 55,      // distância (em "mundo") pra começar a atacar o mob
    attackCooldownMs: 800,
    xpToLevelBase: 100,   // XP necessário pro nível 2
    xpToLevelGrowth: 1.35 // multiplicador de XP necessário por nível
  },

  mob: {
    spawnIntervalMs: [1200, 2200], // intervalo aleatório entre spawns
    approachSpeed: 0.6,   // velocidade própria do mob se aproximando do hero, além do scroll do mundo
    baseHp: 30,
    baseAttack: 5,
    attackRange: 45,
    attackCooldownMs: 1200,
    baseXpReward: 18,
    spawnAheadDistance: 760, // mob nasce fora da tela à direita (hero.screenX + 760 > 960px)
  },

  world: {
    // Fase 1 é infinita por enquanto.
    // phaseTransitionLevel: 10, — placeholder pra futura troca de fase
  },

  // speedFactor: velocidade relativa ao avanço do hero (1 = mesmo ritmo do chão)
  parallax: {
    layers: [
      { key: 'sky',       speedFactor: 0.0  }, // céu: completamente estático
      { key: 'clouds',    speedFactor: 0.04 }, // nuvens: quase imóveis
      { key: 'birds',     speedFactor: 0.07 }, // pássaros: levemente mais rápidos
      { key: 'mountains', speedFactor: 0.15 }, // montanhas distantes
      { key: 'farTrees',  speedFactor: 0.40 }, // árvores de fundo
      { key: 'houses',    speedFactor: 0.60 }, // casinhas na meia-distância
      { key: 'nearTrees', speedFactor: 0.75 }, // árvores e arbustos próximos
      { key: 'ground',    speedFactor: 1.0  }, // pedras, flores: mesma velocidade do hero
    ]
  },

  dayCycle: {
    morningStart:   6,
    afternoonStart: 12,
    eveningStart:   18,
    nightStart:     21,
  }
};
