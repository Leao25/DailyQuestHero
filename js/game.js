// ============================================================
// game.js — Game loop, spawn de mobs e renderização do cenário.
//
// MODELO DE CÂMERA:
//   hero.worldX cresce continuamente enquanto ele anda.
//   Cada camada de parallax é deslocada por (hero.worldX * speedFactor),
//   repetindo em "tiles" infinitos. Camadas com speedFactor baixo parecem
//   mais distantes (movem mais devagar).
// ============================================================

(function () {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // estado global do jogo
  let gameState     = 'loading';   // 'loading' | 'classSelect' | 'playing'
  let selectedClass = 'hunter';
  let hoveredClass  = null;
  let confirmHover  = false;

  let hero = null;
  let mobs = [];
  let lastTimestamp = 0;
  let nextSpawnAt   = 0;

  // Portal da Fase 1
  const PORTAL_WORLD_X  = 2800;   // posição fixa na floresta
  let   portalActive    = false;   // true após todas as gems consumidas
  let   portalOpenAt    = null;    // timestamp em que o portal apareceu
  let   bossSpawned     = false;   // uma vez por sessão
  let   phase2Triggered = false;

  // ============================================================
  // BACKGROUNDS — uma imagem por período do dia
  // ============================================================

  const BG_IMAGES = {};
  const BG_MAP = {
    'Manhã':      'bg_forest_morning',
    'Tarde':      'bg_forest_afternoon',
    'Entardecer': 'bg_forest_dusk',
    'Noite':      'bg_forest_night',
  };

  function loadBackgrounds() {
    Object.values(BG_MAP).forEach(name => {
      const img = new Image();
      img.src = `assets/backgrounds/${name}.png`;
      BG_IMAGES[name] = img;
    });
  }

  // ============================================================
  // TELA DE SELEÇÃO DE CLASSE
  // ============================================================

  const CLASS_KEYS = Object.keys(Sprites.CLASSES);
  const SLOT_W     = CONFIG.canvas.width / CLASS_KEYS.length; // 192px
  const SPRITE_H   = 100; // altura de exibição na tela de seleção
  const CONFIRM_BTN = { x: 380, y: 490, w: 200, h: 38 };

  function drawClassSelect(timestamp) {
    ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

    // fundo escuro gradiente
    const bg = ctx.createLinearGradient(0, 0, 0, CONFIG.canvas.height);
    bg.addColorStop(0, '#0a0812');
    bg.addColorStop(1, '#1a1228');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

    // partículas de fundo decorativas (simples)
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i < 40; i++) {
      const px = ((i * 137 + timestamp * 0.01) % CONFIG.canvas.width);
      const py = ((i * 97  + timestamp * 0.005) % (CONFIG.canvas.height - 60));
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // título
    ctx.save();
    ctx.textAlign = 'center';
    // barra de título
    const titleGrad = ctx.createLinearGradient(280, 28, 680, 28);
    titleGrad.addColorStop(0,   'rgba(90,60,20,0)');
    titleGrad.addColorStop(0.3, 'rgba(120,80,20,0.85)');
    titleGrad.addColorStop(0.7, 'rgba(120,80,20,0.85)');
    titleGrad.addColorStop(1,   'rgba(90,60,20,0)');
    ctx.fillStyle = titleGrad;
    ctx.fillRect(0, 14, CONFIG.canvas.width, 46);
    // borda superior e inferior do título
    ctx.fillStyle = 'rgba(200,160,60,0.5)';
    ctx.fillRect(0, 14, CONFIG.canvas.width, 2);
    ctx.fillRect(0, 58, CONFIG.canvas.width, 2);
    // texto
    ctx.font      = 'bold 26px monospace';
    ctx.fillStyle = '#f0d070';
    ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 10;
    ctx.fillText('⚔  Seleção de Herói  ⚔', CONFIG.canvas.width / 2, 46);
    ctx.shadowBlur = 0;
    ctx.restore();

    // slots de herói
    CLASS_KEYS.forEach((key, idx) => {
      const cls     = Sprites.CLASSES[key];
      const slotX   = idx * SLOT_W;
      const centerX = slotX + SLOT_W / 2;
      const isSelected = key === selectedClass;
      const isHovered  = key === hoveredClass;

      // fundo do slot
      if (isSelected) {
        const sg = ctx.createLinearGradient(slotX, 70, slotX, 440);
        sg.addColorStop(0, `${cls.color}44`);
        sg.addColorStop(1, `${cls.color}11`);
        ctx.fillStyle = sg;
        ctx.fillRect(slotX, 70, SLOT_W, 370);
        // borda lateral esquerda iluminada
        ctx.fillStyle = cls.color + 'cc';
        ctx.fillRect(slotX, 70, 2, 370);
      } else if (isHovered) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(slotX, 70, SLOT_W, 370);
      }

      // separador entre slots
      if (idx > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(slotX, 70, 1, 370);
      }

      // sprite do herói
      const spriteBaseY = 330;
      const breathBob   = isSelected ? Math.sin(timestamp / 600) * 4 : 0;
      Sprites.drawHero(ctx, key, centerX, spriteBaseY + breathBob, SPRITE_H, {
        glow:      isSelected,
        glowColor: cls.color,
      });

      // indicador de selecionado (triângulo acima)
      if (isSelected) {
        ctx.fillStyle = '#f0d070';
        ctx.beginPath();
        ctx.moveTo(centerX - 8, 78);
        ctx.lineTo(centerX + 8, 78);
        ctx.lineTo(centerX,     90);
        ctx.fill();
      }

      // nome da classe
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font      = `${isSelected ? 'bold ' : ''}16px monospace`;
      ctx.fillStyle = isSelected ? '#f0d070' : '#aaaaaa';
      if (isSelected) { ctx.shadowColor = cls.color; ctx.shadowBlur = 8; }
      ctx.fillText(cls.label, centerX, 360);
      ctx.shadowBlur = 0;
      ctx.restore();

      // mini barras de atributos (só no selecionado)
      if (isSelected) {
        drawStatBars(ctx, centerX, 375, cls.stat, cls.color);
      }

      // badge de keygem consumida
      if (GemSystem.isConsumed(key)) {
        ctx.save();
        ctx.font      = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4ade80';
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur  = 6;
        ctx.fillText('✅ Keygem · Fase 1', centerX, 430);
        ctx.shadowBlur  = 0;
        ctx.restore();
      }
    });

    // descrição da classe selecionada
    const selCls = Sprites.CLASSES[selectedClass];
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font      = '13px monospace';
    ctx.fillStyle = '#c0b090';
    ctx.fillText(selCls.desc, CONFIG.canvas.width / 2, 450);
    ctx.restore();

    // botão Confirmar
    const btn = CONFIRM_BTN;
    const btnGrad = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.h);
    if (confirmHover) {
      btnGrad.addColorStop(0, '#6a4010');
      btnGrad.addColorStop(1, '#3a2008');
    } else {
      btnGrad.addColorStop(0, '#5a3408');
      btnGrad.addColorStop(1, '#2e1a04');
    }
    ctx.fillStyle = btnGrad;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = confirmHover ? '#f0c040' : '#a07030';
    ctx.lineWidth   = 2;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font      = 'bold 16px monospace';
    ctx.fillStyle = confirmHover ? '#ffe060' : '#d0a040';
    ctx.fillText('Confirmar', btn.x + btn.w / 2, btn.y + 25);
    ctx.restore();
  }

  function drawStatBars(ctx, cx, y, stat, color) {
    const labels = { atk: 'ATK', def: 'DEF', spd: 'VEL' };
    const maxVal = 5;
    const barW   = 80;
    const barH   = 6;
    const gap    = 18;
    let dy = y;

    for (const [key, val] of Object.entries(stat)) {
      const bx = cx - barW / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(bx, dy, barW, barH);
      ctx.fillStyle = color;
      ctx.fillRect(bx, dy, barW * (val / maxVal), barH);
      ctx.fillStyle = '#888';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(labels[key], bx - 28, dy + barH);
      dy += gap;
    }
  }

  // mouse: hover e clique na tela de seleção
  canvas.addEventListener('mousemove', e => {
    if (gameState !== 'classSelect') return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CONFIG.canvas.width  / rect.width;
    const scaleY = CONFIG.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top)  * scaleY;

    hoveredClass = null;
    CLASS_KEYS.forEach((key, idx) => {
      if (mx >= idx * SLOT_W && mx < (idx + 1) * SLOT_W && my >= 70 && my < 440) {
        hoveredClass = key;
      }
    });

    const btn = CONFIRM_BTN;
    confirmHover = mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h;
    canvas.style.cursor = (hoveredClass || confirmHover) ? 'pointer' : 'default';
  });

  canvas.addEventListener('click', e => {
    if (gameState !== 'classSelect') return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CONFIG.canvas.width  / rect.width;
    const scaleY = CONFIG.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top)  * scaleY;

    // clique num herói
    CLASS_KEYS.forEach((key, idx) => {
      if (mx >= idx * SLOT_W && mx < (idx + 1) * SLOT_W && my >= 70 && my < 440) {
        selectedClass = key;
      }
    });

    // clique no Confirmar
    const btn = CONFIRM_BTN;
    if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
      startGame();
    }
  });


  function startGame() {
    hero          = new Hero(selectedClass);
    bossSpawned   = false;
    phase2Triggered = false;

    // carrega save se existir para a mesma classe
    const saved = SaveSystem.load();
    if (saved && saved.heroClass === selectedClass) {
      SaveSystem.applyToHero(hero, saved);
      Hud.logEvent(`Bem-vindo de volta, Lv.${hero.level}!`, 'info');
    }

    // portal já ativo se todas as gems foram consumidas antes de entrar
    if (GemSystem.allConsumed() && !portalActive) {
      portalActive = true;
      portalOpenAt = Date.now(); // já aberto (sem delay)
    }

    gameState = 'playing';
    canvas.style.cursor = 'default';
    scheduleNextSpawn(Date.now());
    Hud.showStats();
    Hud.setClass(selectedClass);
    Hud.updateHeroStats(hero);
    Hud.logEvent(`${Sprites.CLASSES[selectedClass].label} entrou na Floresta!`, 'info');
  }

  // ---------- Spawn de mobs ----------

  function scheduleNextSpawn(now) {
    const [min, max] = CONFIG.mob.spawnIntervalMs;
    nextSpawnAt = now + min + Math.random() * (max - min);
  }

  function pickWaveSize(heroLevel) {
    const roll = Math.random();
    if (heroLevel >= 6 && roll < 0.15) return 3; // onda de 3: 15% a partir do nível 6
    if (heroLevel >= 3 && roll < 0.35) return 2; // dupla:   35% a partir do nível 3
    return 1;
  }

  function spawnMobIfNeeded(now) {
    mobs = mobs.filter(m => !m.markedForRemoval);
    const aliveMobs = mobs.filter(m => m.state !== 'dead').length;
    const period    = DayCycle.getCurrentPeriod().name;

    // tenta spawnar o boss se condições forem atendidas
    if (
      !bossSpawned &&
      aliveMobs === 0 &&
      period === 'Noite' &&
      hero.level >= 10 &&
      !GemSystem.isConsumed(hero.heroClass)
    ) {
      bossSpawned = true;
      const boss = new Mob(hero, 'Noite', 'forest_guardian');
      mobs.push(boss);
      Hud.logEvent('⚠️ O Guardião da Floresta surgiu das sombras!', 'damage');
      scheduleNextSpawn(now);
      return;
    }

    const forceSpawn = (now - nextSpawnAt) > 6000 && aliveMobs < 1;
    if ((now >= nextSpawnAt && aliveMobs < 1) || forceSpawn) {
      const count   = pickWaveSize(hero.level);
      const spacing = 120;
      for (let i = 0; i < count; i++) {
        const mob = new Mob(hero, period);
        mob.worldX += i * spacing;
        mobs.push(mob);
      }
      scheduleNextSpawn(now);
    }
  }

  const combatCallbacks = {
    onHeroAttack(mob, damage, isCrit = false) {
      const mx  = mob.getScreenX(hero);
      const my  = mob.y - mob.height / 2;
      const cls = hero.heroClass;

      const dmgOpts = isCrit
        ? { color: '#ffe066', outline: '#aa6600', size: 18, bold: true }
        : {};

      const showDamage = (x, y) => {
        if (isCrit) {
          Effects.spawnDamageNumber(x, y - 18, 'CRÍTICO!',
            { color: '#ffe066', outline: '#aa4400', size: 13, bold: true, prefix: '' });
        }
        Effects.spawnDamageNumber(x, y, damage, dmgOpts);
      };

      if (cls === 'hunter') {
        const snapMx = mx, snapMy = my;
        Effects.spawnProjectile('arrow',
          CONFIG.hero.screenX + 20, hero.y - hero.height * 0.7,
          snapMx, snapMy,
          () => {
            if (mob.state === 'dead') return;
            showDamage(snapMx, mob.y - mob.height - 8);
            Effects.spawnHitSparks(snapMx, snapMy);
          }
        );
      } else if (cls === 'mage') {
        const snapMx = mx, snapMy = my;
        Effects.spawnProjectile('fireball',
          CONFIG.hero.screenX + 24, hero.y - hero.height * 0.8,
          snapMx, snapMy,
          () => {
            if (mob.state === 'dead') return;
            showDamage(snapMx, mob.y - mob.height - 8);
            Effects.spawnDeathBurst(snapMx, snapMy, ['#ff4400','#ff8800','#ffcc00','#ffffff']);
          }
        );
      } else {
        showDamage(mx, mob.y - mob.height - 8);
        Effects.spawnHitSparks(mx, my);
      }
    },
    onMobAttack(mob, damage) {
      const roll = Math.random();
      if (roll < hero.dodgeChance) {
        // ESQUIVA
        hero.hp = Math.min(hero.maxHp, hero.hp + damage);
        hero.flashTimer = 0;
        if (hero.state !== 'dead') hero.state = 'walking';
        hero.triggerDodge();
        Effects.spawnDamageNumber(
          CONFIG.hero.screenX, hero.y - hero.height - 8, 'ESQUIVA',
          { color: '#80e0ff', outline: '#004488', size: 13, bold: true, prefix: '' }
        );
        return;
      }
      if (roll < hero.dodgeChance + hero.blockChance) {
        // BLOQUEIO — reverte e aplica só 40%
        hero.hp = Math.min(hero.maxHp, hero.hp + damage);
        const blocked = Math.ceil(damage * 0.4);
        hero.takeDamage(blocked);
        hero.triggerBlock();
        Effects.spawnDamageNumber(
          CONFIG.hero.screenX + (Math.random() - 0.5) * 18,
          hero.y - hero.height - 8, blocked,
          { color: '#80e0ff', outline: '#004488' }
        );
        Effects.spawnDamageNumber(
          CONFIG.hero.screenX, hero.y - hero.height - 28, 'BLOQUEIO',
          { color: '#a0d0ff', outline: '#003366', size: 12, bold: true, prefix: '' }
        );
        Hud.logEvent(`Bloqueou! ${blocked} de dano.`, 'info');
        return;
      }
      // dano normal
      Effects.spawnDamageNumber(
        CONFIG.hero.screenX + (Math.random() - 0.5) * 18,
        hero.y - hero.height - 8, damage,
        { color: '#ff8844', outline: '#441100' }
      );
      Effects.triggerShake(5, 200);
      Hud.logEvent(`Você sofreu ${damage} de dano.`, 'damage');
    },
    onPassiveTrigger(cls, value) {
      const hx = CONFIG.hero.screenX;
      const hy = hero.y - hero.height - 28;
      if (cls === 'warrior') {
        Effects.spawnDamageNumber(hx, hy, `FÚRIA! ATK+1 (${value}/10)`,
          { color: '#ff6622', outline: '#661100', size: 11, bold: true, prefix: '' });
        Hud.logEvent(`Fúria! ATK +1 (${value}/10)`, 'info');
      } else if (cls === 'mage') {
        Effects.spawnDamageNumber(hx, hy, `+${value} HP`,
          { color: '#88ffcc', outline: '#006644', size: 13, bold: true });
        Hud.logEvent(`Colheita Arcana: +${value} HP`, 'info');
      } else if (cls === 'cleric') {
        Effects.spawnDamageNumber(hx, hy, `+${value} HP`,
          { color: '#ffdd88', outline: '#886600', size: 13, bold: true });
        Hud.logEvent(`Bênção Sagrada: +${value} HP`, 'info');
      }
      Hud.updateHeroStats(hero);
    },
    onMobDeath(mob, drops, leveledUp) {
      const mx = mob.getScreenX(hero);
      Effects.spawnDeathBurst(mx, mob.y, ['#4a6838', '#c23b3b', '#e07030', '#ffffff']);
      Effects.spawnXpNumber(mx, mob.y - mob.height - 24, mob.xpReward);
      Hud.logEvent(`Mob derrotado! +${mob.xpReward} XP`, 'info');

      // boss drop — keygem da classe atual
      if (mob.type.isBoss) {
        const gemId   = `keygem_${hero.heroClass}`;
        const gemItem = Items.get(gemId);
        if (gemItem && !GemSystem.isConsumed(hero.heroClass)) {
          drops = [{ ...gemItem }];
          Hud.logEvent(`💎 Keygem obtida: ${gemItem.name}!`, 'drop');
          Effects.spawnDeathBurst(mx, mob.y, ['#a855f7','#d4a0ff','#ffffff','#a855f7']);
        }
      }

      drops.forEach(item => {
        Hud.logEvent(`Item obtido: ${item.name} (${item.rarity})`, 'drop');
      });
      leveledUp.forEach(level => {
        Effects.spawnDamageNumber(
          CONFIG.hero.screenX, hero.y - hero.height - 30, `Nv.${level}`,
          { color: '#ffe040', outline: '#443300', size: 18, bold: true, prefix: '' }
        );
        Hud.logEvent(`🎉 Subiu para o nível ${level}!`, 'levelup');
      });

      // salva progresso e atualiza bag
      SaveSystem.save(hero);
      Bag.refresh();
    },
    onHeroDeath() {
      Effects.triggerShake(10, 400);

      setTimeout(() => {
        SaveSystem.delete();
        document.getElementById('death-overlay').classList.remove('hidden');
      }, 800);
    }
  };

  function findActiveMobTarget() {
    const alive = mobs.filter(m => m.state !== 'dead');
    if (alive.length === 0) return null;
    alive.sort((a, b) => hero.distanceTo(a) - hero.distanceTo(b));
    return alive[0];
  }

  function update(deltaMs, now) {
    spawnMobIfNeeded(now);
    const target = findActiveMobTarget();
    hero.update(deltaMs, target);
    mobs.forEach(mob => mob.update(deltaMs, hero));
    if (target) Combat.resolveTick(hero, target, now, combatCallbacks);
    mobs = mobs.filter(m => !m.markedForRemoval);
    Effects.update(deltaMs);
    updatePortal(now);
  }

  function portalIsOpen(now) {
    return portalActive && portalOpenAt && now >= portalOpenAt;
  }

  function updatePortal(now) {
    if (!portalActive || phase2Triggered) return;
    if (!portalIsOpen(now)) return;
    if (hero.worldX >= PORTAL_WORLD_X) {
      phase2Triggered = true;
      document.getElementById('phase2-overlay').classList.remove('hidden');
    }
  }

  // ============================================================
  // PARALLAX — utilitário de tiling infinito
  // ============================================================

  function getSpeedFactor(key) {
    return CONFIG.parallax.layers.find(l => l.key === key).speedFactor;
  }

  // Chama drawItem(screenX, tileIndex) repetidamente para cobrir a tela toda.
  function drawTiledLayer(cameraX, speedFactor, patternWidth, drawItem) {
    const offset = (cameraX * speedFactor) % patternWidth;
    const count = Math.ceil(CONFIG.canvas.width / patternWidth) + 2;
    for (let i = -1; i <= count; i++) {
      drawItem(i * patternWidth - offset, i);
    }
  }

  // ============================================================
  // BACKGROUND — panning suave com crossfade ao reiniciar o loop
  // ============================================================

  const PERIOD_KEYS = ['Manhã', 'Tarde', 'Entardecer', 'Noite'];

  const BG_STATE = {
    offset:        0,
    crossfading:   false,
    fromOffset:    0,
    crossfadeT:    0,
    currentPeriod: null, // período sendo exibido agora
    nextPeriod:    null, // período que vai entrar no crossfade
  };
  const CROSSFADE_MS      = 800;
  const CROSSFADE_TRIGGER = 0.82;

  function _pickRandomPeriod(excludeName) {
    const options = PERIOD_KEYS.filter(k => k !== excludeName);
    return DayCycle.PERIODS[options[Math.floor(Math.random() * options.length)]];
  }

  function drawBackground(period, deltaMs) {
    // Inicializa o período atual na primeira chamada
    if (!BG_STATE.currentPeriod) BG_STATE.currentPeriod = period;

    const cur  = BG_STATE.currentPeriod;
    const curName = BG_MAP[cur.name] ?? BG_MAP['Tarde'];
    const curImg  = BG_IMAGES[curName];

    if (!curImg || !curImg.complete || !curImg.naturalWidth) {
      drawSky(cur);
      return;
    }

    const CW    = CONFIG.canvas.width;
    const CH    = CONFIG.canvas.height;
    const W     = CW * 1.4;
    const H     = curImg.naturalHeight * (W / curImg.naturalWidth);
    const drawY = (CH - H) / 2;
    const maxOff = W - CW;

    const sf    = 0.06;
    const speed = (hero && hero.walkSpeed) ? hero.walkSpeed : CONFIG.hero.walkSpeed;
    const advance = speed * (deltaMs / 16.67) * sf;
    if (!BG_STATE.crossfading) BG_STATE.offset += advance;

    // Dispara crossfade com período aleatório
    if (!BG_STATE.crossfading && BG_STATE.offset >= maxOff * CROSSFADE_TRIGGER) {
      BG_STATE.crossfading  = true;
      BG_STATE.fromOffset   = BG_STATE.offset;
      BG_STATE.crossfadeT   = 0;
      BG_STATE.nextPeriod   = _pickRandomPeriod(cur.name);
    }

    if (BG_STATE.crossfading) {
      BG_STATE.crossfadeT += deltaMs;
      const t = Math.min(BG_STATE.crossfadeT / CROSSFADE_MS, 1);

      const nxt    = BG_STATE.nextPeriod;
      const nxtImg = BG_IMAGES[BG_MAP[nxt.name] ?? BG_MAP['Tarde']];

      // BG atual saindo
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.drawImage(curImg, -BG_STATE.fromOffset, drawY, W, H);
      ctx.restore();

      // Novo BG entrando (se já carregou)
      if (nxtImg && nxtImg.complete && nxtImg.naturalWidth) {
        ctx.save();
        ctx.globalAlpha = t;
        ctx.drawImage(nxtImg, 0, drawY, W, H);
        ctx.restore();
      }

      if (t >= 1) {
        BG_STATE.crossfading   = false;
        BG_STATE.offset        = 0;
        BG_STATE.currentPeriod = BG_STATE.nextPeriod;
        BG_STATE.nextPeriod    = null;
        _showPeriodChangeBubble();
      }
    } else {
      ctx.drawImage(curImg, -BG_STATE.offset, drawY, W, H);
    }
  }

  // ============================================================
  // PALETAS PIXEL ART POR PERÍODO
  // ============================================================

  const PIXEL_SKY = {
    'Manhã':      [['#2a4880',90],['#4070a8',80],['#6898c0',80],['#a0c0d8',170]],
    'Tarde':      [['#1a3888',100],['#2858b0',100],['#4888cc',110],['#70b0e0',110]],
    'Entardecer': [['#0e0820',80],['#380e28',80],['#801c14',90],['#c84010',170]],
    'Noite':      [['#020206',110],['#04040e',100],['#06081a',100],['#0a0c22',110]],
  };

  const PIXEL_GROUND = {
    'Manhã':      { base:'#2a4820', line:'#1a3010', mid:'#1e3a18' },
    'Tarde':      { base:'#284a1e', line:'#182e10', mid:'#1c3816' },
    'Entardecer': { base:'#1c2e14', line:'#0e1a08', mid:'#162410' },
    'Noite':      { base:'#0e1a0a', line:'#060e04', mid:'#0a1208' },
  };

  // ============================================================
  // CÉU — faixas de cor duras (pixel art, sem gradiente)
  // ============================================================

  function drawSky(period) {
    const bands = PIXEL_SKY[period.name] ?? PIXEL_SKY['Tarde'];
    let y = 0;
    for (const [c, h] of bands) {
      ctx.fillStyle = c;
      ctx.fillRect(0, y, CONFIG.canvas.width, h + 1);
      y += h;
    }
  }

  // ============================================================
  // NUVENS — blocos pixel art (só fillRect, sem ellipse)
  // ============================================================

  const CLOUD_PATTERN_W = 600;

  // Cada nuvem: [ox, y, escala]
  const CLOUD_DEFS = [
    { ox: 20,  y: 50,  s: 2 },
    { ox: 240, y: 90,  s: 1.5 },
    { ox: 430, y: 38,  s: 2.5 },
  ];

  function drawPixelCloud(x, y, s, col, shadow) {
    // sombra (deslocada 2px)
    ctx.fillStyle = shadow;
    ctx.fillRect(x + 8*s+2,  y+12*s+2, 56*s, 16*s);
    ctx.fillRect(x + 16*s+2, y+ 4*s+2, 20*s, 12*s);
    ctx.fillRect(x + 32*s+2, y+     2, 24*s, 12*s);
    ctx.fillRect(x + 52*s+2, y+ 8*s+2, 16*s,  8*s);
    // corpo
    ctx.fillStyle = col;
    ctx.fillRect(x + 8*s,  y+12*s, 56*s, 16*s);
    ctx.fillRect(x + 16*s, y+ 4*s, 20*s, 12*s);
    ctx.fillRect(x + 32*s, y,      24*s, 12*s);
    ctx.fillRect(x + 52*s, y+ 8*s, 16*s,  8*s);
    // highlight (canto superior esquerdo, 1 bloco mais claro)
    ctx.fillStyle = shadow === col ? col : '#ffffff44';
    ctx.fillRect(x + 16*s, y+ 4*s, 6*s, 4*s);
    ctx.fillRect(x + 32*s, y,      8*s, 4*s);
  }

  function drawClouds(cameraX, period) {
    const sf = getSpeedFactor('clouds');
    const isNight   = period.ambientAlpha >= 0.4;
    const isEvening = period.ambientAlpha > 0 && !isNight;
    const col    = isNight ? '#18182e' : isEvening ? '#b06038' : '#e8e8e8';
    const shadow = isNight ? '#0e0e1e' : isEvening ? '#804020' : '#b0b0b8';

    drawTiledLayer(cameraX, sf, CLOUD_PATTERN_W, (tileX) => {
      for (const d of CLOUD_DEFS) {
        drawPixelCloud(tileX + d.ox, d.y, d.s, col, shadow);
      }
    });
  }

  // ============================================================
  // PÁSSAROS — traços pixel art (2 fillRect em V)
  // ============================================================

  const BIRD_PATTERN_W = 900;
  const BIRD_DEFS = [
    { ox: 60,  y: 38 }, { ox: 108, y: 30 }, { ox: 150, y: 44 },
    { ox: 480, y: 55 }, { ox: 524, y: 46 }, { ox: 700, y: 32 },
  ];

  function drawBirds(cameraX, period) {
    if (period.ambientAlpha >= 0.4) return; // sem pássaros à noite
    const sf = getSpeedFactor('birds');
    ctx.fillStyle = '#1a1a28';
    drawTiledLayer(cameraX, sf, BIRD_PATTERN_W, (tileX) => {
      for (const b of BIRD_DEFS) {
        const x = tileX + b.ox, y = b.y;
        ctx.fillRect(x,   y,   4, 2);
        ctx.fillRect(x+4, y-2, 4, 2);
        ctx.fillRect(x+12,y,   4, 2);
        ctx.fillRect(x+8, y-2, 4, 2);
      }
    });
  }

  // ============================================================
  // MONTANHAS — escadinha pixel art (só fillRect)
  // ============================================================

  const MOUNTAIN_PATTERN_W = 480;

  function drawPixelMountain(x, baseY, w, h, bodyCol, snowCol) {
    const steps = Math.max(4, Math.floor(h / 8));
    for (let i = 0; i < steps; i++) {
      const sw = Math.max(4, Math.floor(w * (i + 1) / steps));
      const sy = baseY - h + i * 8;
      ctx.fillStyle = i < Math.floor(steps * 0.22) ? snowCol : bodyCol;
      ctx.fillRect(Math.floor(x + (w - sw) / 2), sy, sw, 9);
    }
  }

  function drawMountains(cameraX, period) {
    const sf = getSpeedFactor('mountains');
    const isNight = period.ambientAlpha >= 0.4;
    const far  = isNight ? '#16182a' : '#303c5e';
    const near = isNight ? '#0e101e' : '#222e48';
    const snow = isNight ? '#202234' : '#cce0f0';

    drawTiledLayer(cameraX, sf * 0.85, MOUNTAIN_PATTERN_W, (x) => {
      drawPixelMountain(x + 10,  CONFIG.canvas.groundY - 20, 260, 160, far,  snow);
      drawPixelMountain(x + 200, CONFIG.canvas.groundY - 20, 200, 100, far,  snow);
    });
    drawTiledLayer(cameraX, sf, MOUNTAIN_PATTERN_W, (x) => {
      drawPixelMountain(x,       CONFIG.canvas.groundY - 20, 220, 135, near, snow);
    });
  }

  // ============================================================
  // ÁRVORES DISTANTES — silhuetas coníferas pixel art
  // ============================================================

  const FAR_TREE_PATTERN_W = 280;

  function drawPixelConifer(x, baseY, h, w, dark, mid) {
    const trunkH = Math.max(4, Math.floor(h * 0.18));
    const crownH = h - trunkH;
    const layers = 5;
    // tronco
    ctx.fillStyle = dark;
    ctx.fillRect(x - 3, baseY - trunkH, 6, trunkH);
    // copa em camadas (pirâmide de rects)
    for (let i = 0; i < layers; i++) {
      const lw = Math.floor(w * (layers - i) / layers);
      const lh = Math.ceil(crownH / layers) + 2;
      const ly = baseY - trunkH - crownH + i * Math.ceil(crownH / layers);
      ctx.fillStyle = i % 2 === 0 ? dark : mid;
      ctx.fillRect(x - Math.floor(lw / 2), ly, lw, lh);
    }
  }

  function drawFarTrees(cameraX, period) {
    const sf = getSpeedFactor('farTrees');
    const isNight = period.ambientAlpha >= 0.4;
    const dark = isNight ? '#0a1408' : '#182e14';
    const mid  = isNight ? '#101c0e' : '#224020';

    drawTiledLayer(cameraX, sf, FAR_TREE_PATTERN_W, (x) => {
      drawPixelConifer(x + 50,  CONFIG.canvas.groundY, 110, 70, dark, mid);
      drawPixelConifer(x + 165, CONFIG.canvas.groundY,  85, 54, dark, mid);
      drawPixelConifer(x + 228, CONFIG.canvas.groundY,  70, 44, dark, mid);
    });
  }

  // ============================================================
  // CASINHAS — pixel art com fillRect
  // ============================================================

  const HOUSE_PATTERN_W = 700;
  const HOUSE_DEFS = [
    { ox: 60,  w: 72, h: 56, roofH: 36, wall:'#4a3018', wallD:'#342010', roof:'#5a1c1c', roofD:'#3e1010', door:'#2e1408', win:'#f0c060' },
    { ox: 430, w: 56, h: 46, roofH: 28, wall:'#3c2e1a', wallD:'#281e10', roof:'#321414', roofD:'#200c0c', door:'#241008', win:'#a8d8f0' },
  ];

  function drawHouses(cameraX, period) {
    const sf = getSpeedFactor('houses');
    const m = 1 - period.ambientAlpha * 0.65;

    drawTiledLayer(cameraX, sf, HOUSE_PATTERN_W, (tileX) => {
      for (const h of HOUSE_DEFS) {
        const x = tileX + h.ox;
        const by = CONFIG.canvas.groundY;

        // parede principal
        ctx.fillStyle = shadeColor(h.wall, m);
        ctx.fillRect(x, by - h.h, h.w, h.h);
        // lado (profundidade)
        ctx.fillStyle = shadeColor(h.wallD, m);
        ctx.fillRect(x + h.w, by - h.h, 8, h.h);

        // telhado pixel (escadinha)
        ctx.fillStyle = shadeColor(h.roof, m);
        const rSteps = Math.floor(h.roofH / 4);
        for (let i = 0; i < rSteps; i++) {
          const rw = h.w + 16 - i * Math.floor((h.w + 16) / rSteps);
          ctx.fillRect(x - 8 + Math.floor((h.w + 16 - rw) / 2), by - h.h - i * 4, rw, 5);
        }
        // lado telhado
        ctx.fillStyle = shadeColor(h.roofD, m);
        for (let i = 0; i < rSteps; i++) {
          const rw = h.w + 16 - i * Math.floor((h.w + 16) / rSteps);
          ctx.fillRect(x + h.w + 8 - Math.floor((h.w + 16 - rw) / 2), by - h.h - i * 4, 6, 5);
        }

        // porta
        const dw = Math.floor(h.w * 0.28), dh = Math.floor(h.h * 0.55);
        const dx = x + Math.floor(h.w / 2 - dw / 2);
        ctx.fillStyle = shadeColor(h.door, m);
        ctx.fillRect(dx, by - dh, dw, dh);
        ctx.fillStyle = '#c0902050';
        ctx.fillRect(dx + dw - 4, by - dh * 0.5, 2, 2);

        // janela
        const ws = Math.floor(h.w * 0.24);
        const wx = x + Math.floor(h.w * 0.14), wy = by - h.h + Math.floor(h.h * 0.2);
        ctx.fillStyle = shadeColor('#1a1008', m);
        ctx.fillRect(wx - 2, wy - 2, ws + 4, ws + 4);
        ctx.fillStyle = period.ambientAlpha > 0.1
          ? shadeColor(h.win, Math.min(1, m + 0.5)) : shadeColor(h.win, m);
        ctx.fillRect(wx, wy, ws, ws);
        // grade da janela
        ctx.fillStyle = shadeColor('#1a1008', m);
        ctx.fillRect(wx + Math.floor(ws/2) - 1, wy, 2, ws);
        ctx.fillRect(wx, wy + Math.floor(ws/2) - 1, ws, 2);

        // chaminé
        const cx2 = x + Math.floor(h.w * 0.72);
        const ch2 = Math.floor(h.roofH * 0.7);
        ctx.fillStyle = shadeColor('#3a2818', m);
        ctx.fillRect(cx2, by - h.h - ch2, 8, ch2 + 4);
        // fumaça pixel (quadradinhos)
        if (period.ambientAlpha > 0) {
          ctx.fillStyle = `rgba(180,170,160,${0.3 * period.ambientAlpha})`;
          ctx.fillRect(cx2 + 1, by - h.h - ch2 - 8,  6, 6);
          ctx.fillRect(cx2 - 1, by - h.h - ch2 - 16, 6, 6);
          ctx.fillRect(cx2 + 2, by - h.h - ch2 - 24, 4, 4);
        }
      }
    });
  }

  // ============================================================
  // ÁRVORES PRÓXIMAS — coníferas grandes pixel art
  // ============================================================

  const NEAR_TREE_PATTERN_W = 320;

  function drawNearTrees(cameraX, period) {
    const sf = getSpeedFactor('nearTrees');
    const isNight = period.ambientAlpha >= 0.4;
    const trunk = isNight ? '#1a0e06' : '#2e1a0a';
    const dark  = isNight ? '#061008' : '#102010';
    const mid   = isNight ? '#0a1a0c' : '#1a3418';
    const light = isNight ? '#0e2010' : '#244a20';

    drawTiledLayer(cameraX, sf, NEAR_TREE_PATTERN_W, (x) => {
      drawPixelConiferLarge(x + 55,  CONFIG.canvas.groundY, 155, 90, trunk, dark, mid, light);
      drawPixelConiferLarge(x + 200, CONFIG.canvas.groundY, 120, 70, trunk, dark, mid, light);
      // arbusto pixel
      drawPixelBush(x + 132, CONFIG.canvas.groundY, 28, dark, mid, light);
    });
  }

  function drawPixelConiferLarge(x, baseY, h, w, trunk, dark, mid, light) {
    const trunkH = Math.floor(h * 0.22);
    const crownH = h - trunkH;
    const layers = 7;

    // tronco
    ctx.fillStyle = trunk;
    ctx.fillRect(x - 5, baseY - trunkH, 10, trunkH);
    // listras de casca (pixel)
    ctx.fillStyle = dark;
    ctx.fillRect(x - 2, baseY - Math.floor(trunkH * 0.6), 2, 4);
    ctx.fillRect(x + 1, baseY - Math.floor(trunkH * 0.3), 2, 4);

    // copa em camadas
    for (let i = 0; i < layers; i++) {
      const lw = Math.floor(w * (layers - i) / layers);
      const lh = Math.ceil(crownH / layers) + 2;
      const ly = baseY - trunkH - crownH + i * Math.ceil(crownH / layers);
      if (i === 0)      ctx.fillStyle = light;
      else if (i === 1) ctx.fillStyle = mid;
      else if (i % 2 === 0) ctx.fillStyle = mid;
      else              ctx.fillStyle = dark;
      ctx.fillRect(x - Math.floor(lw / 2), ly, lw, lh);

      // pixel de destaque no canto esquerdo de cada camada
      if (i > 1) {
        ctx.fillStyle = light;
        ctx.fillRect(x - Math.floor(lw / 2), ly, 4, 2);
      }
    }
  }

  function drawPixelBush(x, baseY, r, dark, mid, light) {
    // base
    ctx.fillStyle = dark;
    ctx.fillRect(x - r, baseY - Math.floor(r * 0.8), r * 2, Math.floor(r * 0.8));
    // camada do meio
    ctx.fillStyle = mid;
    ctx.fillRect(x - Math.floor(r * 0.8), baseY - Math.floor(r * 1.4), Math.floor(r * 1.6), Math.floor(r * 0.7));
    // topo
    ctx.fillStyle = dark;
    ctx.fillRect(x - Math.floor(r * 0.5), baseY - Math.floor(r * 1.9), r, Math.floor(r * 0.6));
    // highlight
    ctx.fillStyle = light;
    ctx.fillRect(x - Math.floor(r * 0.7), baseY - Math.floor(r * 1.5), 6, 4);
  }

  // ============================================================
  // CHÃO — pixel art: faixas de cor + detalhes em fillRect
  // ============================================================

  const GROUND_PATTERN_W = 160;
  const GROUND_DETAILS = [
    { ox: 8,   type: 'grass', h: 8  },
    { ox: 30,  type: 'rock'        },
    { ox: 60,  type: 'grass', h: 6  },
    { ox: 90,  type: 'flower'      },
    { ox: 115, type: 'grass', h: 10 },
    { ox: 140, type: 'rock'        },
  ];

  function drawGround(cameraX, period) {
    const g = PIXEL_GROUND[period.name] ?? PIXEL_GROUND['Tarde'];

    // faixa base
    ctx.fillStyle = g.base;
    ctx.fillRect(0, CONFIG.canvas.groundY, CONFIG.canvas.width, CONFIG.canvas.height - CONFIG.canvas.groundY);
    // linha de borda pixel
    ctx.fillStyle = g.line;
    ctx.fillRect(0, CONFIG.canvas.groundY, CONFIG.canvas.width, 4);
    // faixa de grama média
    ctx.fillStyle = g.mid;
    ctx.fillRect(0, CONFIG.canvas.groundY + 4, CONFIG.canvas.width, 6);

    const isNight = period.ambientAlpha >= 0.4;
    const sf = getSpeedFactor('ground');

    drawTiledLayer(cameraX, sf, GROUND_PATTERN_W, (tileX) => {
      for (const d of GROUND_DETAILS) {
        const gx = tileX + d.ox;
        const gy = CONFIG.canvas.groundY;
        if (d.type === 'grass') {
          // tufos de grama pixel: 3 retângulos verticais
          ctx.fillStyle = g.line;
          ctx.fillRect(gx,     gy - d.h,             2, d.h);
          ctx.fillRect(gx + 3, gy - Math.floor(d.h*0.7), 2, Math.floor(d.h*0.7));
          ctx.fillRect(gx + 6, gy - d.h + 2,         2, d.h - 2);
        } else if (d.type === 'rock') {
          // pedra pixel
          const rc = isNight ? '#282830' : '#505058';
          const rl = isNight ? '#343440' : '#686870';
          ctx.fillStyle = rc;
          ctx.fillRect(gx,     gy - 8,  16, 8);
          ctx.fillRect(gx + 2, gy - 12,  12, 4);
          ctx.fillStyle = rl;
          ctx.fillRect(gx + 2, gy - 12,  6, 4);
          ctx.fillRect(gx,     gy - 8,   6, 4);
        } else if (d.type === 'flower' && !isNight) {
          // flor pixel
          ctx.fillStyle = g.line;
          ctx.fillRect(gx + 2, gy - 12, 2, 12);
          ctx.fillStyle = '#e04060';
          ctx.fillRect(gx,     gy - 16, 2, 4);
          ctx.fillRect(gx + 4, gy - 16, 2, 4);
          ctx.fillRect(gx + 2, gy - 18, 2, 2);
          ctx.fillRect(gx + 2, gy - 14, 2, 2);
          ctx.fillStyle = '#f0e050';
          ctx.fillRect(gx + 2, gy - 16, 2, 2);
        }
      }
    });
  }

  // ============================================================
  // OVERLAY NOTURNO
  // ============================================================

  function drawAmbientOverlay(period) {
    if (period.ambientAlpha > 0) {
      ctx.fillStyle = `rgba(5,5,20,${period.ambientAlpha})`;
      ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
    }
  }

  // ============================================================
  // UTILITÁRIOS DE COR
  // ============================================================

  function shadeColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const rr = Math.round(r * factor).toString(16).padStart(2, '0');
    const gg = Math.round(g * factor).toString(16).padStart(2, '0');
    const bb = Math.round(b * factor).toString(16).padStart(2, '0');
    return `#${rr}${gg}${bb}`;
  }

  function darken(hex, factor) {
    return shadeColor(hex, factor);
  }

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================

  function draw(period, deltaMs) {
    ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

    const shake = Effects.getShakeOffset();
    ctx.save();
    ctx.translate(shake.x, shake.y);

    const cam = hero.worldX;

    drawBackground(period, deltaMs);

    if (portalActive) drawPortal(cam);

    mobs.forEach(mob => mob.draw(ctx, hero));
    hero.draw(ctx);

    drawAmbientOverlay(period);
    Effects.draw(ctx);

    ctx.restore();
  }

  function drawPortal(camX) {
    if (!portalIsOpen(Date.now())) return;
    const screenX = CONFIG.hero.screenX + (PORTAL_WORLD_X - camX);
    if (screenX < -120 || screenX > CONFIG.canvas.width + 120) return;

    const now      = Date.now();
    const elapsed  = portalOpenAt ? (now - portalOpenAt) / 1000 : 0;
    const pulse    = Math.sin(elapsed * 3) * 0.18 + 0.82;   // 0.64–1.0
    const shimmer  = Math.sin(elapsed * 7) * 0.12 + 0.88;
    const groundY  = CONFIG.canvas.groundY;
    const portalH  = 120;
    const portalW  = 54;
    const px       = screenX;
    const py       = groundY - portalH;

    ctx.save();

    // brilho externo
    ctx.shadowColor = `rgba(74,222,128,${0.7 * pulse})`;
    ctx.shadowBlur  = 38;

    // anel externo
    ctx.strokeStyle = `rgba(74,222,128,${0.9 * pulse})`;
    ctx.lineWidth   = 5;
    ctx.beginPath();
    ctx.ellipse(px, py + portalH / 2, portalW / 2 + 6, portalH / 2 + 6, 0, 0, Math.PI * 2);
    ctx.stroke();

    // interior gradiente giratório
    const grad = ctx.createRadialGradient(px, py + portalH / 2, 4, px, py + portalH / 2, portalW / 2);
    grad.addColorStop(0,   `rgba(255,255,255,${0.9 * shimmer})`);
    grad.addColorStop(0.3, `rgba(134,239,172,${0.7 * pulse})`);
    grad.addColorStop(0.7, `rgba(21,128,61,${0.5 * pulse})`);
    grad.addColorStop(1,   `rgba(0,0,0,0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(px, py + portalH / 2, portalW / 2, portalH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // anel interno pulsante
    ctx.strokeStyle = `rgba(255,255,255,${0.6 * shimmer})`;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.ellipse(px, py + portalH / 2, portalW / 2 - 4, portalH / 2 - 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // label "PORTAL" acima
    ctx.shadowBlur  = 10;
    ctx.shadowColor = '#4ade80';
    ctx.fillStyle   = `rgba(134,239,172,${pulse})`;
    ctx.font        = 'bold 11px monospace';
    ctx.textAlign   = 'center';
    ctx.fillText('PORTAL', px, py - 10);

    ctx.restore();
  }

  // ============================================================
  // LOOP PRINCIPAL
  // ============================================================

  function loop(timestamp) {
    const deltaMs = lastTimestamp ? timestamp - lastTimestamp : 0;
    lastTimestamp = timestamp;

    // relógio sempre atualizado (visível em todas as telas)
    Hud.updateClock(DayCycle.getCurrentPeriod());

    if (gameState === 'classSelect') {
      drawClassSelect(timestamp);
    } else if (gameState === 'playing') {
      update(deltaMs, Date.now());
      // Período controlado pelo BG_STATE após primeiro crossfade (random lore)
      const period = BG_STATE.currentPeriod ?? DayCycle.getCurrentPeriod();
      draw(period, deltaMs);
      Hud.updateHeroStats(hero);
    } else {
      // loading
      ctx.fillStyle = '#080810';
      ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
      ctx.fillStyle = '#555';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Carregando...', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
    }

    requestAnimationFrame(loop);
  }

  // ── Balão de pensamento ───────────────────────────────────────
  const BUBBLE_PHRASES = {
    all: [
      'Huum...',
      'Essas árvores...',
      'Tenho a sensação de estar andando em loop...',
      'Ser um herói é mais cansativo do que parece.',
      'Quantos goblins já derrubei hoje?',
      'Preciso de um descanso.',
    ],
    warrior:   ['Pela honra de Karveth, o Inabalável... quanto tempo mais essa floresta vai durar?'],
    hunter:    ['Karine me disse que a floresta fala... até agora só ouvi vento.'],
    mage:      ['O Arconte Valdris passaria vergonha me vendo perdido assim...'],
    cleric:    ['Pela luz de Aelys... juro que já passei por essa árvore antes.'],
    // Frases disparadas na mudança de período (crossfade)
    periodChange: [
      'O tempo aqui não segue nenhuma lógica...',
      'Espera... já anoiteceu?',
      'Essa floresta dobra o tempo como quer.',
      'Sinto que o mundo pulou algumas horas.',
      'Algo mudou no ar...',
      'Nem percebi a hora passar.',
      'Essa luz... isso é madrugada ou entardecer?',
      'O sol sumiu rápido demais.',
    ],
  };

  function _showPeriodChangeBubble() {
    if (!hero) return;
    const pool = BUBBLE_PHRASES.periodChange;
    const text = pool[Math.floor(Math.random() * pool.length)];
    const el   = document.getElementById('hero-bubble');
    document.getElementById('hero-bubble-text').textContent = text;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4500);
  }

  let _bubbleTimer = null;

  function _scheduleBubble() {
    const delay = 18000 + Math.random() * 20000; // 18–38s
    _bubbleTimer = setTimeout(() => {
      if (gameState !== 'playing' || !hero) { _scheduleBubble(); return; }
      const pool = [...BUBBLE_PHRASES.all, ...(BUBBLE_PHRASES[hero.heroClass] ?? [])];
      const text = pool[Math.floor(Math.random() * pool.length)];
      const el   = document.getElementById('hero-bubble');
      document.getElementById('hero-bubble-text').textContent = text;
      el.classList.remove('hidden');
      setTimeout(() => el.classList.add('hidden'), 4000);
      _scheduleBubble();
    }, delay);
  }

  function init() {
    Hud.init();
    loadBackgrounds();
    requestAnimationFrame(loop);
    Bag.init(() => hero);
    _scheduleBubble();

    document.getElementById('death-btn').addEventListener('click', () => {
      document.getElementById('death-overlay').classList.add('hidden');
      Bag.closeBag();
      Bag.closeEquip();
      gameState = 'classSelect';
    });

    // Keygem popup
    document.getElementById('keygem-change').addEventListener('click', () => {
      document.getElementById('keygem-overlay').classList.add('hidden');
      Bag.closeBag();
      Bag.closeEquip();
      gameState = 'classSelect';
    });
    document.getElementById('keygem-stay').addEventListener('click', () => {
      document.getElementById('keygem-overlay').classList.add('hidden');
    });

    // Fase 2 popup
    document.getElementById('phase2-btn').addEventListener('click', () => {
      document.getElementById('phase2-overlay').classList.add('hidden');
      Bag.closeBag();
      Bag.closeEquip();
      phase2Triggered = false;
      portalActive    = false;
      gameState       = 'classSelect';
    });

    // hook para quando todas as gems forem consumidas via bag.js
    window._onAllGemsConsumed = () => {
      portalActive = true;
      portalOpenAt = Date.now() + 10000; // abre após 10s
      Hud.logEvent('💎 Todas as Keygens consumidas! O portal se abrirá em 10 segundos...', 'levelup');
    };
    // Tecla T — desativada

    Sprites.load(() => {
      MobSprites.load(() => {
        gameState = 'classSelect';
      });
    });
  }

  init();
})();
