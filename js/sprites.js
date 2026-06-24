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
    hunter: {
      label: 'Caçadora',
      desc:  'Ágil e precisa. Ataques rápidos com alta chance de crítico.',
      color: '#4a8050',
      stat:  { atk: 3, def: 2, spd: 5 },
    },
    // warrior, mage, cleric — adicionados em fases futuras
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
      walk:   { file: 'hero_hunter_walk',   count: 6, frameW: 362, frameH: 724, fps: [150, 150, 150, 150, 150, 150], groundOffset: 120, heightScale: 1.5 },
      attack: { file: 'hero_hunter_attack', count: 4, frameH: 887, frameOffsets: [0, 417, 858, 1331], frameWidths: [417, 441, 473, 443], fps: [200, 200, 200, 200], groundOffset: 150, heightScale: 1.8 },
      // block:  { file: 'hero_hunter_block',  count: 2, frameW: 353, frameH: 353, fps: [100, 180], groundOffset: 30 },
      dodge:  { file: 'hero_hunter_dodge',  count: 1, frameW: 500, frameH: 500, fps: [200],       groundOffset: 110 },
      // death:  { file: 'hero_hunter_death',  count: 2, frameW: 353, frameH: 353, fps: [150, 400], groundOffset: 30 },
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
        const frames = [];
        for (let i = 0; i < def.count; i++) {
          const srcX = def.frameOffsets ? def.frameOffsets[i] : i * def.frameW;
          const srcW = def.frameWidths  ? def.frameWidths[i]  : def.frameW;
          const fc = document.createElement('canvas');
          fc.width  = srcW;
          fc.height = def.frameH;
          fc.getContext('2d').drawImage(img, srcX, 0, srcW, def.frameH, 0, 0, srcW, def.frameH);
          frames.push(fc);
        }
        this.animSheets[key][animName] = frames;
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

    // Se a animação pedida não carregou ainda, tenta walk como fallback
    const resolvedAnim = (anims && anims[animName]) ? animName : 'walk';
    const resolvedDef  = this.ANIM_DEFS[key]?.[resolvedAnim];

    if (anims && resolvedDef && anims[resolvedAnim]) {
      const frames = anims[resolvedAnim];
      const fi     = Math.min(frameIdx, def.count - 1);
      const frame  = frames[fi];
      if (!frame) return;
      const scale = (targetH * (def.heightScale ?? 1)) / def.frameH;
      const dw    = frame.width * scale;
      const dh    = def.frameH * scale;
      const drawY = baseY - dh + (def.groundOffset ?? 0);

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
      if (options.flipX) {
        ctx.translate(cx, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(frame, -dw / 2, drawY, dw, dh);
      } else {
        ctx.drawImage(frame, cx - dw / 2, drawY, dw, dh);
      }
      ctx.restore();
      return;
    }

    // fallback só se não houver nenhuma animação carregada ainda
    if (!anims || !anims['walk']) {
      this.drawHero(ctx, key, cx, baseY, targetH, options);
    }
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

  drawHero(ctx, key, cx, baseY, targetH, options = {}) {
    const img = this.images[key];
    const isCanvas = img instanceof HTMLCanvasElement;
    const hasImage = img && (isCanvas ? img.width > 0 : (img.complete && img.naturalWidth > 0));

    if (!hasImage) return;

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
