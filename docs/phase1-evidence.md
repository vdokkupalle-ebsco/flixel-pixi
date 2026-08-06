# Phase 1 evidence: loop, cameras, and pixel APIs

- Checkpoint: C1 architecture lock
- Status: Passed
- Date: 2026-08-06
- Harness: `examples/smoke/phase1.html`

Phase 1 tested the assumptions that would be expensive to reverse after the
gameplay hierarchy exists. The evidence locks the deterministic loop, render
handle ownership, and default camera pipeline. Measurements are diagnostic
baselines from one development machine, not release performance budgets.

## Fixed-step determinism

The public `FixedStepAccumulator` uses a 1/60 second authoritative step, caps
catch-up work, exposes a render-only interpolation fraction, and clears elapsed
debt across visibility pause/resume.

| Display cadence | Display frames | Simulation steps | Final x at 37 units/s for 10 s |
| --------------- | -------------- | ---------------- | ------------------------------ |
| 30 Hz           | 300            | 600              | 370                            |
| 60 Hz           | 600            | 600              | 370                            |
| 120 Hz          | 1,200          | 600              | 370                            |

The unit suite also verifies partial-step interpolation, the catch-up cap,
discarded-time reporting, reset behavior, and hidden-tab time rejection.

## Camera pipeline

The browser harness keeps each Pixi render handle under one `world` container.
For each camera, the adapter synchronizes camera membership and scroll-factor
positioning, applies the camera transform, renders the same world to that
camera's render texture, then composites the two outputs on the screen stage.

The spike exercises:

- two viewports with different scroll, zoom, rotation, background, tint, and
  alpha;
- a following camera clamped to world bounds and a fixed overview camera;
- one shared moving object, one object filtered to each camera, and a
  `scrollFactor = 0` HUD handle;
- viewport masks plus independent flash, fade, and shake effects;
- visibility pause/resume and complete render-texture/application teardown.

Chromium/WebGL browser checks establish two camera passes per frame, exactly
one parent for the shared handle, two independent 390×240 RGBA render targets,
and no page errors during animation or destruction. The render targets account
for 748,800 bytes of raw color storage; driver bookkeeping and temporary filter
surfaces are not observable from browser APIs.

Automated GPU pixel extraction now verifies that both camera textures contain
the shared-object color, each contains its own camera-filtered color, and each
contains exactly zero pixels of the other camera's filtered color. A default
framebuffer sample in the gap between viewports remains the exact screen
background `(17, 23, 34, 255)`, proving that masks and camera FX do not leak
across the composite boundary.

The resize contract exercises a 900×380 renderer at 1× resolution, a narrow
720×650 stacked layout at 2× resolution, and restoration to the original
layout. At 2×, each logical 390×240 camera surface becomes a 780×480 allocation
and the two raw color targets grow from 748,800 to 2,995,200 bytes as expected.
The browser test then destroys and recreates the application without page
errors or extra canvases.

The harness measures warmed CPU submission time for direct and render-texture
passes. Those values are exposed in the page and benchmark artifacts but are
not gated because GPU work is asynchronous and machine-dependent. Direct
viewport rendering remains a possible later fast path for one simple camera;
render-texture composition is the correctness baseline because clipping,
rotation, filters, and FX remain isolated by construction.

WebGL is the compatibility lane and passed. WebGPU was not available in the
automated browser lane; the spike uses Pixi's backend-neutral render API so a
WebGPU parity lane can be added when CI/browser support is reliable.

## Pixel compatibility costs and classification

The CPU prototypes use packed `0xRRGGBBAA` buffers. Representative Vitest means
for 256×256 inputs were:

| Operation                          | Mean time | Classification                               |
| ---------------------------------- | --------- | -------------------------------------------- |
| `makeGraphic` solid allocation     | 0.0056 ms | Core, Adapted                                |
| `stamp` 128×128 into 256×256       | 0.0291 ms | Compat, Emulated                             |
| `replaceColor` over 256×256        | 0.0445 ms | Compat, Emulated                             |
| per-pixel overlap, worst-case miss | 0.3095 ms | Compat with cached CPU data, Emulated        |
| Canvas 2D 256×256 `getImageData`   | ~0.06 ms  | Compat staging only; never a core frame path |

These numbers include the allocations shown by the benchmark and should be
compared by order of magnitude, not treated as cross-machine guarantees. GPU
texture readback is a separate synchronization cost and is intentionally not a
real-time core primitive.

Final C1 policy:

- `makeGraphic` and animation frame selection use Pixi-native generated
  textures and texture frames in core.
- `stamp`, `replaceColor`, mutable `pixels`, and per-pixel tests live in the
  optional compatibility module.
- Per-pixel collision should use a cached CPU alpha mask prepared at load time.
  Arbitrary per-frame GPU readback is unsupported; use AABB/collision shapes or
  preprocessed masks.

## Checkpoint verdict

All C1 architecture criteria pass. ADR-0003 is locked to one logical world plus
per-camera render-texture passes, and ADR-0006 is locked to an isolated pixel
compatibility module. Phase 2 may now build the headless lifecycle and state
hierarchy on these decisions.
