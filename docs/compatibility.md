# Upstream compatibility ledger

This ledger inventories the public API of the original ActionScript 3 Flixel source at commit `8989e5044be072c4abbbaa1317c9854786f6447f`. It is generated from 43 classes, 766 public members, and 14,928 source lines under `org/flixel`. The machine-readable source of this ledger is `upstream/as3-api-manifest.json`.

Phase 0 status means only that the member has been identified and assigned to the port plan. It does not claim the member is implemented. As implementation proceeds, every member will receive one compatibility classification: Exact, Adapted, Emulated, Deprecated, or Unsupported.

## Phase 1 provisional classifications

Checkpoint C1 measured the rendering and pixel operations that determine the
port boundary. Full class implementation remains scheduled for later phases.

| Upstream surface                                       | Classification | Destination / constraint                                                     |
| ------------------------------------------------------ | -------------- | ---------------------------------------------------------------------------- |
| `FlxCamera` transforms, filters, masks, and FX         | Adapted        | Core per-camera render-texture passes over one logical world.                |
| `FlxSprite.makeGraphic`                                | Adapted        | Core generated Pixi texture.                                                 |
| Animation `frame`, `framePixels`, and `drawFrame`      | Adapted        | Core Pixi texture frames; `framePixels` materialization is compat-only.      |
| `FlxSprite.stamp` and `replaceColor`                   | Emulated       | Optional CPU Canvas/packed-buffer or render-texture compatibility module.    |
| Mutable `FlxSprite.pixels`                             | Deprecated     | Optional compatibility staging; prefer textures and asset preprocessing.     |
| `FlxSprite.pixelsOverlapPoint` / per-pixel overlap     | Emulated       | Cached CPU alpha masks only.                                                 |
| Arbitrary per-frame GPU readback for gameplay behavior | Unsupported    | Use collision shapes, AABB tests, or alpha masks prepared during asset load. |

See [Phase 1 evidence](phase1-evidence.md) for measurements and the C1 verdict.

## Phase 2 implementation classifications

Checkpoint C2 implements the headless lifecycle surface. “Partial” entries
classify only the members delivered in Phase 2; the remaining upstream members
stay scheduled in the inventory below.

| Upstream surface                                              | Classification | Phase 2 status / adaptation                                                                                                                                                                    |
| ------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FlxPoint`                                                    | Exact          | Value, mutation, and copy behavior implemented; Flash points are represented by structural `PointLike` objects.                                                                                |
| `FlxRect`                                                     | Exact          | Edges, strict overlap, mutation, and copy behavior implemented; Flash rectangles use structural objects.                                                                                       |
| `FlxU` math, time, color, RNG, rotation, and velocity helpers | Adapted        | Implemented without Flash dependencies. `computeVelocity` accepts an optional explicit elapsed step for isolated tests. Flash reflection and `openURL` remain deferred.                        |
| `FlxBasic`                                                    | Adapted        | Lifecycle flags and hooks are implemented headlessly; renderer-specific camera/debug behavior remains adapter-owned.                                                                           |
| `FlxGroup`                                                    | Adapted        | Public collection, recursion, sorting, query, cleanup, and recycling APIs are implemented. Traversal uses a stable snapshot so additions wait one pass and removed members are skipped safely. |
| `FlxState`                                                    | Exact          | The `create` hook and inherited group lifecycle are implemented.                                                                                                                               |
| `FlxG` (minimal Phase 2 facade)                               | Adapted        | Core dimensions, timing, state, world, score/level, deterministic random, and selection APIs delegate to one explicit `FlxContext`. Other services remain scheduled.                           |
| `FlxGame` (minimal Phase 2 controller)                        | Adapted        | The recognizable constructor, fixed-step headless controller, and atomic state boundary are implemented. Browser/Pixi startup and later engine services remain scheduled.                      |

See [Phase 2 evidence](phase2-evidence.md) for contract vectors and the C2
verdict.

## Phase 3 implementation classifications

Checkpoint C3 adds authoritative world-space movement and collision. Rendering
coordinates remain a structural adapter boundary; no collision reads Pixi
transforms or bounds.

| Upstream surface                                         | Classification | Phase 3 status / adaptation                                                                                                                                                                                                                     |
| -------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FlxPath` node and mutation APIs                         | Exact          | Node order, clamped insertion/removal, copy-versus-reference behavior, and head/tail access are implemented. Debug drawing and plugin registration remain scheduled with debugger adapters.                                                     |
| `FlxObject` motion, path, health, contact, and AABB APIs | Adapted        | AS3 half-step integration, path modes, collision flags, strict overlap, reset, flicker timing, health, and world-space helpers are implemented. Screen helpers accept a structural camera explicitly; tilemap delegation arrives with tilemaps. |
| `FlxObject.separate`, `separateX`, and `separateY`       | Exact          | AS3 axis order, overlap bias, directional masks, mass/elasticity response, immovable handling, touching flags, and moving-platform carry are preserved.                                                                                         |
| `FlxQuadTree`                                            | Adapted        | AS3 single/dual-list placement and swept hulls are implemented. Callback scratch state is instance-owned and boundary-spanning pairs notify once, preventing static-state corruption and duplicate callbacks.                                   |
| `FlxList`                                                | Adapted        | The linked-list helper is implemented as an internal collision detail rather than a root package export.                                                                                                                                        |
| `FlxG.overlap` and `FlxG.collide`                        | Exact          | World bounds/divisions, self comparison, nested groups, process filtering, notification, and separation delegation are implemented.                                                                                                             |

