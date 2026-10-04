export const GAME_CONFIG = {
  canvas: { width: 1280, height: 720 },

  player: {
    startingHealth: 100,
    startingGold: 500,
    startingScore: 0,
  },

  game: {
    startingWave: 1,
    maxWaves: 50,
    defaultSpeed: 1,
    maxSpeed: 3,
    waveStartDelay: 1.5,
    waveClearDelay: 1.5,
  },

  enemy: {
    spawnInterval: 0.16,
    startingCount: 10,
    countIncreasePerWave: 2,
    baseHealth: 100,
    healthIncreasePerWave: 10,
    baseSpeed: 70,
    speedIncreasePerWave: 3,
    reward: 10,
    rewardIncreasePerWave: 1,
    baseDamage: 5,
  },

  towers: {
    basic: { cost: 100, range: 150, damage: 28, fireRate: 1.1, color: "#60a5fa" },
    rapid: { cost: 150, range: 170, damage: 12, fireRate: 4, color: "#fbbf24" },
    cannon: { cost: 250, range: 205, damage: 75, fireRate: 0.55, color: "#f97316" },
  },

  performance: {
    targetFPS: 60,
    minimumFPS: 45,
    maxFrameTimeMs: 33,
    stressEnemies: 5000,
    stressTowers: 100,
    stressProjectiles: 1000,
    metricWindow: 600,
  },

  spatialGrid: {
    cellSize: 100,
  },
};
