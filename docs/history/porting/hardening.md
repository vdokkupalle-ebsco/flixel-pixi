# Phase 13 evidence: hardening pass (in progress toward C13)

- Checkpoint: **not** full C13 yet (no 1.0 publish)
- Status: In progress — corrected render-frame metrics + soft Chromium FPS floors + longer soak
- Date: 2026-08-09 audit update
- Spec: [`../implementation-plans/specs/2026-08-06-phase13-hardening-design.md`](../implementation-plans/specs/2026-08-06-phase13-hardening-design.md)
- Plan: [`../implementation-plans/plans/2026-08-07-c13-completion.md`](../implementation-plans/plans/2026-08-07-c13-completion.md)

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

## Frozen render budgets (headless Chromium, serial reference run)

Command: `npm run test:perf`

| active | avgFps | medianFps | minFps | Gate       |
| ------ | ------ | --------- | ------ | ---------- |
| 2000   | 65.61  | 60.24     | 20.00  | median ≥48 |
| 5000   | 35.60  | 40.00     | 20.00  | median ≥28 |
| 10000  | 17.32  | 17.15     | 12.00  | median ≥14 |

Reference: MacBook Pro `Mac16,8`, Apple M4 Pro (12-core CPU, 16-core GPU),
24 GB, macOS 26.5.2 arm64, Node 22.x, Playwright 1.62.1, Chromium
151.0.7922.34. Median is gated; mean and minimum remain diagnostic because
isolated scheduler and GC stalls vary between otherwise equivalent runs.

## Soak

| Metric    | Frozen budget                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------ |
| cycles    | 30 × ~750ms in the fast lane; 30 minutes on demand                                               |
| active    | ≤2 render handles, 1 target/1,228,800 bytes, 2 texture sources, 1 audio context/handle, 1 canvas |
| released  | all engine-owned counts exactly zero                                                             |
| listeners | retained process baseline ≤16                                                                    |

## Verification

- `npx vitest run` — pass
- `npm run check:budgets` — 9/9 static bundle/CPU budgets pass
- `npm run test:perf` — 4/4 browser FPS/resource budgets pass
- `npm run test:soak:30m` — 2,359 cycles pass over 30.2 minutes
- `npm run test:matrix` — five desktop/mobile profiles cover layout, lifecycle,
  accessibility, pressure, and teardown contracts (22 pass; 3 unsupported
  non-Chromium memory-pressure simulations skip explicitly)
- `npm run check:package` — a nine-file tarball passes clean-consumer
  ESM, declarations, source-map, license, provenance-config, Vite, and browser
  lifecycle checks
- The `0.1.0-rc.1` API baseline, changelog, compatibility rules, and upgrade
  policy are committed release gates; 1.0 is deferred across multiple release
  cycles
- Remaining for C13: physical-device release approval, signed release-candidate
  publication, and registry-tarball validation