See [Phase 3 evidence](phase3-evidence.md) for collision vectors, stress
measurements, and the C3 verdict.

## Phase 4 implementation classifications

Checkpoint C4 adds explicit browser assets and adapter-owned visual objects.
Gameplay positions, animation clocks, hitboxes, and frame selection remain
plain TypeScript state; Pixi display objects are synchronized views.

| Upstream surface                                      | Classification | Phase 4 status / adaptation                                                                                                                                                  |
| ----------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FlxAnim`                                             | Exact          | Name, copied frame sequence, seconds-per-frame delay, loop flag, and destruction are implemented.                                                                            |
| `FlxSprite` frame grids, animation, and transforms    | Adapted        | Frame/play/callback/facing/origin/offset/scale/tint/alpha/angle/visibility semantics drive container-backed Pixi sprite handles after simulation.                            |
| `FlxSprite.makeGraphic`                               | Adapted        | Packed `0xRRGGBBAA` pixels upload through an owned `BufferImageSource`; generated and sprite-sheet textures default to nearest sampling.                                     |
| `FlxSprite.loadRotatedGraphic`                        | Deprecated     | Runtime Pixi rotation replaces pre-baked Flash rotation sheets.                                                                                                              |
| `framePixels`, mutable `pixels`, `stamp`, and overlap | Emulated       | CPU packed-buffer helpers remain in the explicit compatibility module; arbitrary gameplay GPU readback remains unsupported per C1.                                           |
| `FlxText`                                             | Adapted        | Text, width wrapping, alignment, font, size, fill, one-pixel shadow, border, multiline bounds, transforms, and alpha use Pixi `Text`; `BitmapText` is an explicit fast mode. |
| `FlxTileblock`                                        | Adapted        | Seeded tile selection generates one uploadable texture from pixel-backed/preprocessed tile graphics; URL textures must be preprocessed rather than read back from the GPU.   |
| `FlxAssets` (browser-native)                          | New            | Typed descriptors, aliases, manifests, bundles, progress, retries, failure state, background loading, cache lookup, and unload wrap Pixi `Assets`.                           |

See [Phase 4 evidence](phase4-evidence.md) for the sprite-sheet oracle,
cross-browser snapshots, and lifecycle results.

## Phase 5 implementation classifications

Checkpoint C5 replaces the camera risk spike with a production adapter. Camera
simulation remains renderer-neutral, while Pixi owns render targets, viewport
sprites, and their cleanup.

| Upstream surface                                   | Classification | Phase 5 status / adaptation                                                                                                                                                                                   |
| -------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FlxCamera` follow, focus, dead zones, and bounds  | Exact          | All four AS3 follow presets, epsilon focus behavior, target edges, camera bounds, and optional world-bound updates are preserved on deterministic state.                                                      |
| Camera zoom, scale, angle, alpha, tint/background  | Adapted        | Pixi render-texture output replaces Flash bitmap buffers. Rotation uses a stable center origin instead of the upstream camera's documented “weird display results”; transparent backgrounds remain supported. |
| Flash, fade, shake, callbacks, and `stopFX`        | Exact          | Effects use simulation elapsed time and seeded Flixel randomness; AS3 zero-alpha effect colors retain their opaque fallback.                                                                                  |
| `FlxG` camera collection and FX facade             | Adapted        | Add/select/remove/reset, background color, and FX broadcasts delegate to `FlxContext`; the context always retains one valid primary camera.                                                                   |
| `FlxBasic.cameras` and camera-aware sprite draw    | Adapted        | A null list routes to all active cameras; explicit lists isolate world objects or HUD labels through one retained render registry.                                                                            |
| Screen/world and pointer conversion                | Adapted        | Typed transforms cover viewport translation, scroll, scroll factor, zoom, independent scale, center rotation, and shake, with inverse round-trip and rendered-transform contracts.                            |
| `FlxCamera.buffer`, `screen`, and container access | Unsupported    | Flash `BitmapData`/display-list objects are replaced by explicit `FlxCameraView` resources owned by `FlxCameraRenderer`; gameplay code should not mutate them.                                                |

