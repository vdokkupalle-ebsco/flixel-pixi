# Phase 4 evidence: assets, sprites, animation, and text

- Checkpoint: C4 sprite compatibility
- Status: Passed
- Date: 2026-08-06
- Upstream oracle: Flixel commit `8989e5044be072c4abbbaa1317c9854786f6447f`
- PixiJS baseline: 8.19

Phase 4 adds visual objects without making Pixi transforms authoritative.
`FlxSprite` and `FlxText` are plain TypeScript gameplay objects. Each creates
adapter-owned Pixi containers only when a renderer asks for a handle, and every
handle synchronizes from the gameplay state after simulation.

## Delivered surface

The public package exports `FlxAssets`, `FlxGraphic`, `FlxAnim`, `FlxSprite`,
`FlxText`, `FlxTileblock`, and sprite/text render-handle types.

`FlxAssets` wraps Pixi `Assets` with typed descriptors, aliases, manifests,
bundles, progress/error callbacks, retry options, background loading, synchronous
cache lookup, explicit unload, failure inspection, and `FlxContext` service
installation. Constructors never start a network request.

`FlxSprite` provides generated graphics, frame-grid selection, forward and
looping/non-looping animation, frame callbacks, pause/resume/restart, random and
direct frame selection, facing, origin, offset, scaling, tint, alpha, rotation,
blend mode, transformed on-screen checks, and render-handle lifecycle tracking.

`FlxText` provides fixed-width word wrapping, multiline bounds, left/center/right
alignment, font, size, fill, one-pixel shadow, border, and the inherited sprite
transforms. Pixi `Text` is the fidelity default; explicit `bitmap` mode is for
scores, timers, and other frequently changing labels with a suitable glyph set.

`FlxTileblock` rounds its bounds to tile dimensions, selects tiles from the
seeded Flixel RNG, and uploads one generated texture. It intentionally accepts
pixel-backed/preprocessed graphics only: silently reading a URL texture back
from the GPU would violate the C1 compatibility decision.

## AS3 sprite-sheet oracle

Tests are derived from pinned `FlxAnim.as`, `FlxSprite.as`, `FlxText.as`, and
`FlxTileblock.as` behavior:

- animation advances in `postUpdate` using seconds-per-frame and carries excess
  elapsed time through a loop;
- non-looping animations stop on their final frame, while restart is explicit;
- callbacks receive animation name, animation-frame number, and sheet index when
  a frame is materialized;
- facing flips only a graphic loaded with reverse support;
- offset shifts the visual top-left while origin remains the rotation/scale
  center;
- alpha clamps to `[0, 1]`, color ignores alpha, and frame indices are validated;
- transformed culling uses the displayed frame rather than the collision box;
- text setters immediately invalidate the adapter style and multiline bounds.

The browser C4 scene covers forward animation, pause, callbacks, reverse facing,
origin/offset, scale, tint, alpha, rotation, multiline text, and nearest-neighbor
generated textures.

## Asset and lifecycle evidence

Headless tests inject a fake asset backend to prove same-alias failure recovery,
cache identity, progress/error reporting, bundle load/unload, and context service
replacement. A real Pixi Assets test loads JSON from a data URL and exercises
the actual resolver, cache, background loader, bundle, and unload adapter.

The browser scene deliberately creates and destroys 32 transient handles. Only
the four live scene handles remain before rendering. Sprite-sheet subtextures
are cached once per frame, shared by handles, and destroyed separately from the
asset-owned texture source. Scene destruction removes all handles before owned
generated textures and the Pixi application are destroyed.

## Pixel art and high DPI

Generated textures use `scaleMode: 'nearest'`, no automatic mipmaps, and
round-pixel sprite placement by default. Loaded pixel-art assets should declare
`data: { scaleMode: 'nearest' }` in their `FlxAssetDescriptor`; sampling is an
asset/source property and is not mutated per sprite because cached textures are
shared. Set `antialiasing = true` only for art intended for linear sampling and
load that art with a matching descriptor.

Logical positions and frame dimensions do not change with device pixel ratio.
The renderer resolution controls backing-store density. Existing camera tests
now run at both 1× and 2× initial density across the browser matrix.

## Visual and verification results

The committed platform-neutral `phase4-sprites` baselines pass in Chromium,
Firefox, and WebKit with a maximum allowed changed-pixel ratio of 1%. The crop
uses generated sprite geometry so host font rasterization cannot create false
CI differences; text layout/style assertions run in the same real-browser test.
The full browser matrix contains 12 passing project/test combinations, including
the pre-existing application lifecycle and two-camera isolation suites.

The headless suite contains 72 passing tests across 12 files. Coverage is
95.94% statements, 90.05% branches, 96.38% functions, and 97.82% lines. Strict
TypeScript and the production smoke build pass at this checkpoint.

Representative adapter benchmark means on the development machine were:

| Workload                                      | Mean time |
| --------------------------------------------- | --------- |
| 10,000 sprite render-handle synchronizations  | 1.086 ms  |
| Create/destroy 1,000 transient sprite handles | 0.539 ms  |

These are diagnostic regression baselines, not cross-device promises.

## Compatibility boundary

Mutable `pixels`, `stamp`, `replaceColor`, and per-pixel overlap remain explicit
CPU compatibility operations. Arbitrary per-frame GPU readback is unsupported.
`loadRotatedGraphic` is deprecated because Pixi performs runtime rotation;
pre-baking would multiply texture memory without preserving a useful browser
contract.

## Checkpoint verdict

C4 passes. Sprite animation and transforms match the pinned contracts at the
gameplay boundary, assets expose explicit asynchronous ownership, generated
pixel art is sharp, visual baselines pass on all three required engines, and
repeated handle changes return to a stable retained-resource count. Phase 5 may
integrate these handles into the production multi-camera renderer and add camera
effects.
