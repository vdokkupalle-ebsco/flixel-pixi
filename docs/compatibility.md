# Upstream compatibility ledger

This ledger inventories the public API of the original ActionScript 3 Flixel source at commit `8989e5044be072c4abbbaa1317c9854786f6447f`. It is generated from 43 classes, 766 public members, and 14,928 source lines under `org/flixel`. The machine-readable source of this ledger is `upstream/as3-api-manifest.json`.

Every inventory entry below carries a final compatibility classification:
Exact, Adapted, Emulated, Deprecated, or Unsupported. The capability summaries
provide narrative context; the inventory is the member-level ledger with no
unknown rows.

## Rendering provisional classifications

The rendering spike measured the pixel operations that determine the port
boundary.

| Upstream surface                                       | Classification | Destination / constraint                                                     |
| ------------------------------------------------------ | -------------- | ---------------------------------------------------------------------------- |
| `FlxCamera` transforms, filters, masks, and FX         | Adapted        | Core per-camera render-texture passes over one logical world.                |
| `FlxSprite.makeGraphic`                                | Adapted        | Core generated Pixi texture.                                                 |
| Animation `frame`, `framePixels`, and `drawFrame`      | Adapted        | Core Pixi texture frames; `framePixels` materialization is compat-only.      |
| `FlxSprite.stamp` and `replaceColor`                   | Emulated       | Optional CPU Canvas/packed-buffer or render-texture compatibility module.    |
| Mutable `FlxSprite.pixels`                             | Deprecated     | Optional compatibility staging; prefer textures and asset preprocessing.     |
| `FlxSprite.pixelsOverlapPoint` / per-pixel overlap     | Emulated       | Cached CPU alpha masks only.                                                 |
| Arbitrary per-frame GPU readback for gameplay behavior | Unsupported    | Use collision shapes, AABB tests, or alpha masks prepared during asset load. |

See the [historical rendering evidence](history/porting/rendering-spikes.md) for
the original measurements and verdict.

## Headless core implementation classifications

The headless-core milestone established the lifecycle surface and its adaptation
boundaries.

| Upstream surface                                              | Classification | Headless core status / adaptation                                                                                                                                                                                                                               |
| ------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FlxPoint`                                                    | Exact          | Value, mutation, and copy behavior implemented; Flash points are represented by structural `PointLike` objects.                                                                                                                                                 |
| `FlxRect`                                                     | Exact          | Edges, strict overlap, mutation, and copy behavior implemented; Flash rectangles use structural objects.                                                                                                                                                        |
| `FlxU` math, time, color, RNG, rotation, and velocity helpers | Adapted        | Implemented without Flash dependencies. `computeVelocity` accepts an optional explicit elapsed step for isolated tests. Flash reflection and `openURL` remain deferred.                                                                                         |
| `FlxBasic`                                                    | Adapted        | Lifecycle flags and hooks are implemented headlessly; renderer-specific camera/debug behavior remains adapter-owned.                                                                                                                                            |
| `FlxGroup`                                                    | Adapted        | Public collection, recursion, sorting, query, cleanup, and recycling APIs are implemented. Traversal uses a stable snapshot so additions wait one pass and removed members are skipped safely.                                                                  |
| `FlxState` and HaxeFlixel-style `FlxSubState`                 | Adapted        | State/group lifecycle plus deferred nested overlays, persistence flags, create-once reuse, callbacks, signals, and destruction policy are implemented. Substate background artwork remains an explicit state member rather than a renderer-owned implicit fill. |
| `FlxG` (minimal headless-core facade)                         | Adapted        | Core dimensions, timing, state, world, score/level, deterministic random, and selection APIs delegate to one explicit `FlxContext`. Other services remain scheduled.                                                                                            |
| `FlxGame` (minimal headless-core controller)                  | Adapted        | The recognizable constructor, fixed-step headless controller, and atomic state boundary are implemented. Browser/Pixi startup and later engine services remain scheduled.                                                                                       |

See the [historical headless-core evidence](history/porting/headless-core.md) for
contract vectors and the original verdict.

## Collision implementation classifications

The collision milestone added authoritative world-space movement. Rendering
coordinates remain a structural adapter boundary; no collision reads Pixi
transforms or bounds.

| Upstream surface                                         | Classification | Collision status / adaptation                                                                                                                                                                                                                   |
| -------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FlxPath` node and mutation APIs                         | Exact          | Node order, clamped insertion/removal, copy-versus-reference behavior, and head/tail access are implemented. Debug drawing and plugin registration remain scheduled with debugger adapters.                                                     |
| `FlxObject` motion, path, health, contact, and AABB APIs | Adapted        | AS3 half-step integration, path modes, collision flags, strict overlap, reset, flicker timing, health, and world-space helpers are implemented. Screen helpers accept a structural camera explicitly; tilemap delegation arrives with tilemaps. |
| `FlxObject.separate`, `separateX`, and `separateY`       | Exact          | AS3 axis order, overlap bias, directional masks, mass/elasticity response, immovable handling, touching flags, and moving-platform carry are preserved.                                                                                         |
| `FlxQuadTree`                                            | Adapted        | AS3 single/dual-list placement and swept hulls are implemented. Callback scratch state is instance-owned and boundary-spanning pairs notify once, preventing static-state corruption and duplicate callbacks.                                   |
| `FlxList`                                                | Adapted        | The linked-list helper is implemented as an internal collision detail rather than a root package export.                                                                                                                                        |
| `FlxG.overlap` and `FlxG.collide`                        | Exact          | World bounds/divisions, self comparison, nested groups, process filtering, notification, and separation delegation are implemented.                                                                                                             |

