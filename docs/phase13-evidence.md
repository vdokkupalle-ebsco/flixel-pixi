# Phase 13 evidence: hardening pass (in progress toward C13)

- Checkpoint: **not** full C13 yet (no 1.0 publish)
- Status: In progress — corrected render-frame metrics + soft Chromium FPS floors + longer soak
- Date: 2026-08-09 audit update
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

## Frame ownership and measurement correction (2026-08-09)

`createBrowserGame` now has one frame owner: a single `requestAnimationFrame`
callback advances fixed simulation, syncs render state, and renders exactly
once. Pixi's automatic ticker is disabled. The public `onFrame` callback reports
the raw wall-clock render interval and simulation-step count.

The original Phase 13 FPS values were invalidated because they counted
simulation updates executed inside one presentation frame. The bench now warms
up and measures completed browser render intervals. Phase 13 stress tests run
serially so the 2k, 5k, 10k, and soak workloads do not contend with one another.

## Perf note

`createBrowserGame` now skips `syncWorldToRenderer` unless `FlxContext.renderablesDirty`
(set by group add/remove/replace/clear and state create). Stable 10k scenes no longer
pay O(n) membership diffs every frame.

## Render FPS baseline (headless Chromium, serial local run)

Command: `npm run test:perf`

| active | avgFps | minFps | Gate          |
| ------ | ------ | ------ | ------------- |
| 2000   | 86.6   | 5.7    | soft ≥ 60 avg |
| 5000   | 58.5   | 20.3   | soft ≥ 30 avg |
| 10000  | 32.6   | 20.0   | report-only   |

These are local regression baselines, not cross-device performance promises.
Minimum FPS remains report-only because setup/GC hitches dominate the short run.

## Soak

| Metric | Value                             |
| ------ | --------------------------------- |
| cycles | 30 × ~750ms                       |
| probe  | `registeredObjectCount` mid-cycle |
| assert | flat within ε=+2; no errors       |

## Verification

- `npx vitest run` — pass
- `npm run test:perf` — 4/4 pass
- `npm run test:e2e` — 105/105 pass across Chromium, Firefox, and WebKit
- Remaining for C13: richer leak probes, a 30-minute soak, WebGPU fallback
  verification, release provenance, and the 1.0 publish
