import GameHUD from "../components/HUD/GameHUD";
import { useGameEngine } from "../hooks/useGameEngine";

export default function Game() {
  const game = useGameEngine();

  return (
    <main className="game-page">
      <GameHUD
        gameState={game.gameState}
        selectedTowerType={game.selectedTowerType}
        selectedTower={game.selectedTower}
        onPause={game.pauseGame}
        onResume={game.resumeGame}
        onRestart={game.restartGame}
        onSpeedChange={game.setSpeed}
        onTowerSelect={game.selectTower}
        onUpgrade={game.upgradeTower}
        onSell={game.sellTower}
        onStressTest={game.stressTest}
      />

      <section className="game-area">
        <div className="canvas-shell">
          <canvas ref={game.canvasRef} className="game-canvas" />
          <div className="legend">
            <span><i className="dot normal" /> Normal</span>
            <span><i className="dot fast" /> Fast</span>
            <span><i className="dot tank" /> Tank</span>
            <span><i className="dot boss" /> Boss</span>
          </div>
        </div>
      </section>
    </main>
  );
}