Modern HaxeFlixel container parity is tracked separately from the pinned AS3
inventory. At HaxeFlixel commit
`8c7b551f203a78ab0e7ee6757f39693d35108d24`, `FlxContainer`,
`FlxSpriteContainer`, and `FlxSpriteGroup` are classified **Adapted**:
exclusive ownership is preserved, composite collision expands to member AABBs,
and world-authoritative member coordinates drive adapter-owned Pixi `Container`
branches. See the [container guide](guides/containers.md) for the exact
local/world and lifecycle contract.

See the [historical collision evidence](history/porting/collision.md) for
collision vectors and stress measurements.

## Sprites and text implementation classifications

The sprites-and-text milestone added explicit browser assets and adapter-owned
visual objects.
Gameplay positions, animation clocks, hitboxes, and frame selection remain
plain TypeScript state; Pixi display objects are synchronized views.

| Upstream surface                                      | Classification | Sprites and text status / adaptation                                                                                                                                         |
| ----------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FlxAnim`                                             | Exact          | Name, copied frame sequence, seconds-per-frame delay, loop flag, and destruction are implemented.                                                                            |
| `FlxSprite` frame grids, animation, and transforms    | Adapted        | Frame/play/callback/facing/origin/offset/scale/tint/alpha/angle/visibility semantics drive container-backed Pixi sprite handles after simulation.                            |
| `FlxSprite.makeGraphic`                               | Adapted        | Packed `0xRRGGBBAA` pixels upload through an owned `BufferImageSource`; generated and sprite-sheet textures default to nearest sampling.                                     |
| `FlxSprite.loadRotatedGraphic`                        | Deprecated     | Runtime Pixi rotation replaces pre-baked Flash rotation sheets.                                                                                                              |
| `framePixels`, mutable `pixels`, `stamp`, and overlap | Emulated       | CPU packed-buffer helpers remain in the explicit compatibility module; arbitrary gameplay GPU readback remains unsupported by the rendering architecture.                    |
| `FlxText`                                             | Adapted        | Text, width wrapping, alignment, font, size, fill, one-pixel shadow, border, multiline bounds, transforms, and alpha use Pixi `Text`; `BitmapText` is an explicit fast mode. |
| Modern HaxeFlixel `FlxBitmapFont`                     | Adapted        | Single- and multi-page AngelCode BMFont XML plus monospace grids register Pixi `BitmapFont` instances; `FlxAssets` adds Pixi bundle identity and unload invalidation.        |
| Modern HaxeFlixel `FlxBitmapText`                     | Adapted        | Bitmap-font labels use Pixi `BitmapText` with field width, alignment, spacing, tint, and transform sync through a dedicated render handle.                                   |
| `FlxTileblock`                                        | Adapted        | Seeded tile selection generates one uploadable texture from pixel-backed/preprocessed tile graphics; URL textures must be preprocessed rather than read back from the GPU.   |
| `FlxAssets` (browser-native)                          | New            | Typed descriptors, aliases, manifests, bundles, progress, retries, failure state, background loading, cache lookup, and unload wrap Pixi `Assets`.                           |

See the [historical sprites/text evidence](history/porting/sprites-text.md) for
the sprite-sheet oracle, cross-browser snapshots, and lifecycle results.

## Camera implementation classifications

The camera milestone replaced the rendering spike with a production adapter.
Camera
simulation remains renderer-neutral, while Pixi owns render targets, viewport
sprites, and their cleanup.

| Upstream surface                                   | Classification | Camera status / adaptation                                                                                                                                                                                    |
| -------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FlxCamera` follow, focus, dead zones, and bounds  | Exact          | All four AS3 follow presets, epsilon focus behavior, target edges, camera bounds, and optional world-bound updates are preserved on deterministic state.                                                      |
| Camera zoom, scale, angle, alpha, tint/background  | Adapted        | Pixi render-texture output replaces Flash bitmap buffers. Rotation uses a stable center origin instead of the upstream camera's documented “weird display results”; transparent backgrounds remain supported. |
| Flash, fade, shake, callbacks, and `stopFX`        | Exact          | Effects use simulation elapsed time and seeded Flixel randomness; AS3 zero-alpha effect colors retain their opaque fallback.                                                                                  |
| `FlxG` camera collection and FX facade             | Adapted        | Add/select/remove/reset, background color, and FX broadcasts delegate to `FlxContext`; the context always retains one valid primary camera.                                                                   |
| `FlxBasic.cameras` and camera-aware sprite draw    | Adapted        | A null list routes to all active cameras; explicit lists isolate world objects or HUD labels through one retained render registry.                                                                            |
| Screen/world and pointer conversion                | Adapted        | Typed transforms cover viewport translation, scroll, scroll factor, zoom, independent scale, center rotation, and shake, with inverse round-trip and rendered-transform contracts.                            |
| `FlxCamera.buffer`, `screen`, and container access | Unsupported    | Flash `BitmapData`/display-list objects are replaced by explicit `FlxCameraView` resources owned by `FlxCameraRenderer`; gameplay code should not mutate them.                                                |

