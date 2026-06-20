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
    darknight: {
      label: 'Dark Knight',
      desc:  'Guerreiro sombrio de armadura negra. Alto dano e defesa pesada.',
      color: '#5a7898',
      stat:  { atk: 5, def: 4, spd: 2 },
    },
    warrior: {
      label: 'Guerreiro',
      desc:  'Combatente equilibrado com espada e escudo. Versátil e resistente.',
      color: '#9a7040',
      stat:  { atk: 3, def: 4, spd: 3 },
    },
    hunter: {
      label: 'Caçador',
      desc:  'Ágil e preciso. Ataques rápidos com alta chance de crítico.',
      color: '#4a8050',
      stat:  { atk: 3, def: 2, spd: 5 },
    },
    mage: {
      label: 'Mago',
      desc:  'Feitiços devastadores de longa distância. Frágil mas letal.',
      color: '#5050a0',
      stat:  { atk: 5, def: 1, spd: 3 },
    },
    cleric: {
      label: 'Clérigo',
      desc:  'Guardião sagrado. Cura-se em combate e possui alta resistência.',
      color: '#909060',
      stat:  { atk: 2, def: 4, spd: 2 },
    },
  },

  bounds: {}, // tight pixel bounds por sprite key
  sheets: {}, // spritesheets animados por key

  // Definição das linhas/frames de cada spritesheet
  SHEET_DEFS: {
    darknight: {
      sheetW: 1774, sheetH: 887,
      rowH: 221,
      rows: [
        { name: 'walk',   count: 7, frameW: 253, fps: [110,110,110,110,110,110,110] },
        { name: 'attack', count: 5, frameW: 354, fps: [100,55,55,100,120] }, // frames 2-3 mais rápidos
        { name: 'defend', count: 4, frameW: 443, fps: [100,100,100,160] },
        { name: 'dodge',  count: 5, frameW: 354, fps: [70,70,70,70,100] },
      ]
    }
  },

  loadSheet(key) {
    if (this.sheets[key]) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Remove fundo branco/cinza claro do spritesheet
      const oc = document.createElement('canvas');
      oc.width  = img.naturalWidth;
      oc.height = img.naturalHeight;
      const ox = oc.getContext('2d');
      ox.drawImage(img, 0, 0);
      const id = ox.getImageData(0, 0, oc.width, oc.height);
      const d  = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i+1], b = d[i+2];
        // zera pixels brancos/cinza claros (checker board e fundo branco)
        if (r > 200 && g > 200 && b > 200) d[i+3] = 0;
      }
      ox.putImageData(id, 0, 0);
      // substitui img por canvas processado
      this.sheets[key] = oc;
    };
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

  // Chama onComplete() quando todos os sprites estiverem prontos.
  load(onComplete) {
    const keys = Object.keys(this.CLASSES);
    this._total = keys.length;

    keys.forEach(key => {
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

  // Processa a imagem: remove fundo claro/xadrez e calcula bounds reais.
  // Substitui this.images[key] por um canvas já limpo.
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
        // remove branco e xadrez (cinza claro ou branco, todos os tons típicos de checker)
        if (r > 155 && g > 155 && b > 155 && Math.abs(r-g) < 20 && Math.abs(g-b) < 20) {
          d[i+3] = 0;
        } else if (d[i+3] > 8) {
          if (y < topY)    topY    = y;
          if (y > bottomY) bottomY = y;
        }
      }
    }
    ox.putImageData(id, 0, 0);
    this.images[key] = oc; // substitui img pelo canvas processado
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
