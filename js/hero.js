class Hero {
  constructor(heroClass = 'darknight') {
    this.heroClass = heroClass;
    this.worldX = 0;
    this.y      = CONFIG.canvas.groundY;
    this.width  = 40;
    this.height = 88;

    this.level      = 1;
    this.maxHp      = CONFIG.hero.baseMaxHp;
    this.hp         = this.maxHp;
    this.attack     = CONFIG.hero.baseAttack;

    this.xp             = 0;
    this.xpToNextLevel  = CONFIG.hero.xpToLevelBase;

    this.lastAttackTime = 0;
    this.inventory      = [];

    // alcance e cadência de ataque por classe
    const rangeByClass   = { hunter: 280, mage: 320, darknight: 55, warrior: 60, cleric: 65 };
    const cooldownByClass = { hunter: 1300, mage: 1600, darknight: 800, warrior: 900, cleric: 1100 };
    this.attackRange      = rangeByClass[heroClass]    ?? CONFIG.hero.attackRange;
    this.attackCooldownMs = cooldownByClass[heroClass] ?? CONFIG.hero.attackCooldownMs;

    this.state         = 'walking';
    this.walkAnimTimer = 0;
    this.flashTimer    = 0;

    // efeitos visuais de ação
    this.dodgeOffset   = 0;   // deslocamento horizontal temporário na esquiva
    this.dodgeTimer    = 0;
    this.blockTimer    = 0;   // duração do flash de bloqueio (azul)
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

    if (targetMob && this.distanceTo(targetMob) <= this.attackRange) {
      this.state = 'attacking';
      return;
    }

    this.state = 'walking';
    this.worldX        += CONFIG.hero.walkSpeed * (deltaMs / 16.67);
    this.walkAnimTimer += deltaMs;
  }

  distanceTo(entity) { return Math.abs(this.worldX - entity.worldX); }
  canAttack(now)     { return now - this.lastAttackTime >= this.attackCooldownMs; }
  performAttack(now) { this.lastAttackTime = now; return this.attack; }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.flashTimer = 180;
    if (this.hp === 0) this.state = 'dead';
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
    const bob  = this.state === 'walking' ? Math.sin(this.walkAnimTimer / 90) * 3 : 0;
    const baseY = fy + bob;

    // sombra
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(sx - 22, fy + 2, 44, 8);
    ctx.fillRect(sx - 18, fy,     36, 4);

    if (this.state === 'dead') {
      Sprites.drawHero(ctx, this.heroClass, sx, baseY, this.height, { alpha: 0.35 });
      ctx.restore();
      return;
    }

    Sprites.drawHero(ctx, this.heroClass, sx, baseY, this.height);

    // feedback visual de bloqueio — brilho azul no contorno
    if (this.blockTimer > 0) {
      ctx.save();
      ctx.shadowColor = `rgba(80,160,255,${(this.blockTimer / 320) * 0.9})`;
      ctx.shadowBlur  = 18;
      Sprites.drawHero(ctx, this.heroClass, sx, baseY, this.height);
      ctx.restore();
    }

    // feedback visual de dano — brilho vermelho no contorno
    if (this.flashTimer > 0 && this.blockTimer === 0) {
      ctx.save();
      ctx.shadowColor = `rgba(255,60,40,${(this.flashTimer / 180) * 0.9})`;
      ctx.shadowBlur  = 16;
      Sprites.drawHero(ctx, this.heroClass, sx, baseY, this.height);
      ctx.restore();
    }

    ctx.restore();
  }
}