See [Phase 5 evidence](phase5-evidence.md) for the pinned AS3 oracle,
cross-browser split-screen scene, resource-lifecycle proof, and C5 verdict.

## Phase 6 implementation classifications

Checkpoint C6 separates authoritative tile data from adapter-owned Pixi chunks.
Tile collision, rays, and paths run without a renderer; one subscribed render
handle services every camera and rebuilds only changed visible chunks.

| Upstream surface                                    | Classification | Phase 6 status / adaptation                                                                                                                                                                    |
| --------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FlxTilemap` CSV, queries, mutation, and bounds     | Adapted        | CSV/data loading, exports, indices, instances, coordinates, offsets, bounds, following, mutation, and dirty notifications are implemented with explicit validation.                            |
| OFF/AUTO/ALT autotiling                             | Exact          | The pinned four-neighbor bitmask, ALT interior-corner priority, `+1` indexing, and local 3×3 mutation update are preserved in committed fixtures.                                              |
| Tile overlap, properties, callbacks, and separation | Adapted        | Reusable `FlxTile` proxies preserve directional masks, map indices, filters, callbacks, and `FlxObject.separate`; non-solid callbacks require a real geometric overlap instead of the AS3 bug. |
| Rays, pathfinding, and simplification               | Adapted        | Rays sample at tile resolution; A* replaces the upstream documented brute-force flood while retaining eight directions, equal step cost, no diagonal corner cutting, and solid-tile rules.     |
| `FlxTilemapBuffer`                                  | Emulated       | Camera-sized packed-pixel compatibility metadata remains available; production drawing uses subscribed `FlxTilemapRenderHandle` chunks instead of Flash `BitmapData`.                          |
| Tilemap drawing and multi-camera buffers            | Adapted        | Shared tileset subtextures feed lazy 16×16-tile Pixi containers. Camera culling is zoom-aware, dirty chunks rebuild once, and sequential camera passes never duplicate authoritative data.     |
| `ImgAuto`, `ImgAutoAlt`, and `imageToCSV`           | Deprecated     | Built-in embedded Flash assets/classes are omitted; callers provide a tileset or a packed pixel buffer explicitly.                                                                             |

See [Phase 6 evidence](phase6-evidence.md) for pinned fixtures, collision and
path contracts, chunk metrics, cross-browser snapshots, and the C6 verdict.

## Phase 7 implementation classifications

Checkpoint C7 queues browser events independently of display cadence and
publishes them through context-owned input state on fixed simulation steps.

| Upstream surface                          | Classification | Phase 7 status / adaptation                                                                                                                                                               |
| ----------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Input` digital transitions and snapshots | Exact          | The pinned `2 → 1` pressed and `-1 → 0` released states, named queries, reset, any-key, numeric records, and playback are preserved.                                                      |
| `Keyboard` names and event capture        | Adapted        | Public key names and legacy values remain; DOM `code` is preferred for physical bindings, with `keyCode`/`key` fallback and explicit `CTRL`/`RETURN` aliases.                             |
| `Mouse` buttons, wheel, and coordinates   | Adapted        | Pointer Events replace Flash mouse events; CSS-to-logical scaling, capture, cancellation, multi-button state, cursor CSS, and the full C5 inverse camera transform are implemented.       |
| `FlxButton` interaction and appearance    | Adapted        | Three states, label offsets, externally controlled checkbox highlighting, four callbacks, and four backend-neutral sound hooks are retained in one composite Pixi render handle.          |
| Stage/UI-thread mouse-up listener         | Adapted        | The input queue plus pointer capture replaces the Flash stage listener. Activation occurs on an uncancelled authoritative release and never directly inside a DOM or Pixi event callback. |
| `FlxG.keys`, `mouse`, and `resetInput`    | Adapted        | The facade resolves a typed `FlxInputService` from the active context; `FlxGame` installs and advances a headless-capable manager before every state step.                                |

