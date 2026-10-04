import { GAME_CONFIG } from "../config/gameConfig";
import { GAME_PATH } from "../config/path";
import { GameState } from "./GameState";
import { SpatialGrid } from "./SpatialGrid";
import { Enemy } from "../entities/Enemy";
import { Projectile } from "../entities/Projectile";
import { Tower } from "../entities/Tower";
import { renderGame } from "../rendering/renderer";

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;

    this.context = canvas.getContext("2d", {
      alpha: false,
    });

    this.canvas.width = GAME_CONFIG.canvas.width;

    this.canvas.height = GAME_CONFIG.canvas.height;

    this.state = new GameState();

    this.enemyPool = [];
    this.projectilePool = [];

    this.spatialGrid = new SpatialGrid(
      GAME_CONFIG.canvas.width,
      GAME_CONFIG.canvas.height,
      GAME_CONFIG.spatialGrid.cellSize,
    );

    this.selectedTowerType = "basic";
    this.selectedTower = null;
    this.stressMode = "optimized";

    this.animationFrameId = null;

    /*
     * Timestamp of previous RAF callback.
     */
    this.lastTime = 0;

    /*
     * Timestamp used for actual
     * frame-rate measurement.
     */
    this.lastFrameTimestamp = 0;

    this.metricFrames = new Float64Array(GAME_CONFIG.performance.metricWindow);
    this.metricCount = 0;
    this.metricCursor = 0;
    this.metricSum = 0;
    this.goodFrameCount = 0;
    this.slowFrameCount = 0;
    this.metricSortScratch = [];
    this.metricRefreshCounter = 0;

    this.handleCanvasClick = this.handleCanvasClick.bind(this);

    this.canvas.addEventListener("click", this.handleCanvasClick);
  }

  start() {
    this.state.isRunning = true;

    const now = performance.now();

    this.lastTime = now;
    this.lastFrameTimestamp = now;

    this.animationFrameId = requestAnimationFrame((time) =>
      this.gameLoop(time),
    );
  }

  gameLoop(currentTime) {
    if (!this.state.isRunning) {
      return;
    }

    /*
     * Simulation delta.
     *
     * This is affected by game speed,
     * but performance metrics are NOT.
     */
    let deltaTime = (currentTime - this.lastTime) / 1000;

    this.lastTime = currentTime;

    deltaTime = Math.min(deltaTime, 0.1);

    /*
     * ACTUAL browser frame interval.
     *
     * This is the important performance
     * measurement for the assignment.
     */
    let frameInterval = currentTime - this.lastFrameTimestamp;

    this.lastFrameTimestamp = currentTime;

    /*
     * Ignore impossible/initial values.
     */
    if (frameInterval <= 0 || frameInterval > 1000) {
      frameInterval = 0;
    }

    if (
      !this.state.isPaused &&
      !this.state.isGameOver &&
      !this.state.isVictory
    ) {
      this.update(deltaTime * this.state.gameSpeed);
    }

    renderGame(this.context, this.state, this.selectedTower);

    this.recordFrameMetrics(frameInterval);

    this.animationFrameId = requestAnimationFrame((time) =>
      this.gameLoop(time),
    );
  }

  recordFrameMetrics(frameInterval) {
    if (frameInterval <= 0) {
      return;
    }

    const metrics = this.state;
    const maxSamples = GAME_CONFIG.performance.metricWindow;
    const goodThreshold = 1000 / GAME_CONFIG.performance.minimumFPS;

    metrics.frameTime = frameInterval;
    metrics.fps = Math.round(1000 / frameInterval);

    if (this.metricCount < maxSamples) {
      this.metricFrames[this.metricCursor] = frameInterval;
      this.metricCount += 1;
      this.metricSum += frameInterval;
      if (frameInterval <= goodThreshold) this.goodFrameCount += 1;
      if (frameInterval > GAME_CONFIG.performance.maxFrameTimeMs) this.slowFrameCount += 1;
    } else {
      const old = this.metricFrames[this.metricCursor];
      this.metricSum -= old;
      if (old <= goodThreshold) this.goodFrameCount -= 1;
      if (old > GAME_CONFIG.performance.maxFrameTimeMs) this.slowFrameCount -= 1;

      this.metricFrames[this.metricCursor] = frameInterval;
      this.metricSum += frameInterval;
      if (frameInterval <= goodThreshold) this.goodFrameCount += 1;
      if (frameInterval > GAME_CONFIG.performance.maxFrameTimeMs) this.slowFrameCount += 1;
    }

    this.metricCursor = (this.metricCursor + 1) % maxSamples;
    metrics.framesMeasured = this.metricCount;
    metrics.avgFrameTime = this.metricCount ? this.metricSum / this.metricCount : 0;
    metrics.framesAtLeast45FPS = this.metricCount
      ? (this.goodFrameCount / this.metricCount) * 100
      : 0;
    metrics.slowFramePercent = this.metricCount
      ? (this.slowFrameCount / this.metricCount) * 100
      : 0;

    // P95 is refreshed periodically instead of allocating/sorting every frame.
    this.metricRefreshCounter += 1;
    if (this.metricRefreshCounter >= 30 || this.metricCount === 1) {
      this.metricRefreshCounter = 0;
      this.metricSortScratch.length = this.metricCount;
      for (let i = 0; i < this.metricCount; i += 1) {
        this.metricSortScratch[i] = this.metricFrames[i];
      }
      this.metricSortScratch.sort((a, b) => a - b);
      const p95Index = Math.max(0, Math.ceil(this.metricCount * 0.95) - 1);
      metrics.p95FrameTime = this.metricSortScratch[p95Index] || 0;
    }
  }

  update(deltaTime) {
    /*
     * Stress mode is deliberately
     * isolated from normal gameplay.
     *
     * This guarantees fixed benchmark
     * population:
     *
     * 5000 enemies
     * 100 towers
     * 1000 projectiles
     */
    if (this.state.isStressTest) {
      this.updateStressWorld(deltaTime);

      return;
    }

    /*
     * Normal game.
     */
    this.updateWave(deltaTime);

    this.updateEnemies(deltaTime);

    /*
     * Rebuild the spatial grid after movement so tower
     * queries use the current enemy positions.
     */
    this.spatialGrid.clear();

    for (let i = 0; i < this.state.enemies.length; i += 1) {
      const enemy = this.state.enemies[i];

      if (enemy.alive) {
        this.spatialGrid.insert(enemy);
      }
    }

    this.updateTowers(deltaTime);

    this.updateProjectiles(deltaTime);

    this.removeFinishedEntities();

    this.checkWaveComplete(deltaTime);
  }

  updateWave(deltaTime) {
    if (this.state.waveStarting) {
      this.state.waveStartTimer -= deltaTime;

      if (this.state.waveStartTimer <= 0) {
        this.state.waveStarting = false;

        this.state.spawnTimer = 0;
      }

      return;
    }

    const totalEnemies =
      GAME_CONFIG.enemy.startingCount +
      (this.state.wave - 1) * GAME_CONFIG.enemy.countIncreasePerWave;

    if (this.state.enemiesSpawned >= totalEnemies) {
      return;
    }

    this.state.spawnTimer -= deltaTime;

    if (this.state.spawnTimer > 0) {
      return;
    }

    const enemy = this.acquireEnemy();

    enemy.reset(
      GAME_PATH,
      this.getEnemyConfig(this.state.wave, this.state.enemiesSpawned),
    );

    this.state.enemies.push(enemy);

    this.state.enemiesSpawned += 1;

    this.state.spawnTimer = GAME_CONFIG.enemy.spawnInterval;
  }

  getEnemyConfig(wave, spawnNumber) {
    const baseHealth =
      GAME_CONFIG.enemy.baseHealth +
      (wave - 1) * GAME_CONFIG.enemy.healthIncreasePerWave;

    const baseSpeed =
      GAME_CONFIG.enemy.baseSpeed +
      (wave - 1) * GAME_CONFIG.enemy.speedIncreasePerWave;

    const baseReward =
      GAME_CONFIG.enemy.reward +
      (wave - 1) * GAME_CONFIG.enemy.rewardIncreasePerWave;

    /*
     * Boss.
     */
    if (wave % 5 === 0 && spawnNumber === 0) {
      return {
        type: "boss",
        baseHealth: baseHealth * 8,
        baseSpeed: baseSpeed * 0.4,
        reward: baseReward * 8,
        radius: 24,
      };
    }

    /*
     * Tank.
     */
    if (wave >= 3 && spawnNumber % 5 === 0) {
      return {
        type: "tank",
        baseHealth: baseHealth * 3,
        baseSpeed: baseSpeed * 0.55,
        reward: baseReward * 2.5,
        radius: 17,
      };
    }

    /*
     * Fast.
     */
    if (wave >= 2 && spawnNumber % 3 === 0) {
      return {
        type: "fast",
        baseHealth: baseHealth * 0.6,
        baseSpeed: baseSpeed * 1.8,
        reward: baseReward * 1.5,
        radius: 10,
      };
    }

    /*
     * Normal.
     */
    return {
      type: "normal",
      baseHealth,
      baseSpeed,
      reward: baseReward,
      radius: 12,
    };
  }

  updateStressWorld(deltaTime) {
    const enemies = this.state.enemies;

    const towers = this.state.towers;

    const projectiles = this.state.projectiles;

    /*
     * ------------------------------------------------
     * 1. Update 5000 enemy positions
     * ------------------------------------------------
     *
     * They move continuously but are never killed
     * during benchmark mode.
     */
    for (let i = 0; i < enemies.length; i += 1) {
      const enemy = enemies[i];

      const phase = i * 0.017;

      enemy.x += Math.cos(phase + enemy.y * 0.01) * 5 * deltaTime;

      enemy.y += Math.sin(phase + enemy.x * 0.008) * 5 * deltaTime;

      /*
       * Wrap around the canvas.
       */
      if (enemy.x > 1290) {
        enemy.x = -10;
      } else if (enemy.x < -10) {
        enemy.x = 1290;
      }

      if (enemy.y > 730) {
        enemy.y = -10;
      } else if (enemy.y < -10) {
        enemy.y = 730;
      }

      enemy.alive = true;
    }

    /*
     * ------------------------------------------------
     * 2. Rebuild spatial grid
     * ------------------------------------------------
     *
     * This is intentionally part of the stress test.
     */
    this.spatialGrid.clear();

    for (let i = 0; i < enemies.length; i += 1) {
      this.spatialGrid.insert(enemies[i]);
    }

    /*
     * ------------------------------------------------
     * 3. Run target queries for 100 towers
     * ------------------------------------------------
     *
     * Baseline deliberately scans all 5,000 enemies
     * for every tower. Optimized mode uses the spatial
     * grid to visit only nearby buckets.
     */
    for (let i = 0; i < towers.length; i += 1) {
      const tower = towers[i];

      if (
        !tower.target ||
        !tower.target.alive ||
        tower.distanceTo(tower.target) > tower.range
      ) {
        tower.target = this.stressMode === "baseline"
          ? this.findClosestLinear(tower.x, tower.y, tower.range, enemies)
          : this.spatialGrid.findClosest(tower.x, tower.y, tower.range);
      }
    }

    /*
     * ------------------------------------------------
     * 4. Move exactly 1000 projectiles
     * ------------------------------------------------
     *
     * They wrap instead of dying.
     */
    for (let i = 0; i < projectiles.length; i += 1) {
      const projectile = projectiles[i];

      projectile.x += projectile.speed * deltaTime * 0.35;

      if (projectile.x > 1290) {
        projectile.x = -10;
      }

      if (projectile.x < -10) {
        projectile.x = 1290;
      }

      projectile.y += Math.sin(i * 0.05 + projectile.x * 0.01) * deltaTime * 20;

      if (projectile.y > 730) {
        projectile.y = -10;
      }

      if (projectile.y < -10) {
        projectile.y = 730;
      }

      projectile.alive = true;

      /*
       * Keep a valid target reference.
       */
      projectile.target = enemies[i % enemies.length];
    }

    /*
     * Important:
     *
     * Do NOT call:
     *
     * updateEnemies()
     * updateTowers()
     * updateProjectiles()
     * removeFinishedEntities()
     *
     * here.
     *
     * Those normal-game systems would destroy
     * the fixed stress population.
     */
  }

  updateEnemies(deltaTime) {
    for (let i = 0; i < this.state.enemies.length; i += 1) {
      const enemy = this.state.enemies[i];

      if (!enemy.alive) {
        continue;
      }

      enemy.update(deltaTime);

      if (enemy.reachedBase) {
        enemy.alive = false;

        this.state.health -= GAME_CONFIG.enemy.baseDamage;

        if (this.state.health <= 0) {
          this.state.health = 0;

          this.state.isGameOver = true;

          this.state.isRunning = false;
        }
      }
    }
  }

  updateTowers(deltaTime) {
    for (let i = 0; i < this.state.towers.length; i += 1) {
      const tower = this.state.towers[i];

      tower.update(
        deltaTime,
        this.spatialGrid,
        (x, y, target, damage, type) => {
          const projectile = this.acquireProjectile();

          projectile.reset(x, y, target, damage, type);

          this.state.projectiles.push(projectile);
        },
      );
    }
  }

  updateProjectiles(deltaTime) {
    for (let i = 0; i < this.state.projectiles.length; i += 1) {
      this.state.projectiles[i].update(deltaTime);
    }
  }

  removeFinishedEntities() {
    /*
     * Compact enemy array in-place.
     *
     * This avoids creating a new array
     * every frame.
     */
    let enemyWriteIndex = 0;

    for (let i = 0; i < this.state.enemies.length; i += 1) {
      const enemy = this.state.enemies[i];

      if (enemy.alive) {
        this.state.enemies[enemyWriteIndex] = enemy;

        enemyWriteIndex += 1;

        continue;
      }

      if (enemy.health <= 0) {
        this.state.gold += enemy.reward;

        this.state.score += enemy.reward;

        this.state.enemiesDefeated += 1;
      }

      this.enemyPool.push(enemy);
    }

    this.state.enemies.length = enemyWriteIndex;

    /*
     * Compact projectile array
     * in-place.
     */
    let projectileWriteIndex = 0;

    for (let i = 0; i < this.state.projectiles.length; i += 1) {
      const projectile = this.state.projectiles[i];

      if (projectile.alive) {
        this.state.projectiles[projectileWriteIndex] = projectile;

        projectileWriteIndex += 1;

        continue;
      }

      projectile.target = null;

      this.projectilePool.push(projectile);
    }

    this.state.projectiles.length = projectileWriteIndex;
  }

  checkWaveComplete(deltaTime) {
    const totalEnemies =
      GAME_CONFIG.enemy.startingCount +
      (this.state.wave - 1) * GAME_CONFIG.enemy.countIncreasePerWave;

    const spawningFinished = this.state.enemiesSpawned >= totalEnemies;

    if (!spawningFinished || this.state.enemies.length > 0) {
      this.state.waveCompleteTimer = 0;

      return;
    }

    this.state.waveCompleteTimer += deltaTime;

    if (this.state.waveCompleteTimer < GAME_CONFIG.game.waveClearDelay) {
      return;
    }

    this.state.waveCompleteTimer = 0;

    if (this.state.wave >= GAME_CONFIG.game.maxWaves) {
      this.state.isVictory = true;

      this.state.isRunning = false;

      return;
    }

    this.state.wave += 1;

    this.state.waveStarting = true;

    this.state.waveStartTimer = GAME_CONFIG.game.waveStartDelay;

    this.state.enemiesSpawned = 0;

    this.state.spawnTimer = 0;
  }

  findClosestLinear(x, y, range, enemies) {
    const rangeSq = range * range;
    let closest = null;
    let closestSq = rangeSq;

    for (let i = 0; i < enemies.length; i += 1) {
      const enemy = enemies[i];
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq <= closestSq) {
        closestSq = distanceSq;
        closest = enemy;
      }
    }

    return closest;
  }

  acquireEnemy() {
    return this.enemyPool.pop() || new Enemy();
  }

  acquireProjectile() {
    return this.projectilePool.pop() || new Projectile();
  }

  handleCanvasClick(event) {
    /*
     * Stress benchmark is not interactive.
     */
    if (this.state.isStressTest) {
      return;
    }

    if (this.state.isPaused || this.state.isGameOver || this.state.isVictory) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();

    const scaleX = this.canvas.width / rect.width;

    const scaleY = this.canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;

    const y = (event.clientY - rect.top) * scaleY;

    const clickedTower = this.findTowerAt(x, y);

    if (clickedTower) {
      this.selectedTower = clickedTower;

      return;
    }

    /*
     * Clicking empty canvas clears
     * selection and attempts placement.
     */
    this.selectedTower = null;

    this.placeTower(x, y);
  }

  findTowerAt(x, y) {
    for (let i = this.state.towers.length - 1; i >= 0; i -= 1) {
      const tower = this.state.towers[i];

      if (Math.hypot(tower.x - x, tower.y - y) <= tower.radius + 10) {
        return tower;
      }
    }

    return null;
  }

  placeTower(x, y) {
    if (this.isOnPath(x, y) || this.isTooCloseToTower(x, y)) {
      return false;
    }

    const cost = this.getTowerCost(this.selectedTowerType);

    if (this.state.gold < cost) {
      return false;
    }

    this.state.towers.push(new Tower(x, y, this.selectedTowerType));

    this.state.gold -= cost;

    return true;
  }

  isOnPath(x, y) {
    const pathWidth = 48;

    for (let i = 0; i < GAME_PATH.length - 1; i += 1) {
      const a = GAME_PATH[i];

      const b = GAME_PATH[i + 1];

      if (this.distanceToSegment(x, y, a.x, a.y, b.x, b.y) < pathWidth) {
        return true;
      }
    }

    return false;
  }

  distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;

    const dy = y2 - y1;

    if (dx === 0 && dy === 0) {
      return Math.hypot(px - x1, py - y1);
    }

    const t = Math.max(
      0,
      Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)),
    );

    const closestX = x1 + t * dx;

    const closestY = y1 + t * dy;

    return Math.hypot(px - closestX, py - closestY);
  }

  isTooCloseToTower(x, y) {
    for (let i = 0; i < this.state.towers.length; i += 1) {
      const tower = this.state.towers[i];

      if (Math.hypot(tower.x - x, tower.y - y) < 45) {
        return true;
      }
    }

    return false;
  }

  getTowerCost(type) {
    return GAME_CONFIG.towers[type]?.cost || GAME_CONFIG.towers.basic.cost;
  }

  setTowerType(type) {
    if (!GAME_CONFIG.towers[type]) {
      return;
    }

    this.selectedTowerType = type;

    this.selectedTower = null;
  }

  upgradeSelectedTower() {
    const tower = this.selectedTower;

    if (!tower) {
      return false;
    }

    const cost = tower.getUpgradeCost();

    if (cost === null || this.state.gold < cost) {
      return false;
    }

    this.state.gold -= cost;

    tower.upgrade();

    return true;
  }

  sellSelectedTower() {
    const tower = this.selectedTower;

    if (!tower) {
      return false;
    }

    const index = this.state.towers.indexOf(tower);

    if (index < 0) {
      return false;
    }

    this.state.gold += tower.getSellValue();

    this.state.towers.splice(index, 1);

    this.selectedTower = null;

    return true;
  }

  getSelectedTowerInfo() {
    const tower = this.selectedTower;

    if (!tower) {
      return null;
    }

    return {
      type: tower.type,

      level: tower.level,

      damage: tower.damage,

      range: tower.range,

      fireRate: tower.fireRate,

      upgradeCost: tower.getUpgradeCost(),

      sellValue: tower.getSellValue(),
    };
  }

  startStressTest(mode = "optimized") {
    /*
     * Reset normal game state.
     */
    this.state.reset();

    this.state.isRunning = true;

    this.state.isStressTest = true;
    this.stressMode = mode === "baseline" ? "baseline" : "optimized";
    this.state.stressMode = this.stressMode;

    this.state.wave = GAME_CONFIG.game.maxWaves;

    this.state.waveStarting = false;

    this.selectedTower = null;

    this.selectedTowerType = "basic";

    /*
     * Reset performance history.
     */
    this.metricCount = 0;
    this.metricCursor = 0;
    this.metricSum = 0;
    this.goodFrameCount = 0;
    this.slowFrameCount = 0;
    this.metricRefreshCounter = 0;

    /*
     * Clear active entities.
     */
    this.state.towers.length = 0;
    this.state.enemies.length = 0;
    this.state.projectiles.length = 0;

    /*
     * Reset RAF timestamps so
     * the first stress frame isn't
     * measured against an old frame.
     */
    const now = performance.now();

    this.lastTime = now;
    this.lastFrameTimestamp = now;

    /*
     * --------------------------------------------
     * EXACT TARGET 1:
     * 5,000 enemies
     * --------------------------------------------
     */
    const enemyCount = GAME_CONFIG.performance.stressEnemies;

    for (let i = 0; i < enemyCount; i += 1) {
      const enemy = this.acquireEnemy();

      enemy.reset(GAME_PATH, {
        type:
          i % 17 === 0
            ? "boss"
            : i % 5 === 0
              ? "tank"
              : i % 3 === 0
                ? "fast"
                : "normal",

        /*
         * Very high health so benchmark
         * enemies aren't accidentally
         * removed by gameplay damage.
         */
        baseHealth: 1000000,

        baseSpeed: 40 + (i % 20),

        reward: 1,

        radius: 7 + (i % 4),
      });

      /*
       * Deterministic distribution.
       */
      enemy.x = (i * 37) % 1280;

      enemy.y = (i * 83) % 720;

      enemy.alive = true;

      this.state.enemies.push(enemy);
    }

    /*
     * --------------------------------------------
     * EXACT TARGET 2:
     * 100 towers
     * --------------------------------------------
     */
    const towerTypes = ["basic", "rapid", "cannon"];

    const towerCount = GAME_CONFIG.performance.stressTowers;

    for (let i = 0; i < towerCount; i += 1) {
      const tower = new Tower(
        40 + ((i * 113) % 1180),

        35 + ((i * 71) % 650),

        towerTypes[i % towerTypes.length],
      );

      /*
       * Level 5 makes the stress
       * scenario representative of
       * a late-game tower setup.
       */
      tower.level = 5;

      tower.range = 260;

      this.state.towers.push(tower);
    }

    /*
     * --------------------------------------------
     * EXACT TARGET 3:
     * 1,000 projectiles
     * --------------------------------------------
     */
    const projectileCount = GAME_CONFIG.performance.stressProjectiles;

    for (let i = 0; i < projectileCount; i += 1) {
      const projectile = this.acquireProjectile();

      projectile.reset(
        i % 1280,
        (i * 7) % 720,

        this.state.enemies[i % this.state.enemies.length],

        1,

        towerTypes[i % towerTypes.length],
      );

      projectile.alive = true;

      this.state.projectiles.push(projectile);
    }

    /*
     * Defensive exact-count check.
     *
     * These are the numbers the
     * HUD should report.
     */
    this.state.enemies.length = enemyCount;

    this.state.towers.length = towerCount;

    this.state.projectiles.length = projectileCount;
  }

  pause() {
    /*
     * Stress test is intentionally
     * not pausable so its measurement
     * remains continuous.
     */
    if (!this.state.isStressTest) {
      this.state.isPaused = true;
    }
  }

  resume() {
    if (this.state.isGameOver || this.state.isVictory) {
      return;
    }

    this.state.isPaused = false;

    const now = performance.now();

    this.lastTime = now;

    this.lastFrameTimestamp = now;
  }

  restart() {
    this.state.reset();
    this.stressMode = "optimized";

    this.selectedTower = null;

    this.selectedTowerType = "basic";

    this.metricCount = 0;
    this.metricCursor = 0;
    this.metricSum = 0;
    this.goodFrameCount = 0;
    this.slowFrameCount = 0;
    this.metricRefreshCounter = 0;

    const now = performance.now();

    this.lastTime = now;

    this.lastFrameTimestamp = now;

    this.state.isRunning = true;
  }

  setSpeed(speed) {
    if (speed >= 1 && speed <= GAME_CONFIG.game.maxSpeed) {
      this.state.gameSpeed = speed;
    }
  }

  getState() {
    return this.state;
  }

  destroy() {
    this.state.isRunning = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);

      this.animationFrameId = null;
    }

    this.canvas.removeEventListener("click", this.handleCanvasClick);
  }
}
