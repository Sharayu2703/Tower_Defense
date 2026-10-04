import { GAME_CONFIG } from "../config/gameConfig";
import { GAME_PATH } from "../config/path";

export function renderGame(context, state, selectedTower) {
  const width = GAME_CONFIG.canvas.width;

  const height = GAME_CONFIG.canvas.height;

  context.clearRect(0, 0, width, height);

  drawBackground(context, width, height);

  drawGrid(context, width, height);

  drawPath(context);

  drawBase(context);

  drawTowers(context, state.towers, selectedTower);

  drawEnemies(context, state.enemies);

  drawProjectiles(context, state.projectiles);

  if (state.isPaused && !state.isStressTest) {
    drawOverlay(context, width, height, "PAUSED");
  }

  if (state.isGameOver) {
    drawOverlay(context, width, height, "GAME OVER");
  }

  if (state.isVictory) {
    drawOverlay(context, width, height, "VICTORY");
  }
}

function drawBackground(context, width, height) {
  context.fillStyle = "#0b1220";

  context.fillRect(0, 0, width, height);
}

function drawGrid(context, width, height) {
  context.strokeStyle = "rgba(148,163,184,0.06)";

  context.lineWidth = 1;

  const size = 40;

  context.beginPath();

  for (let x = 0; x <= width; x += size) {
    context.moveTo(x, 0);

    context.lineTo(x, height);
  }

  for (let y = 0; y <= height; y += size) {
    context.moveTo(0, y);

    context.lineTo(width, y);
  }

  context.stroke();
}

function drawPath(context) {
  context.lineCap = "round";

  context.lineJoin = "round";

  context.strokeStyle = "#243244";

  context.lineWidth = 70;

  context.beginPath();

  context.moveTo(GAME_PATH[0].x, GAME_PATH[0].y);

  for (let i = 1; i < GAME_PATH.length; i += 1) {
    context.lineTo(GAME_PATH[i].x, GAME_PATH[i].y);
  }

  context.stroke();

  context.strokeStyle = "#334155";

  context.lineWidth = 4;

  context.beginPath();

  context.moveTo(GAME_PATH[0].x, GAME_PATH[0].y);

  for (let i = 1; i < GAME_PATH.length; i += 1) {
    context.lineTo(GAME_PATH[i].x, GAME_PATH[i].y);
  }

  context.stroke();
}

function drawBase(context) {
  const x = GAME_PATH[GAME_PATH.length - 1].x;

  const y = GAME_PATH[GAME_PATH.length - 1].y;

  context.fillStyle = "#16a34a";

  context.beginPath();

  context.arc(x - 25, y, 28, 0, Math.PI * 2);

  context.fill();

  context.fillStyle = "#ffffff";

  context.font = "bold 12px sans-serif";

  context.textAlign = "center";

  context.textBaseline = "middle";

  context.fillText("BASE", x - 25, y);
}

function drawTowers(context, towers, selectedTower) {
  for (let i = 0; i < towers.length; i += 1) {
    const tower = towers[i];

    let color = "#38bdf8";

    if (tower.type === "rapid") {
      color = "#facc15";
    }

    if (tower.type === "cannon") {
      color = "#f97316";
    }

    context.fillStyle = color;

    context.beginPath();

    context.arc(tower.x, tower.y, tower.radius, 0, Math.PI * 2);

    context.fill();

    /*
     * Only draw expensive
     * selection information
     * for selected tower.
     */
    if (tower === selectedTower) {
      context.strokeStyle = "#ffffff";

      context.lineWidth = 2;

      context.beginPath();

      context.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);

      context.stroke();

      context.strokeStyle = "#ffffff";

      context.beginPath();

      context.arc(tower.x, tower.y, tower.radius + 4, 0, Math.PI * 2);

      context.stroke();
    }

    /*
     * Tower level.
     */
    context.fillStyle = "#ffffff";

    context.font = "bold 10px sans-serif";

    context.textAlign = "center";

    context.textBaseline = "middle";

    context.fillText(String(tower.level), tower.x, tower.y);
  }
}

function drawEnemies(context, enemies) {
  /*
   * Viewport culling.
   *
   * Objects outside this
   * rectangle are skipped.
   */
  const minX = -30;
  const maxX = GAME_CONFIG.canvas.width + 30;

  const minY = -30;
  const maxY = GAME_CONFIG.canvas.height + 30;

  /*
   * Normal rendering.
   */
  context.lineWidth = 1;

  for (let i = 0; i < enemies.length; i += 1) {
    const enemy = enemies[i];

    if (!enemy.alive) {
      continue;
    }

    if (enemy.x < minX || enemy.x > maxX || enemy.y < minY || enemy.y > maxY) {
      continue;
    }

    let color = "#ef4444";

    if (enemy.type === "fast") {
      color = "#facc15";
    } else if (enemy.type === "tank") {
      color = "#a855f7";
    } else if (enemy.type === "boss") {
      color = "#f97316";
    }

    context.fillStyle = color;

    context.beginPath();

    context.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);

    context.fill();
  }
}

function drawProjectiles(context, projectiles) {
  const minX = -10;
  const maxX = GAME_CONFIG.canvas.width + 10;

  const minY = -10;
  const maxY = GAME_CONFIG.canvas.height + 10;

  /*
   * Batch all projectile
   * circles into one path.
   */
  context.fillStyle = "#f8fafc";

  context.beginPath();

  for (let i = 0; i < projectiles.length; i += 1) {
    const projectile = projectiles[i];

    if (!projectile.alive) {
      continue;
    }

    if (
      projectile.x < minX ||
      projectile.x > maxX ||
      projectile.y < minY ||
      projectile.y > maxY
    ) {
      continue;
    }

    const radius = projectile.radius || 3;

    context.moveTo(projectile.x + radius, projectile.y);

    context.arc(projectile.x, projectile.y, radius, 0, Math.PI * 2);
  }

  context.fill();
}

function drawOverlay(context, width, height, text) {
  context.fillStyle = "rgba(2,6,23,0.72)";

  context.fillRect(0, 0, width, height);

  context.fillStyle = "#ffffff";

  context.font = "bold 52px sans-serif";

  context.textAlign = "center";

  context.textBaseline = "middle";

  context.fillText(text, width / 2, height / 2);
}
