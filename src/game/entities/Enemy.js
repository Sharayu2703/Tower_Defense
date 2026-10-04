export class Enemy {
  constructor() {
    this.path = null;
    this.type = "normal";
    this.pathIndex = 0;
    this.x = 0;
    this.y = 0;
    this.speed = 0;
    this.maxHealth = 1;
    this.health = 1;
    this.reward = 0;
    this.radius = 12;
    this.alive = false;
    this.reachedBase = false;
  }

  reset(path, config) {
    this.path = path;
    this.type = config.type || "normal";
    this.pathIndex = 0;
    this.x = path[0].x;
    this.y = path[0].y;
    this.speed = config.baseSpeed;
    this.maxHealth = config.baseHealth;
    this.health = this.maxHealth;
    this.reward = config.reward;
    this.radius = config.radius || 12;
    this.alive = true;
    this.reachedBase = false;
    return this;
  }

  update(deltaTime) {
    if (!this.alive || this.reachedBase) return;

    let remaining = this.speed * deltaTime;

    while (remaining > 0) {
      const target = this.path[this.pathIndex + 1];

      if (!target) {
        this.reachedBase = true;
        return;
      }

      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= remaining) {
        this.x = target.x;
        this.y = target.y;
        this.pathIndex += 1;
        remaining -= distance;
      } else {
        this.x += (dx / distance) * remaining;
        this.y += (dy / distance) * remaining;
        remaining = 0;
      }
    }
  }

  takeDamage(amount) {
    if (!this.alive) return false;

    this.health -= amount;

    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      return true;
    }

    return false;
  }
}
