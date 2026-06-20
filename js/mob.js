// ============================================================
// mob.js — Inimigos da Floresta.
// Sprite: Goblin das Sombras — pele verde-escura, olhos vermelhos
// brilhantes, orelhas pontudas, garras, costas curvadas.
// Nasce à direita do hero e caminha para a esquerda (enfrenta esquerda).
//
// mob.worldX é posição no mundo; getScreenX(hero) converte pra tela.
// ============================================================

let mobIdCounter = 0;

class Mob {
  constructor(hero) {
    this.id     = ++mobIdCounter;
    this.width  = 36;
    this.height = 130; // usado pelo HP bar

    this.worldX = hero.worldX + CONFIG.mob.spawnAheadDistance;
    this.y      = CONFIG.canvas.groundY;

    this.maxHp     = CONFIG.mob.baseHp;
    this.hp        = this.maxHp;
    this.attack    = CONFIG.mob.baseAttack;
    this.xpReward  = CONFIG.mob.baseXpReward;

    this.lastAttackTime  = 0;
    this.state           = 'walking'; // 'walking' | 'attacking' | 'dead'
    this.markedForRemoval = false;
    this.walkAnimTimer   = 0;
    this.flashTimer      = 0;
  }

  update(deltaMs, hero) {
    if (this.flashTimer > 0) this.flashTimer = Math.max(0, this.flashTimer - deltaMs);
    if (this.state === 'dead') return;

    const distance = Math.abs(this.worldX - hero.worldX);

    if (distance <= CONFIG.mob.attackRange) {
      this.state = 'attacking';
      return;
    }

    this.state = 'walking';
    this.walkAnimTimer += deltaMs;
    const dir = hero.worldX > this.worldX ? 1 : -1;
    this.worldX += dir * CONFIG.mob.approachSpeed * (deltaMs / 16.67);
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

  // ============================================================
  // DRAW — Goblin das Sombras
  // Âncora: sx = centro horizontal na tela, fy = linha do chão
  // Goblin enfrenta ESQUERDA (caminha em direção ao hero)
  // ============================================================
  draw(ctx, hero) {
    const screenX = this.getScreenX(hero);
    if (screenX < -60 || screenX > CONFIG.canvas.width + 60) return;
    ctx.save();
    const sx = screenX;
    const fy = this.y;

    // morto — corpo deitado
    if (this.state === 'dead') {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#2a3820';
      ctx.fillRect(sx - 22, fy - 12, 44, 12);
      ctx.restore();
      return;
    }

    const bob      = Math.sin(this.walkAnimTimer / 80) * 2;
    const legSwing = Math.sin(this.walkAnimTimer / 80);
    const fy2      = fy + bob;

    // paleta Goblin das Sombras
    const SK = '#4a6838'; // pele principal
    const SD = '#2e4422'; // pele escuro
    const SH = '#6a8a50'; // pele highlight
    const CL = '#3a2a18'; // roupa principal
    const CD = '#241a0c'; // roupa escuro
    const CE = '#4e3a24'; // roupa borda
    const EY = '#ff2424'; // olho vermelho
    const EP = '#900000'; // pupila
    const FA = '#e8d890'; // presa/fang
    const NL = '#787038'; // garra/nail
    const WP = '#5a3820'; // cabo de arma

    // --- sombra pixel art ---
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(sx - 16, fy + 2, 32, 6);
    ctx.fillRect(sx - 12, fy,     24, 4);

    // --- braço traseiro (braço direito, atrás do corpo) ---
    ctx.fillStyle = SD;
    ctx.fillRect(sx + 6, fy2 - 32, 6, 14);
    // garra traseira
    ctx.fillStyle = NL;
    ctx.fillRect(sx + 5,  fy2 - 20, 3, 5);
    ctx.fillRect(sx + 9,  fy2 - 18, 3, 5);

    // --- perna traseira ---
    {
      const lx = sx + 2 + legSwing * 5;
      ctx.fillStyle = SD;
      ctx.fillRect(lx,     fy2 - 14, 6, 14);
      ctx.fillStyle = '#161006';
      ctx.fillRect(lx - 1, fy2 - 3,  9,  4); // pé
    }

    // --- corpo / túnica ---
    ctx.fillStyle = CL;
    ctx.fillRect(sx - 10, fy2 - 34, 20, 24);
    // highlight lado esquerdo (frente)
    ctx.fillStyle = CE;
    ctx.fillRect(sx - 8,  fy2 - 32,  8, 14);
    // sombra lado direito (atrás)
    ctx.fillStyle = CD;
    ctx.fillRect(sx + 4,  fy2 - 34,  6, 24);
    // barra da túnica (rasgada — zigue-zague)
    ctx.fillStyle = CD;
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(sx - 10 + i * 4, fy2 - 11, 3, 3 + (i % 2) * 4);
    }

    // --- corcunda pixel art ---
    ctx.fillStyle = CD;
    ctx.fillRect(sx,     fy2 - 46, 12, 8);
    ctx.fillRect(sx + 2, fy2 - 42, 10, 6);
    ctx.fillStyle = CL;
    ctx.fillRect(sx + 1, fy2 - 44, 8, 5);

    // --- perna dianteira (sobre o corpo) ---
    {
      const lx = sx - 8 - legSwing * 5;
      ctx.fillStyle = SK;
      ctx.fillRect(lx,     fy2 - 14, 6, 14);
      ctx.fillStyle = '#1e1408';
      ctx.fillRect(lx - 1, fy2 - 3,  9,  4); // pé
    }

    // --- braço dianteiro (esquerdo, voltado para o hero) ---
    ctx.fillStyle = SK;
    ctx.fillRect(sx - 17, fy2 - 32, 7, 10); // braço superior
    // antebraço inclinado levemente para baixo
    ctx.fillRect(sx - 19, fy2 - 22, 8,  8);
    // garras
    ctx.fillStyle = NL;
    ctx.fillRect(sx - 21, fy2 - 17, 3,  6);
    ctx.fillRect(sx - 17, fy2 - 15, 3,  6);
    ctx.fillRect(sx - 13, fy2 - 17, 3,  5);

    // --- cabeça pixel art ---
    ctx.fillStyle = SK;
    ctx.fillRect(sx - 11, fy2 - 50, 20, 18);
    ctx.fillRect(sx - 9,  fy2 - 54, 16, 6);
    ctx.fillRect(sx - 6,  fy2 - 57, 10, 4);
    // highlight frente (esquerdo)
    ctx.fillStyle = SH;
    ctx.fillRect(sx - 9, fy2 - 48,  6,  8);
    // sombra atrás (direito)
    ctx.fillStyle = SD;
    ctx.fillRect(sx + 4, fy2 - 50,  6, 18);

    // --- orelhas pontudas pixel art ---
    // orelha esquerda
    ctx.fillStyle = SK;
    ctx.fillRect(sx - 18, fy2 - 60, 6, 6);
    ctx.fillRect(sx - 15, fy2 - 56, 4, 4);
    ctx.fillRect(sx - 13, fy2 - 52, 4, 4);
    ctx.fillStyle = SD;
    ctx.fillRect(sx - 16, fy2 - 58, 4, 4);
    // orelha direita
    ctx.fillStyle = SD;
    ctx.fillRect(sx + 12, fy2 - 58, 6, 6);
    ctx.fillRect(sx + 10, fy2 - 54, 4, 4);
    ctx.fillRect(sx + 8,  fy2 - 50, 4, 4);

    // --- olhos ---
    ctx.fillStyle = '#100606';
    ctx.fillRect(sx - 8, fy2 - 46, 7, 5); // órbita esquerda
    ctx.fillRect(sx + 1, fy2 - 46, 7, 5); // órbita direita
    // brilho vermelho
    ctx.fillStyle = EY;
    ctx.fillRect(sx - 7, fy2 - 45,  5,  3);
    ctx.fillRect(sx + 2, fy2 - 45,  5,  3);
    // pupila
    ctx.fillStyle = EP;
    ctx.fillRect(sx - 5, fy2 - 45,  2,  2);
    ctx.fillRect(sx + 4, fy2 - 45,  2,  2);

    // --- nariz achatado ---
    ctx.fillStyle = SD;
    ctx.fillRect(sx - 3, fy2 - 39, 5, 4);
    ctx.fillStyle = '#1c1010';
    ctx.fillRect(sx - 2, fy2 - 39, 2, 2); // narina esq
    ctx.fillRect(sx + 1, fy2 - 39, 2, 2); // narina dir

    // --- boca com presas ---
    ctx.fillStyle = '#080204';
    ctx.fillRect(sx - 5, fy2 - 35, 9, 5);
    ctx.fillStyle = FA;
    ctx.fillRect(sx - 4, fy2 - 35, 2, 6); // presa esquerda
    ctx.fillRect(sx + 2, fy2 - 35, 2, 6); // presa direita
    // língua
    ctx.fillStyle = '#c02030';
    ctx.fillRect(sx - 1, fy2 - 32, 3, 3);

    // flash de dano — glow branco ao redor do mob
    if (this.flashTimer > 0) {
      const alpha = (this.flashTimer / 150) * 1.0;
      ctx.save();
      ctx.shadowColor = `rgba(255,255,255,${alpha})`;
      ctx.shadowBlur  = 14;
      // redesenha só o corpo central para o glow aparecer
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.3})`;
      ctx.fillRect(sx - 14, fy2 - 54, 28, 54);
      ctx.restore();
    }

    // --- barra de HP ---
    const bw = 32;
    const hpRatio = this.hp / this.maxHp;
    const barY = fy - this.height - 14;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(sx - bw / 2,          barY, bw, 6);
    ctx.fillStyle = hpRatio > 0.5 ? '#dd3333' : '#ff7700';
    ctx.fillRect(sx - bw / 2,          barY, bw * hpRatio, 6);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - bw / 2,        barY, bw, 6);

    ctx.restore();
  }
}
