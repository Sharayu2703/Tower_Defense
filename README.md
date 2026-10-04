# Sentinel Grid — Browser Tower Defense

A self-contained React + HTML5 Canvas tower-defense game built for the frontend developer hiring test.

## Status

- **Gameplay:** implemented for 50 waves.
- **Stress harness:** implemented for the required 5,000 enemies / 100 towers / 1,000 projectiles.
- **Before/after benchmark:** implemented with **Baseline 5K** and **Optimized 5K** modes. The baseline deliberately performs a full enemy scan for every tower; the optimized build uses the spatial grid. Both modes keep pooling, rendering, movement, and the same entity counts constant so the measured delta isolates target lookup.
- **Build:** the submitted source is a Vite app. The original uploaded archive contained Windows-specific `node_modules`; do not commit or ship that folder. Run `npm ci` on the target machine before building.
- **Deployment/video:** these require a browser session and external deployment/recording accounts, so they must be completed from the developer machine. No performance numbers are fabricated in `NUMBERS.md`.

## Requirements checklist

| Requirement | Implementation | Status |
|---|---|---|
| Playable start-to-finish | 50-wave state machine, victory/game-over states | ✅ |
| At least 50 waves | `maxWaves: 50` | ✅ |
| At least 3 tower types | Basic, Rapid, Cannon | ✅ |
| At least 4 enemy types | Normal, Fast, Tank, Boss | ✅ |
| Automatic targeting/attacking | Tower cooldown + target acquisition + projectiles | ✅ |
| Path following | Deterministic multi-segment path | ✅ |
| Placement | Canvas click placement with path/tower collision checks | ✅ |
| Upgrading | Levels 1–5, damage/range/fire-rate scaling | ✅ |
| Selling | 70% of invested value | ✅ |
| Health/currency/score | GameState + HUD | ✅ |
| Victory/game-over | Wave completion and base damage | ✅ |
| Pause/restart/speed | Pause, restart, 1x/2x/3x | ✅ |
| Progressive difficulty | Enemy count, health, speed and reward scale by wave; special enemies appear | ✅ |
| 5,000 enemies | Dedicated stress harness | ✅ |
| 100 towers | Dedicated stress harness | ✅ |
| 1,000 projectiles | Dedicated stress harness | ✅ |
| 45+ FPS / <5% >33ms measurement | Rolling 600-frame metrics | ✅ |
| Stable object lifecycle | Enemy/projectile pools | ✅ |
| No per-entity loops/timers | Single `requestAnimationFrame` loop | ✅ |
| Rendering culling | Offscreen enemies/projectiles are skipped | ✅ |
| Different refresh rates | Delta-time simulation | ✅ |
| Before/after optimization demo | Baseline 5K vs Optimized 5K buttons | ✅ |
| `NUMBERS.md` | Measurement template, no invented results | ✅ |
| Deployed URL | Requires deployment from the developer account | ⚠️ |
| 2–5 minute face + English demo video | Requires screen/recording session | ⚠️ |

## Architecture

```text
React UI
  └─ useGameEngine()
       └─ GameEngine (imperative game state + one RAF loop)
            ├─ GameState
            ├─ Enemy pool
            ├─ Projectile pool
            ├─ SpatialGrid
            ├─ Tower targeting
            └─ Canvas renderer
```

### Responsibilities

- `src/pages/Game.jsx` — page composition.
- `src/components/HUD/GameHUD.jsx` — HUD, controls, tower selection, upgrade/sell actions and benchmark controls.
- `src/hooks/useGameEngine.js` — React/engine bridge. React receives a lightweight HUD snapshot roughly every 100 ms rather than owning game entities.
- `src/game/core/GameEngine.js` — simulation loop, waves, input, benchmark harness, pooling and performance metrics.
- `src/game/core/GameState.js` — gameplay and benchmark state.
- `src/game/core/SpatialGrid.js` — fixed-size spatial buckets for nearby-enemy queries.
- `src/game/entities/Enemy.js` — pooled enemy behavior and path movement.
- `src/game/entities/Tower.js` — tower stats, targeting, upgrade and sell values.
- `src/game/entities/Projectile.js` — pooled projectile movement and hit handling.
- `src/game/rendering/renderer.js` — Canvas-only rendering.
- `src/game/config/*` — balance constants and path geometry.

## Rendering approach

The game uses a single 1280×720 logical HTML5 Canvas scaled responsively with CSS. Canvas is preferable here to thousands of React DOM nodes because the game has a high-frequency simulation and many short-lived entities.

The renderer draws the static background/path first, then towers, enemies and projectiles. Enemy/projectile drawing has a viewport check so objects outside the visible canvas are skipped.

## Main performance bottlenecks

