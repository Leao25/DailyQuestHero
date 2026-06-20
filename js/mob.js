// ============================================================
// mob.js — Inimigos por tipo, com sprites PNG e spawn dinâmico.
// Fase 1 (Floresta): Goblin, Lobo, Orc, Esqueleto.
// Demônio reservado para fases futuras.
// ============================================================

// Definição dos tipos de mob disponíveis na Fase 1
const MOB_TYPES = {
  goblin: {
    key:          'goblin',
    label:        'Goblin',
    spriteKey:    'mob_goblin',
    spriteH:      72,
    hp:           30,
    attack:       5,
    xpReward:     18,
    attackRange:  45,
    approachSpeed:0.7,
    weight:       40,   // peso de spawn (maior = mais frequente)
    periods:      ['Manhã', 'Tarde', 'Entardecer', 'Noite'], // aparece sempre
    minLevel:     1,
    drops:        ['herb', 'coin'],
  },
  wolf: {
    key:          'wolf',
    label:        'Lobo',
    spriteKey:    'mob_wolf',
    spriteH:      72,
    hp:           50,
    attack:       8,
    xpReward:     30,
    attackRange:  50,
    approachSpeed:1.0,
    weight:       25,
    periods:      ['Manhã', 'Tarde'],
    minLevel:     2,
    drops:        ['pelt', 'fang'],
  },
  orc: {
    key:          'orc',
    label:        'Orc',
    spriteKey:    'mob_orc',
    spriteH:      88,
    hp:           90,
    attack:       14,
    xpReward:     55,
    attackRange:  55,
    approachSpeed:0.5,
    weight:       15,
    periods:      ['Tarde', 'Entardecer'],
    minLevel:     4,
    drops:        ['weapon', 'gold'],
  },
  skeleton: {
    key:          'skeleton',
    label:        'Esqueleto',
    spriteKey:    'mob_skeleton',
    spriteH:      80,
    hp:           45,
    attack:       10,
    xpReward:     40,
    attackRange:  48,
    approachSpeed:0.6,
    weight:       20,
    periods:      ['Entardecer', 'Noite'],
    minLevel:     3,
    drops:        ['bone', 'gem'],
  },
  // Demônio reservado — não entra no pool da Fase 1
  demon: {
    key:          'demon',
    label:        'Demônio',
    spriteKey:    'mob_demon',
    spriteH:      96,
    hp:           120,
    attack:       20,
    xpReward:     80,
    attackRange:  60,
    approachSpeed:0.8,
    weight:       5,
    periods:      ['Noite'],
    minLevel:     8,
    drops:        ['rune', 'rare_item'],
  },
};

// Pool disponível na Fase 1 (sem demônio)
const PHASE1_POOL = ['goblin', 'wolf', 'orc', 'skeleton'];

function pickMobType(heroLevel, period) {
  const eligible = PHASE1_POOL
    .map(k => MOB_TYPES[k])
    .filter(t => heroLevel >= t.minLevel && t.periods.includes(period));

  if (eligible.length === 0) return MOB_TYPES.goblin; // fallback

  const totalWeight = eligible.reduce((s, t) => s + t.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const t of eligible) {
    roll -= t.weight;
    if (roll <= 0) return t;
  }
  return eligible[eligible.length - 1];
}

// ── Carregamento de sprites dos mobs ─────────────────────────
const MobSprites = {
  images: {},
  bounds: {},
  _loaded: 0,
  _total:  0,
  ready:   false,

  load(onComplete) {
    const keys = Object.keys(MOB_TYPES);
    this._total = keys.length;
    keys.forEach(k => {
      const def = MOB_TYPES[k];
      const img = new Image();
      img.onload = () => {
        this._calcBounds(def.spriteKey, img);
        this._loaded++;
        if (this._loaded === this._total) { this.ready = true; onComplete(); }
      };
      img.onerror = () => {
        this.bounds[def.spriteKey] = { topY: 0, bottomY: 1, contentH: 1 };
        this._loaded++;
        if (this._loaded === this._total) { this.ready = true; onComplete(); }
      };
      img.src = `assets/sprites/${def.spriteKey}.png`;
      this.images[def.spriteKey] = img;
    });
  },

  _calcBounds(key, img) {
    const oc = document.createElement('canvas');
    oc.width  = img.naturalWidth;
    oc.height = img.naturalHeight;
    const ox = oc.getContext('2d');
    ox.drawImage(img, 0, 0);
    const id = ox.getImageData(0, 0, oc.width, oc.height);
    const d  = id.data;
    let topY = img.naturalHeight, bottomY = 0;
    for (let y = 0; y < img.naturalHeight; y++) {
      for (let x = 0; x < img.naturalWidth; x++) {
        const i = (y * img.naturalWidth + x) * 4;
        const r = d[i], g = d[i+1], b = d[i+2];
        if (r > 155 && g > 155 && b > 155 && Math.abs(r-g) < 20 && Math.abs(g-b) < 20) {
          d[i+3] = 0;
        } else if (d[i+3] > 8) {
          if (y < topY)    topY    = y;
          if (y > bottomY) bottomY = y;
        }
      }
    }
    ox.putImageData(id, 0, 0);
    this.images[key] = oc;
    this.bounds[key] = { topY, bottomY, contentH: Math.max(1, bottomY - topY + 1) };
  },

  draw(ctx, spriteKey, cx, baseY, targetH, options = {}) {
    const img = this.images[spriteKey];
    if (!img) return false;
    const isCanvas = img instanceof HTMLCanvasElement;
    if (!isCanvas && (!img.complete || !img.naturalWidth)) return false;
    const srcW = isCanvas ? img.width  : img.naturalWidth;
    const srcH = isCanvas ? img.height : img.naturalHeight;
    const b = this.bounds[spriteKey] ?? { topY: 0, bottomY: srcH - 1, contentH: srcH };
    const scale = targetH / b.contentH;
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    const drawY = baseY - drawH + (srcH - 1 - b.bottomY) * scale;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
    ctx.drawImage(img, cx - drawW / 2, drawY, drawW, drawH);
    ctx.restore();
    return true;
  },
};

