# Performance Measurements

**Important:** replace `TBD` only with numbers measured live in the same browser/device. Never invent these values for the hiring submission.

## Required before/after comparison

| Build | Optimization delta | Workload | Avg FPS | Frame p95 (ms) | Frames >=45 FPS | Frames >33ms | Browser | Device | Measurement window | Notes |
|---|---|---|---:|---:|---:|---:|---|---|---|---|
| Baseline 5K | Linear target scan | 5,000 enemies / 100 towers / 1,000 projectiles | TBD | TBD | TBD | TBD | TBD | TBD | 600 frames / 10+ sec | Show the breaking point visually |
| Optimized 5K | Spatial grid | 5,000 enemies / 100 towers / 1,000 projectiles | TBD | TBD | TBD | TBD | TBD | TBD | 600 frames / 10+ sec | Same workload/window/device |

## Acceptance targets

- **>=45 FPS for at least 95% of measured frames**
- **<5% of measured frames above 33 ms**
- Game remains interactive during the stress workload
- Memory remains broadly stable during a complete 50-wave run

## Measurement method

1. Use the same browser, device and window size for baseline and optimized runs.
2. Click **Baseline 5K** and allow the rolling 600-frame metric window to stabilize.
3. Record the HUD values for FPS, P95, `>=45 FPS` and `>33ms`.
4. Restart and repeat with **Optimized 5K**.
5. Do not change zoom/window size between measurements.
6. For the video, derive the numbers live from the browser rather than reading prewritten claims.

## What the benchmark isolates

The benchmark keeps object pooling, Canvas rendering, entity counts and movement constant. The intentional difference is target acquisition:

- Baseline: each of 100 towers scans all 5,000 enemies.
- Optimized: each tower queries only relevant spatial-grid buckets.

This makes the before/after result attributable to the spatial-grid optimization.
