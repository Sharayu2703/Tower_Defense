export class SpatialGrid {
  constructor(width, height, cellSize) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.buckets = Array.from({ length: this.cols * this.rows }, () => []);
  }

  clear() {
    for (const bucket of this.buckets) bucket.length = 0;
  }

  indexFor(x, y) {
    const col = Math.max(0, Math.min(this.cols - 1, Math.floor(x / this.cellSize)));
    const row = Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.cellSize)));
    return row * this.cols + col;
  }

  insert(entity) {
    this.buckets[this.indexFor(entity.x, entity.y)].push(entity);
  }

  findClosest(x, y, range) {
    const minCol = Math.max(0, Math.floor((x - range) / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((x + range) / this.cellSize));
    const minRow = Math.max(0, Math.floor((y - range) / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((y + range) / this.cellSize));

    const rangeSq = range * range;
    let closest = null;
    let closestSq = rangeSq;

    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        const bucket = this.buckets[row * this.cols + col];
        for (const enemy of bucket) {
          if (!enemy.alive) continue;
          const dx = enemy.x - x;
          const dy = enemy.y - y;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq <= closestSq) {
            closestSq = distanceSq;
            closest = enemy;
          }
        }
      }
    }

    return closest;
  }
}
