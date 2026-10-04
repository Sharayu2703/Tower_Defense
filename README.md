# Sentinel Grid

A browser-based Tower Defense game built with React and HTML5 Canvas.

Sentinel Grid is designed as both a playable tower-defense game and a real-time performance engineering exercise. The project focuses on scalable simulation, efficient targeting, optimized Canvas rendering, object pooling, spatial partitioning, and measurable performance under a heavy stress workload.

---

## Features

### Gameplay

- 50 progressive waves
- 3 different tower types
- 4 different enemy types
- Automatic tower targeting
- Enemy path-following
- Tower placement
- Tower upgrading
- Tower selling
- Player health
- Gold/currency system
- Score system
- Victory state
- Game-over state
- Pause/resume
- Game speed controls
- Restart functionality
- Progressive enemy difficulty

### Performance

The game includes a dedicated stress-test mode with:

- 5,000 active enemies
- 100 active towers
- 1,000 active projectiles

The engine uses:

- A centralized `requestAnimationFrame` loop
- Delta-time based simulation
- Spatial partitioning
- Object pooling
- Canvas rendering
- Viewport culling
- Batched projectile rendering
- Reduced Canvas state changes
- In-place entity-array compaction

---

# Tech Stack

- React
- JavaScript
- HTML5 Canvas
- Vite
- CSS

No backend or external service is required for the core game.

---

# Getting Started

## Requirements

- Node.js
- npm
- Modern web browser

Recommended browsers:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox

---

## Installation

Clone or download the repository.

Install dependencies:

```bash
npm install