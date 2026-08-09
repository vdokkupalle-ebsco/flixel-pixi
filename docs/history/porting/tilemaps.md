# Phase 6 evidence: tilemaps, collision, and paths

- Checkpoint: C6 tilemap gate
- Status: Passed
- Date: 2026-08-06
- Upstream oracle: Flixel commit `8989e5044be072c4abbbaa1317c9854786f6447f`
- PixiJS baseline: 8.19

Phase 6 ports `FlxTilemap`, `FlxTile`, and the useful compatibility surface of
`FlxTilemapBuffer`. `FlxTilemap` is the authoritative world object: its flat
integer data, tile properties, overlap proxies, ray tests, and path search do
not inspect Pixi display state. `FlxTilemapRenderHandle` subscribes to targeted
data changes and owns the lazy Pixi chunk hierarchy.

## Delivered surface

The package exports CSV and numeric-data loading, OFF/AUTO/ALT modes, dimensions,
raw or collision-simplified data, coordinate/index queries, instances, world
coordinates, bounds, camera following, mutations, tile property ranges,
directional collision masks, callback filters, rays, and pathfinding. Defensive
validation rejects ragged CSV, invalid dimensions, invalid values, missing
tileset frames, and out-of-range property spans; query/mutation methods retain
the upstream false/zero/null sentinel style where it is useful.

`FlxG.overlap` and `FlxG.collide` recognize a tilemap on either side and preserve
callback ordering. Each tile type owns one reusable `FlxTile` proxy. Before a
test, the proxy receives the selected tile's world position, previous map
position, and map index, so `FlxObject.separate` retains directional masks,
touching flags, one-way behavior, and moving-map deltas.

The path search uses A* over the upstream eight-neighbor topology. Cardinal and
diagonal moves have equal cost to match the pinned flood, and diagonal moves are
rejected when either adjacent cardinal tile is solid. Basic simplification
removes collinear nodes. Optional ray simplification greedily removes additional
nodes only when the resulting segment passes the same solid-tile ray test.

## Pinned AS3 contracts

The implementation was checked against pinned `FlxTilemap.as`,
`system/FlxTile.as`, and `system/FlxTilemapBuffer.as`:

- OFF preserves input indices and honors independent starting, draw, and
  collision indices;
- AUTO adds neighbor bits in UP/RIGHT/DOWN/LEFT order (`1/2/4/8`) and then adds
  one to select the tileset frame;
- ALT preserves the pinned bottom-left, top-left, top-right, bottom-right
  overwrite priority for an otherwise fully surrounded tile;
- an autotile mutation recomputes only the local 3×3 neighborhood;
- collision selection clips the object's tile rectangle to map bounds and uses
  one extra row and column like the AS3 implementation;
- tile callbacks receive a reusable tile object plus the overlapping object,
  with `mapIndex` identifying the exact cell;
- paths reject solid endpoints and diagonal corner cutting;
- `follow` applies tile-sized borders to camera and optional world bounds.

One upstream defect is intentionally corrected: AS3 invokes callbacks on
non-solid tiles merely because they are in the selected neighborhood, without
first assigning their world position. This port requires a real geometric
overlap and always assigns position/map index before invoking the callback.

## Dirty chunks and multi-camera behavior

The renderer divides a map into 16×16-tile chunks by default. Chunks are
materialized lazily, retain sprites and shared `FlxGraphic.frameTexture`
subtextures between frames, and rebuild only after a subscribed mutation marks
their key dirty. A mutation in a hidden chunk remains dirty until a camera can
see it. Full invalidation marks keys without immediately allocating containers.

Visibility is calculated independently for every camera, including zoomed-out
view extents. Cameras render sequentially through one handle, so the first
camera that sees a dirty chunk rebuilds it and later cameras reuse the clean
result. No camera owns a copy of map data or tileset frames. Destroying the
handle unsubscribes it before containers are destroyed, while shared textures
remain owned by `FlxGraphic`.

## C6 browser scene

Open `/tilemaps.html` to run a `96 × 48` map in a `500 × 264` platformer-follow
camera and a `260 × 264` zoomed overview simultaneously. The target follows a
twelve-second deterministic path driven by `FixedStepAccumulator`. Runtime
tiles toggle once per simulation second, producing localized chunk rebuilds.
The overview and follow views use the same map handle; labels demonstrate
camera-specific HUD routing.

The harness proves that one visible mutation causes exactly one chunk rebuild,
the large map is represented by one shared handle, an A* path is found, every
ray-simplified segment remains clear, and camera motion changes after 120 exact
steps. Three committed visual baselines cover Chromium, Firefox, and WebKit at a
1.5% changed-pixel tolerance.

## Verification and performance

The headless suite contains 96 passing tests across 15 files, including eleven
Phase 6 cases for parsing/export, OFF/AUTO/ALT fixtures, validation, pixel
conversion/buffer compatibility, one-way collision and callbacks, rays and
paths, dirty chunks, and multi-camera ownership. Coverage is 96.89% statements,
91.50% branches, 97.69% functions, and 98.31% lines. The browser file adds six
engine/test combinations for the live C6 scene, bringing the complete browser
matrix to 30 combinations. The benchmark report adds 1,000 targeted dirty-chunk
mutations and a simplified path across a `128 × 128` map. These benchmarks are
regression diagnostics rather than cross-device frame rate promises.

Representative means on the development machine were 3.381 ms for 1,000
targeted tile mutations plus visible chunk rebuilds, and 0.0803 ms for a
simplified A* path across the `128 × 128` map. The production ESM bundle is
133,852 bytes raw and 31,446 bytes gzip. These numbers are committed as
regression baselines, not universal hardware budgets.

## Checkpoint verdict

C6 passes. Known maps produce pinned autotile indices; offset, one-way, callback,
mutation, ray, and path contracts pass headlessly; simplifiers do not cross
solids; one changed tile rebuilds one affected visible chunk; and two cameras
share map data and clean chunks. Phase 7 may add step-boundary input without
coupling DOM events to tile collision or renderer state.
