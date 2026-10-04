# Hiring Test Submission Checklist

## Code

- [x] 50 waves
- [x] 3 tower types
- [x] 4 enemy types
- [x] Placement / targeting / projectiles
- [x] Upgrade / sell
- [x] Health / gold / score
- [x] Victory / game over
- [x] Pause / restart / 1x–3x speed
- [x] 5K / 100 / 1K stress harness
- [x] Baseline 5K and Optimized 5K comparison
- [x] Spatial grid
- [x] Object pooling
- [x] In-place entity compaction
- [x] Viewport culling
- [x] Delta-time simulation
- [x] Fixed-size performance metrics

## Before sending the application

1. Run `npm ci`.
2. Run `npm run build` and confirm the build succeeds.
3. Run `npm run dev` and test a normal game session.
4. Test tower placement, upgrade and sell.
5. Test pause, restart and 1x/2x/3x.
6. Run **Baseline 5K** and record the actual metrics in `NUMBERS.md`.
7. Run **Optimized 5K** and record the actual metrics in `NUMBERS.md`.
8. Check that the optimized mode meets the hiring-test FPS targets on the submission machine.
9. Deploy the `dist` output to Vercel/Netlify/Cloudflare Pages/etc.
10. Open the deployed URL in the browser.
11. Record a 2–5 minute English demo with your face visible.
12. In the first 30 seconds, show baseline → optimized live.
13. Show the measured before/after numbers live and keep the same workload/device/window.
14. Add the deployed URL and video URL to the final application.

## What is intentionally not claimed by this repository

- No fabricated FPS results.
- No fabricated memory results.
- No fabricated deployment URL.
- No fabricated video URL.