See the [historical camera evidence](history/porting/cameras.md) for the pinned
AS3 oracle, split-screen scene, and resource-lifecycle proof.

## Tilemap implementation classifications

The tilemap milestone separated authoritative tile data from adapter-owned Pixi
chunks.
Tile collision, rays, and paths run without a renderer; one subscribed render
handle services every camera and rebuilds only changed visible chunks.

| Upstream surface                                    | Classification | Tilemap status / adaptation                                                                                                                                                                    |
| --------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FlxTilemap` CSV, queries, mutation, and bounds     | Adapted        | CSV/data loading, exports, indices, instances, coordinates, offsets, bounds, following, mutation, and dirty notifications are implemented with explicit validation.                            |
| OFF/AUTO/ALT autotiling                             | Exact          | The pinned four-neighbor bitmask, ALT interior-corner priority, `+1` indexing, and local 3×3 mutation update are preserved in committed fixtures.                                              |
| Tile overlap, properties, callbacks, and separation | Adapted        | Reusable `FlxTile` proxies preserve directional masks, map indices, filters, callbacks, and `FlxObject.separate`; non-solid callbacks require a real geometric overlap instead of the AS3 bug. |
| Rays, pathfinding, and simplification               | Adapted        | Rays sample at tile resolution; A* replaces the upstream documented brute-force flood while retaining eight directions, equal step cost, no diagonal corner cutting, and solid-tile rules.     |
| `FlxTilemapBuffer`                                  | Emulated       | Camera-sized packed-pixel compatibility metadata remains available; production drawing uses subscribed `FlxTilemapRenderHandle` chunks instead of Flash `BitmapData`.                          |
| Tilemap drawing and multi-camera buffers            | Adapted        | Shared tileset subtextures feed lazy 16×16-tile Pixi containers. Camera culling is zoom-aware, dirty chunks rebuild once, and sequential camera passes never duplicate authoritative data.     |
| `ImgAuto`, `ImgAutoAlt`, and `imageToCSV`           | Deprecated     | Built-in embedded Flash assets/classes are omitted; callers provide a tileset or a packed pixel buffer explicitly.                                                                             |

See the [historical tilemap evidence](history/porting/tilemaps.md) for fixtures,
collision/path contracts, chunk metrics, and browser snapshots.

## Input implementation classifications

The input milestone queues browser events independently of display cadence and
publishes them through context-owned input state on fixed simulation steps.

| Upstream surface                          | Classification | Input status / adaptation                                                                                                                                                                                                                |
| ----------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Input` digital transitions and snapshots | Exact          | The pinned `2 → 1` pressed and `-1 → 0` released states, named queries, reset, any-key, numeric records, and playback are preserved.                                                                                                     |
| `Keyboard` names and event capture        | Adapted        | Public key names and legacy values remain; DOM `code` is preferred for physical bindings, with `keyCode`/`key` fallback and explicit `CTRL`/`RETURN` aliases.                                                                            |
| `Mouse` buttons, wheel, and coordinates   | Adapted        | Pointer Events replace Flash mouse events; CSS-to-logical scaling, capture, cancellation, multi-button state, cursor CSS, and the full inverse camera transform are implemented.                                                         |
| `FlxButton` interaction and appearance    | Adapted        | Four visual states, per-status label offsets/alphas, swipe-to-press, multi-touch overlap, checkbox highlighting, four callbacks, and backend-neutral sound hooks in one composite Pixi render handle.                                    |
| Stage/UI-thread mouse-up listener         | Adapted        | The input queue plus pointer capture replaces the Flash stage listener. Activation occurs on an uncancelled authoritative release and never directly inside a DOM or Pixi event callback.                                                |
| `FlxG.keys`, `mouse`, and `resetInput`    | Adapted        | The facade resolves a typed `FlxInputService` from the active context; `FlxGame` installs and advances a headless-capable manager before every state step.                                                                               |
| Modern HaxeFlixel gamepads                | Adapted        | Web Gamepad snapshots are polled once per fixed step with standard-layout constants, scaled dead zones, stable logical reconnect IDs, injectable providers, and replay 1.1 state.                                                        |
| Modern HaxeFlixel actions                 | Adapted        | Serializable keyboard, mouse, wheel, gamepad-button, analog-axis, keyboard-axis, and D-pad sources support stable device targeting and exclusive runtime rebinding.                                                                      |
| Modern HaxeFlixel touches and swipes      | Adapted        | Pointer Events publish concurrent touches at fixed-step boundaries; only the primary touch mirrors the mouse, and logical-distance swipes are recorded in replay 1.2.                                                                    |
| Modern HaxeFlixel virtual controls        | Adapted        | Texture-free HUD D-pad/action buttons and radial analog sticks publish serializable virtual sources through the deterministic action/replay pipeline. Buttons use native semantics; sticks require equivalent keyboard/gamepad bindings. |
| Modern HaxeFlixel `FlxBar`                | Adapted        | Eight fill directions, parent/value binding, position follow offsets, renderer-owned fill geometry, and limit callbacks without per-value texture uploads.                                                                               |
| Modern HaxeFlixel `FlxInputText`          | Adapted        | Camera-projected native input/textarea controls preserve selection, mobile keyboards, and IME while publishing edits and submission on fixed updates.                                                                                    |