1. **Tower target acquisition:** 100 towers × 5,000 enemies creates 500,000 distance checks per update if implemented as a naive scan.
2. **Per-frame allocations:** repeatedly copying/sorting metric arrays or creating new entity arrays can trigger garbage collection during a stress run.
3. **Entity churn:** enemies and projectiles are created and destroyed frequently during normal play.
4. **Canvas draw calls:** 5,000 enemies plus 1,000 projectiles are a substantial rendering workload even when simulation is optimized.
5. **Refresh-rate dependence:** simulation must not assume a fixed 16.67 ms frame interval.

## Optimizations

### 1. Spatial grid for target lookup

A fixed 100 px grid partitions the 1280×720 world. Each enemy is inserted into one bucket. A tower only searches buckets overlapping its range rather than scanning all 5,000 enemies.

The benchmark has two explicit modes:

- **Baseline 5K:** full linear scan for each tower.
- **Optimized 5K:** spatial-grid lookup.

This is the primary before/after optimization to demonstrate in the video. The workload and entity population remain the same.

### 2. Object pooling

Enemies and projectiles are reused through `enemyPool` and `projectilePool`. This reduces allocation/GC pressure during long waves.

Pooling is kept enabled in both benchmark modes so the spatial-grid comparison is attributable to the target lookup change rather than multiple simultaneous variables.

### 3. In-place compaction

Dead enemies/projectiles are compacted with write indices instead of `filter()`, avoiding a new active array every frame.

### 4. Low-overhead performance metrics

The FPS metric history is a fixed-size `Float64Array`. Average, ≥45 FPS and >33 ms percentages are updated incrementally. P95 is sorted only periodically rather than allocating/sorting the rolling window every frame.

### 5. Delta-time simulation

Movement, firing and wave timers use elapsed time. Changing from 60 Hz to another display refresh rate therefore changes the number of simulation callbacks, not the simulated speed.

### 6. React isolation

React is responsible for the low-frequency HUD only. The thousands of game entities stay inside the imperative engine and are rendered directly to Canvas.

## Game design / balance decisions

- **Basic:** general-purpose starting tower.
- **Rapid:** lower damage but high fire rate, useful against fast enemies.
- **Cannon:** expensive, slow and high-damage, useful against tanks/bosses.
- **Normal:** baseline enemy.
- **Fast:** lower health and high movement speed.
- **Tank:** high health and reduced speed.
- **Boss:** appears every fifth wave as a high-health, high-reward enemy.
- Enemy health, speed, reward and wave size scale with wave number.
- Towers have five upgrade levels so currency remains strategically useful throughout a run.
- Selling returns 70% of invested tower value to allow repositioning without making placement decisions permanent.

## Stress-test procedure

Use the exact same browser window and device for both measurements:

1. Start the game.
2. Click **Baseline 5K**.
3. Keep the browser visible and wait at least 10 seconds / 600 measured frames.
4. Record FPS, P95, ≥45 FPS %, and >33 ms % in `NUMBERS.md`.
5. Click **Restart**.
6. Click **Optimized 5K**.
7. Wait the same amount of time and record the same metrics.
8. Confirm the HUD still reports exactly **5,000 enemies, 100 towers, 1,000 projectiles**.
9. Repeat once after a fresh reload if you want a second sanity check.

Do not invent results. The hiring-test video should derive the numbers live in the browser.

## Demo-video plan (about 3–4 minutes)

**0:00–0:30 — required before/after immediately:**
- Open the deployed game.
- Show **Baseline 5K** with the visible FPS/frame-time HUD.
- Switch to **Optimized 5K** and show the same workload improving.
- Say in English what changed: naive 500,000 target checks versus spatial-grid lookup.

**0:30–1:30 — gameplay:**
- Restart.
- Place all three tower types.
- Select a tower, upgrade it, sell it, and demonstrate automatic attacks.
- Show pause and 2x/3x speed.

**1:30–2:30 — performance exploration:**
- Explain the bottleneck and why Canvas + an imperative engine were selected.
- Explain pooling, in-place compaction, viewport culling, delta time and low-frequency React updates.

**2:30–3:30 — final stress result:**
- Run Optimized 5K again.
- Show 5,000 / 100 / 1,000 counts and live metrics.
- Read the actual measured values and explain the delta from baseline.

The presenter must show their face and speak English. Record with Loom or another screen recorder and include the deployed link in the final submission.

## Local run

```bash
npm ci
npm run dev
```

Then open the Vite URL shown in the terminal.

For a production check:

```bash
npm run build
npm run preview
```

Do not include `node_modules` in the submission archive. It is platform-specific and reproducible from `package-lock.json`.

## Deployment

This is a static Vite application. Vercel, Netlify, Cloudflare Pages or another static host can deploy it without a backend or external service. The deployed URL is intentionally not fabricated here; add the real URL after deployment.
