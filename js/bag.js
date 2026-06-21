// ============================================================
// bag.js — Mochila (grid) e Equipamentos (character screen)
// ============================================================

var Bag = {
  _bagOpen:   false,
  _equipOpen: false,
  _selected:  null,
  _getHero:   null,

  init(getHero) {
    this._getHero = getHero;

    document.getElementById('bag-btn').addEventListener('click',   () => this.toggleBag());
    document.getElementById('equip-btn').addEventListener('click', () => this.toggleEquip());
    document.getElementById('bag-close').addEventListener('click',   () => this.closeBag());
    document.getElementById('equip-close').addEventListener('click', () => this.closeEquip());

    document.getElementById('ip-equip').addEventListener('click',           () => this._equip());
    document.getElementById('ip-unequip').addEventListener('click',         () => this._unequip());
    document.getElementById('equip-detail-unequip').addEventListener('click',() => this._unequipSlot());

    // fecha popup ao clicar fora
    document.getElementById('bag-overlay').addEventListener('click', e => {
      if (!e.target.closest('#item-popup') && !e.target.closest('.bag-slot')) {
        this._hideItemPopup();
      }
    });

    document.querySelectorAll('#equip-modal .equip-slot').forEach(el => {
      el.addEventListener('click', () => this._onEquipSlotClick(el.dataset.slot));
    });

    document.getElementById('bag-overlay').addEventListener('click', e => {
      if (e.target === e.currentTarget) this.closeBag();
    });
    document.getElementById('equip-overlay').addEventListener('click', e => {
      if (e.target === e.currentTarget) this.closeEquip();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'b' || e.key === 'B') this.toggleBag();
      if (e.key === 'e' || e.key === 'E') this.toggleEquip();
      if (e.key === 'Escape') { this.closeBag(); this.closeEquip(); }
    });
  },

  // ── Mochila ─────────────────────────────────────────────────
  toggleBag() { this._bagOpen ? this.closeBag() : this.openBag(); },

  openBag() {
    this._bagOpen = true;
    document.getElementById('bag-overlay').classList.remove('hidden');
    this._renderGrid();
    this._hideItemPopup();
    this._selected = null;
  },

  closeBag() {
    this._bagOpen = false;
    document.getElementById('bag-overlay').classList.add('hidden');
    this._hideItemPopup();
  },

  // ── Equipamentos ─────────────────────────────────────────────
  toggleEquip() { this._equipOpen ? this.closeEquip() : this.openEquip(); },

  openEquip() {
    this._equipOpen = true;
    document.getElementById('equip-overlay').classList.remove('hidden');
    document.getElementById('equip-detail').classList.add('hidden');
    this._activeEquipSlot = null;
    this._renderEquipScreen();
    this._startHeroLoop();
  },

  closeEquip() {
    this._equipOpen = false;
    document.getElementById('equip-overlay').classList.add('hidden');
    this._stopHeroLoop();
  },

  _startHeroLoop() {
    this._stopHeroLoop();
    const tick = () => {
      if (!this._equipOpen) return;
      const hero = this._getHero();
      if (hero) this._drawHeroCanvas(hero);
      this._heroLoopId = requestAnimationFrame(tick);
    };
    this._heroLoopId = requestAnimationFrame(tick);
  },

  _stopHeroLoop() {
    if (this._heroLoopId) { cancelAnimationFrame(this._heroLoopId); this._heroLoopId = null; }
  },

  // chamado por combat.js / hero.js depois de equip/drop
  refresh() {
    if (this._bagOpen)   this._renderGrid();
    if (this._equipOpen) this._renderEquipScreen();
  },

  // ── Render: grid da mochila ──────────────────────────────────
  _renderGrid() {
    const hero = this._getHero();
    const grid = document.getElementById('bag-grid');
    grid.innerHTML = '';
    if (!hero) return;

    if (!hero.inventory || hero.inventory.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'grid-column:1/-1;color:#6a5030;font-size:11px;text-align:center;padding:30px 0;font-family:Courier New,monospace;';
      empty.textContent = 'Mochila vazia';
      grid.appendChild(empty);
      return;
    }

    // agrupa stackáveis
    const grouped = [];
    const seen = {};
    for (const item of hero.inventory) {
      const stackable = item.type === 'material' || item.type === 'consumable';
      if (stackable && seen[item.id] !== undefined) {
        grouped[seen[item.id]].qty++;
      } else {
        seen[item.id] = grouped.length;
        grouped.push({ item, qty: 1 });
      }
    }

    grouped.forEach(({ item, qty }, idx) => {
      const slot = document.createElement('div');
      slot.className = 'bag-slot';
      slot.dataset.rarity = item.rarity;
      slot.title = item.name;

      const img = this._itemImg(item, 44);
      if (img) slot.appendChild(img);
      else slot.textContent = item.icon ?? '?';

      if (qty > 1) {
        const badge = document.createElement('span');
        badge.className = 'item-qty';
        badge.textContent = qty;
        slot.appendChild(badge);
      }

      if (this._selected?.index === idx) slot.classList.add('selected');

      slot.addEventListener('mouseenter', e => this._showItemPopup(item, hero, e.currentTarget));
      slot.addEventListener('mouseleave', e => {
        // só esconde se não foi fixado por click
        if (!this._popupPinned) this._hideItemPopup();
      });
      slot.addEventListener('click', e => {
        this._selected = { item, index: idx };
        this._popupPinned = true;
        this._showItemPopup(item, hero, e.currentTarget);
        this._renderGrid();
      });

      grid.appendChild(slot);
    });
  },

  _showItemPopup(item, hero, slotEl) {
    const popup = document.getElementById('item-popup');

    // imagem
    const img = document.getElementById('ip-img');
    if (item.img) {
      img.src   = `assets/items/${item.img}`;
      img.style.display = '';
    } else {
      img.style.display = 'none';
    }

    // textos
    const nameEl = document.getElementById('ip-name');
    nameEl.textContent = item.name;
    nameEl.style.color = Items.getRarityColor(item.rarity);

    const RARITY_LABELS = { comum:'Comum', incomum:'Incomum', raro:'Raro', epico:'Épico' };
    document.getElementById('ip-rarity').textContent = RARITY_LABELS[item.rarity] ?? item.rarity;
    document.getElementById('ip-desc').textContent   = item.desc ?? '';

    const bonusEl = document.getElementById('ip-bonus');
    if (item.bonus) {
      const parts = [];
      if (item.bonus.attack) parts.push(`+${item.bonus.attack} ATK`);
      if (item.bonus.maxHp)  parts.push(`+${item.bonus.maxHp} HP`);
      bonusEl.textContent = parts.join('  ');
    } else if (item.effect) {
      bonusEl.textContent = item.effect.type === 'heal'
        ? `Cura ${item.effect.amount} HP`
        : item.effect.type === 'xp'
          ? `+${item.effect.amount} XP`
          : `+${item.effect.amount} ATK por ${item.effect.duration / 1000}s`;
    } else {
      bonusEl.textContent = '';
    }
    document.getElementById('ip-value').textContent = item.value ? `Valor: ${item.value} ouro` : '';

    // botões
    const equipBtn   = document.getElementById('ip-equip');
    const unequipBtn = document.getElementById('ip-unequip');
    equipBtn.textContent = 'Equipar';
    equipBtn.classList.add('hidden');
    unequipBtn.classList.add('hidden');

    if (hero) {
      const isEquipable = ['weapon','armor','accessory'].includes(item.type);
      const isEquipped  = item.slot && hero.equipment?.[item.slot]?.id === item.id;
      if (isEquipable && isEquipped) unequipBtn.classList.remove('hidden');
      else if (isEquipable)          equipBtn.classList.remove('hidden');
      if (item.type === 'keygem' && !GemSystem.isConsumed(item.heroClass)) {
        equipBtn.textContent = 'Usar Keygem';
        equipBtn.classList.remove('hidden');
      }
    }

    // posicionamento fixo relativo ao viewport
    popup.classList.remove('hidden');
    const slotRect = slotEl.getBoundingClientRect();
    const popupW   = 210;
    const popupH   = popup.offsetHeight || 280;
    const vw       = window.innerWidth;
    const vh       = window.innerHeight;

    // tenta à direita do slot; se não couber, vai à esquerda
    let left = slotRect.right + 8;
    if (left + popupW > vw - 8) left = slotRect.left - popupW - 8;

    // alinha pelo topo do slot; se sair por baixo, sobe
    let top = slotRect.top;
    if (top + popupH > vh - 8) top = vh - popupH - 8;

    popup.style.left = `${Math.max(8, left)}px`;
    popup.style.top  = `${Math.max(8, top)}px`;
  },

  _hideItemPopup() {
    this._popupPinned = false;
    document.getElementById('item-popup').classList.add('hidden');
  },

  // ── Render: tela de equipamentos ────────────────────────────
  _renderEquipScreen() {
    const hero = this._getHero();
    if (!hero) return;

    // slots
    const eq = hero.equipment ?? {};
    const placeholders = { weapon: '⚔️', armor: '🛡️', accessory: '📿' };

    document.querySelectorAll('#equip-modal .equip-slot').forEach(el => {
      const slot = el.dataset.slot;
      const item = eq[slot];
      el.innerHTML = '';
      el.classList.remove('filled');
      el.style.borderColor = '';

      if (item) {
        const img = this._itemImg(item, 50);
        if (img) el.appendChild(img);
        else el.textContent = item.icon ?? '?';
        el.classList.add('filled');
        el.style.borderColor = Items.getRarityColor(item.rarity);
      } else {
        el.textContent = placeholders[slot] ?? '?';
      }
    });

    // stats
    document.getElementById('equip-atk-val').textContent = hero.attack ?? '—';
    document.getElementById('equip-hp-val').textContent  = hero.maxHp  ?? '—';

    // desenha sprite do hero no canvas central
    this._drawHeroCanvas(hero);
  },

  _drawHeroCanvas(hero) {
    const canvas = document.getElementById('equip-hero-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    // centraliza o hero no canvas de equipamentos, menor que no jogo
    const scale = 1.6;
    const tx = canvas.width  / 2 - CONFIG.hero.screenX * scale;
    const ty = canvas.height - 8  - hero.y * scale;

    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(scale, scale);
    hero.draw(ctx);
    ctx.restore();
  },

  _onEquipSlotClick(slot) {
    const hero = this._getHero();
    if (!hero) return;
    const item = hero.equipment?.[slot];
    this._activeEquipSlot = slot;

    const detailEl = document.getElementById('equip-detail');
    if (!item) { detailEl.classList.add('hidden'); return; }

    const nameEl = document.getElementById('equip-detail-name');
    nameEl.textContent = item.name;
    nameEl.style.color = Items.getRarityColor(item.rarity);

    const parts = [];
    if (item.bonus?.attack) parts.push(`+${item.bonus.attack} ATK`);
    if (item.bonus?.maxHp)  parts.push(`+${item.bonus.maxHp} HP`);
    document.getElementById('equip-detail-bonus').textContent = parts.join('  ') || (item.desc ?? '');

    detailEl.classList.remove('hidden');
  },

  _unequipSlot() {
    const hero = this._getHero();
    if (!hero || !this._activeEquipSlot) return;
    const item = hero.equipment?.[this._activeEquipSlot];
    if (!item) return;

    Items.removeBonus(hero, item);
    delete hero.equipment[this._activeEquipSlot];
    hero.inventory.push(item);
    SaveSystem.save(hero);
    Hud.updateHeroStats(hero);
    document.getElementById('equip-detail').classList.add('hidden');
    this._activeEquipSlot = null;
    this._renderEquipScreen();
  },

  // ── Equipar / desequipar da mochila ─────────────────────────
  _equip() {
    const hero = this._getHero();
    if (!hero || !this._selected) return;
    const { item } = this._selected;

    // keygem — usa e abre popup especial
    if (item.type === 'keygem') {
      this._useKeygem(hero, item);
      return;
    }

    if (!item.slot) return;

    if (!hero.equipment) hero.equipment = {};
    if (hero.equipment[item.slot]) Items.removeBonus(hero, hero.equipment[item.slot]);
    hero.equipment[item.slot] = item;
    Items.applyBonus(hero, item);

    const idx = hero.inventory.findIndex(i => i === item || i.id === item.id);
    if (idx !== -1) hero.inventory.splice(idx, 1);

    SaveSystem.save(hero);
    Hud.updateHeroStats(hero);
    this._selected = null;
    this._hideItemPopup();
    this._renderGrid();
  },

  _unequip() {
    const hero = this._getHero();
    if (!hero || !this._selected) return;
    const { item } = this._selected;
    if (!item.slot) return;

    Items.removeBonus(hero, item);
    delete hero.equipment[item.slot];
    hero.inventory.push(item);

    SaveSystem.save(hero);
    Hud.updateHeroStats(hero);
    this._selected = null;
    this._hideItemPopup();
    this._renderGrid();
  },

  // ── Keygem: usa e abre popup ─────────────────────────────────
  _useKeygem(hero, item) {
    GemSystem.consume(item.heroClass);

    // remove da mochila
    const idx = hero.inventory.findIndex(i => i.id === item.id);
    if (idx !== -1) hero.inventory.splice(idx, 1);
    SaveSystem.save(hero);

    this.closeBag();

    const count   = GemSystem.count();
    const total   = 5;
    const allDone = GemSystem.allConsumed();

    document.getElementById('keygem-icon').textContent  = item.icon;
    document.getElementById('keygem-title').textContent = `${item.name} Consumida!`;
    document.getElementById('keygem-count').textContent =
      allDone ? '✅ Todas as 5 gems coletadas! O portal se abrirá em breve...'
              : `${count} / ${total} gems coletadas`;

    document.getElementById('keygem-overlay').classList.remove('hidden');

    // se todas consumidas, notifica o game para abrir o portal
    if (allDone && typeof window._onAllGemsConsumed === 'function') {
      window._onAllGemsConsumed();
    }
  },

  // ── Helper: cria <img> para item ────────────────────────────
  _itemImg(item, size) {
    if (!item.img) return null;
    const img = document.createElement('img');
    img.src   = `assets/items/${item.img}`;
    img.style.cssText = `width:${size}px;height:${size}px;image-rendering:pixelated;object-fit:contain;`;
    img.onerror = () => { img.replaceWith(document.createTextNode(item.icon ?? '?')); };
    return img;
  },
};