See the [historical input evidence](history/porting/input.md) for low-FPS
transition proofs, mapping notes, cancellation tests, replay snapshots, and
browser baselines.

## Effects implementation classifications

The effects milestone retained group-owned simulation state while adding
deterministic
effects services and an optional high-throughput Pixi projection.

| Upstream surface                              | Classification | Effects status / adaptation                                                                                                                                                |
| --------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FlxParticle` lifespan and contact behavior   | Exact          | Lifespan, gravity-only floor friction, contact spin reversal, elasticity response, and `onEmit()` are advanced on fixed simulation steps.                                  |
| `FlxEmitter` burst, stream, and launch ranges | Adapted        | Geometry, seeded ranges, quantity, catch-up emission, gravity, drag, bounce, custom particle classes, and recycling are preserved; Pixi rotation replaces baked sheets.    |
| `FlxEmitter.makeParticles` graphics argument  | Adapted        | Browser-native `FlxGraphic`/Pixi `Texture` inputs replace embedded AS3 classes. Multiple frames remain seeded; baked-rotation counts are accepted but intentionally inert. |
| `FlxTimer` and `TimerManager`                 | Exact          | Game-time loops, pause/resume, infinite loops, progress, cancel, final-stop-before-callback, catch-up, and state-switch cleanup are preserved.                             |
| `FlxG` plugin APIs and ordering               | Adapted        | Add/get/remove/remove-type and update/draw ordering remain; stable snapshot traversal makes callback removal safe instead of retaining the upstream skip hazard.           |
| `DebugPathDisplay` and `FlxPath` registration | Adapted        | Paths self-register with the context plugin and render per camera through a dedicated Pixi `Graphics` layer using debug colors and scroll factors.                         |
| Pixi `ParticleContainer` projection           | New            | An explicit render option mirrors stable group members into lightweight Pixi particles; it never owns lifespan, emission, randomness, or recycling.                        |

See the [historical effects evidence](history/porting/effects.md) for seeded
vectors, allocation plateaus, timer/state boundaries, and plugin mutation
proofs.

The extraction helper is `scripts/extract-as3-api.mjs`. To re-check the source inventory against a local upstream clone:

```bash
node scripts/extract-as3-api.mjs /path/to/flixel/org/flixel
```

## Inventory

### `org.flixel.FlxBasic`

- Source: `FlxBasic.as`
- Public API (17): `active`, `alive`, `cameras`, `destroy`, `draw`, `drawDebug`, `exists`, `FlxBasic`, `ID`, `ignoreDrawDebug`, `kill`, `postUpdate`, `preUpdate`, `revive`, `toString`, `update`, `visible`
- Compatibility status: Adapted — lifecycle flags and hooks implemented; camera/debug draw adapter-owned.

### `org.flixel.FlxButton`

- Source: `FlxButton.as`
- Public API (21): `destroy`, `draw`, `FlxButton`, `static HIGHLIGHT`, `label`, `labelOffset`, `static NORMAL`, `on (get/set)`, `onDown`, `onOut`, `onOver`, `onUp`, `static PRESSED`, `preUpdate`, `setSounds`, `soundDown`, `soundOut`, `soundOver`, `soundUp`, `status`, `update`
- Compatibility status: Adapted — deterministic input state and composite Pixi render handle; embedded sound classes are backend-neutral sound hooks.

### `org.flixel.FlxCamera`

- Source: `FlxCamera.as`
- Public API (39): `alpha (get/set)`, `angle (get/set)`, `antialiasing (get/set)`, `bgColor`, `bounds`, `buffer`, `color (get/set)`, `copyFrom`, `deadzone`, `static defaultZoom`, `destroy`, `fade`, `fill`, `flash`, `FlxCamera`, `focusOn`, `follow`, `getContainerSprite`, `getScale`, `height`, `screen`, `scroll`, `setBounds`, `setScale`, `shake`, `static SHAKE_BOTH_AXES`, `static SHAKE_HORIZONTAL_ONLY`, `static SHAKE_VERTICAL_ONLY`, `stopFX`, `static STYLE_LOCKON`, `static STYLE_PLATFORMER`, `static STYLE_TOPDOWN`, `static STYLE_TOPDOWN_TIGHT`, `target`, `update`, `width`, `x`, `y`, `zoom (get/set)`
- Compatibility status: Adapted — transforms, follow styles, FX, and multi-camera routing via render-texture passes.

### `org.flixel.FlxEmitter`

- Source: `FlxEmitter.as`
- Public API (27): `at`, `bounce`, `destroy`, `emitParticle`, `FlxEmitter`, `frequency`, `gravity`, `height`, `kill`, `lifespan`, `makeParticles`, `maxParticleSpeed`, `maxRotation`, `minParticleSpeed`, `minRotation`, `on`, `particleClass`, `particleDrag`, `setRotation`, `setSize`, `setXSpeed`, `setYSpeed`, `start`, `update`, `width`, `x`, `y`
- Compatibility status: Adapted — burst/stream emitters with recycling; graphics via FlxGraphic/Texture.

### `org.flixel.FlxG`

- Source: `FlxG.as`
- Public API (90): `static addBitmap`, `static addCamera`, `static addPlugin`, `static bgColor (get/set)`, `static BLACK`, `static BLUE`, `static camera`, `static cameras`, `static checkBitmapCache`, `static clearBitmapCache`, `static collide`, `static createBitmap`, `static debug`, `static DEBUGGER_BIG`, `static DEBUGGER_LEFT`, `static DEBUGGER_MICRO`, `static DEBUGGER_RIGHT`, `static DEBUGGER_STANDARD`, `static DEBUGGER_TOP`, `static elapsed`, `static fade`, `static flash`, `static flashFramerate (get/set)`, `static flashGfx`, `static flashGfxSprite`, `static framerate (get/set)`, `static getLibraryName`, `static getPlugin`, `static getRandom`, `static globalSeed`, `static GREEN`, `static height`, `static keys`, `static level`, `static levels`, `static LIBRARY_MAJOR_VERSION`, `static LIBRARY_MINOR_VERSION`, `static LIBRARY_NAME`, `static loadReplay`, `static loadSound`, `static log`, `static mobile`, `static mouse`, `static music`, `static mute`, `static overlap`, `static paused`, `static pauseSounds`, `static PINK`, `static play`, `static playMusic`, `static plugins`, `static random`, `static recordReplay`, `static RED`, `static reloadReplay`, `static removeCamera`, `static removePlugin`, `static removePluginType`, `static resetCameras`, `static resetDebuggerLayout`, `static resetGame`, `static resetInput`, `static resetState`, `static resumeSounds`, `static save`, `static saves`, `static score`, `static scores`, `static setDebuggerLayout`, `static shake`, `static shuffle`, `static sounds`, `static stage (get)`, `static state (get)`, `static stopRecording`, `static stopReplay`, `static stream`, `static switchState`, `static timeScale`, `static unwatch`, `static useBufferLocking`, `static visualDebug`, `static volume (get/set)`, `static volumeHandler`, `static watch`, `static WHITE`, `static width`, `static worldBounds`, `static worldDivisions`
- Compatibility status: Adapted — facade over FlxContext for timing, state, world, input, audio, save, replay, plugins, log/watch.

### `org.flixel.FlxGame`

- Source: `FlxGame.as`
- Public API (4): `FlxGame`, `forceDebugger`, `useSoundHotKeys`, `useSystemCursor`
- Compatibility status: Adapted — fixed-step controller, input/audio backends, debug channel; not a Flash Sprite.

### `org.flixel.FlxGroup`

- Source: `FlxGroup.as`
- Public API (27): `add`, `static ASCENDING`, `callAll`, `clear`, `countDead`, `countLiving`, `static DESCENDING`, `destroy`, `draw`, `FlxGroup`, `getFirstAlive`, `getFirstAvailable`, `getFirstDead`, `getFirstExtant`, `getFirstNull`, `getRandom`, `kill`, `length`, `maxSize (get/set)`, `members`, `preUpdate`, `recycle`, `remove`, `replace`, `setAll`, `sort`, `update`
- Compatibility status: Adapted — collection, recursion, sorting, recycle, snapshot traversal.

### `org.flixel.FlxObject`

- Source: `FlxObject.as`
- Public API (67): `acceleration`, `allowCollisions`, `angle`, `angularAcceleration`, `angularDrag`, `angularVelocity`, `static ANY`, `static CEILING`, `destroy`, `static DOWN`, `drag`, `draw`, `drawDebug`, `elasticity`, `flicker`, `flickering (get)`, `static FLOOR`, `FlxObject`, `followPath`, `getMidpoint`, `getScreenXY`, `health`, `height`, `hurt`, `immovable`, `isTouching`, `justTouched`, `last`, `static LEFT`, `mass`, `maxAngular`, `maxVelocity`, `moves`, `static NONE`, `onScreen`, `static OVERLAP_BIAS`, `overlaps`, `overlapsAt`, `overlapsPoint`, `path`, `static PATH_BACKWARD`, `static PATH_FORWARD`, `static PATH_HORIZONTAL_ONLY`, `static PATH_LOOP_BACKWARD`, `static PATH_LOOP_FORWARD`, `static PATH_VERTICAL_ONLY`, `static PATH_YOYO`, `pathAngle`, `pathSpeed`, `postUpdate`, `preUpdate`, `reset`, `static RIGHT`, `scrollFactor`, `static separate`, `static separateX`, `static separateY`, `solid (get/set)`, `stopFollowingPath`, `touching`, `static UP`, `velocity`, `static WALL`, `wasTouching`, `width`, `x`, `y`
- Compatibility status: Adapted — motion, path, health, AABB, separation; tilemap delegation via collide.

### `org.flixel.FlxParticle`

- Source: `FlxParticle.as`
- Public API (5): `FlxParticle`, `friction`, `lifespan`, `onEmit`, `update`
- Compatibility status: Adapted — emitter-managed particle with lifespan/alpha/scale hooks.

### `org.flixel.FlxPath`

- Source: `FlxPath.as`
- Public API (16): `add`, `addAt`, `addPoint`, `addPointAt`, `debugColor`, `debugScrollFactor`, `destroy`, `drawDebug`, `FlxPath`, `head`, `ignoreDrawDebug`, `static manager (get)`, `nodes`, `remove`, `removeAt`, `tail`
- Compatibility status: Exact — node APIs; debug draw via DebugPathDisplay plugin.

### `org.flixel.FlxPoint`

- Source: `FlxPoint.as`
- Public API (8): `copyFrom`, `copyFromFlash`, `copyTo`, `copyToFlash`, `FlxPoint`, `make`, `x`, `y`
- Compatibility status: Exact — value/mutation/copy; Flash points as PointLike.

### `org.flixel.FlxRect`

- Source: `FlxRect.as`
- Public API (15): `bottom (get)`, `copyFrom`, `copyFromFlash`, `copyTo`, `copyToFlash`, `FlxRect`, `height`, `left (get)`, `make`, `overlaps`, `right (get)`, `top (get)`, `width`, `x`, `y`
- Compatibility status: Exact — edges, overlap, mutation, copy.

### `org.flixel.FlxSave`

- Source: `FlxSave.as`
- Public API (8): `bind`, `close`, `data`, `destroy`, `erase`, `flush`, `FlxSave`, `name`
- Compatibility status: Adapted — bind/flush/close with versioned schema and pluggable storage backends.

### `org.flixel.FlxSound`

- Source: `FlxSound.as`
- Public API (24): `amplitude`, `amplitudeLeft`, `amplitudeRight`, `artist`, `autoDestroy`, `destroy`, `fadeIn`, `fadeOut`, `FlxSound`, `getActualVolume`, `kill`, `loadEmbedded`, `loadStream`, `name`, `pause`, `play`, `proximity`, `resume`, `stop`, `survive`, `update`, `volume (get/set)`, `x`, `y`
- Compatibility status: Adapted — Web Audio backend; proximity/fade/loop semantics preserved where applicable.

### `org.flixel.FlxSprite`

- Source: `FlxSprite.as`
- Public API (36): `addAnimation`, `addAnimationCallback`, `alpha (get/set)`, `antialiasing`, `blend`, `centerOffsets`, `color (get/set)`, `destroy`, `dirty`, `draw`, `drawFrame`, `drawLine`, `facing (get/set)`, `fill`, `finished`, `FlxSprite`, `frame (get/set)`, `frameHeight`, `framePixels`, `frames`, `frameWidth`, `loadGraphic`, `loadRotatedGraphic`, `makeGraphic`, `offset`, `onScreen`, `origin`, `pixels (get/set)`, `pixelsOverlapPoint`, `play`, `postUpdate`, `randomFrame`, `replaceColor`, `scale`, `setOriginToCorner`, `stamp`
- Compatibility status: Adapted — frames, animation, transforms drive Pixi handles; pixel ops in compat module.

### `org.flixel.FlxState`

- Source: `FlxState.as`
- Public API (1): `create`
- Compatibility status: Exact — create hook and group lifecycle.

### `org.flixel.FlxText`

- Source: `FlxText.as`
- Public API (9): `alignment (get/set)`, `color (get/set)`, `destroy`, `FlxText`, `font (get/set)`, `setFormat`, `shadow (get/set)`, `size (get/set)`, `text (get/set)`
- Compatibility status: Adapted — Pixi Text with shadow/border; BitmapText fast mode available.

### Modern HaxeFlixel `FlxBitmapFont`

- Source: HaxeFlixel `flixel.text.FlxBitmapFont`
- Public API (subset): `fromAngelCode`, `fromMonospace`, `getDefaultFont`, `fontFamily`, `size`, `lineHeight`, `destroy`
- Compatibility status: Adapted — single- and multi-page AngelCode XML via
  `parseBmFontXml`, monospace grids, Pixi `BitmapFont`/`Cache` registration, and
  asset-backed bundle loading with unload invalidation; `fromXNA` and text
  `.fnt` parsers remain scheduled.

### Modern HaxeFlixel `FlxBitmapText`

- Source: HaxeFlixel `flixel.text.FlxBitmapText`
- Public API (subset): `text`, `font`, `fieldWidth`, `alignment`, `letterSpacing`, `lineSpacing`, `setFormat`, `createRenderHandle`
- Compatibility status: Adapted — Pixi `BitmapText` projection with field width, alignment, spacing, tint, and transform interpolation.

### Modern HaxeFlixel `FlxInputText`

- Source: HaxeFlixel `flixel.text.FlxInputText`
- Public API (adapted subset): `text`, `maxLength`, `multiline`, `type`, `inputMode`, `placeholder`, `enabled`, `editable`, `focused`, `focus`, `blur`, `select`, `selectionStart`, `selectionEnd`, `onTextChange`, `onSubmit`
- Compatibility status: Adapted — a camera-projected native input/textarea owns caret, selection, mobile keyboard, password, and IME behavior; changes become authoritative only on fixed updates.

### `org.flixel.FlxTileblock`

- Source: `FlxTileblock.as`
- Public API (2): `FlxTileblock`, `loadTiles`
- Compatibility status: Adapted — seeded tile texture generation.

### `org.flixel.FlxTilemap`

- Source: `FlxTilemap.as`
- Public API (34): `static ALT`, `static arrayToCSV`, `auto`, `static AUTO`, `static bitmapToCSV`, `destroy`, `draw`, `findPath`, `FlxTilemap`, `follow`, `getBounds`, `getData`, `getTile`, `getTileByIndex`, `getTileCoords`, `getTileInstances`, `heightInTiles`, `static imageToCSV`, `static ImgAuto`, `static ImgAutoAlt`, `loadMap`, `static OFF`, `overlaps`, `overlapsAt`, `overlapsPoint`, `overlapsWithCallback`, `ray`, `setDirty`, `setTile`, `setTileByIndex`, `setTileProperties`, `totalTiles`, `update`, `widthInTiles`
- Compatibility status: Adapted — loadMap/collide/ray/pathfinding with chunked render handles.

### `org.flixel.FlxTimer`

- Source: `FlxTimer.as`
- Public API (13): `destroy`, `finished`, `FlxTimer`, `loops`, `loopsLeft (get)`, `static manager (get)`, `paused`, `progress (get)`, `start`, `stop`, `time`, `timeLeft (get)`, `update`
- Compatibility status: Adapted — deterministic catch-up timers via TimerManager plugin.

### `org.flixel.FlxU`

- Source: `FlxU.as`
- Public API (27): `static abs`, `static bound`, `static ceil`, `static compareClassNames`, `static computeVelocity`, `static floor`, `static formatArray`, `static formatMoney`, `static formatTicks`, `static formatTime`, `static getAngle`, `static getClass`, `static getClassName`, `static getDistance`, `static getHSB`, `static getRandom`, `static getRGBA`, `static getTicks`, `static makeColor`, `static makeColorFromHSB`, `static max`, `static min`, `static openURL`, `static rotatePoint`, `static round`, `static shuffle`, `static srand`
- Compatibility status: Adapted — math/time/color/RNG helpers; Flash reflection/openURL unsupported.

### `org.flixel.plugin.DebugPathDisplay`

- Source: `plugin/DebugPathDisplay.as`
- Public API (7): `add`, `clear`, `DebugPathDisplay`, `destroy`, `draw`, `drawDebug`, `remove`
- Compatibility status: Adapted — Pixi path-debug geometry plugin.

### `org.flixel.plugin.TimerManager`

- Source: `plugin/TimerManager.as`
- Public API (6): `add`, `clear`, `destroy`, `remove`, `TimerManager`, `update`
- Compatibility status: Adapted — manages FlxTimer catch-up updates.

### `org.flixel.system.debug.Log`

- Source: `system/debug/Log.as`
- Public API (3): `add`, `destroy`, `Log`
- Compatibility status: Adapted — DOM Log panel fed by FlxLog / DebugChannel.

### `org.flixel.system.debug.Perf`

- Source: `system/debug/Perf.as`
- Public API (8): `activeObjects`, `destroy`, `flash`, `flixelDraw`, `flixelUpdate`, `Perf`, `update`, `visibleObjects`
- Compatibility status: Adapted — DOM Perf panel (FPS / step timing).

### `org.flixel.system.debug.VCR`

- Source: `system/debug/VCR.as`
- Public API (16): `destroy`, `onOpen`, `onPause`, `onPlay`, `onRecord`, `onRestart`, `onStep`, `onStop`, `paused`, `playing`, `recording`, `stepRequested`, `stopped`, `stopRecording`, `updateRuntime`, `VCR`
- Compatibility status: Adapted — DOM VCR controls over FlxG replay facade.

### `org.flixel.system.debug.Vis`

- Source: `system/debug/Vis.as`
- Public API (3): `destroy`, `onBounds`, `Vis`
- Compatibility status: Adapted — DOM visual-debug toggles.

### `org.flixel.system.debug.Watch`

- Source: `system/debug/Watch.as`
- Public API (8): `add`, `destroy`, `editing`, `remove`, `removeAll`, `submit`, `update`, `Watch`
- Compatibility status: Adapted — DOM Watch panel over FlxWatch.

### `org.flixel.system.debug.WatchEntry`

- Source: `system/debug/WatchEntry.as`
- Public API (16): `cancel`, `custom`, `destroy`, `editing`, `field`, `nameDisplay`, `object`, `oldValue`, `onKeyUp`, `onMouseUp`, `setY`, `submit`, `updateValue`, `updateWidth`, `valueDisplay`, `WatchEntry`
- Compatibility status: Adapted — named field watch snapshot.

### `org.flixel.system.FlxAnim`

- Source: `system/FlxAnim.as`
- Public API (6): `delay`, `destroy`, `FlxAnim`, `frames`, `looped`, `name`
- Compatibility status: Exact — name, frames, delay, loop, destroy.

### `org.flixel.system.FlxDebugger`

- Source: `system/FlxDebugger.as`
- Public API (10): `destroy`, `FlxDebugger`, `hasMouse`, `log`, `perf`, `resetLayout`, `setLayout`, `vcr`, `vis`, `watch`
- Compatibility status: Adapted — optional DOM debugger consuming DebugChannel; not Flash UI.

### `org.flixel.system.FlxList`

- Source: `system/FlxList.as`
- Public API (4): `destroy`, `FlxList`, `next`, `object`
- Compatibility status: Adapted — internal quadtree list helper (not a root export).

### `org.flixel.system.FlxPreloader`

- Source: `system/FlxPreloader.as`
- Public API (4): `className`, `FlxPreloader`, `minDisplayTime`, `myURL`
- Compatibility status: Adapted — accessible HTML preloader (not Flash MovieClip).

### `org.flixel.system.FlxQuadTree`

- Source: `system/FlxQuadTree.as`
- Public API (8): `static A_LIST`, `add`, `static B_LIST`, `destroy`, `static divisions`, `execute`, `FlxQuadTree`, `load`
- Compatibility status: Adapted — overlap/collide tree with instance-owned scratch.

### `org.flixel.system.FlxReplay`

- Source: `system/FlxReplay.as`
- Public API (12): `create`, `destroy`, `finished`, `FlxReplay`, `frame`, `frameCount`, `load`, `playNextFrame`, `recordFrame`, `rewind`, `save`, `seed`
- Compatibility status: Adapted — JSON replay + AS3 text adapter; seed/frame records.

### `org.flixel.system.FlxTile`

- Source: `system/FlxTile.as`
- Public API (7): `callback`, `destroy`, `filter`, `FlxTile`, `index`, `mapIndex`, `tilemap`
- Compatibility status: Adapted — reusable tile collision/callback proxy.

### `org.flixel.system.FlxTilemapBuffer`

- Source: `system/FlxTilemapBuffer.as`
- Public API (12): `columns`, `destroy`, `dirty`, `draw`, `fill`, `FlxTilemapBuffer`, `height`, `pixels (get)`, `rows`, `width`, `x`, `y`
- Compatibility status: Emulated — compatibility metadata; production uses render-handle chunks.

### `org.flixel.system.FlxWindow`

- Source: `system/FlxWindow.as`
- Public API (6): `destroy`, `FlxWindow`, `maxSize`, `minSize`, `reposition`, `resize`
- Compatibility status: Unsupported as Flash Sprite window — debugger panels use DOM instead of FlxWindow.

### `org.flixel.system.input.Input`

- Source: `system/input/Input.as`
- Public API (11): `any`, `destroy`, `getKeyCode`, `Input`, `justPressed`, `justReleased`, `playback`, `pressed`, `record`, `reset`, `update`
- Compatibility status: Adapted — pinned numeric transitions and snapshot record/playback.

### `org.flixel.system.input.Keyboard`

- Source: `system/input/Keyboard.as`
- Public API (94): `A`, `ALT`, `B`, `BACKSLASH`, `BACKSPACE`, `C`, `CAPSLOCK`, `COMMA`, `CONTROL`, `D`, `DELETE`, `DOWN`, `E`, `EIGHT`, `END`, `ENTER`, `ESCAPE`, `F`, `F1`, `F10`, `F11`, `F12`, `F2`, `F3`, `F4`, `F5`, `F6`, `F7`, `F8`, `F9`, `FIVE`, `FOUR`, `G`, `H`, `handleKeyDown`, `handleKeyUp`, `HOME`, `I`, `INSERT`, `J`, `K`, `Keyboard`, `L`, `LBRACKET`, `LEFT`, `M`, `MINUS`, `N`, `NINE`, `NUMPADEIGHT`, `NUMPADFIVE`, `NUMPADFOUR`, `NUMPADMINUS`, `NUMPADNINE`, `NUMPADONE`, `NUMPADPERIOD`, `NUMPADPLUS`, `NUMPADSEVEN`, `NUMPADSIX`, `NUMPADSLASH`, `NUMPADTHREE`, `NUMPADTWO`, `NUMPADZERO`, `O`, `ONE`, `P`, `PAGEDOWN`, `PAGEUP`, `PERIOD`, `PLUS`, `Q`, `QUOTE`, `R`, `RBRACKET`, `RIGHT`, `S`, `SEMICOLON`, `SEVEN`, `SHIFT`, `SIX`, `SLASH`, `SPACE`, `T`, `TAB`, `THREE`, `TWO`, `U`, `UP`, `V`, `W`, `X`, `Y`, `Z`, `ZERO`
- Compatibility status: Adapted — DOM code mappings plus compatibility aliases.

### `org.flixel.system.input.Mouse`

- Source: `system/input/Mouse.as`
- Public API (22): `destroy`, `getScreenPosition`, `getWorldPosition`, `handleMouseDown`, `handleMouseUp`, `handleMouseWheel`, `hide`, `justPressed`, `justReleased`, `load`, `Mouse`, `playback`, `pressed`, `record`, `reset`, `screenX`, `screenY`, `show`, `unload`, `update`, `visible (get)`, `wheel`
- Compatibility status: Adapted — Pointer Events with camera transforms.

### `org.flixel.system.replay.FrameRecord`

- Source: `system/replay/FrameRecord.as`
- Public API (8): `create`, `destroy`, `frame`, `FrameRecord`, `keys`, `load`, `mouse`, `save`
- Compatibility status: Exact — per-frame key/mouse snapshot for replays.

### `org.flixel.system.replay.MouseRecord`

- Source: `system/replay/MouseRecord.as`
- Public API (5): `button`, `MouseRecord`, `wheel`, `x`, `y`
- Compatibility status: Exact — mouse button/wheel/position snapshot.
