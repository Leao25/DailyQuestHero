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
    goldReward:   5,
    attackRange:  45,
    approachSpeed:0.7,
    weight:       40,
    periods:      ['Manhã', 'Tarde', 'Entardecer', 'Noite'],
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
    goldReward:   8,
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
    goldReward:   18,
    attackRange:  55,
    approachSpeed:0.5,
    weight:       15,
    periods:      ['Tarde', 'Entardecer', 'Noite'],
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
    goldReward:   12,
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
    goldReward:   30,
    attackRange:  60,
    approachSpeed:0.8,
    weight:       5,
    periods:      ['Noite'],
    minLevel:     8,
    drops:        ['rune', 'rare_item'],
  },

  // Boss da Fase 1 — Guardião da Floresta
  forest_guardian: {
    key:          'forest_guardian',
    label:        'Guardião da Floresta',
    spriteKey:    'mob_orc',
    spriteH:      110,
    hp:           400,
    attack:       22,
    xpReward:     200,
    goldReward:   100,
    attackRange:  60,
    approachSpeed:0.4,
    weight:       0,
    periods:      ['Noite'],
    minLevel:     10,
    drops:        [],
    isBoss:       true,
  },
};

// Pool disponível na Fase 1 (sem demônio)
const PHASE1_POOL = ['goblin']; // wolf, orc, skeleton desativados temporariamente

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
//
// Formato padrão esperado (mob_[type]_sheet.png):
//   Row 0: walk   — 5 frames
//   Row 1: attack — 4 frames
//   Row 2: death  — 4 frames
//
const MobSprites = {
  images: {},
  bounds: {},
  sheets: {},
  animSheets: {}, // { spriteKey: { animName: [canvas, canvas, ...] } }
  _loaded: 0,
  _total:  0,
  ready:   false,

  // ── Animações individuais por arquivo (novo sistema) ─────────
  ANIM_DEFS: {
    mob_goblin: {
      walk:   { file: 'mob_goblin_walk',   count: 2, frameW: 353, frameH: 353, fps: [420, 420], groundOffset: 42 },
      attack: { file: 'mob_goblin_attack', count: 2, frameW: 353, frameH: 353, fps: [300, 420], groundOffset: 65 },
    },
  },

  loadAnimSheets(spriteKey) {
    const defs = this.ANIM_DEFS[spriteKey];
    if (!defs) return;
    if (!this.animSheets[spriteKey]) this.animSheets[spriteKey] = {};
    Object.entries(defs).forEach(([animName, def]) => {
      const img = new Image();
      img.onload = () => {
        const frames = [];
        for (let i = 0; i < def.count; i++) {
          const fc = document.createElement('canvas');
          fc.width  = def.frameW;
          fc.height = def.frameH;
          fc.getContext('2d').drawImage(img, i * def.frameW, 0, def.frameW, def.frameH, 0, 0, def.frameW, def.frameH);
          frames.push(fc);
        }
        this.animSheets[spriteKey][animName] = frames;
      };
      img.onerror = () => {};
      img.src = `assets/sprites/${def.file}.png`;
    });
  },

  drawAnimFrame(ctx, spriteKey, animName, frameIdx, cx, baseY, targetH, options = {}) {
    const anims = this.animSheets[spriteKey];
    const def   = this.ANIM_DEFS[spriteKey]?.[animName];
    if (!anims || !def) return false;
    const resolved = anims[animName] ? animName : 'walk';
    const resolvedDef = this.ANIM_DEFS[spriteKey]?.[resolved];
    const frames = anims[resolved];
    if (!frames) return false;
    const fi    = Math.min(frameIdx, resolvedDef.count - 1);
    const frame = frames[fi];
    if (!frame) return false;
    const scale = (targetH * (resolvedDef.heightScale ?? 1)) / resolvedDef.frameH;
    const dw    = resolvedDef.frameW * scale;
    const dh    = resolvedDef.frameH * scale;
    const drawY = baseY - dh + (resolvedDef.groundOffset ?? 0);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
    ctx.drawImage(frame, cx - dw / 2, drawY, dw, dh);
    ctx.restore();
    return true;
  },

  // ── Definição dos spritesheets por mob ───────────────────────
  SHEET_DEFS: {
    mob_goblin: {
      rowH: 150,
      rows: [
        { name: 'walk',   count: 5, frameW: 150, fps: [110,110,110,110,110] },
        { name: 'attack', count: 4, frameW: 150, fps: [80,60,60,140] },
        { name: 'death',  count: 4, frameW: 150, fps: [100,100,150,250] },
      ],
    },
    mob_wolf: {
      rowH: 150,
      rows: [
        { name: 'walk',   count: 5, frameW: 150, fps: [100,100,100,100,100] },
        { name: 'attack', count: 4, frameW: 150, fps: [70,55,55,140] },
        { name: 'death',  count: 4, frameW: 150, fps: [100,100,150,250] },
      ],
    },
    mob_orc: {
      rowH: 180,
      rows: [
        { name: 'walk',   count: 5, frameW: 180, fps: [130,130,130,130,130] },
        { name: 'attack', count: 4, frameW: 180, fps: [100,70,70,160] },
        { name: 'death',  count: 4, frameW: 180, fps: [100,100,150,250] },
      ],
    },
    mob_skeleton: {
      rowH: 160,
      rows: [
        { name: 'walk',   count: 5, frameW: 160, fps: [120,120,120,120,120] },
        { name: 'attack', count: 4, frameW: 160, fps: [90,65,65,150] },
        { name: 'death',  count: 4, frameW: 160, fps: [100,100,150,250] },
      ],
    },
    mob_demon: {
      rowH: 200,
      rows: [
        { name: 'walk',   count: 5, frameW: 200, fps: [110,110,110,110,110] },
        { name: 'attack', count: 4, frameW: 200, fps: [80,60,60,150] },
        { name: 'death',  count: 4, frameW: 200, fps: [100,100,150,250] },
      ],
    },
  },

  loadSheet(spriteKey) {
    if (this.sheets[spriteKey]) return;
    const img = new Image();
    img.onload = () => {
      const oc = document.createElement('canvas');
      oc.width  = img.naturalWidth;
      oc.height = img.naturalHeight;
      oc.getContext('2d').drawImage(img, 0, 0);
      this.sheets[spriteKey] = oc;
    };
    img.onerror = () => {};
    img.src = `assets/sprites/${spriteKey}_sheet.png`;
  },

  drawFrame(ctx, spriteKey, animName, frameIdx, cx, baseY, targetH, options = {}) {
    const sheet = this.sheets[spriteKey];
    const def   = this.SHEET_DEFS[spriteKey];
    if (!sheet || !def) {
      this.draw(ctx, spriteKey, cx, baseY, targetH, options);
      return;
    }
    const rowIdx = def.rows.findIndex(r => r.name === animName);
    if (rowIdx < 0) { this.draw(ctx, spriteKey, cx, baseY, targetH, options); return; }
    const row = def.rows[rowIdx];
    const fi  = Math.min(frameIdx, row.count - 1);
    const scale = targetH / def.rowH;
    const dw    = row.frameW * scale;
    const dh    = def.rowH   * scale;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
    ctx.drawImage(sheet, fi * row.frameW, rowIdx * def.rowH, row.frameW, def.rowH,
                  cx - dw / 2, baseY - dh, dw, dh);
    ctx.restore();
  },

  load(onComplete) {
    // carrega apenas spriteKeys únicos para evitar duplicatas (ex: forest_guardian usa mob_orc)
    const uniqueKeys = [...new Set(Object.values(MOB_TYPES).map(d => d.spriteKey))];
    this._total  = uniqueKeys.length;
    this._loaded = 0;

    uniqueKeys.forEach(spriteKey => {
      this.loadAnimSheets(spriteKey);
      this.loadSheet(spriteKey);

      const img = new Image();
      img.onload = () => {
        this._calcBounds(spriteKey, img);
        this._loaded++;
        if (this._loaded === this._total) { this.ready = true; onComplete(); }
      };
      img.onerror = () => {
        this.bounds[spriteKey] = { topY: 0, bottomY: 1, contentH: 1 };
        this._loaded++;
        if (this._loaded === this._total) { this.ready = true; onComplete(); }
      };
      img.src = `assets/sprites/${spriteKey}.png`;
      this.images[spriteKey] = img;
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
        if (d[i+3] > 8) {
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
  constructor(hero, period = 'Manhã', forceType = null) {
    this.id   = ++mobIdCounter;
    const def = forceType ? MOB_TYPES[forceType] : pickMobType(hero.level, period);
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

    // animação por frames
    this.animFrame = 0;
    this.animTimer = 0;
    this._lastAnim = '';
  }

  _animName() {
    if (this.state === 'dead')      return 'death';
    if (this.state === 'attacking') return 'attack';
    return 'walk';
  }

  _advanceAnim(deltaMs) {
    const anim = this._animName();
    if (anim !== this._lastAnim) {
      this.animFrame = 0;
      this.animTimer = 0;
      this._lastAnim = anim;
      return;
    }
    // novo sistema: ANIM_DEFS individuais
    const animDef = MobSprites.ANIM_DEFS[this.spriteKey]?.[anim];
    if (animDef) {
      this.animTimer += deltaMs;
      const frameDur = animDef.fps[this.animFrame] ?? 100;
      if (this.animTimer >= frameDur) {
        this.animTimer -= frameDur;
        const looping = (anim === 'walk' || anim === 'attack');
        this.animFrame = looping
          ? (this.animFrame + 1) % animDef.count
          : Math.min(this.animFrame + 1, animDef.count - 1);
      }
      return;
    }
    // fallback: SHEET_DEFS (spritesheet em linhas)
    const sheetDef = MobSprites.SHEET_DEFS[this.spriteKey];
    if (!sheetDef) return;
    const row = sheetDef.rows.find(r => r.name === anim);
    if (!row) return;
    this.animTimer += deltaMs;
    const frameDur = row.fps[this.animFrame] ?? 100;
    if (this.animTimer >= frameDur) {
      this.animTimer -= frameDur;
      const looping = (anim === 'walk');
      this.animFrame = looping
        ? (this.animFrame + 1) % row.count
        : Math.min(this.animFrame + 1, row.count - 1);
    }
  }

  update(deltaMs, hero) {
    if (this.flashTimer > 0) this.flashTimer = Math.max(0, this.flashTimer - deltaMs);
    if (this.state === 'dead') return;

    const distance = Math.abs(this.worldX - hero.worldX);
    if (distance <= this.attackRange) {
      this.state = 'attacking';
      this._advanceAnim(deltaMs);
      return;
    }
    this.state = 'walking';
    this.walkAnimTimer += deltaMs;
    this._advanceAnim(deltaMs);
    const dir = hero.worldX > this.worldX ? 1 : -1;
    this.worldX += dir * this.approachSpeed * (deltaMs / 16.67);
    // impede o mob de ultrapassar o hero (mobs sempre vêm da direita)
    const minDist = this.attackRange - 2;
    if (this.worldX < hero.worldX + minDist) this.worldX = hero.worldX + minDist;
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

    const anim      = this._animName();
    const hasAnims  = !!MobSprites.animSheets[this.spriteKey];
    const hasSheet  = !!MobSprites.sheets[this.spriteKey];
    const drawSprite = (opts = {}) => {
      if (hasAnims) {
        const drew = MobSprites.drawAnimFrame(ctx, this.spriteKey, anim, this.animFrame, sx, fy, this.spriteH, opts);
        if (drew) return;
      }
      if (hasSheet) {
        MobSprites.drawFrame(ctx, this.spriteKey, anim, this.animFrame, sx, fy, this.spriteH, opts);
      } else {
        const drew = MobSprites.draw(ctx, this.spriteKey, sx, fy, this.spriteH, opts);
        if (!drew && !opts.alpha) this._drawFallback(ctx, sx, fy);
      }
    };

    if (this.state === 'dead') {
      drawSprite({ alpha: 0.35 });
      ctx.restore();
      return;
    }

    const bob   = Math.sin(this.walkAnimTimer / 80) * 2;
    const baseY = fy + bob;

    // sombra
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(sx - 18, fy + 2, 36, 6);
    ctx.fillRect(sx - 14, fy,     28, 4);

    // sprite (animado ou estático)
    if (hasSheet) {
      MobSprites.drawFrame(ctx, this.spriteKey, anim, this.animFrame, sx, baseY, this.spriteH);
    } else {
      const drew = MobSprites.draw(ctx, this.spriteKey, sx, baseY, this.spriteH);
      if (!drew) this._drawFallback(ctx, sx, fy);
    }

    // flash de dano — glow branco
    if (this.flashTimer > 0) {
      ctx.save();
      ctx.shadowColor = `rgba(255,255,255,${this.flashTimer / 150})`;
      ctx.shadowBlur  = 14;
      if (hasSheet) {
        MobSprites.drawFrame(ctx, this.spriteKey, anim, this.animFrame, sx, baseY, this.spriteH);
      } else {
        MobSprites.draw(ctx, this.spriteKey, sx, baseY, this.spriteH);
      }
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