See [Phase 7 evidence](phase7-evidence.md) for low-FPS transition proofs,
mapping notes, cancellation tests, replay snapshots, browser baselines, and the
C7 verdict.

## Phase 8 implementation classifications

Checkpoint C8 retains group-owned simulation state while adding deterministic
effects services and an optional high-throughput Pixi projection.

| Upstream surface                              | Classification | Phase 8 status / adaptation                                                                                                                                                |
| --------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FlxParticle` lifespan and contact behavior   | Exact          | Lifespan, gravity-only floor friction, contact spin reversal, elasticity response, and `onEmit()` are advanced on fixed simulation steps.                                  |
| `FlxEmitter` burst, stream, and launch ranges | Adapted        | Geometry, seeded ranges, quantity, catch-up emission, gravity, drag, bounce, custom particle classes, and recycling are preserved; Pixi rotation replaces baked sheets.    |
| `FlxEmitter.makeParticles` graphics argument  | Adapted        | Browser-native `FlxGraphic`/Pixi `Texture` inputs replace embedded AS3 classes. Multiple frames remain seeded; baked-rotation counts are accepted but intentionally inert. |
| `FlxTimer` and `TimerManager`                 | Exact          | Game-time loops, pause/resume, infinite loops, progress, cancel, final-stop-before-callback, catch-up, and state-switch cleanup are preserved.                             |
| `FlxG` plugin APIs and ordering               | Adapted        | Add/get/remove/remove-type and update/draw ordering remain; stable snapshot traversal makes callback removal safe instead of retaining the upstream skip hazard.           |
| `DebugPathDisplay` and `FlxPath` registration | Adapted        | Paths self-register with the context plugin and render per camera through a dedicated Pixi `Graphics` layer using debug colors and scroll factors.                         |
| Pixi `ParticleContainer` projection           | New            | An explicit render option mirrors stable group members into lightweight Pixi particles; it never owns lifespan, emission, randomness, or recycling.                        |

See [Phase 8 evidence](phase8-evidence.md) for seeded vectors, allocation
plateau tests, timer/state boundaries, plugin mutation proofs, browser checks,
and the C8 verdict.

The extraction helper is `scripts/extract-as3-api.mjs`. To re-check the source inventory against a local upstream clone:

```bash
node scripts/extract-as3-api.mjs /path/to/flixel/org/flixel
```

## Inventory

### `org.flixel.FlxBasic`

- Source: `FlxBasic.as`
- Public API (17): `active`, `alive`, `cameras`, `destroy`, `draw`, `drawDebug`, `exists`, `FlxBasic`, `ID`, `ignoreDrawDebug`, `kill`, `postUpdate`, `preUpdate`, `revive`, `toString`, `update`, `visible`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.FlxButton` extends `FlxSprite`

- Source: `FlxButton.as`
- Public API (21): `destroy`, `draw`, `FlxButton`, `static HIGHLIGHT`, `label`, `labelOffset`, `static NORMAL`, `on (get/set)`, `onDown`, `onOut`, `onOver`, `onUp`, `static PRESSED`, `preUpdate`, `setSounds`, `soundDown`, `soundOut`, `soundOver`, `soundUp`, `status`, `update`
- Phase 7 status: implemented with deterministic input state and a composite Pixi render handle; embedded sound classes are backend-neutral sound hooks.

### `org.flixel.FlxCamera` extends `FlxBasic`

- Source: `FlxCamera.as`
- Public API (39): `alpha (get/set)`, `angle (get/set)`, `antialiasing (get/set)`, `bgColor`, `bounds`, `buffer`, `color (get/set)`, `copyFrom`, `deadzone`, `static defaultZoom`, `destroy`, `fade`, `fill`, `flash`, `FlxCamera`, `focusOn`, `follow`, `getContainerSprite`, `getScale`, `height`, `screen`, `scroll`, `setBounds`, `setScale`, `shake`, `static SHAKE_BOTH_AXES`, `static SHAKE_HORIZONTAL_ONLY`, `static SHAKE_VERTICAL_ONLY`, `stopFX`, `static STYLE_LOCKON`, `static STYLE_PLATFORMER`, `static STYLE_TOPDOWN`, `static STYLE_TOPDOWN_TIGHT`, `target`, `update`, `width`, `x`, `y`, `zoom (get/set)`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.FlxEmitter` extends `FlxGroup`

- Source: `FlxEmitter.as`
- Public API (27): `at`, `bounce`, `destroy`, `emitParticle`, `FlxEmitter`, `frequency`, `gravity`, `height`, `kill`, `lifespan`, `makeParticles`, `maxParticleSpeed`, `maxRotation`, `minParticleSpeed`, `minRotation`, `on`, `particleClass`, `particleDrag`, `setRotation`, `setSize`, `setXSpeed`, `setYSpeed`, `start`, `update`, `width`, `x`, `y`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.FlxG`

