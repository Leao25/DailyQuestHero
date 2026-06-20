// ============================================================
// effects.js — Efeitos visuais de combate:
//   • Números de dano/XP flutuantes
//   • Partículas de morte
//   • Screen shake ao levar dano
// Todos os efeitos são pure-canvas, sem DOM.
// ============================================================

const Effects = {
  texts:      [],   // números flutuantes
  particles:  [],   // partículas de morte/impacto
  projectiles:[],   // flechas / bolas de fogo

  // estado do screen shake
  _shake: { ix: 0, iy: 0, timer: 0, intensity: 0 },

  // ── Spawn ────────────────────────────────────────────────

  spawnDamageNumber(x, y, value, options = {}) {
    this.texts.push({
      x: x + (Math.random() - 0.5) * 14,
      y,
      value:   options.prefix ? `${options.prefix}${value}` : `-${value}`,
      color:   options.color  ?? '#ff4444',
      outline: options.outline ?? '#220000',
      size:    options.size   ?? 15,
      bold:    options.bold   ?? true,
      vy:      -(1.1 + Math.random() * 0.4),
      vx:      (Math.random() - 0.5) * 0.5,
      life:    1.0,
      decay:   0.016,
    });
  },

  spawnXpNumber(x, y, value) {
    this.spawnDamageNumber(x, y, value, {
      prefix:  '+',
      color:   '#aaee44',
      outline: '#223300',
      size:    13,
      bold:    false,
    });
  },

  // Estouro de partículas ao matar um mob
  spawnDeathBurst(x, y, colors = ['#c23b3b', '#e05020', '#ff8030']) {
    const count = 22;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
      const speed = 1.8 + Math.random() * 3.5;
      this.particles.push({
        x,
        y: y - 18,
        vx:    Math.cos(angle) * speed,
        vy:    Math.sin(angle) * speed - 2.5,
        gravity: 0.14,
        life:    1.0,
        decay:   0.018 + Math.random() * 0.018,
        size:    2.5 + Math.random() * 3.5,
        color:   colors[Math.floor(Math.random() * colors.length)],
        shape:   Math.random() > 0.5 ? 'circle' : 'square',
      });
    }

    // faíscas brancas/amarelas extras
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 4;
      this.particles.push({
        x, y: y - 18,
        vx:    Math.cos(angle) * speed,
        vy:    Math.sin(angle) * speed - 3,
        gravity: 0.10,
        life:    1.0,
        decay:   0.035 + Math.random() * 0.02,
        size:    1.5 + Math.random() * 2,
        color:   Math.random() > 0.5 ? '#ffffff' : '#ffee88',
        shape:   'circle',
      });
    }
  },

  // Partículas menores ao Hero acertar um golpe (impacto no mob)
  spawnHitSparks(x, y) {
    for (let i = 0; i < 7; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y - 10,
        vx:    Math.cos(angle) * speed,
        vy:    Math.sin(angle) * speed,
        gravity: 0.08,
        life:    1.0,
        decay:   0.06 + Math.random() * 0.04,
        size:    1.5 + Math.random() * 2,
        color:   Math.random() > 0.4 ? '#ffe860' : '#ffffff',
        shape:   'circle',
      });
    }
  },

  // Projétil — 'arrow' ou 'fireball'
  // onHit(targetX, targetY) é chamado quando chega no alvo
  spawnProjectile(type, fromX, fromY, toX, toY, onHit) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = type === 'arrow' ? 9 : 5.5;
    this.projectiles.push({
      type,
      x: fromX, y: fromY,
      tx: toX,  ty: toY,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      dist,
      traveled: 0,
      onHit,
      trail: [],
    });
  },

  // Screen shake: intensity em px, duration em ms
  triggerShake(intensity, duration) {
    if (intensity <= this._shake.intensity) return; // não interrompe shake mais forte
    this._shake.intensity = intensity;
    this._shake.timer     = duration;
  },

  // Retorna o offset de shake atual (chamado antes de draw)
  getShakeOffset() {
    if (this._shake.timer <= 0) return { x: 0, y: 0 };
    const t = this._shake.timer / 200; // normalizado
    const amp = this._shake.intensity * t;
    return {
      x: (Math.random() - 0.5) * amp * 2,
      y: (Math.random() - 0.5) * amp * 2,
    };
  },

  // ── Update ───────────────────────────────────────────────

  update(deltaMs) {
    const dt = deltaMs / 16.67;

    if (this._shake.timer > 0) {
      this._shake.timer = Math.max(0, this._shake.timer - deltaMs);
    }

    // textos flutuantes
    for (const t of this.texts) {
      t.x    += t.vx * dt;
      t.y    += t.vy * dt;
      t.vy   *= 0.96;         // desacelera ao subir
      t.life -= t.decay * dt;
    }
    this.texts = this.texts.filter(t => t.life > 0);

    // projéteis
    for (const p of this.projectiles) {
      p.trail.push({ x: p.x, y: p.y, life: 1.0 });
      if (p.trail.length > 8) p.trail.shift();
      for (const t of p.trail) t.life -= 0.18 * dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.traveled += Math.sqrt(p.vx * p.vx + p.vy * p.vy) * dt;

      if (p.traveled >= p.dist) {
        p.traveled = p.dist;
        p.hit = true;
        if (p.onHit) p.onHit(p.tx, p.ty);
      }
    }
    this.projectiles = this.projectiles.filter(p => !p.hit);

    // partículas
    for (const p of this.particles) {
      p.x    += p.vx * dt;
      p.y    += p.vy * dt;
      p.vy   += p.gravity * dt;
      p.life -= p.decay * dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  },

  // ── Draw ─────────────────────────────────────────────────

  draw(ctx) {
    // --- projéteis ---
    for (const p of this.projectiles) {
      const angle = Math.atan2(p.vy, p.vx);
      ctx.save();

      if (p.type === 'arrow') {
        // rastro fino
        for (const t of p.trail) {
          ctx.globalAlpha = Math.max(0, t.life) * 0.4;
          ctx.fillStyle = '#c8a050';
          ctx.fillRect(t.x - 1, t.y - 1, 2, 2);
        }
        ctx.globalAlpha = 1;
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        // haste
        ctx.fillStyle = '#8b5a1a';
        ctx.fillRect(-14, -1, 20, 2);
        // ponta metálica
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(6, -2, 8, 4);
        ctx.fillRect(12, -1, 4, 2);
        // penas
        ctx.fillStyle = '#e8e0c0';
        ctx.fillRect(-14, -3, 6, 2);
        ctx.fillRect(-14,  1, 6, 2);

      } else if (p.type === 'fireball') {
        // rastro de fogo
        for (const t of p.trail) {
          ctx.globalAlpha = Math.max(0, t.life) * 0.5;
          ctx.fillStyle = '#ff6600';
          ctx.beginPath();
          ctx.arc(t.x, t.y, 4 * t.life, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        // camada externa laranja
        ctx.fillStyle = '#ff5500';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
        ctx.fill();
        // núcleo amarelo
        ctx.fillStyle = '#ffee00';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        // brilho central branco
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // --- partículas ---
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = p.color;
      const r = p.size * (0.4 + p.life * 0.6); // encolhe ao morrer
      if (p.shape === 'square') {
        ctx.fillRect(p.x - r / 2, p.y - r / 2, r, r);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // --- números flutuantes ---
    for (const t of this.texts) {
      const alpha = Math.max(0, t.life);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font        = `${t.bold ? 'bold ' : ''}${t.size}px monospace`;
      ctx.textAlign   = 'center';

      // outline / sombra
      ctx.fillStyle   = t.outline;
      for (const [ox, oy] of [[-1,-1],[1,-1],[-1,1],[1,1],[0,2]]) {
        ctx.fillText(t.value, t.x + ox, t.y + oy);
      }
      // texto principal
      ctx.fillStyle = t.color;
      ctx.fillText(t.value, t.x, t.y);

      ctx.restore();
    }
  },
};
