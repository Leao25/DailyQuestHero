// ============================================================
// combat.js — Orquestra o combate automático entre Hero e Mob.
// Não desenha nada; só resolve regras e dispara callbacks de evento.
// ============================================================

const Combat = {

  resolveTick(hero, mob, now, callbacks) {
    if (!mob || mob.state === 'dead' || hero.state === 'dead') return;

    const distance    = hero.distanceTo(mob);
    const heroInRange = distance <= hero.attackRange;
    const mobInRange  = distance <= mob.attackRange;

    // ── Herói ataca mob ──────────────────────────────────────
    if (heroInRange && hero.canAttack(now)) {
      let isCrit = Math.random() < hero.critChance;

      let damage = hero.performAttack(now);
      if (isCrit) damage = Math.round(damage * hero.critMultiplier);

      mob.takeDamage(damage);
      callbacks.onHeroAttack(mob, damage, isCrit);

      // Mage "Colheita": crit cura 10% do maxHP
      if (isCrit && hero.heroClass === 'mage') {
        const heal = Math.round(hero.maxHp * 0.10);
        hero.hp = Math.min(hero.maxHp, hero.hp + heal);
        callbacks.onPassiveTrigger?.('mage', heal);
      }

      if (mob.state === 'dead') {
        this.handleMobDeath(hero, mob, callbacks);
      }
    }

    // ── Mob ataca herói ──────────────────────────────────────
    if (mobInRange && mob.state !== 'dead' && mob.canAttack(now)) {
      const rawDamage = mob.performAttack(now);

      // Esquiva (SPD): evita o dano completamente
      const dodgeRoll = Math.random();
      if (dodgeRoll < hero.dodgeChance) {
        hero.triggerDodge();
        callbacks.onDodge?.(hero);
        return;
      }

      // Bloqueio (DEF): reduz o dano pela metade
      const blockRoll = Math.random();
      if (blockRoll < hero.blockChance) {
        const blocked = Math.max(1, Math.floor(rawDamage * 0.5));
        hero.triggerBlock();
        hero.takeDamage(blocked);
        callbacks.onBlock?.(hero, blocked);
        if (hero.state === 'dead') callbacks.onHeroDeath();
        return;
      }

      // Dano normal
      hero.takeDamage(rawDamage);
      callbacks.onMobAttack(mob, rawDamage);
      if (hero.state === 'dead') callbacks.onHeroDeath();
    }
  },

  handleMobDeath(hero, mob, callbacks) {
    const leveledUp = hero.gainXp(mob.xpReward);
    const goldEarned = mob.goldReward ?? 0;
    hero.gold += goldEarned;
    // const drops = Items.rollDrops(mob.type?.key ?? 'goblin');
    // if (drops.length > 0) hero.addItems(drops);
    const drops = [];
    mob.markedForRemoval = true;

    // Hunter "Foco": cada kill +1 stack; a 10/10, 50% de flecha bônus
    if (hero.heroClass === 'hunter') {
      hero.passiveStacks = (hero.passiveStacks ?? 0) + 1;
      if (hero.passiveStacks >= 10) {
        if (Math.random() < 0.5) callbacks.onPassiveTrigger?.('hunter', 'bonus_arrow');
        hero.passiveStacks = 0;
      }
    }

    // Warrior "Fúria": cada kill +1 ATK (máx 10)
    if (hero.heroClass === 'warrior' && (hero.passiveStacks ?? 0) < 10) {
      hero.passiveStacks    = (hero.passiveStacks ?? 0) + 1;
      hero.passiveBonusAtk  = (hero.passiveBonusAtk ?? 0) + 1;
      hero.attack           += 1;
      callbacks.onPassiveTrigger?.('warrior', hero.passiveStacks);
    }

    // Cleric "Bênção": cada kill cura 15% do maxHP
    if (hero.heroClass === 'cleric') {
      const heal = Math.round(hero.maxHp * 0.15);
      hero.hp = Math.min(hero.maxHp, hero.hp + heal);
      callbacks.onPassiveTrigger?.('cleric', heal);
    }

    callbacks.onMobDeath(mob, drops, leveledUp, goldEarned);
  },
};
