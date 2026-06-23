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
    document.getElementById('equip-btn')?.addEventListener('click', () => this.toggleEquip());
    document.getElementById('bag-close').addEventListener('click',   () => this.closeBag());
    document.getElementById('equip-close').addEventListener('click', () => this.closeEquip());

    document.getElementById('ip-equip').addEventListener('click',           () => this._equip());
    document.getElementById('ip-unequip').addEventListener('click',         () => this._unequip());
    document.getElementById('ip-vault').addEventListener('click',           () => this._sendToVault());
    document.getElementById('ip-delete').addEventListener('click',          () => this._confirmDelete());
    document.getElementById('del-confirm').addEventListener('click',        () => this._executeDelete());
    document.getElementById('del-cancel').addEventListener('click',         () => this._closeDeletePopup());
    document.getElementById('delete-overlay').addEventListener('click', e => {
      if (e.target === e.currentTarget) this._closeDeletePopup();
    });
    document.getElementById('equip-detail-unequip').addEventListener('click',() => this._unequipSlot());
    document.getElementById('vault-close').addEventListener('click',        () => this.closeVault());
    document.getElementById('vault-overlay').addEventListener('click', e => {
      if (e.target === e.currentTarget) this.closeVault();
    });
    document.getElementById('vw-cancel').addEventListener('click',  () => this._closeWithdrawPopup());
    document.getElementById('vault-withdraw-overlay').addEventListener('click', e => {
      if (e.target === e.currentTarget) this._closeWithdrawPopup();
    });

    // aba "Baú" na mochila → abre modal separado
    document.getElementById('tab-bag').addEventListener('click',   () => {
      document.getElementById('tab-bag').classList.add('active');
      document.getElementById('tab-vault').classList.remove('active');
    });
    document.getElementById('tab-vault').addEventListener('click', () => {
      this.closeBag();
      this.openVault();
    });

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
      if (e.key === 'v' || e.key === 'V') this.toggleVault();
      if (e.key === 'Escape') { this.closeBag(); this.closeEquip(); this.closeVault(); }
      if (e.key === '1' && this._gameActive) this._useQuickSlot(1);
      if (e.key === '2' && this._gameActive) this._useQuickSlot(2);
      if (e.key === '3' && this._gameActive) this._useQuickSlot(3);
    });

    // volume slider
    document.getElementById('volume-slider').addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      Audio.setMusicVolume(v);
      document.getElementById('volume-icon').textContent = v === 0 ? '🔇' : '🎵';
    });
    document.getElementById('sfx-slider').addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      Audio.setSfxVolume(v);
      document.getElementById('sfx-icon').textContent = v === 0 ? '🔇' : '🔊';
    });

    // quick-use bar — drag & drop
    this._quickSlots = { 1: null, 2: null, 3: null };
    this._initQuickBar();
  },

  _initQuickBar() {
    [1, 2, 3].forEach(n => {
      const el = document.getElementById(`qslot-${n}`);
      el.addEventListener('dragover',  e => { e.preventDefault(); el.classList.add('drag-over'); });
      el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
      el.addEventListener('drop', e => {
        e.preventDefault();
        el.classList.remove('drag-over');
        const itemId = e.dataTransfer.getData('text/plain');
        const hero = this._getHero();
        if (!hero) return;
        const item = hero.inventory.find(i => i.id === itemId);
        if (!item) return;
        if (item.type !== 'consumable') {
          this._showQuickMsg('Apenas consumíveis');
          return;
        }
        this._quickSlots[n] = itemId;
        this._renderQuickSlot(n, item);
      });
    });
  },

  _renderQuickSlot(n, item) {
    const el = document.getElementById(`qslot-${n}`);
    // limpa conteúdo exceto a key label
    const key = el.querySelector('.qslot-key');
    el.innerHTML = '';
    el.appendChild(key);
    if (!item) return;
    const hero = this._getHero();
    const qty = hero ? hero.inventory.filter(i => i.id === item.id).length : 0;
    if (qty === 0) { this._quickSlots[n] = null; return; }
    if (item.img) {
      const img = document.createElement('img');
      img.src = `assets/items/${item.img}`;
      const sz = item.quickbarSize ?? 38;
      img.style.width  = `${sz}px`;
      img.style.height = `${sz}px`;
      img.style.objectFit = 'contain';
      el.appendChild(img);
    } else {
      const ic = document.createElement('span');
      ic.textContent = item.icon ?? '?';
      ic.style.fontSize = '22px';
      el.appendChild(ic);
    }
    const qtyEl = document.createElement('span');
    qtyEl.className = 'qslot-qty';
    qtyEl.textContent = qty > 1 ? qty : '';
    el.appendChild(qtyEl);
  },

  _useQuickSlot(n) {
    const itemId = this._quickSlots?.[n];
    if (!itemId) return;
    const hero = this._getHero();
    if (!hero) return;
    const item = hero.inventory.find(i => i.id === itemId);
    if (!item?.effect) return;

    const ef = item.effect;
    if (ef.type === 'heal') {
      const before = hero.hp;
      hero.hp = Math.min(hero.maxHp, hero.hp + ef.amount);
      const healed = hero.hp - before;
      Hud.logEvent(`Usou ${item.name}: +${healed} HP`, 'info');
      Hud.updateHeroStats(hero);
    } else if (ef.type === 'xp') {
      hero.xp = (hero.xp ?? 0) + ef.amount;
      Hud.logEvent(`Usou ${item.name}: +${ef.amount} XP`, 'info');
      Hud.updateHeroStats(hero);
    } else if (ef.type === 'buff') {
      hero[ef.stat] = (hero[ef.stat] ?? 0) + ef.amount;
      setTimeout(() => { hero[ef.stat] -= ef.amount; Hud.updateHeroStats(hero); }, ef.duration);
      Hud.logEvent(`Usou ${item.name}: +${ef.amount} ${ef.stat} por ${ef.duration/1000}s`, 'info');
      Hud.updateHeroStats(hero);
    }

    const idx = hero.inventory.findIndex(i => i.id === itemId);
    if (idx !== -1) hero.inventory.splice(idx, 1);
    SaveSystem.save(hero);
    this._renderQuickSlot(n, item);

    // flash visual no slot
    const el = document.getElementById(`qslot-${n}`);
    el.classList.add('active-flash');
    setTimeout(() => el.classList.remove('active-flash'), 300);
  },

  _showQuickMsg(text) {
    const el = document.getElementById('quickbar-msg');
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(this._quickMsgTimer);
    this._quickMsgTimer = setTimeout(() => el.classList.add('hidden'), 1800);
  },

  openVault() {
    this._vaultOpen = true;
    document.getElementById('vault-overlay').classList.remove('hidden');
    this._renderVault();
  },

  closeVault() {
    this._vaultOpen = false;
    this._vaultSelected = null;
    this._popupPinned = false;
    this._hideItemPopup();
    document.getElementById('vault-overlay').classList.add('hidden');
  },

  toggleVault() { this._vaultOpen ? this.closeVault() : this.openVault(); },

  _renderVault() {
    const grid = document.getElementById('vault-grid');
    grid.innerHTML = '';
    const entries = Vault.getAll();
    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'grid-column:1/-1;text-align:center;color:#666;font-size:11px;padding:20px 0;';
      empty.textContent = 'O baú está vazio.';
      grid.appendChild(empty);
      return;
    }
    const hero = this._getHero();
    entries.forEach(({ item, qty }) => {
      const slot = document.createElement('div');
      slot.className = 'bag-slot';
      slot.dataset.rarity = item.rarity;
      slot.title = item.name;

      const img = this._itemImg(item, item.imgSize ?? 44);
      if (img) slot.appendChild(img);
      else slot.textContent = item.icon ?? '?';

      if (qty > 1) {
        const badge = document.createElement('span');
        badge.className = 'item-qty';
        badge.textContent = qty;
        slot.appendChild(badge);
      }

      slot.addEventListener('mouseenter', () => {
        if (!this._popupPinned) this._showItemPopup(item, null, slot);
      });
      slot.addEventListener('mouseleave', () => {
        if (!this._popupPinned) this._hideItemPopup();
      });
      slot.addEventListener('click', () => {
        if (this._vaultSelected === item.id) {
          this._vaultSelected = null;
          this._popupPinned = false;
          this._hideItemPopup();
          this._renderVault();
          return;
        }
        this._vaultSelected = item.id;
        this._popupPinned = true;
        this._showItemPopup(item, null, slot);
        const vaultBtn = document.getElementById('ip-vault');
        vaultBtn.textContent = 'Retirar do Baú 📦';
        vaultBtn.classList.remove('hidden');
        // esconde botões irrelevantes no contexto do vault
        document.getElementById('ip-use').style.display   = 'none';
        document.getElementById('ip-craft')?.style && (document.getElementById('ip-craft').style.display = 'none');
        vaultBtn.onclick = () => this._confirmWithdraw(item, qty);
      });
      grid.appendChild(slot);
    });
  },

  _confirmWithdraw(item, qty) {
    const TAX_RATE = 0.10;
    const totalValue = (item.value ?? 0) * qty;
    const fee = Math.ceil(totalValue * TAX_RATE);
    const hero = this._getHero();

    document.getElementById('vw-title').textContent   = '🔒 Saque do Baú Seguro';
    document.getElementById('vw-confirm').textContent = 'Confirmar Saque';
    document.getElementById('vw-msg').innerHTML =
      `A taxa de saque hoje está em <strong>10%</strong>.<br>` +
      `${qty}x ${item.name} → valor total: <strong>${totalValue}g</strong>`;
    document.getElementById('vw-fee').textContent =
      fee > 0 ? `Taxa: ${fee}g (seu gold atual: ${hero?.gold ?? 0}g)` : 'Item sem valor — saque gratuito.';

    const confirmBtn = document.getElementById('vw-confirm');
    confirmBtn.onclick = () => {
      if (!hero) return;
      if (fee > 0 && hero.gold < fee) {
        document.getElementById('vw-fee').textContent = `Gold insuficiente! Você precisa de ${fee}g.`;
        return;
      }
      hero.gold -= fee;
      Vault.withdraw(item.id, qty, hero);
      SaveSystem.save(hero);
      Hud.updateHeroStats(hero);
      Hud.logEvent(`Retirou ${qty}x ${item.name} do baú. Taxa: ${fee}g`, 'info');
      this._closeWithdrawPopup();
      this._popupPinned = false;
      this._vaultSelected = null;
      this._hideItemPopup();
      this._renderVault();
    };

    document.getElementById('vault-withdraw-overlay').classList.remove('hidden');
  },

  _closeWithdrawPopup() {
    document.getElementById('vault-withdraw-overlay').classList.add('hidden');
  },

  _confirmDelete() {
    // contexto: vault ou bag?
    if (this._vaultOpen && this._vaultSelected) {
      const entries = Vault.getAll();
      const entry   = entries.find(e => e.item.id === this._vaultSelected);
      if (!entry) return;
      document.getElementById('del-msg').innerHTML =
        `Deseja excluir permanentemente <strong>${entry.qty}x ${entry.item.name}</strong> do Baú Seguro?<br><span style="color:#ff6666;font-size:10px">Esta ação não pode ser desfeita.</span>`;
    } else {
      if (!this._selected) return;
      const hero = this._getHero();
      const item = this._selected.item;
      const qty  = hero?.inventory.filter(i => i.id === item.id).length ?? 0;
      document.getElementById('del-msg').innerHTML =
        `Deseja excluir permanentemente <strong>${qty}x ${item.name}</strong> da Mochila?<br><span style="color:#ff6666;font-size:10px">Esta ação não pode ser desfeita.</span>`;
    }
    document.getElementById('delete-overlay').classList.remove('hidden');
  },

  _executeDelete() {
    if (this._vaultOpen && this._vaultSelected) {
      const itemId = this._vaultSelected;
      const entries = Vault.getAll();
      const entry   = entries.find(e => e.item.id === itemId);
      if (entry) {
        Vault.withdraw(itemId, entry.qty, { inventory: [] }); // retira sem dar a ninguém
        // forçar remoção direta (withdraw pode não funcionar sem hero real)
        const raw = Vault._read().filter(e => e.id !== itemId);
        Vault._write(raw);
        Hud.logEvent(`${entry.qty}x ${entry.item.name} excluído do baú.`, 'info');
      }
      this._popupPinned = false;
      this._vaultSelected = null;
      this._hideItemPopup();
      this._renderVault();
    } else {
      const hero = this._getHero();
      if (!hero || !this._selected) return;
      const itemId = this._selected.item.id;
      const qty    = hero.inventory.filter(i => i.id === itemId).length;
      hero.inventory = hero.inventory.filter(i => i.id !== itemId);
      SaveSystem.save(hero);
      Hud.logEvent(`${qty}x ${this._selected.item.name} excluído da mochila.`, 'info');
      this._hideItemPopup();
      this._renderGrid();
      this.refreshQuickBar();
    }
    this._closeDeletePopup();
  },

  _closeDeletePopup() {
    document.getElementById('delete-overlay').classList.add('hidden');
  },

  _sendToVault() {
    const hero = this._getHero();
    if (!hero || !this._selected) return;
    const item = this._selected.item;
    if (item.type === 'keygem') return;
    const qty = hero.inventory.filter(i => i.id === item.id).length;
    if (qty === 0) return;
    // remove toda a pilha do inventário
    hero.inventory = hero.inventory.filter(i => i.id !== item.id);
    Vault.deposit(item.id, qty);
    SaveSystem.save(hero);
    Hud.logEvent(`${qty}x ${item.name} enviado ao baú.`, 'info');
    this._hideItemPopup();
    this._renderGrid();
    this.refreshQuickBar();
  },

  refreshQuickBar() {
    [1, 2, 3].forEach(n => {
      const itemId = this._quickSlots?.[n];
      if (!itemId) return;
      const hero = this._getHero();
      const item = hero?.inventory.find(i => i.id === itemId);
      this._renderQuickSlot(n, item ?? { id: itemId });
    });
  },

  // ── Mochila ─────────────────────────────────────────────────
  toggleBag() { this._bagOpen ? this.closeBag() : this.openBag(); },

  openBag() {
    this._bagOpen = true;
    document.getElementById('bag-overlay').classList.remove('hidden');
    document.getElementById('tab-bag').classList.add('active');
    document.getElementById('tab-vault').classList.remove('active');
    this._renderGrid();
    this.refreshQuickBar();
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

      slot.draggable = true;
      slot.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', item.id);
        this._dragging = true;
        this._hideItemPopup();
      });
      slot.addEventListener('dragend', () => { this._dragging = false; });

      const img = this._itemImg(item, item.imgSize ?? 44);
      if (img) slot.appendChild(img);
      else slot.textContent = item.icon ?? '?';

      if (qty > 1) {
        const badge = document.createElement('span');
        badge.className = 'item-qty';
        badge.textContent = qty;
        slot.appendChild(badge);
      }

      if (this._selected?.index === idx) slot.classList.add('selected');

      slot.addEventListener('mouseenter', e => {
        if (!this._popupPinned && !this._dragging) this._showItemPopup(item, hero, e.currentTarget);
      });
      slot.addEventListener('mouseleave', e => {
        if (!this._popupPinned) this._hideItemPopup();
      });
      slot.addEventListener('click', e => {
        if (this._selected?.index === idx) {
          // clicou no mesmo item selecionado: desseleciona
          this._selected = null;
          this._popupPinned = false;
          this._hideItemPopup();
          this._renderGrid();
          return;
        }
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
          : item.effect.type === 'phase2'
            ? 'Avança para a Fase 2'
            : `+${item.effect.amount} ATK por ${item.effect.duration / 1000}s`;
    } else {
      bonusEl.textContent = '';
    }
    document.getElementById('ip-value').textContent = item.value ? `Valor: ${item.value} ouro` : '';

    // botão usar (consumíveis)
    let useBtn = document.getElementById('ip-use');
    if (!useBtn) {
      useBtn = document.createElement('button');
      useBtn.id = 'ip-use';
      useBtn.textContent = 'Usar';
      useBtn.style.cssText = 'margin-top:6px;padding:3px 10px;font-size:11px;background:#2a3a4a;color:#88ccff;border:1px solid #4a7aaa;border-radius:4px;cursor:pointer;font-family:inherit;width:100%;';
      document.getElementById('ip-value').insertAdjacentElement('afterend', useBtn);
      useBtn.addEventListener('click', () => this._useConsumable());
    }
    useBtn.style.display = (item.type === 'consumable' && hero) ? '' : 'none';

    // botão craft — aparece se o item for ingrediente de alguma receita
    let craftBtn = document.getElementById('ip-craft');
    if (!craftBtn) {
      craftBtn = document.createElement('button');
      craftBtn.id = 'ip-craft';
      craftBtn.style.cssText = 'margin-top:6px;padding:3px 10px;font-size:11px;background:#2a4a2a;color:#88ffaa;border:1px solid #4a8a4a;border-radius:4px;cursor:pointer;font-family:inherit;width:100%;';
      document.getElementById('ip-value').insertAdjacentElement('afterend', craftBtn);
      craftBtn.addEventListener('click', () => this._confirmCraft());
    }
    const recipe = hero ? CRAFT_RECIPES.find(r => r.ingredient === item.id) : null;
    if (recipe) {
      const qty = hero.inventory.filter(i => i.id === item.id).length;
      const result = Items.get(recipe.result);
      craftBtn.textContent = `⚗ Craft (${recipe.qty}x → ${result?.name ?? recipe.result})`;
      craftBtn.style.display = qty >= recipe.qty ? '' : 'none';
    } else {
      craftBtn.style.display = 'none';
    }

    // botões
    const equipBtn   = document.getElementById('ip-equip');
    const unequipBtn = document.getElementById('ip-unequip');
    const vaultBtn   = document.getElementById('ip-vault');
    equipBtn.textContent = 'Equipar';
    equipBtn.classList.add('hidden');
    unequipBtn.classList.add('hidden');
    // baú: texto e ação dependem do contexto
    if (this._vaultOpen) {
      vaultBtn.textContent = 'Retirar do Baú 📦';
      vaultBtn.onclick = null; // será definido no click do slot
    } else {
      vaultBtn.textContent = 'Enviar ao Baú 🔒';
      vaultBtn.onclick = null;
    }
    if (item.type !== 'keygem') vaultBtn.classList.remove('hidden');
    else vaultBtn.classList.add('hidden');

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

    // posicionamento relativo ao modal de referência
    popup.classList.remove('hidden');
    const refId   = this._vaultOpen ? 'vault-modal' : 'bag-modal';
    this._positionPopup(popup, refId);
  },

  _positionPopup(popup, refModalId) {
    const popupW  = 210;
    const popupH  = popup.offsetHeight || 280;
    const vh      = window.innerHeight;
    const vw      = window.innerWidth;
    const rect    = document.getElementById(refModalId).getBoundingClientRect();

    let left = rect.left - popupW - 12;
    if (left < 8) left = rect.right + 12;
    if (left + popupW > vw - 8) left = Math.max(8, rect.left - popupW - 12);

    let top = rect.top;
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
    const scale = 1.1;
    const tx = canvas.width  / 2 - CONFIG.hero.screenX * scale;
    const ty = canvas.height - 100 - hero.y * scale;

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

  // ── Usar consumível ─────────────────────────────────────────
  _useConsumable() {
    const hero = this._getHero();
    if (!hero || !this._selected) return;
    const item = this._selected.item;
    if (!item?.effect) return;

    const ef = item.effect;
    if (ef.type === 'heal') {
      const before = hero.hp;
      hero.hp = Math.min(hero.maxHp, hero.hp + ef.amount);
      const healed = hero.hp - before;
      Hud.logEvent(`Usou ${item.name}: +${healed} HP`, 'info');
      Hud.updateHeroStats(hero);
    } else if (ef.type === 'xp') {
      hero.xp = (hero.xp ?? 0) + ef.amount;
      Hud.logEvent(`Usou ${item.name}: +${ef.amount} XP`, 'info');
      Hud.updateHeroStats(hero);
    } else if (ef.type === 'buff') {
      hero[ef.stat] = (hero[ef.stat] ?? 0) + ef.amount;
      setTimeout(() => { hero[ef.stat] -= ef.amount; Hud.updateHeroStats(hero); }, ef.duration);
      Hud.logEvent(`Usou ${item.name}: +${ef.amount} ${ef.stat} por ${ef.duration/1000}s`, 'info');
      Hud.updateHeroStats(hero);
    } else if (ef.type === 'phase2') {
      const idx2 = hero.inventory.findIndex(i => i.id === item.id);
      if (idx2 !== -1) hero.inventory.splice(idx2, 1);
      SaveSystem.save(hero);
      this._hideItemPopup();
      this._renderGrid();
      this.refreshQuickBar();
      if (window._onForestKeyUsed) window._onForestKeyUsed();
      return;
    }

    // remove uma unidade do inventário
    const idx = hero.inventory.findIndex(i => i.id === item.id);
    if (idx !== -1) hero.inventory.splice(idx, 1);
    SaveSystem.save(hero);
    this._hideItemPopup();
    this._renderGrid();
    this.refreshQuickBar();
  },

  // ── Craft genérico baseado em CRAFT_RECIPES ──────────────────
  _confirmCraft() {
    const hero = this._getHero();
    if (!hero || !this._selected) return;
    const recipe = CRAFT_RECIPES.find(r => r.ingredient === this._selected.item.id);
    if (!recipe) return;

    const ingItem    = Items.get(recipe.ingredient);
    const resultItem = Items.get(recipe.result);
    const TAX_RATE   = 0.10;
    const totalValue = (ingItem?.value ?? 0) * recipe.qty;
    const fee        = Math.ceil(totalValue * TAX_RATE);
    const pct        = Math.round(recipe.successChance * 100);

    document.getElementById('vw-title').textContent   = '⚗️ Confirmar Craft';
    document.getElementById('vw-confirm').textContent = 'Confirmar Craft';
    document.getElementById('vw-msg').innerHTML =
      `Chance de sucesso: <strong>${pct}%</strong><br>` +
      `Receita: ${recipe.qty}x ${ingItem?.name} → <strong>${resultItem?.name}</strong><br>` +
      `Valor dos materiais: <strong>${totalValue}g</strong>`;
    document.getElementById('vw-fee').textContent =
      fee > 0
        ? `Taxa de serviço: ${fee}g (seu gold atual: ${hero.gold ?? 0}g)`
        : 'Craft gratuito!';

    const confirmBtn = document.getElementById('vw-confirm');
    confirmBtn.onclick = () => {
      if (fee > 0 && (hero.gold ?? 0) < fee) {
        document.getElementById('vw-fee').textContent = `Gold insuficiente! Você precisa de ${fee}g.`;
        return;
      }
      hero.gold = (hero.gold ?? 0) - fee;
      this._executeCraft(recipe);
      this._closeWithdrawPopup();
      Hud.updateHeroStats(hero);
    };

    document.getElementById('vault-withdraw-overlay').classList.remove('hidden');
  },

  _executeCraft(recipe) {
    const hero = this._getHero();
    if (!hero) return;
    const available = hero.inventory.filter(i => i.id === recipe.ingredient);
    if (available.length < recipe.qty) return;
    for (let i = 0; i < recipe.qty; i++) {
      const idx = hero.inventory.findIndex(it => it.id === recipe.ingredient);
      hero.inventory.splice(idx, 1);
    }
    const ingItem    = Items.get(recipe.ingredient);
    const resultItem = Items.get(recipe.result);
    if (Math.random() < recipe.successChance) {
      hero.inventory.push({ ...resultItem });
      Hud.logEvent(`Craft: ${recipe.qty}x ${ingItem?.name} → ${resultItem?.name}`, 'info');
    } else {
      Hud.logEvent(`Craft falhou! Os materiais foram consumidos.`, 'damage');
    }
    SaveSystem.save(hero);
    this._hideItemPopup();
    this._renderGrid();
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