- Source: `FlxG.as`
- Public API (90): `static addBitmap`, `static addCamera`, `static addPlugin`, `static bgColor (get/set)`, `static BLACK`, `static BLUE`, `static camera`, `static cameras`, `static checkBitmapCache`, `static clearBitmapCache`, `static collide`, `static createBitmap`, `static debug`, `static DEBUGGER_BIG`, `static DEBUGGER_LEFT`, `static DEBUGGER_MICRO`, `static DEBUGGER_RIGHT`, `static DEBUGGER_STANDARD`, `static DEBUGGER_TOP`, `static elapsed`, `static fade`, `static flash`, `static flashFramerate (get/set)`, `static flashGfx`, `static flashGfxSprite`, `static framerate (get/set)`, `static getLibraryName`, `static getPlugin`, `static getRandom`, `static globalSeed`, `static GREEN`, `static height`, `static keys`, `static level`, `static levels`, `static LIBRARY_MAJOR_VERSION`, `static LIBRARY_MINOR_VERSION`, `static LIBRARY_NAME`, `static loadReplay`, `static loadSound`, `static log`, `static mobile`, `static mouse`, `static music`, `static mute`, `static overlap`, `static paused`, `static pauseSounds`, `static PINK`, `static play`, `static playMusic`, `static plugins`, `static random`, `static recordReplay`, `static RED`, `static reloadReplay`, `static removeCamera`, `static removePlugin`, `static removePluginType`, `static resetCameras`, `static resetDebuggerLayout`, `static resetGame`, `static resetInput`, `static resetState`, `static resumeSounds`, `static save`, `static saves`, `static score`, `static scores`, `static setDebuggerLayout`, `static shake`, `static shuffle`, `static sounds`, `static stage (get)`, `static state (get)`, `static stopRecording`, `static stopReplay`, `static stream`, `static switchState`, `static timeScale`, `static unwatch`, `static useBufferLocking`, `static visualDebug`, `static volume (get/set)`, `static volumeHandler`, `static watch`, `static WHITE`, `static width`, `static worldBounds`, `static worldDivisions`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.FlxGame` extends `Sprite`

- Source: `FlxGame.as`
- Public API (4): `FlxGame`, `forceDebugger`, `useSoundHotKeys`, `useSystemCursor`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.FlxGroup` extends `FlxBasic`

- Source: `FlxGroup.as`
- Public API (27): `add`, `static ASCENDING`, `callAll`, `clear`, `countDead`, `countLiving`, `static DESCENDING`, `destroy`, `draw`, `FlxGroup`, `getFirstAlive`, `getFirstAvailable`, `getFirstDead`, `getFirstExtant`, `getFirstNull`, `getRandom`, `kill`, `length`, `maxSize (get/set)`, `members`, `preUpdate`, `recycle`, `remove`, `replace`, `setAll`, `sort`, `update`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.FlxObject` extends `FlxBasic`

- Source: `FlxObject.as`
- Public API (67): `acceleration`, `allowCollisions`, `angle`, `angularAcceleration`, `angularDrag`, `angularVelocity`, `static ANY`, `static CEILING`, `destroy`, `static DOWN`, `drag`, `draw`, `drawDebug`, `elasticity`, `flicker`, `flickering (get)`, `static FLOOR`, `FlxObject`, `followPath`, `getMidpoint`, `getScreenXY`, `health`, `height`, `hurt`, `immovable`, `isTouching`, `justTouched`, `last`, `static LEFT`, `mass`, `maxAngular`, `maxVelocity`, `moves`, `static NONE`, `onScreen`, `static OVERLAP_BIAS`, `overlaps`, `overlapsAt`, `overlapsPoint`, `path`, `static PATH_BACKWARD`, `static PATH_FORWARD`, `static PATH_HORIZONTAL_ONLY`, `static PATH_LOOP_BACKWARD`, `static PATH_LOOP_FORWARD`, `static PATH_VERTICAL_ONLY`, `static PATH_YOYO`, `pathAngle`, `pathSpeed`, `postUpdate`, `preUpdate`, `reset`, `static RIGHT`, `scrollFactor`, `static separate`, `static separateX`, `static separateY`, `solid (get/set)`, `stopFollowingPath`, `touching`, `static UP`, `velocity`, `static WALL`, `wasTouching`, `width`, `x`, `y`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.FlxParticle` extends `FlxSprite`

