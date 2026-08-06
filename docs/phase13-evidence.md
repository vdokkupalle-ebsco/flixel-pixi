# Phase 13 evidence: hardening pass (partial)

- Checkpoint: **not** full C13 — hardening only (no 1.0 publish)
- Status: In progress / partial
- Date: 2026-08-06
- Spec: [`docs/superpowers/specs/2026-08-06-phase13-hardening-design.md`](superpowers/specs/2026-08-06-phase13-hardening-design.md)

## Scene config (bench-sprites)

| Parameter | Value |
| --- | --- |
| Resolution | 640×480 |
| Atlas | Procedural 4×4 × 16px tiles, one texture |
| Active sprites | 2000 / 5000 / 10000 via `?active=` (buttons 2k/5k/10k, keys 1/2/3) |
| Inactive pool | 8000 (allocation only, not registered; fixed across presets) |
| Warmup | 1s |
| Measure | 4s |

## FPS baseline (report-only)

| Browser | active | avgFps | minFps | Notes |
| --- | --- | --- | --- | --- |
| Chromium (local) | 2000 | 431.8 | 9.6 | Playwright `?active=2000` (varies by run) |
| Chromium (local) | 5000 | 194.2 | 7.3 | Playwright `?active=5000` |
| Chromium (local) | 10000 | 65.7 | 5.9 | Playwright `?active=10000` |

## Soak (10 × ~750ms)

| Metric | Value |
| --- | --- |
| cycles | 10 |
| errors | [] |
| registeredSamples | [2, 2, 2, 2, 2, 2, 2, 2, 2, 2] |
| verdict | flat / no throw |

## Verification

- `npm run check:games-imports` — pass
- `npx playwright test tests/browser/phase13.spec.ts` — pass
