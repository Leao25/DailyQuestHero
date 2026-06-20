// ============================================================
// combat.js — Orquestra o combate automático entre Hero e Mob.
// Não desenha nada; só resolve regras e dispara callbacks de evento.
// ============================================================

const Combat = {

  /**
   * Processa um "tick" de combate entre o hero e um mob específico.
   * Retorna um objeto com os eventos ocorridos neste tick, para a
   * camada de jogo decidir o que mostrar no log/HUD.
   */
  resolveTick(hero, mob, now, callbacks) {
    if (!mob || mob.state === 'dead' || hero.state === 'dead') return;

    const distance = hero.distanceTo(mob);
    const heroInRange = distance <= hero.attackRange;
    const mobInRange = distance <= mob.attackRange;

    if (heroInRange && hero.canAttack(now)) {
      const damage = hero.performAttack(now);
      mob.takeDamage(damage);
      callbacks.onHeroAttack(mob, damage);

      if (mob.state === 'dead') {
        this.handleMobDeath(hero, mob, callbacks);
      }
    }

    if (mobInRange && mob.state !== 'dead' && mob.canAttack(now)) {
      const damage = mob.performAttack(now);
      hero.takeDamage(damage);
      callbacks.onMobAttack(mob, damage);

      if (hero.state === 'dead') {
        callbacks.onHeroDeath();
      }
    }
  },

  handleMobDeath(hero, mob, callbacks) {
    const leveledUp = hero.gainXp(mob.xpReward);
    const drops = Items.rollDrops();

    if (drops.length > 0) {
      hero.addItems(drops);
    }

    mob.markedForRemoval = true;

    callbacks.onMobDeath(mob, drops, leveledUp);
  }
};