- Source: `FlxParticle.as`
- Public API (5): `FlxParticle`, `friction`, `lifespan`, `onEmit`, `update`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.FlxPath`

- Source: `FlxPath.as`
- Public API (16): `add`, `addAt`, `addPoint`, `addPointAt`, `debugColor`, `debugScrollFactor`, `destroy`, `drawDebug`, `FlxPath`, `head`, `ignoreDrawDebug`, `static manager (get)`, `nodes`, `remove`, `removeAt`, `tail`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.FlxPoint`

- Source: `FlxPoint.as`
- Public API (8): `copyFrom`, `copyFromFlash`, `copyTo`, `copyToFlash`, `FlxPoint`, `make`, `x`, `y`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.FlxRect`

- Source: `FlxRect.as`
- Public API (15): `bottom (get)`, `copyFrom`, `copyFromFlash`, `copyTo`, `copyToFlash`, `FlxRect`, `height`, `left (get)`, `make`, `overlaps`, `right (get)`, `top (get)`, `width`, `x`, `y`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.FlxSave` extends `Object`

- Source: `FlxSave.as`
- Public API (8): `bind`, `close`, `data`, `destroy`, `erase`, `flush`, `FlxSave`, `name`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.FlxSound` extends `FlxBasic`

- Source: `FlxSound.as`
- Public API (24): `amplitude`, `amplitudeLeft`, `amplitudeRight`, `artist`, `autoDestroy`, `destroy`, `fadeIn`, `fadeOut`, `FlxSound`, `getActualVolume`, `kill`, `loadEmbedded`, `loadStream`, `name`, `pause`, `play`, `proximity`, `resume`, `stop`, `survive`, `update`, `volume (get/set)`, `x`, `y`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.FlxSprite` extends `FlxObject`

- Source: `FlxSprite.as`
- Public API (36): `addAnimation`, `addAnimationCallback`, `alpha (get/set)`, `antialiasing`, `blend`, `centerOffsets`, `color (get/set)`, `destroy`, `dirty`, `draw`, `drawFrame`, `drawLine`, `facing (get/set)`, `fill`, `finished`, `FlxSprite`, `frame (get/set)`, `frameHeight`, `framePixels`, `frames`, `frameWidth`, `loadGraphic`, `loadRotatedGraphic`, `makeGraphic`, `offset`, `onScreen`, `origin`, `pixels (get/set)`, `pixelsOverlapPoint`, `play`, `postUpdate`, `randomFrame`, `replaceColor`, `scale`, `setOriginToCorner`, `stamp`
- Phase 4 status: core sprite/frame/animation/transform surface implemented;
  Flash pixel mutation is classified above and pre-baked rotation is deprecated.

### `org.flixel.FlxState` extends `FlxGroup`

- Source: `FlxState.as`
- Public API (1): `create`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.FlxText` extends `FlxSprite`

- Source: `FlxText.as`
- Public API (9): `alignment (get/set)`, `color (get/set)`, `destroy`, `FlxText`, `font (get/set)`, `setFormat`, `shadow (get/set)`, `size (get/set)`, `text (get/set)`
- Phase 4 status: implemented through adapter-owned Pixi `Text`/`BitmapText`.

### `org.flixel.FlxTileblock` extends `FlxSprite`

- Source: `FlxTileblock.as`
- Public API (2): `FlxTileblock`, `loadTiles`
- Phase 4 status: implemented for generated or preprocessed pixel-backed tiles.

### `org.flixel.FlxTilemap` extends `FlxObject`

- Source: `FlxTilemap.as`
- Public API (34): `static ALT`, `static arrayToCSV`, `auto`, `static AUTO`, `static bitmapToCSV`, `destroy`, `draw`, `findPath`, `FlxTilemap`, `follow`, `getBounds`, `getData`, `getTile`, `getTileByIndex`, `getTileCoords`, `getTileInstances`, `heightInTiles`, `static imageToCSV`, `static ImgAuto`, `static ImgAutoAlt`, `loadMap`, `static OFF`, `overlaps`, `overlapsAt`, `overlapsPoint`, `overlapsWithCallback`, `ray`, `setDirty`, `setTile`, `setTileByIndex`, `setTileProperties`, `totalTiles`, `update`, `widthInTiles`
- Phase 6 status: implemented with renderer-neutral data/collision and a subscribed Pixi chunk adapter; embedded Flash autotile assets are deprecated.

### `org.flixel.FlxTimer`

- Source: `FlxTimer.as`
- Public API (13): `destroy`, `finished`, `FlxTimer`, `loops`, `loopsLeft (get)`, `static manager (get)`, `paused`, `progress (get)`, `start`, `stop`, `time`, `timeLeft (get)`, `update`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.FlxU`

