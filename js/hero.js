class Hero {
  constructor(heroClass = 'warrior') {
    this.heroClass = heroClass;
    this.worldX = 0;
    this.y      = CONFIG.canvas.groundY;
    this.width  = 40;
    const heightByClass = { warrior: 160, hunter: 160, mage: 160, cleric: 160 };
    this.height = heightByClass[heroClass] ?? 130;

    this.level      = 1;
    this.maxHp      = CONFIG.hero.baseMaxHp;
    this.hp         = this.maxHp;
    this.xp             = 0;
    this.xpToNextLevel  = CONFIG.hero.xpToLevelBase;

    this.lastAttackTime = 0;
    this.inventory      = [];

    // alcance, cadência e dano base por classe
    const attackByClass   = { hunter: 7, mage: 18, warrior: 15, cleric: 9 };
    const rangeByClass    = { hunter: 280, mage: 320, warrior: 60, cleric: 65 };
    const cooldownByClass = { hunter: 1100, mage: 1600, warrior: 900, cleric: 1100 };
    this.attack     = attackByClass[heroClass] ?? CONFIG.hero.baseAttack;
    this.attackRange      = rangeByClass[heroClass]    ?? CONFIG.hero.attackRange;
    this.attackCooldownMs = cooldownByClass[heroClass] ?? CONFIG.hero.attackCooldownMs;

    // stats de combate por classe
    const critChanceByClass = { warrior: 0.15, hunter: 0.25, mage: 0.20, cleric: 0.08 };
    const critMultByClass   = { warrior: 1.8,  hunter: 2.0,  mage: 2.5,  cleric: 1.5  };
    const dodgeByClass      = { warrior: 0.08, hunter: 0.20, mage: 0.05, cleric: 0.12 };
    const blockByClass      = { warrior: 0.30, hunter: 0.10, mage: 0.05, cleric: 0.20 };
    this.critChance     = critChanceByClass[heroClass] ?? 0.10;
    this.critMultiplier = critMultByClass[heroClass]   ?? 1.5;
    this.dodgeChance    = dodgeByClass[heroClass]      ?? 0.10;
    this.blockChance    = blockByClass[heroClass]      ?? 0.15;

    // passiva da classe (stacks e estado)
    this.passiveStacks  = 0;
    this.passiveBonusAtk = 0; // warrior: ATK acumulado pela passiva

    this.state         = 'walking';
    this.walkAnimTimer = 0;
    this.flashTimer    = 0;

    // animação por frames
    this.animFrame = 0;
    this.animTimer = 0;
    this._lastAnim = '';

    // efeitos visuais de ação
    this.dodgeOffset   = 0;
    this.dodgeTimer    = 0;
    this.blockTimer    = 0;
  }

  update(deltaMs, targetMob) {
    if (this.flashTimer > 0) this.flashTimer = Math.max(0, this.flashTimer - deltaMs);
    if (this.blockTimer > 0) this.blockTimer = Math.max(0, this.blockTimer - deltaMs);
    if (this.dodgeTimer > 0) {
      this.dodgeTimer  = Math.max(0, this.dodgeTimer - deltaMs);
      // hero recua para direita na esquiva e volta suavemente
      const t = this.dodgeTimer / 220;
      this.dodgeOffset = Math.round(Math.sin(t * Math.PI) * 28);
    } else {
      this.dodgeOffset = 0;
    }

    if (this.state === 'dead') return;

    // estados temporários de dodge/block sobrepõem attacking/walking
    if (this.dodgeTimer > 0) {
      this.state = 'dodging';
      this._advanceAnim(deltaMs);
      return;
    }
    if (this.blockTimer > 0) {
      this.state = 'blocking';
      this._advanceAnim(deltaMs);
      return;
    }

    if (targetMob && this.distanceTo(targetMob) <= this.attackRange) {
      this.state = 'attacking';
      this._advanceAnim(deltaMs);
      return;
    }

    this.state = 'walking';
    this.worldX        += CONFIG.hero.walkSpeed * (deltaMs / 16.67);
    this.walkAnimTimer += deltaMs;
    this._advanceAnim(deltaMs);
  }

  triggerDodge() {
    this.dodgeTimer  = 400; // duração da animação de esquiva em ms
    this.dodgeOffset = 0;
  }

  triggerBlock() {
    this.blockTimer = 350; // duração da animação de bloqueio em ms
    this.flashTimer = 150;
  }

  // Mapeia estado do herói para nome de animação
  _animName() {
    if (this.state === 'dead')      return 'death';
    if (this.state === 'dodging')   return 'dodge';
    if (this.state === 'blocking')  return 'block';
    if (this.state === 'attacking') return 'attack';
    return 'walk';
  }

  // Avança o frame da animação com base no ANIM_DEFS
  _advanceAnim(deltaMs) {
    const defs = Sprites.ANIM_DEFS[this.heroClass];
    const anim = this._animName();

    if (anim !== this._lastAnim) {
      this.animFrame = 0;
      this.animTimer = 0;
      this._lastAnim = anim;
      return;
    }

    if (!defs) return;
    const def = defs[anim];
    if (!def) return;

    this.animTimer += deltaMs;
    const frameDur = def.fps[this.animFrame] ?? 100;
    if (this.animTimer >= frameDur) {
      this.animTimer -= frameDur;
      const isLooping = (anim === 'walk' || anim === 'attack');
      if (isLooping) {
        this.animFrame = (this.animFrame + 1) % def.count;
      } else {
        this.animFrame = Math.min(this.animFrame + 1, def.count - 1);
      }
    }
  }

  distanceTo(entity) { return Math.abs(this.worldX - entity.worldX); }
  canAttack(now)     { return now - this.lastAttackTime >= this.attackCooldownMs; }
  performAttack(now) { this.lastAttackTime = now; return this.attack; }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.flashTimer = 180;
    if (this.hp === 0) {
      this.state = 'dead';
      // Warrior "Fúria": reseta stacks e ATK bônus na morte
      if (this.heroClass === 'warrior' && this.passiveBonusAtk > 0) {
        this.attack = Math.max(1, this.attack - this.passiveBonusAtk);
        this.passiveBonusAtk = 0;
        this.passiveStacks   = 0;
      }
      // Hunter: reseta contador de hits
      if (this.heroClass === 'hunter') this.passiveStacks = 0;
    }
  }

  triggerBlock() { this.blockTimer = 320; }
  triggerDodge() { this.dodgeTimer = 220; }

  respawn() { this.hp = this.maxHp; this.state = 'walking'; }

  gainXp(amount) {
    this.xp += amount;
    const leveledUp = [];
    while (this.xp >= this.xpToNextLevel) {
      this.xp          -= this.xpToNextLevel;
      this.level       += 1;
      this.maxHp        = Math.round(this.maxHp  * 1.12);
      this.attack       = Math.round(this.attack * 1.10);
      this.hp           = Math.min(this.hp + Math.round(this.maxHp * 0.30), this.maxHp);
      this.xpToNextLevel = Math.round(this.xpToNextLevel * CONFIG.hero.xpToLevelGrowth);
      leveledUp.push(this.level);
    }
    return leveledUp;
  }

  addItems(items) { this.inventory.push(...items); }

  // Calcula o retângulo exato do sprite e aplica o fillStyle já definido
  _drawFlashRect(ctx, sx, baseY) {
    const img = Sprites.images[this.heroClass];
    if (!img) return;
    const b    = Sprites.bounds[this.heroClass];
    const srcW = img.width  ?? img.naturalWidth  ?? 1;
    const srcH = img.height ?? img.naturalHeight ?? 1;
    const contentH = b?.contentH ?? srcH;
    const scale    = this.height / contentH;
    const drawW    = srcW * scale;
    const drawH    = srcH * scale;
    const bottomOff = b ? (srcH - 1 - b.bottomY) * scale : 0;
    ctx.fillRect(sx - drawW / 2, baseY - drawH + bottomOff, drawW, drawH);
  }

  draw(ctx) {
    ctx.save();
    const sx   = CONFIG.hero.screenX + this.dodgeOffset;
    const fy   = this.y;
    const bob  = this.state === 'walking'  ? Math.sin(this.walkAnimTimer / 90) * 3
               : this.state === 'attacking' ? (this.animFrame === 1 ? 3 : -3)
               : 0;
    const baseY = fy + bob;

    // sombra — pulsa com o bob da animação
    const shadowY     = fy + 44;
    const shadowScale = 1 + bob * 0.04; // bob ±3 → escala ±12%
    const sw1 = Math.round(44 * shadowScale);
    const sw2 = Math.round(36 * shadowScale);
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(sx - sw1 / 2, shadowY,     sw1, 8);
    ctx.fillRect(sx - sw2 / 2, shadowY - 2, sw2, 4);

    const anim      = this._animName();
    const hasAnims  = !!Sprites.animSheets[this.heroClass];
    const drawSprite = (opts = {}) => {
      if (hasAnims) {
        Sprites.drawFrame(ctx, this.heroClass, anim, this.animFrame, sx, baseY, this.height, opts);
      } else {
        Sprites.drawHero(ctx, this.heroClass, sx, baseY, this.height, opts);
      }
    };

    if (this.state === 'dead') {
      drawSprite({ alpha: 0.35 });
      ctx.restore();
      return;
    }

    drawSprite();

    // brilho azul de bloqueio
    if (this.blockTimer > 0) {
      ctx.save();
      ctx.shadowColor = `rgba(80,160,255,${(this.blockTimer / 320) * 0.9})`;
      ctx.shadowBlur  = 18;
      drawSprite();
      ctx.restore();
    }

    // brilho vermelho de dano
    if (this.flashTimer > 0 && this.blockTimer === 0) {
      ctx.save();
      ctx.shadowColor = `rgba(255,60,40,${(this.flashTimer / 180) * 0.9})`;
      ctx.shadowBlur  = 16;
      drawSprite();
      ctx.restore();
    }

    ctx.restore();
  }
}
