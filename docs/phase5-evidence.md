# Phase 5 evidence: production cameras and visual effects

- Checkpoint: C5 multi-camera gate
- Status: Passed
- Date: 2026-08-06
- Upstream oracle: Flixel commit `8989e5044be072c4abbbaa1317c9854786f6447f`
- PixiJS baseline: 8.19

Phase 5 turns the C1 camera experiment into the engine camera path. `FlxCamera`
owns deterministic gameplay-facing state and coordinate transforms without a
DOM or GPU dependency. `FlxCameraRenderer` owns Pixi render textures, output
sprites, scene routing, and teardown. `FlxContext` connects them through an
explicit service, while `FlxG` retains the familiar compatibility facade.

## Delivered surface

The public package now exports `FlxCamera`, camera follow/effect types,
`FlxCameraRenderer`, `FlxCameraView`, and the context camera-host contract.
`FlxContext` owns an ordered camera collection and primary camera; add, remove,
reset, selection, and fixed-step updates keep the installed renderer synchronized.
Removing the final camera creates and registers a valid replacement before the
old camera is destroyed.

The camera model implements lock-on, platformer, top-down, and tight top-down
follow styles; focus; custom dead zones; camera/world bounds; viewport position
and dimensions; zoom; independent scale; rotation; alpha; tint; transparent
backgrounds; filtering; flash; fade; directional shake; completion callbacks;
and immediate effect cancellation. `FlxGame` advances cameras after state
simulation so follow targets use the authoritative position from that step.

`FlxCameraRenderer` uses one logical world registry and one render-texture pass
per active camera. Null object camera lists route to every active camera;
explicit lists isolate an object. `scrollFactor = 0` uses the same path for HUD
objects. Camera output is composited around its center so the actual Pixi
transform agrees with `worldToScreen` and `screenToWorld` for translated,
zoomed, independently scaled, rotated, and shaken viewports.

## Pinned AS3 contracts

The implementation was checked against pinned `FlxCamera.as`, `FlxG.as`,
`FlxObject.as`, and `FlxSprite.as`:

- follow constants retain values `0..3`, including the platformer `width / 8`
  by `height / 3` dead zone and top-down square presets;
- target-edge comparisons include the AS3 epsilon before adjusting scroll;
- bounds clamp scroll to the world rectangle minus camera dimensions;
- `flash` decreases alpha, `fade` increases it, and shake offsets use seeded
  `FlxG.random()` plus elapsed simulation time;
- a null object camera list means all global cameras;
- screen position subtracts truncated camera scroll multiplied by the object's
  scroll factor;
- camera `x` and `y` remain screen-space viewport coordinates;
- background color and effects use `0xAARRGGBB`, including the upstream
  opaque fallback for effect colors whose alpha byte is zero.

Flash documented camera rotation and arbitrary `setScale` as producing odd
display results. This port classifies that surface as adapted: rotation is
centered, reversible, and shared by renderer and pointer conversion.

## C5 browser scene

Open `/phase5.html` to run the checkpoint scene. It renders a zoomed platformer
follow camera and a translated, tinted, rotated overview camera simultaneously.
The scene includes shared world objects, same-position camera-exclusive objects,
parallax layers, `scrollFactor = 0` HUD text, independent flash/fade, and
directional shake. The shared follow target travels an eight-second deterministic
path. A 60 Hz `FixedStepAccumulator` advances target and camera state before one
manual camera render per display frame; visibility changes clear elapsed-time
debt instead of producing a catch-up jump. Flash, fade, and shake repeat once per
path cycle, and the overview fade is cleared after its demonstration window.

The browser harness reads each render target before effects and proves that the
magenta object exists only in the follow camera and the yellow object only in
the overview camera. A logical world point is round-tripped through the rotated
camera, then compared with the real Pixi output transform. The same coordinate
result is captured before and after the second camera is added, so single- and
multi-camera operation use one contract rather than divergent paths.

At 1× density, two `360 × 240` RGBA targets retain 691,200 bytes. The WebKit
desktop preset starts at 2×, where the same logical targets become `720 × 480`.
A runtime resize to an `820 × 300` canvas at 2× preserves camera coordinates and
produces the expected `1640 × 600` backing store without moving either viewport.

The scene also creates and removes a temporary camera, asserting that its
`RenderTexture` is destroyed immediately. Final teardown releases every camera
target and sprite/text handle, removes the context service, destroys owned
textures, and removes the application canvas.

## Verification results

The Phase 5 browser file contributes nine passing cases across Chromium,
Firefox, and WebKit: split-screen routing/effects/lifecycle, pointer/HiDPI
resize, and deterministic target/camera motion in each engine. Tests can pause,
seek, and advance exact simulation steps before visual capture, so live animation
does not make snapshots timing-dependent. Three committed `phase5-cameras`
visual baselines allow a 1.5% changed-pixel ratio for renderer and font
rasterization differences.

The headless suite contains 85 passing tests across 14 files. Coverage is 96.56%
statements, 90.74% branches, 97.28% functions, and 98.28% lines. The production
library and all four smoke entries build successfully; the library bundle is
105.32 kB raw and 24.56 kB gzip on this checkpoint build. The complete browser
matrix passes all 24 project/test combinations across the three engines.

Representative Phase 5 benchmark means on the development machine were:

| Workload                                      | Mean time |
| --------------------------------------------- | --------- |
| 10,000 bounded platformer follow updates      | 0.180 ms  |
| 10,000 allocation-free coordinate round trips | 0.116 ms  |

These are diagnostic regression baselines, not cross-device promises. A direct
single-camera fast path was intentionally not added: the production render-pass
path meets the current checkpoint needs, and a second path would require its own
visual, coordinate, effect, and cleanup parity burden before profiling shows a
real benefit.

## Checkpoint verdict

C5 passes. Two simultaneous cameras isolate world and HUD objects correctly,
follow/effect timing is deterministic, rendered transforms and pointer math
agree under translation/zoom/rotation, density changes preserve logical layout,
and camera churn returns render-target ownership to a stable count. Phase 6 may
build the tilemap renderer on this camera registry without duplicating world
data or making Pixi transforms authoritative for collision.