- Source: `FlxU.as`
- Public API (27): `static abs`, `static bound`, `static ceil`, `static compareClassNames`, `static computeVelocity`, `static floor`, `static formatArray`, `static formatMoney`, `static formatTicks`, `static formatTime`, `static getAngle`, `static getClass`, `static getClassName`, `static getDistance`, `static getHSB`, `static getRandom`, `static getRGBA`, `static getTicks`, `static makeColor`, `static makeColorFromHSB`, `static max`, `static min`, `static openURL`, `static rotatePoint`, `static round`, `static shuffle`, `static srand`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.plugin.DebugPathDisplay` extends `FlxBasic`

- Source: `plugin/DebugPathDisplay.as`
- Public API (7): `add`, `clear`, `DebugPathDisplay`, `destroy`, `draw`, `drawDebug`, `remove`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.plugin.TimerManager` extends `FlxBasic`

- Source: `plugin/TimerManager.as`
- Public API (6): `add`, `clear`, `destroy`, `remove`, `TimerManager`, `update`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.system.debug.Log` extends `FlxWindow`

- Source: `system/debug/Log.as`
- Public API (3): `add`, `destroy`, `Log`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.system.debug.Perf` extends `FlxWindow`

- Source: `system/debug/Perf.as`
- Public API (8): `activeObjects`, `destroy`, `flash`, `flixelDraw`, `flixelUpdate`, `Perf`, `update`, `visibleObjects`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.system.debug.VCR` extends `Sprite`

- Source: `system/debug/VCR.as`
- Public API (16): `destroy`, `onOpen`, `onPause`, `onPlay`, `onRecord`, `onRestart`, `onStep`, `onStop`, `paused`, `playing`, `recording`, `stepRequested`, `stopped`, `stopRecording`, `updateRuntime`, `VCR`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.system.debug.Vis` extends `Sprite`

- Source: `system/debug/Vis.as`
- Public API (3): `destroy`, `onBounds`, `Vis`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.system.debug.Watch` extends `FlxWindow`

- Source: `system/debug/Watch.as`
- Public API (8): `add`, `destroy`, `editing`, `remove`, `removeAll`, `submit`, `update`, `Watch`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.system.debug.WatchEntry`

- Source: `system/debug/WatchEntry.as`
- Public API (16): `cancel`, `custom`, `destroy`, `editing`, `field`, `nameDisplay`, `object`, `oldValue`, `onKeyUp`, `onMouseUp`, `setY`, `submit`, `updateValue`, `updateWidth`, `valueDisplay`, `WatchEntry`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.system.FlxAnim`

- Source: `system/FlxAnim.as`
- Public API (6): `delay`, `destroy`, `FlxAnim`, `frames`, `looped`, `name`
- Phase 4 status: implemented.

### `org.flixel.system.FlxDebugger` extends `Sprite`

- Source: `system/FlxDebugger.as`
- Public API (10): `destroy`, `FlxDebugger`, `hasMouse`, `log`, `perf`, `resetLayout`, `setLayout`, `vcr`, `vis`, `watch`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.system.FlxList`

- Source: `system/FlxList.as`
- Public API (4): `destroy`, `FlxList`, `next`, `object`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.system.FlxPreloader` extends `MovieClip`

- Source: `system/FlxPreloader.as`
- Public API (4): `className`, `FlxPreloader`, `minDisplayTime`, `myURL`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.system.FlxQuadTree` extends `FlxRect`

- Source: `system/FlxQuadTree.as`
- Public API (8): `static A_LIST`, `add`, `static B_LIST`, `destroy`, `static divisions`, `execute`, `FlxQuadTree`, `load`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.system.FlxReplay`

- Source: `system/FlxReplay.as`
- Public API (12): `create`, `destroy`, `finished`, `FlxReplay`, `frame`, `frameCount`, `load`, `playNextFrame`, `recordFrame`, `rewind`, `save`, `seed`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.system.FlxTile` extends `FlxObject`

