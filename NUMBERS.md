# Sentinel Grid — Performance Numbers

## Test Summary

Sentinel Grid was tested using the built-in 5K stress-test mode.

### Stress-Test Configuration

| Metric                    | Target |
| ------------------------- | -----: |
| Active enemies            |  5,000 |
| Active towers             |    100 |
| Active projectiles        |  1,000 |
| Minimum target FPS        | 45 FPS |
| Maximum target frame time |  33 ms |

---

## Measured Results

### Baseline Stress Test

| Metric             | Measured |
| ------------------ | -------: |
| Active enemies     |    5,000 |
| Active towers      |      100 |
| Active projectiles |    1,000 |
| FPS                |       60 |
| Frame time         |  16.7 ms |
| Frames ≥45 FPS     |      86% |
| Frames >33 ms      |    12.0% |
| P95 frame time     |  33.4 ms |

### Result

The baseline stress test demonstrates that the game can maintain approximately 60 FPS on the tested environment, but the frame-time distribution does not yet satisfy the target requirement.

The measured results were:

- **FPS:** 60
- **Frame time:** 16.7 ms
- **≥45 FPS:** 86%
- **>33 ms:** 12.0%
- **P95:** 33.4 ms

The main performance gap is the percentage of slower frames. The target is less than 5% of frames above 33 ms, while this measurement shows 12.0%.

---

## Target Requirements

| Requirement        |           Target | Measured | Status  |
| ------------------ | ---------------: | -------: | ------- |
| Active enemies     |            5,000 |    5,000 | PASS    |
| Active towers      |              100 |      100 | PASS    |
| Active projectiles |            1,000 |    1,000 | PASS    |
| FPS target         |          ≥45 FPS |   60 FPS | PASS    |
| Frames ≥45 FPS     |             ≥95% |      86% | NOT YET |
| Frames >33 ms      |              <5% |    12.0% | NOT YET |
| P95 frame time     | ≤33 ms preferred |  33.4 ms | NOT YET |

---

## Measurement Notes

The performance HUD reports:

- Current FPS from the actual `requestAnimationFrame` interval.
- Current frame time from the actual frame interval.
- Rolling percentage of frames meeting the ≥45 FPS target.
- Rolling percentage of frames exceeding 33 ms.
- P95 frame time over the measurement window.

The stress test intentionally keeps the following populations active simultaneously:

- 5,000 enemies
- 100 towers
- 1,000 projectiles

This provides a deterministic workload for comparing performance before and after optimizations.

---

## Interpretation

The measured FPS value alone should not be used as the only performance indicator.

Although the observed FPS is approximately 60 FPS, the rolling frame distribution shows that some frames are significantly slower:

- 86% of measured frames reached at least 45 FPS.
- 12.0% of measured frames exceeded 33 ms.
- P95 frame time was 33.4 ms.

Therefore, this run **does not fully satisfy the assignment's 95% / <5% frame-time requirement**.

Further optimization should focus on reducing frame-time spikes rather than only increasing average FPS.

---

## Reproduction

1. Start the application.
2. Open the game.
3. Click **5K Stress**.
4. Let the stress test run long enough for the performance window to stabilize.
5. Record:
   - FPS
   - Frame
   - ≥45 FPS
   - > 33 ms
   - P95

6. Repeat the same test after each major optimization.

For a fair comparison, use the same browser, display, power mode, and background workload whenever possible.

---

## Honest Reporting

These values are measurements from the tested run and are reported as observed.

No performance values are intenti
