import { GAME_CONFIG } from "../config/gameConfig";

export class Tower {
  constructor(x, y, type = "basic") {
    this.x = x;
    this.y = y;
    this.type = type;
    this.level = 1;
    this.cooldown = 0;
    this.target = null;
    this.radius = 18;
    this.totalInvested = 0;
    this.applyTypeStats();
  }

  applyTypeStats() {
    const stats = GAME_CONFIG.towers[this.type] || GAME_CONFIG.towers.basic;
    this.baseCost = stats.cost;
    this.range = stats.range;
    this.damage = stats.damage;
    this.fireRate = stats.fireRate;
    this.color = stats.color;
    this.totalInvested = stats.cost;
  }

  update(deltaTime, spatialGrid, spawnProjectile) {
    this.cooldown -= deltaTime;

    if (
      !this.target ||
      !this.target.alive ||
      this.distanceTo(this.target) > this.range
    ) {
      this.target = spatialGrid.findClosest(this.x, this.y, this.range);
    }

    if (this.target && this.cooldown <= 0) {
      spawnProjectile(this.x, this.y, this.target, this.damage, this.type);
      this.cooldown += 1 / this.fireRate;
    }
  }

  distanceTo(enemy) {
    return Math.hypot(enemy.x - this.x, enemy.y - this.y);
  }

  getUpgradeCost() {
    if (this.level >= 5) return null;
    return Math.round(this.baseCost * (0.75 + this.level * 0.5));
  }

  upgrade() {
    const cost = this.getUpgradeCost();
    if (cost === null) return false;

    this.level += 1;
    this.damage = Math.round(this.damage * 1.35);
    this.range = Math.round(this.range * 1.08);
    this.fireRate *= 1.12;
    this.totalInvested += cost;
    this.target = null;
    return true;
  }

  getSellValue() {
    return Math.floor(this.totalInvested * 0.7);
  }
}
