# Phase 13 Hardening Pass — Design

**Date:** 2026-08-06  
**Status:** Approved for planning  
**Checkpoint:** Partial Phase 13 (not full C13 / not 1.0 publish)

## Problem

Before a public 1.0, we need measured browser performance under sprite load and confidence that create/destroy cycles do not leak or crash. Full C13 (30-minute soak, hard multi-browser FPS gates, npm publish) is deferred.

## Goals

1. Establish a **report-only** FPS baseline for a realistic atlas-batched sprite stress scene.
2. Run a **short practical soak**: repeated `bootGame` → run → `destroy()` with no monotonic growth on available counters and no throws.
3. Record results in evidence docs; mark Phase 13 as an in-progress hardening pass in `PORTING_PLAN.md`.

## Non-goals

- Publishing npm 1.0 / API freeze changelog for public release.
- Hard CI fail on FPS (any browser).
- 30-minute automated soak.
- Pathological unique-texture-per-sprite stress.
- Full device matrix, accessibility audit, or WebGPU fallback verification (later C13 work).

## Approach

Sample-first harness reusing `examples/games/_kit/boot-game.ts` and the Phase 12 Vite/Playwright pattern.

## Architecture

```
examples/games/bench-sprites/   → stress sample (atlas, ~2k active, inactive pool)
examples/games/bench-soak/      → destroy-cycle harness
tests/browser/phase13.spec.ts   → Chromium metrics + soak assert
docs/phase13-evidence.md        → recorded numbers + scene config
```

Both samples boot via public APIs only (`bootGame` + `src` public exports). Games index and `vite.games.config.ts` gain entries. Public-import guard continues to cover `examples/games/**`.

## Component: Sprite stress sample (`bench-sprites`)

### Scene config (fixed for evidence)

| Parameter        | Value                                      |
| ---------------- | ------------------------------------------ |
| Resolution       | 640×480 (match other games samples)        |
| Atlas            | Procedural in-memory; one texture, ≥4 frames (e.g. 4×4 grid of 16×16 tiles) |
| Active sprites   | 2000 moving (bounce/wrap), shared atlas frames |
| Inactive pool    | 8000–10000 members with `exists = false` (or equivalent off-update) |
| Warmup           | Discard first ~1s of samples               |
| Measure window   | ~3–5s after warmup                         |

### Metrics surface

Expose on `window.__FLIXEL_PIXI_BENCH__` after ready:

| Field            | Meaning                                      |
| ---------------- | -------------------------------------------- |
| `ready`          | boolean                                      |
| `avgFps`         | average FPS over measure window              |
| `minFps`         | minimum (or ~p5) FPS in window               |
| `activeCount`    | active moving sprites                        |
| `inactiveCount`  | inactive pooled sprites                      |
| `drawCalls`      | optional; omit / `null` if not cheap via Pixi |

HUD may mirror FPS/counts for manual runs (`npm run dev:games`).

### FPS policy

**Report-only.** Playwright always passes on FPS values; numbers are logged and copied into `docs/phase13-evidence.md`. A future pass may promote Chromium floors to soft gates once CI baselines exist.

## Component: Soak harness (`bench-soak`)

### Cycle

Repeat **M = 10** times:

1. `bootGame({ ... })`
2. Run for **K** frames or ~500–1000 ms
3. `destroy()`
4. Record probe snapshot

### Probes (best-effort)

Prefer concrete, engine-visible counts when available (e.g. renderer-registered handle count, remaining `FlxG`/`Application` state). If a probe is unreliable, document “probe skipped” in evidence; still require:

- No uncaught errors across cycles
- Boot reaches `ready` each cycle
- Destroy completes without throw

### Assert policy

If a stable counter exists: final cycle value ≤ first cycle + small ε (no monotonic climb across the 10 samples). If only crash-free teardown is measurable, that is the gate for this pass.

## Testing

`tests/browser/phase13.spec.ts` (Chromium primary for this pass; other browsers optional/nice-to-have):

1. **Bench:** load `bench-sprites` → wait `ready` → wait measure window → read `__FLIXEL_PIXI_BENCH__` → assert fields present and finite; log metrics; do not fail on FPS magnitude.
2. **Soak:** load `bench-soak` → wait completion → assert no growth (or crash-free completion per above).

Wire entries into `playwright.config.ts` / games Vite config the same way as Phase 12 samples.

## Documentation

| Artifact | Role |
| -------- | ---- |
| `docs/phase13-evidence.md` | Scene config, machine/browser note, FPS table, soak result |
| `docs/guides/performance.md` | Short pointer to `bench-sprites` / soak |
| `PORTING_PLAN.md` | Phase 13 status: hardening pass in progress; C13 not closed |

## Done criteria

- [ ] `bench-sprites` and `bench-soak` run under `npm run dev:games`
- [ ] Playwright Phase 13 specs pass (report-only FPS; soak gate as specified)
- [ ] `docs/phase13-evidence.md` filled with at least one local (or CI) run
- [ ] `PORTING_PLAN.md` reflects partial Phase 13; no claim of full C13 / 1.0 publish

## Follow-ups (explicitly later)

- Soft Chromium FPS floor once baselines stabilize
- Longer soak (toward 30 minutes) and richer leak probes
- Full browser/device matrix, a11y, WebGPU fallback
- API freeze, changelog, tarball verification, npm 1.0
