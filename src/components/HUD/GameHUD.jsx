const TOWERS = [
  { type: "basic", name: "Basic", icon: "🔵", cost: 100 },
  { type: "rapid", name: "Rapid", icon: "⚡", cost: 150 },
  { type: "cannon", name: "Cannon", icon: "💥", cost: 250 },
];

export default function GameHUD({
  gameState,
  selectedTowerType,
  selectedTower,
  onPause,
  onResume,
  onRestart,
  onSpeedChange,
  onTowerSelect,
  onUpgrade,
  onSell,
  onStressTest,
}) {
  if (!gameState) return null;

  const disabled = gameState.isGameOver || gameState.isVictory || gameState.isPaused || gameState.isStressTest;
  const performanceGood = gameState.framesMeasured < 30 || gameState.framesAtLeast45FPS >= 95;

  return (
    <header className="game-hud">
      <div className="brand">
        <div className="brand-mark">S</div>
        <div>
          <strong>Sentinel Grid</strong>
          <span>Tower Defense</span>
        </div>
      </div>

      <div className="stats">
        <Stat label="❤️ Health" value={gameState.health} />
        <Stat label="💰 Gold" value={gameState.gold} />
        <Stat label="🏆 Score" value={gameState.score} />
        <Stat label="🌊 Wave" value={`${gameState.wave} / 50`} />
        <Stat label="👾 Enemies" value={gameState.enemies.length} />
      </div>

      <div className="tower-selection">
        <span className="section-label">Build</span>
        <div className="tower-buttons">
          {TOWERS.map((tower) => (
            <button
              key={tower.type}
              className={selectedTowerType === tower.type ? "tower-button active" : "tower-button"}
              onClick={() => onTowerSelect(tower.type)}
              disabled={disabled}
            >
              <span>{tower.icon} {tower.name}</span>
              <small>${tower.cost}</small>
            </button>
          ))}
        </div>
      </div>

      {selectedTower && (
        <div className="selected-panel">
          <div>
            <strong>{selectedTower.type.toUpperCase()} · LVL {selectedTower.level}</strong>
            <small>
              DMG {Math.round(selectedTower.damage)} · RNG {Math.round(selectedTower.range)} · {selectedTower.fireRate.toFixed(1)}/s
            </small>
          </div>
          <div className="selected-actions">
            <button
              onClick={onUpgrade}
              disabled={disabled || selectedTower.upgradeCost === null || gameState.gold < selectedTower.upgradeCost}
            >
              Upgrade {selectedTower.upgradeCost === null ? "MAX" : `$${selectedTower.upgradeCost}`}
            </button>
            <button onClick={onSell} disabled={disabled}>Sell ${selectedTower.sellValue}</button>
          </div>
        </div>
      )}

      <div className="performance">
        <div className={performanceGood ? "metric good" : "metric bad"}>
          <span>FPS</span><b>{gameState.fps}</b>
        </div>
        <div className="metric"><span>Frame</span><b>{gameState.frameTime.toFixed(1)}ms</b></div>
        <div className="metric"><span>≥45 FPS</span><b>{gameState.framesAtLeast45FPS.toFixed(0)}%</b></div>
        <div className="metric"><span>&gt;33ms</span><b>{gameState.slowFramePercent.toFixed(1)}%</b></div>
        <div className="metric"><span>P95</span><b>{gameState.p95FrameTime.toFixed(1)}ms</b></div>
      </div>

      <div className="controls">
        {!gameState.isGameOver && !gameState.isVictory && !gameState.isStressTest && (
          gameState.isPaused ? <button onClick={onResume}>Resume</button> : <button onClick={onPause}>Pause</button>
        )}
        <button onClick={onRestart}>Restart</button>
        {!gameState.isStressTest && [1, 2, 3].map((speed) => (
          <button key={speed} className={gameState.gameSpeed === speed ? "active" : ""} onClick={() => onSpeedChange(speed)}>{speed}x</button>
        ))}
        <button className="stress-button baseline" onClick={() => onStressTest("baseline")}>Baseline 5K</button>
        <button className="stress-button" onClick={() => onStressTest("optimized")}>Optimized 5K</button>
      </div>

      {gameState.isStressTest && (
        <div className="stress-banner">
          {gameState.stressMode === "baseline" ? "BASELINE" : "OPTIMIZED"} STRESS: {gameState.enemies.length} enemies · {gameState.towers.length} towers · {gameState.projectiles.length} projectiles
        </div>
      )}

      {(gameState.isGameOver || gameState.isVictory) && (
        <div className={gameState.isVictory ? "result victory" : "result game-over"}>
          <strong>{gameState.isVictory ? "VICTORY" : "GAME OVER"}</strong>
          <button onClick={onRestart}>Play Again</button>
        </div>
      )}
    </header>
  );
}

function Stat({ label, value }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}
