// ============================================================
// sprites.js — Carregamento e renderização de sprites PNG.
// Todos os sprites são carregados uma vez e reutilizados.
// ============================================================

const Sprites = {
  images: {},
  _loaded: 0,
  _total:  0,
  ready:   false,

  // Metadados de cada classe (usados na tela de seleção)
  CLASSES: {
    // warrior: {
    //   label: 'Guerreiro',
    //   desc:  'Combatente equilibrado com espada e escudo. Versátil e resistente.',
    //   color: '#9a7040',
    //   stat:  { atk: 3, def: 4, spd: 3 },
    // },
    hunter: {
      label: 'Caçador',
      desc:  'Ágil e preciso. Ataques rápidos com alta chance de crítico.',
      color: '#4a8050',
      stat:  { atk: 3, def: 2, spd: 5 },
    },
    // mage: {
    //   label: 'Mago',
    //   desc:  'Feitiços devastadores de longa distância. Frágil mas letal.',
    //   color: '#5050a0',
    //   stat:  { atk: 5, def: 1, spd: 3 },
    // },
    // cleric: {
    //   label: 'Clérigo',
    //   desc:  'Guardião sagrado. Cura-se em combate e possui alta resistência.',
    //   color: '#909060',
    //   stat:  { atk: 2, def: 4, spd: 2 },
    // },
  },

  bounds:     {}, // tight pixel bounds por sprite key
  animSheets: {}, // { heroKey: { animName: canvas } }

  // ── Definição das animações por herói ───────────────────────
  // Cada animação é um arquivo PNG separado com frames lado a lado.
  // file: nome do arquivo em assets/sprites/ (sem .png)
  // count: número de frames
  // frameW/frameH: tamanho de cada frame em px
  // fps: duração em ms de cada frame
  // ─────────────────────────────────────────────────────────────
  ANIM_DEFS: {
    hunter: {
      walk:   { file: 'hero_hunter_walk',   count: 2, frameW: 353, frameH: 353, fps: [420, 420] },
      attack: { file: 'hero_hunter_attack', count: 2, frameW: 353, frameH: 353, fps: [100, 180] },
      block:  { file: 'hero_hunter_block',  count: 2, frameW: 353, frameH: 353, fps: [100, 180] },
      dodge:  { file: 'hero_hunter_dodge',  count: 2, frameW: 353, frameH: 353, fps: [80,  120] },
      death:  { file: 'hero_hunter_death',  count: 2, frameW: 353, frameH: 353, fps: [150, 400] },
    },
    // outros heróis usarão ANIM_DEFS quando tiverem assets
  },

  loadAnimSheets(key) {
    const defs = this.ANIM_DEFS[key];
    if (!defs) return;
    if (!this.animSheets[key]) this.animSheets[key] = {};
    Object.entries(defs).forEach(([animName, def]) => {
      const img = new Image();
      img.onload = () => {
        const oc = document.createElement('canvas');
        oc.width  = img.naturalWidth;
        oc.height = img.naturalHeight;
        oc.getContext('2d').drawImage(img, 0, 0);
        this.animSheets[key][animName] = oc;
      };
      img.onerror = () => {};
      img.src = `assets/sprites/${def.file}.png`;
    });
  },

  // Desenha um frame de animação individual.
  // Usa animSheets (arquivo por animação) se disponível,
  // senão cai no fallback desenhado.
  drawFrame(ctx, key, animName, frameIdx, cx, baseY, targetH, options = {}) {
    const anims = this.animSheets[key];
    const def   = this.ANIM_DEFS[key]?.[animName];

    if (anims && def && anims[animName]) {
      const sheet = anims[animName];
      const fi    = Math.min(frameIdx, def.count - 1);
      const sx    = fi * def.frameW;
      const scale = targetH / def.frameH;
      const dw    = def.frameW * scale;
      const dh    = def.frameH * scale;

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
      if (options.flipX) {
        ctx.translate(cx, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(sheet, sx, 0, def.frameW, def.frameH, -dw / 2, baseY - dh, dw, dh);
      } else {
        ctx.drawImage(sheet, sx, 0, def.frameW, def.frameH, cx - dw / 2, baseY - dh, dw, dh);
      }
      ctx.restore();
      return;
    }

    // fallback: pose estática ou canvas desenhado
    this.drawHero(ctx, key, cx, baseY, targetH, options);
  },

  // Chama onComplete() quando todos os sprites estáticos estiverem prontos.
  // Sheets são carregados em paralelo sem bloquear o jogo.
  load(onComplete) {
    const keys = Object.keys(this.CLASSES);
    this._total = keys.length;

    keys.forEach(key => {
      // carrega animações individuais (novo sistema)
      this.loadAnimSheets(key);

      const img = new Image();
      img.onload = () => {
        this._calcBounds(key, img);
        this._loaded++;
        if (this._loaded === this._total) { this.ready = true; onComplete(); }
      };
      img.onerror = () => {
        this.bounds[key] = { topY: 0, bottomY: 0, contentH: 1 };
        this._loaded++;
        if (this._loaded === this._total) { this.ready = true; onComplete(); }
      };
      img.src = `assets/sprites/hero_${key}.png`;
      this.images[key] = img;
    });
  },

  // Calcula bounds reais do sprite (pixels não-transparentes).
  // Sprites com fundo transparente não precisam de remoção de cor.
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

  get(key) { return this.images[key] ?? null; },

  /**
   * Desenha um sprite de herói centralizado em (cx, baseY).
   * baseY = linha do chão (pés do personagem).
   * targetH = altura VISÍVEL desejada do personagem (sem espaço transparente).
   * options: { alpha, flipX, glow, glowColor }
   */
  // Fallback desenhado a canvas para o hunter enquanto sprite não existe
  _drawHunterFallback(ctx, cx, baseY, targetH, options = {}) {
    const s = targetH / 72; // escala baseada na altura alvo
    const x = cx;
    const y = baseY;

    ctx.save();
    if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
    if (options.flipX) { ctx.translate(cx * 2, 0); ctx.scale(-1, 1); }

    // sombra no chão
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y, 14 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // pernas
    ctx.fillStyle = '#3b2a1a';
    ctx.fillRect(x - 8 * s, y - 22 * s, 7 * s, 22 * s);
    ctx.fillRect(x + 1 * s, y - 22 * s, 7 * s, 22 * s);

    // botas
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(x - 9 * s, y - 8 * s, 8 * s, 8 * s);
    ctx.fillRect(x + 1 * s, y - 8 * s, 8 * s, 8 * s);

    // corpo / armadura de couro
    ctx.fillStyle = '#5a3d20';
    ctx.fillRect(x - 10 * s, y - 46 * s, 20 * s, 24 * s);

    // cinto
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(x - 11 * s, y - 24 * s, 22 * s, 4 * s);

    // capa / capuz (verde floresta)
    ctx.fillStyle = '#2d4a20';
    ctx.fillRect(x - 12 * s, y - 68 * s, 24 * s, 28 * s);

    // cabeça
    ctx.fillStyle = '#c8956a';
    ctx.beginPath();
    ctx.arc(x, y - 60 * s, 9 * s, 0, Math.PI * 2);
    ctx.fill();

    // capuz cobrindo parte da cabeça
    ctx.fillStyle = '#2d4a20';
    ctx.beginPath();
    ctx.arc(x, y - 62 * s, 10 * s, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x - 10 * s, y - 68 * s, 20 * s, 10 * s);

    // arco nas costas (linha curva)
    ctx.strokeStyle = '#8b5e2a';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.arc(x + 13 * s, y - 45 * s, 18 * s, -1.0, 1.0);
    ctx.stroke();

    // corda do arco
    ctx.strokeStyle = '#d4b87a';
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(x + 13 * s, y - 62 * s);
    ctx.lineTo(x + 13 * s, y - 28 * s);
    ctx.stroke();

    // braço esquerdo
    ctx.fillStyle = '#5a3d20';
    ctx.fillRect(x - 18 * s, y - 46 * s, 8 * s, 18 * s);

    // mão
    ctx.fillStyle = '#c8956a';
    ctx.fillRect(x - 18 * s, y - 30 * s, 7 * s, 7 * s);

    ctx.restore();
  },

  drawHero(ctx, key, cx, baseY, targetH, options = {}) {
    const img = this.images[key];
    const isCanvas = img instanceof HTMLCanvasElement;
    const hasImage = img && (isCanvas ? img.width > 0 : (img.complete && img.naturalWidth > 0));

    // Fallback desenhado enquanto imagem não carregou
    if (!hasImage) {
      if (key === 'hunter') this._drawHunterFallback(ctx, cx, baseY, targetH, options);
      return;
    }

    if (!isCanvas && (!img.complete || !img.naturalWidth)) return;
    const srcW = isCanvas ? img.width  : img.naturalWidth;
    const srcH = isCanvas ? img.height : img.naturalHeight;

    const b = this.bounds[key] ?? { topY: 0, bottomY: srcH - 1, contentH: srcH };

    // Escala baseada no conteúdo real, não na imagem inteira
    const scale  = targetH / b.contentH;
    const drawW  = srcW * scale;
    const drawH  = srcH * scale;
    const drawY  = baseY - drawH + (srcH - 1 - b.bottomY) * scale;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;

    if (options.glow) {
      ctx.shadowColor = options.glowColor ?? '#ffffff';
      ctx.shadowBlur  = 18;
    }

    if (options.flipX) {
      ctx.translate(cx, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, -drawW / 2, drawY, drawW, drawH);
    } else {
      ctx.drawImage(img, cx - drawW / 2, drawY, drawW, drawH);
    }

    ctx.restore();
  },
};
