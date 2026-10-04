import { GAME_CONFIG } from "../config/gameConfig";

export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.health = GAME_CONFIG.player.startingHealth;
    this.gold = GAME_CONFIG.player.startingGold;
    this.score = GAME_CONFIG.player.startingScore;
    this.wave = GAME_CONFIG.game.startingWave;

    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.isStressTest = false;
    this.stressMode = "optimized";

    this.gameSpeed = GAME_CONFIG.game.defaultSpeed;

    this.enemies = [];
    this.towers = [];
    this.projectiles = [];

    this.fps = 0;
    this.frameTime = 0;
    this.avgFrameTime = 0;
    this.p95FrameTime = 0;
    this.framesMeasured = 0;
    this.framesAtLeast45FPS = 0;
    this.slowFramePercent = 0;

    this.spawnTimer = 0;
    this.enemiesSpawned = 0;
    this.enemiesDefeated = 0;
    this.waveCompleteTimer = 0;
    this.waveStarting = true;
    this.waveStartTimer = GAME_CONFIG.game.waveStartDelay;
  }
}
