# Phase 13 evidence: hardening pass (in progress toward C13)

- Checkpoint: **not** full C13 yet (no 1.0 publish)
- Status: In progress — dirty world-sync + soft Chromium FPS floors + longer soak
- Date: 2026-08-07
- Spec: [`docs/superpowers/specs/2026-08-06-phase13-hardening-design.md`](superpowers/specs/2026-08-06-phase13-hardening-design.md)
- Plan: [`docs/superpowers/plans/2026-08-07-c13-completion.md`](superpowers/plans/2026-08-07-c13-completion.md)

## Scene config (bench-sprites)

| Parameter      | Value                                    |
| -------------- | ---------------------------------------- |
| Resolution     | 640×480                                  |
| Atlas          | Procedural 4×4 × 16px tiles, one texture |
| Active sprites | 2000 / 5000 / 10000 via `?active=`       |
| Inactive pool  | 8000 (allocation only)                   |
| Warmup         | 1s                                       |
| Measure        | 4s                                       |

## Perf note (2026-08-07)

`createBrowserGame` now skips `syncWorldToRenderer` unless `FlxContext.renderablesDirty`
(set by group add/remove/replace/clear and state create). Stable 10k scenes no longer
pay O(n) membership diffs every frame.

## FPS baseline (Chromium local)

| active | avgFps | minFps  | Gate          |
| ------ | ------ | ------- | ------------- |
| 2000   | 790.6  | _(log)_ | soft ≥ 60 avg |
| 5000   | 339.0  | _(log)_ | soft ≥ 30 avg |
| 10000  | 125.2  | ~4.4    | report-only   |

## Soak

| Metric | Value                             |
| ------ | --------------------------------- |
| cycles | 30 × ~750ms                       |
| probe  | `registeredObjectCount` mid-cycle |
| assert | flat within ε=+2; no errors       |

## Verification

- `npx vitest run` — pass
- `npx playwright test tests/browser/phase13.spec.ts --project=chromium` — pass
- Remaining for C13: Firefox/WebKit matrix, richer leak probes, optional 30‑min soak, 1.0 publish
