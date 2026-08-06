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
| Active sprites | 2000 moving |
| Inactive pool | 8000 (allocation only, not registered) |
| Warmup | 1s |
| Measure | 4s |

## FPS baseline (report-only)

| Browser | avgFps | minFps | Notes |
| --- | --- | --- | --- |
| Chromium (local/CI) | 239.6 | 24.1 | Playwright log; macOS arm64 (Darwin) |

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
