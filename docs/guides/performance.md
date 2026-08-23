# Performance guide

Practical notes for keeping Flixel simulation and Pixi rendering cheap. Deeper decisions live in ADRs under `docs/adr/`.

## Prefer simulation authority

Keep gameplay state in Flixel objects (`x`, `y`, velocity, animation frame). Treat Pixi display objects as views updated by render handles. Do not drive gameplay from Pixi transforms.

## Hot paths

- **Text:** use BitmapText / fast text mode when you have many labels; styled `FlxText` is fine for HUDs.
- **Particles:** recycle via `FlxEmitter` pools; consider the opt-in `ParticleContainer` projection (ADR 0009) for large bursts.
- **Tilemaps:** dirty only changed regions; production drawing uses chunked `FlxTilemapRenderHandle`s (Tilemap).
- **Cameras:** each camera is a render-texture pass — extra cameras cost fill rate (ADR 0003).

## Fixed step

Simulation runs on a fixed accumulator (`FlxGame` / ADR 0002). Display refresh rate must not change gameplay. Prefer fixed-step benches over wall-clock when profiling logic.

## Cleanup

Destroy states, unload asset bundles you no longer need, and drop render handles when objects leave the world. Leaked textures and listeners show up in long sessions (Performance soak will gate this harder).

## Release budgets

Named 1.0-candidate limits live in
[`performance-budgets.json`](../../performance-budgets.json). Run the portable
CI/release lane with:

```bash
npm run verify:budgets
```

`check:budgets` builds the library, measures raw/gzip bundle size, runs the
selected deterministic Vitest workloads, writes
`reports/performance-budget-results.json`, and fails when a named ceiling is
exceeded. `test:perf` runs the Chromium sprite and lifecycle budgets serially.
It requires every stress scene to boot with the expected counts, report finite
positive frame metrics, and release owned resources, but it does not apply an
absolute FPS floor to variable hosted hardware.

Run the hardware-sensitive FPS thresholds explicitly on the documented
reference machine with:

```bash
npm run test:perf:reference
```

The reference machine is a 24 GB MacBook Pro `Mac16,8` with a 12-core Apple M4
Pro CPU and 16-core GPU, macOS 26.5.2 arm64, Node 22.x, Playwright 1.62.1, and
Chromium 151.0.7922.34. These are regression budgets for that profile, not
cross-device frame-rate promises.

| Category            | Frozen gate                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------ |
| Library bundle      | ≤655,000 raw bytes; ≤150,000 gzip bytes                                                    |
| Sprite stress       | median ≥48/28/14 FPS at 2k/5k/10k active sprites                                           |
| Camera target       | ≤1,228,800 active bytes for the 640×480@1× soak scene                                      |
| Lifecycle ownership | ≤2 render handles, 1 target, 2 generated texture sources, 1 audio context/handle, 1 canvas |
| Teardown            | every engine-owned count returns to zero; retained process listeners ≤16                   |

Median FPS is the reference-machine browser statistic because it represents
sustained frame delivery without allowing isolated OS/browser scheduling stalls
to invalidate a run. Mean and minimum FPS remain report diagnostics. CPU means have explicit
per-workload ceilings in the JSON file, with enough headroom to detect material
regressions without treating benchmark noise as a release failure.

## Benchmarks

- Sprite atlas stress: `examples/games/bench-sprites/` (`npm run dev:games` → Bench Sprites). Presets **2k / 5k / 10k** via UI buttons, keys `1`/`2`/`3`, or `?active=5000`. Report-only FPS via `window.__FLIXEL_PIXI_BENCH__`.
- Boot/destroy soak: `examples/games/bench-soak/`. See the
  [historical hardening evidence](../history/porting/hardening.md).
