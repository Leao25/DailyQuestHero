// ============================================================
// bag.js — UI da mochila: inventário, equipamento, detalhes
// ============================================================

const Bag = {
  _hero:     null,
  _open:     false,
  _selected: null, // { item, index }

  init(getHero) {
    this._getHero = getHero;

    document.getElementById('bag-btn').addEventListener('click',  () => this.toggle());
    document.getElementById('bag-close').addEventListener('click', () => this.close());
    document.getElementById('detail-equip').addEventListener('click',   () => this._equip());
    document.getElementById('detail-unequip').addEventListener('click', () => this._unequip());

    // slots de equipamento — clique mostra o item equipado
    document.querySelectorAll('.equip-slot').forEach(el => {
      el.addEventListener('click', () => {
        const slot = el.dataset.slot;
        const hero = this._getHero();
        if (!hero) return;
        const item = hero.equipment?.[slot];
        if (item) this._showDetail(item, null);
      });
    });

    // tecla B abre/fecha
    document.addEventListener('keydown', e => {
      if (e.key === 'b' || e.key === 'B') this.toggle();
    });
  },

  toggle() { this._open ? this.close() : this.open(); },

  open() {
    this._open = true;
    document.getElementById('bag-panel').classList.remove('hidden');
    this.refresh();
  },

  close() {
    this._open = false;
    document.getElementById('bag-panel').classList.add('hidden');
    this._selected = null;
    document.getElementById('item-detail').classList.add('hidden');
  },

  refresh() {
    if (!this._open) return;
    const hero = this._getHero();
    if (!hero) return;
    this._renderEquipSlots(hero);
    this._renderGrid(hero);
  },

  _renderEquipSlots(hero) {
    const eq = hero.equipment ?? {};
    document.querySelectorAll('.equip-slot').forEach(el => {
      const slot = el.dataset.slot;
      const item = eq[slot];
      // limpa
      el.innerHTML = '';
      el.classList.remove('filled');
      if (item) {
        el.textContent = item.icon ?? '?';
        el.classList.add('filled');
        el.style.borderColor = Items.getRarityColor(item.rarity);
      } else {
        // ícone placeholder por slot
        const placeholders = { weapon: '⚔️', armor: '🛡️', accessory: '📿' };
        el.textContent = placeholders[slot] ?? '?';
      }
      const label = document.createElement('span');
      label.className = 'slot-name';
      label.textContent = slot === 'weapon' ? 'arma' : slot === 'armor' ? 'arm.' : 'aces.';
      el.appendChild(label);
    });
  },

  _renderGrid(hero) {
    const grid = document.getElementById('bag-grid');
    grid.innerHTML = '';

    if (!hero.inventory || hero.inventory.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'grid-column:1/-1;color:#555;font-size:11px;text-align:center;padding:20px 0;';
      empty.textContent = 'Mochila vazia';
      grid.appendChild(empty);
      return;
    }

    // agrupa itens empilháveis (materiais e consumíveis) por ID
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
      slot.dataset.index  = idx;
      slot.textContent    = item.icon ?? '?';
      slot.title          = item.name;

      if (qty > 1) {
        const badge = document.createElement('span');
        badge.className   = 'item-qty';
        badge.textContent = qty;
        slot.appendChild(badge);
      }

      if (this._selected?.index === idx) slot.classList.add('selected');

      slot.addEventListener('click', () => {
        this._selected = { item, index: idx };
        this._renderGrid(hero); // re-render para atualizar seleção
        this._showDetail(item, hero);
      });

      grid.appendChild(slot);
    });
  },

  _showDetail(item, hero) {
    const el = document.getElementById('item-detail');
    el.classList.remove('hidden');

    document.getElementById('detail-name').textContent  = item.name;
    document.getElementById('detail-name').style.color  = Items.getRarityColor(item.rarity);
    document.getElementById('detail-desc').textContent  = item.desc ?? '';

    // bônus
    const bonusEl = document.getElementById('detail-bonus');
    if (item.bonus) {
      const parts = [];
      if (item.bonus.attack) parts.push(`+${item.bonus.attack} ATK`);
      if (item.bonus.maxHp)  parts.push(`+${item.bonus.maxHp} HP`);
      bonusEl.textContent = parts.join('  ');
    } else if (item.effect) {
      bonusEl.textContent = item.effect.type === 'heal'
        ? `Cura ${item.effect.amount} HP`
        : `+${item.effect.amount} ATK por ${item.effect.duration/1000}s`;
    } else {
      bonusEl.textContent = '';
    }

    document.getElementById('detail-value').textContent = `Valor: ${item.value ?? 0} ouro`;

    // botões equip/unequip
    const equipBtn   = document.getElementById('detail-equip');
    const unequipBtn = document.getElementById('detail-unequip');
    equipBtn.classList.add('hidden');
    unequipBtn.classList.add('hidden');

    if (!hero) return;
    const eq = hero.equipment ?? {};

    const isEquipable = ['weapon','armor','accessory'].includes(item.type);
    const isEquipped  = item.slot && eq[item.slot]?.id === item.id;

    if (isEquipable && isEquipped) {
      unequipBtn.classList.remove('hidden');
    } else if (isEquipable) {
      equipBtn.classList.remove('hidden');
    }
  },

  _equip() {
    const hero = this._getHero();
    if (!hero || !this._selected) return;
    const { item } = this._selected;
    if (!item.slot) return;

    // desequipa o atual nesse slot, se houver
    const eq = hero.equipment ?? {};
    if (eq[item.slot]) Items.removeBonus(hero, eq[item.slot]);

    // equipa o novo
    if (!hero.equipment) hero.equipment = {};
    hero.equipment[item.slot] = item;
    Items.applyBonus(hero, item);

    // remove do inventário (1 unidade)
    const idx = hero.inventory.findIndex(i => i.id === item.id);
    if (idx !== -1) hero.inventory.splice(idx, 1);

    SaveSystem.save(hero);
    Hud.updateHeroStats(hero);
    this._selected = null;
    document.getElementById('item-detail').classList.add('hidden');
    this.refresh();
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
    document.getElementById('item-detail').classList.add('hidden');
    this.refresh();
  },
};