- Source: `system/FlxTile.as`
- Public API (7): `callback`, `destroy`, `filter`, `FlxTile`, `index`, `mapIndex`, `tilemap`
- Phase 6 status: implemented as the reusable tile collision/callback proxy.

### `org.flixel.system.FlxTilemapBuffer`

- Source: `system/FlxTilemapBuffer.as`
- Public API (12): `columns`, `destroy`, `dirty`, `draw`, `fill`, `FlxTilemapBuffer`, `height`, `pixels (get)`, `rows`, `width`, `x`, `y`
- Phase 6 status: emulated for compatibility metadata and packed pixels; production rendering uses `FlxTilemapRenderHandle` chunks.

### `org.flixel.system.FlxWindow` extends `Sprite`

- Source: `system/FlxWindow.as`
- Public API (6): `destroy`, `FlxWindow`, `maxSize`, `minSize`, `reposition`, `resize`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.system.input.Input`

- Source: `system/input/Input.as`
- Public API (11): `any`, `destroy`, `getKeyCode`, `Input`, `justPressed`, `justReleased`, `playback`, `pressed`, `record`, `reset`, `update`
- Phase 7 status: implemented with pinned numeric transitions and snapshot record/playback.

### `org.flixel.system.input.Keyboard` extends `Input`

- Source: `system/input/Keyboard.as`
- Public API (94): `A`, `ALT`, `B`, `BACKSLASH`, `BACKSPACE`, `C`, `CAPSLOCK`, `COMMA`, `CONTROL`, `D`, `DELETE`, `DOWN`, `E`, `EIGHT`, `END`, `ENTER`, `ESCAPE`, `F`, `F1`, `F10`, `F11`, `F12`, `F2`, `F3`, `F4`, `F5`, `F6`, `F7`, `F8`, `F9`, `FIVE`, `FOUR`, `G`, `H`, `handleKeyDown`, `handleKeyUp`, `HOME`, `I`, `INSERT`, `J`, `K`, `Keyboard`, `L`, `LBRACKET`, `LEFT`, `M`, `MINUS`, `N`, `NINE`, `NUMPADEIGHT`, `NUMPADFIVE`, `NUMPADFOUR`, `NUMPADMINUS`, `NUMPADNINE`, `NUMPADONE`, `NUMPADPERIOD`, `NUMPADPLUS`, `NUMPADSEVEN`, `NUMPADSIX`, `NUMPADSLASH`, `NUMPADTHREE`, `NUMPADTWO`, `NUMPADZERO`, `O`, `ONE`, `P`, `PAGEDOWN`, `PAGEUP`, `PERIOD`, `PLUS`, `Q`, `QUOTE`, `R`, `RBRACKET`, `RIGHT`, `S`, `SEMICOLON`, `SEVEN`, `SHIFT`, `SIX`, `SLASH`, `SPACE`, `T`, `TAB`, `THREE`, `TWO`, `U`, `UP`, `V`, `W`, `X`, `Y`, `Z`, `ZERO`
- Phase 7 status: implemented with physical DOM `code` mappings plus documented compatibility fallbacks and aliases.

### `org.flixel.system.input.Mouse` extends `FlxPoint`

- Source: `system/input/Mouse.as`
- Public API (22): `destroy`, `getScreenPosition`, `getWorldPosition`, `handleMouseDown`, `handleMouseUp`, `handleMouseWheel`, `hide`, `justPressed`, `justReleased`, `load`, `Mouse`, `playback`, `pressed`, `record`, `reset`, `screenX`, `screenY`, `show`, `unload`, `update`, `visible (get)`, `wheel`
- Phase 7 status: implemented with Pointer Events, capture/cancellation safety, CSS cursors, and C5 camera transforms.

### `org.flixel.system.replay.FrameRecord`

- Source: `system/replay/FrameRecord.as`
- Public API (8): `create`, `destroy`, `frame`, `FrameRecord`, `keys`, `load`, `mouse`, `save`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.

### `org.flixel.system.replay.MouseRecord`

- Source: `system/replay/MouseRecord.as`
- Public API (5): `button`, `MouseRecord`, `wheel`, `x`, `y`
- Phase 0 status: inventoried; implementation is scheduled by the port plan.