// ─────────────────────────────────────────────────────────────

let mobIdCounter = 0;

class Mob {
  constructor(hero, period = 'Manhã') {
    this.id   = ++mobIdCounter;
    const def = pickMobType(hero.level, period);
    this.type = def;

    // escala atributos com nível do hero
    const lvl   = Math.max(1, hero.level);
    const scale = 1 + (lvl - 1) * 0.12;

    this.spriteKey    = def.spriteKey;
    this.spriteH      = def.spriteH;
    this.width        = 36;
    this.height       = def.spriteH + 50; // espaço para HP bar

    this.worldX = hero.worldX + CONFIG.mob.spawnAheadDistance;
    this.y      = CONFIG.canvas.groundY;

    this.maxHp      = Math.round(def.hp * scale);
    this.hp         = this.maxHp;
    this.attack     = Math.round(def.attack * scale);
    this.xpReward   = Math.round(def.xpReward * scale);
    this.attackRange    = def.attackRange;
    this.approachSpeed  = def.approachSpeed;

    this.lastAttackTime   = 0;
    this.state            = 'walking';
    this.markedForRemoval = false;
    this.walkAnimTimer    = 0;
    this.flashTimer       = 0;
  }

  update(deltaMs, hero) {
    if (this.flashTimer > 0) this.flashTimer = Math.max(0, this.flashTimer - deltaMs);
    if (this.state === 'dead') return;

    const distance = Math.abs(this.worldX - hero.worldX);
    if (distance <= this.attackRange) {
      this.state = 'attacking';
      return;
    }
    this.state = 'walking';
    this.walkAnimTimer += deltaMs;
    const dir = hero.worldX > this.worldX ? 1 : -1;
    this.worldX += dir * this.approachSpeed * (deltaMs / 16.67);
  }

  canAttack(now)     { return now - this.lastAttackTime >= CONFIG.mob.attackCooldownMs; }
  performAttack(now) { this.lastAttackTime = now; return this.attack; }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.flashTimer = 150;
    if (this.hp === 0) this.state = 'dead';
  }

  getScreenX(hero) {
    return CONFIG.hero.screenX + (this.worldX - hero.worldX);
  }

  draw(ctx, hero) {
    const screenX = this.getScreenX(hero);
    if (screenX < -80 || screenX > CONFIG.canvas.width + 80) return;
    const sx = screenX;
    const fy = this.y;

    ctx.save();

    if (this.state === 'dead') {
      ctx.globalAlpha = 0.35;
      MobSprites.draw(ctx, this.spriteKey, sx, fy, this.spriteH, { alpha: 0.35 });
      ctx.restore();
      return;
    }

    const bob  = Math.sin(this.walkAnimTimer / 80) * 2;
    const baseY = fy + bob;

    // sombra
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(sx - 18, fy + 2, 36, 6);
    ctx.fillRect(sx - 14, fy,     28, 4);

    // sprite PNG (fallback para canvas goblin se não carregou)
    const drew = MobSprites.draw(ctx, this.spriteKey, sx, baseY, this.spriteH);
    if (!drew) this._drawFallback(ctx, sx, fy);

    // flash de dano — glow branco
    if (this.flashTimer > 0) {
      const alpha = (this.flashTimer / 150);
      ctx.save();
      ctx.shadowColor = `rgba(255,255,255,${alpha})`;
      ctx.shadowBlur  = 14;
      MobSprites.draw(ctx, this.spriteKey, sx, baseY, this.spriteH);
      ctx.restore();
    }

    ctx.restore();

    // barra de HP (fora do save/restore para não herdar transforms)
    this._drawHpBar(ctx, sx, fy);
  }

  _drawHpBar(ctx, sx, fy) {
    const bw     = 36;
    const hpRatio = this.hp / this.maxHp;
    const barY   = fy - this.spriteH - 18;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(sx - bw / 2, barY, bw, 6);
    ctx.fillStyle = hpRatio > 0.5 ? '#dd3333' : '#ff7700';
    ctx.fillRect(sx - bw / 2, barY, bw * hpRatio, 6);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - bw / 2, barY, bw, 6);
  }

  // fallback canvas caso sprite não carregue
  _drawFallback(ctx, sx, fy) {
    ctx.fillStyle = '#4a6838';
    ctx.fillRect(sx - 10, fy - 40, 20, 40);
    ctx.fillStyle = '#ff2424';
    ctx.fillRect(sx - 6,  fy - 36, 4, 4);
    ctx.fillRect(sx + 2,  fy - 36, 4, 4);
  }
}
