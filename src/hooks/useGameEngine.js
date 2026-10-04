import { useEffect, useRef, useState } from "react";
import { GameEngine } from "../game/core/GameEngine";

export function useGameEngine() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [selectedTowerType, setSelectedTowerType] = useState("basic");
  const [selectedTower, setSelectedTower] = useState(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;
    engine.start();

    const interval = setInterval(() => {
      const state = engine.getState();
      setGameState({ ...state, enemies: state.enemies, towers: state.towers, projectiles: state.projectiles });
      setSelectedTowerType(engine.selectedTowerType);
      setSelectedTower(engine.getSelectedTowerInfo());
    }, 100);

    return () => {
      clearInterval(interval);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  return {
    canvasRef,
    gameState,
    selectedTowerType,
    selectedTower,
    pauseGame: () => engineRef.current?.pause(),
    resumeGame: () => engineRef.current?.resume(),
    restartGame: () => engineRef.current?.restart(),
    setSpeed: (speed) => engineRef.current?.setSpeed(speed),
    selectTower: (type) => engineRef.current?.setTowerType(type),
    upgradeTower: () => engineRef.current?.upgradeSelectedTower(),
    sellTower: () => engineRef.current?.sellSelectedTower(),
    stressTest: (mode) => engineRef.current?.startStressTest(mode),
  };
}
