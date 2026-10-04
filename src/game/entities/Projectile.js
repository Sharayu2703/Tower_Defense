export class Projectile {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.target = null;
    this.damage = 0;
    this.speed = 520;
    this.radius = 4;
    this.alive = false;
    this.kind = "basic";
  }

  reset(x, y, target, damage, kind = "basic") {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.kind = kind;
    this.alive = true;
    this.speed = kind === "cannon" ? 420 : kind === "rapid" ? 650 : 520;
    this.radius = kind === "cannon" ? 6 : 4;
    return this;
  }

  update(deltaTime) {
    if (!this.alive || !this.target || !this.target.alive) {
      this.alive = false;
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.hypot(dx, dy);
    const moveDistance = this.speed * deltaTime;

    if (distance <= moveDistance || distance < 0.001) {
      this.x = this.target.x;
      this.y = this.target.y;
      this.target.takeDamage(this.damage);
      this.alive = false;
      return;
    }

    this.x += (dx / distance) * moveDistance;
    this.y += (dy / distance) * moveDistance;
  }
}
