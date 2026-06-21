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

  bounds: {}, // tight pixel bounds por sprite key
  sheets: {}, // spritesheets animados por key

  // ── Definição dos spritesheets por herói ────────────────────
  //
  // Formato padrão esperado (hero_[class]_sheet.png):
  //   Cada linha = uma animação, frames lado a lado da esquerda p/ direita.
  //   Row 0: walk   — 4 frames
  //   Row 1: attack — 4 frames
  //   Row 2: death  — 4 frames
  //
  //   frameW / rowH: dimensões em pixels de cada célula do grid.
  //   fps: duração em ms de cada frame (array com count entradas).
  //
  // Para adicionar um herói: preencha frameW e rowH conforme o asset gerado.
  // ─────────────────────────────────────────────────────────────

  SHEET_DEFS: {
    // Formato: 3 linhas x 4 frames, 128x128px por frame
    // Sheet total: 512x384px
    // Row 0: walk (4 frames)
    // Row 1: attack (4 frames)
    // Row 2: death (4 frames)
    warrior: {
      rowH: 128,
      rows: [
        { name: 'walk',   count: 4, frameW: 128, fps: [120,120,120,120] },
        { name: 'attack', count: 4, frameW: 128, fps: [80,60,80,160] },
        { name: 'death',  count: 4, frameW: 128, fps: [100,100,150,250] },
      ],
    },
    hunter: {
      rowH: 128,
      rows: [
        { name: 'walk',   count: 4, frameW: 128, fps: [110,110,110,110] },
        { name: 'attack', count: 4, frameW: 128, fps: [70,55,70,150] },
        { name: 'death',  count: 4, frameW: 128, fps: [100,100,150,250] },
      ],
    },
    mage: {
      rowH: 128,
      rows: [
        { name: 'walk',   count: 4, frameW: 128, fps: [130,130,130,130] },
        { name: 'attack', count: 4, frameW: 128, fps: [90,70,90,160] },
        { name: 'death',  count: 4, frameW: 128, fps: [100,100,150,250] },
      ],
    },
    cleric: {
      rowH: 128,
      rows: [
        { name: 'walk',   count: 4, frameW: 128, fps: [125,125,125,125] },
        { name: 'attack', count: 4, frameW: 128, fps: [90,70,90,160] },
        { name: 'death',  count: 4, frameW: 128, fps: [100,100,150,250] },
      ],
    },
  },

  loadSheet(key) {
    if (this.sheets[key]) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const oc = document.createElement('canvas');
      oc.width  = img.naturalWidth;
      oc.height = img.naturalHeight;
      oc.getContext('2d').drawImage(img, 0, 0);
      this.sheets[key] = oc;
    };
    img.onerror = () => {}; // arquivo ainda não existe — fallback silencioso
    img.src = `assets/sprites/hero_${key}_sheet.png`;
  },

  // Desenha um frame específico do spritesheet.
  // animName: 'walk' | 'attack' | 'defend' | 'dodge'
  // frameIdx: índice do frame dentro da linha
  drawFrame(ctx, key, animName, frameIdx, cx, baseY, targetH, options = {}) {
    const img = this.sheets[key];
    const def = this.SHEET_DEFS[key];
    const ready = img && def && (img instanceof HTMLCanvasElement ? img.width > 0 : (img.complete && img.naturalWidth > 0));
    if (!ready) {
      this.drawHero(ctx, key, cx, baseY, targetH, options);
      return;
    }

    const rowIdx = def.rows.findIndex(r => r.name === animName);
    if (rowIdx < 0) return;
    const row = def.rows[rowIdx];
    const fi  = Math.min(frameIdx, row.count - 1);

    const sx = fi * row.frameW;
    const sy = rowIdx * def.rowH;
    const scale = targetH / def.rowH;
    const dw = row.frameW * scale;
    const dh = def.rowH  * scale;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
    if (options.flipX) {
      ctx.translate(cx, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, sy, row.frameW, def.rowH, -dw / 2, baseY - dh, dw, dh);
    } else {
      ctx.drawImage(img, sx, sy, row.frameW, def.rowH, cx - dw / 2, baseY - dh, dw, dh);
    }
    ctx.restore();
  },

  // Chama onComplete() quando todos os sprites estáticos estiverem prontos.
  // Sheets são carregados em paralelo sem bloquear o jogo.
  load(onComplete) {
    const keys = Object.keys(this.CLASSES);
    this._total = keys.length;

    keys.forEach(key => {
      // tenta carregar sheet animado (silencioso se não existir)
      this.loadSheet(key);

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
  drawHero(ctx, key, cx, baseY, targetH, options = {}) {
    const img = this.images[key];
    if (!img) return;
    const isCanvas = img instanceof HTMLCanvasElement;
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
