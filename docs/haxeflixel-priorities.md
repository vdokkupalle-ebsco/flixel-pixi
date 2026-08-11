# HaxeFlixel parity priorities

This document is the source of truth for work discovered by comparing
`flixel-pixi` with modern HaxeFlixel. It complements the AS3 compatibility
ledger in [`compatibility.md`](compatibility.md): the ledger records the original
port contract, while this document prioritizes modern authoring features that
can improve the TypeScript engine.

The comparison baseline is HaxeFlixel commit
`8c7b551f203a78ab0e7ee6757f39693d35108d24`. Recheck upstream before starting a
checkpoint; do not silently change the pinned baseline inside an active
checkpoint.

## How to use this backlog

Priority means expected user value and dependency order, not a promise of
one-to-one Haxe API coverage.

- **P0 — foundation:** common game-authoring capabilities or architectural
  dependencies. Complete these first.
- **P1 — production authoring:** features frequently needed by complete games.
- **P2 — advanced workflows:** valuable but narrower rendering, tooling, and
  content-pipeline features.
- **P3 — optional/platform-specific:** implement only with demonstrated browser
  demand and a maintainable web mapping.

Every checkpoint starts with a compatibility decision:

1. Identify the user-facing behavior and representative HaxeFlixel APIs.
2. Classify the destination as **Exact**, **Adapted**, **Emulated**,
   **Deprecated**, or **Unsupported**.
3. Preserve the headless simulation/renderer boundary and existing ADRs.
4. Add unit contracts, a public-API-only demo when visual or interactive, and
   cross-browser coverage in proportion to risk.
5. Update the API report, guides, compatibility notes, and this status table.

External game-port evidence can promote an item, split it into smaller
checkpoints, or prove that it should remain deferred. New work should not be
started merely to match a Haxe class count.

## Current checkpoint order

| Order | Priority | Checkpoint                                      | Status               | Exit condition                                                                                     |
| ----: | :------: | ----------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------- |
|     1 |    P0    | Core tweening and easing                        | Complete (`5d3cbbf`) | Deterministic manager, easing families, options, chaining, target control, unit coverage.          |
|     2 |    P0    | Specialized tweens, motion, paths, and showcase | Complete (`0292702`) | Misc/motion tween families, documentation, public demo, unit and browser coverage.                 |
|     3 |    P0    | State overlays and nested substates             | Complete (`3d71446`) | Deferred lifecycle, persistence policies, reuse/destruction, signals, render ordering, demo/tests. |
|     4 |    P0    | Animation and frame model                       | Complete (`8f47307`) | Controller-based animation and frame collections work without regressing current sprite APIs.      |
|     5 |    P0    | Container and sprite-group model                | Complete (`070469f`) | Transformable composite objects and groups preserve collision, camera, and lifecycle semantics.    |
|     6 |    P0    | Input expansion                                 | Complete (`f197d9f`) | Gamepad/touch/action behavior is deterministic, remappable, and tested across supported browsers.  |
|     7 |    P1    | UI and text authoring                           | Complete             | Common HUD/control/input-text needs no application-specific framework code.                        |
|     8 |    P1    | Atlas and content-pipeline expansion            | Complete             | Standard atlas/font formats load through typed, cached, unloadable asset APIs.                     |
|     9 |    P1    | Scaling, resize, fullscreen, and focus policy   | Complete             | Logical coordinates remain correct through browser/window lifecycle changes.                       |
|    10 |    P1    | Audio organization and system UX                | Complete             | Sound groups, routing, focus policy, and optional system controls are coherent and testable.       |
|    11 |    P2    | Advanced rendering extensions                   | In progress          | Approved filters/shaders/meshes have explicit Pixi ownership and cleanup contracts.                |
|    12 |    P2    | Debugger and runtime inspection                 | Planned              | High-value console, interaction, and graphing workflows work without production overhead.          |
|    13 |    P2    | Utilities and frontend normalization            | Planned              | Shared helpers reduce engine duplication without recreating target-specific Haxe abstractions.     |
|    14 |    P3    | Optional platform capabilities                  | Demand-driven        | Each capability has a real browser use case, web API mapping, permission policy, and fallback.     |
|    15 |    P0    | External compatibility validation               | Required before 1.0  | A pinned external game is playable using documented public APIs and has no unclassified gaps.      |
|    16 |    P0    | Release hardening and 1.0 candidate             | Required before 1.0  | The support matrix, budgets, package artifact, provenance, and release gates pass.                 |

Only one feature checkpoint should normally be active. Release hardening may
run continuously alongside feature work.

## P0 — foundation

### Animation and frame model

Representative upstream areas:

- `FlxAnimationController`, `FlxAnimation`, `FlxBaseAnimation`, and
  `FlxPrerotatedAnimation`;
- `FlxFrame`, `FlxFramesCollection`, `FlxAtlasFrames`, `FlxTileFrames`, and
  `FlxImageFrame`;
- animation prefixes, frame labels, reverse playback, callbacks, finish/reset,
  and frame-duration control.

Compatibility decisions:

- **Adapted:** `FlxAnimationController`, named selection, loop points, reverse
  playback, flip flags, timing controls, and signals use the fixed Flixel clock.
- **Adapted:** grid and atlas inputs normalize into caller-owned
  `FlxFramesCollection` texture views; Pixi owns rendering, not playback time.
- **Exact within the existing API:** `FlxSprite.addAnimation()`, `play()`, and
  callbacks remain supported alongside the controller.
- **Deferred:** trimmed/rotated atlas metadata and richer derived frame queries
  belong to the content-pipeline checkpoint.
- **Deprecated:** pre-rotated animation remains unnecessary because Pixi
  transforms rotation without authoring duplicate frame sets.

Implemented slices:

1. Introduce a controller without breaking `FlxSprite.addAnimation()` and
   `play()`.
2. Normalize frame collections from grids, atlases, and generated graphics.
3. Add prefix/range selection, per-frame duration, reverse playback, and
   deterministic callbacks.
4. Keep pre-rotated animations deprecated in favor of Pixi transforms.

Evidence: unit contracts cover controller state, frame lookup, reverse/flip,
loop/finish/frame signals, per-frame durations, validation, and ownership. The
public animation showcase exercises these features through package exports and
has a browser lifecycle test. See [`guides/animation.md`](guides/animation.md).

Risks: asset ownership, texture lifetime, callback order, API duplication, and
animation state during atlas unload.

### Container and sprite-group model

Representative upstream areas: `FlxContainer`, `FlxSpriteContainer`,
`FlxSpriteGroup`, and group member transform helpers.

Required behavior:

- one logical composite can translate, rotate, scale, tint, scroll, and route
  cameras without making gameplay depend on Pixi transforms;
- members retain predictable local/world coordinates and collision behavior;
- nested composites update, draw, recycle, and destroy exactly once;
- renderer branches use Pixi `Container` nodes, never child-bearing leaf
  sprites.

Checkpoint the coordinate and collision model before exposing public classes.

Compatibility decisions:

- **Adapted:** `FlxContainer` provides exclusive ownership and synchronous
  reparenting through `FlxBasic.container`; ordinary `FlxGroup` remains
  non-exclusive.
- **Adapted:** `FlxSpriteGroup` and `FlxSpriteContainer` expose the group
  authoring surface while member positions stay authoritative world-space
  values during ownership. Local helpers cover translation without deriving
  gameplay state from Pixi matrices.
- **Adapted:** composite overlap/collision recursively expands member AABBs.
  Rotation and scale remain visual and do not mutate collision extents, matching
  the existing sprite boundary.
- **Exact in lifecycle intent:** stable nested traversal, kill/revive hooks,
  recycling, and destruction occur once through the backing group.
- **Adapted for PixiJS v8:** renderer handles own `Container` branches with
  drawable sprites as leaves; the engine never adds children to a Pixi sprite.

Implemented slices:

1. Add exclusive logical containers with membership cleanup hooks.
2. Add transformable sprite groups/containers, local/world helpers, nested
   transforms, camera routing, bounds, and common group delegates.
3. Expand broad-phase collision to composite members without renderer queries.
4. Add adapter-owned composite render handles and incremental child ownership.

Evidence: unit contracts cover exclusive reparenting, coordinate conversion,
transform propagation, collision gaps, nested lifecycle, and leaf-safe Pixi
ownership. The public container showcase exercises nested transforms,
world-space collision, renderer lifecycle, and teardown across the supported
browser projects. See [`guides/containers.md`](guides/containers.md) and
[`adr/0013-container-coordinate-and-render-ownership.md`](adr/0013-container-coordinate-and-render-ownership.md).

### Input expansion

Representative upstream areas:

- gamepads, analog sticks, mapped buttons, reconnects, and action inputs;
- touches, pointers, swipes, and multi-pointer tracking;
- action sets, analog/digital action sources, and runtime rebinding;
- optional accelerometer input.

Planned order:

1. Web Gamepad API manager with stable IDs, dead zones, analog/digital queries,
   reconnect handling, and deterministic per-step snapshots.
2. Extend actions to keyboard, pointer, and gamepad sources with conflict-free
   rebinding and serialization.
3. Multi-touch and swipe recognition using Pointer Events.
4. Motion sensors only after permission, privacy, fallback, and test strategy
   are approved.

Completed checkpoint:

- Gamepad slice 1 is implemented locally: one provider poll per fixed step,
  standard button constants, digital transitions, scaled dead zones, stable
  logical IDs across unambiguous reconnects, injectable headless snapshots,
  and replay 1.1 records. Vendor-specific mapping tables remain a later slice.
- Action slice 2 is implemented locally: typed keyboard, mouse, wheel, gamepad
  button, gamepad axis, keyboard-axis, and D-pad sources; stable-UID targeting;
  exclusive rebinding; atomic versioned serialization; and compatibility with
  the existing keyboard-only `bind()` helper.
- Touch slice 3 is implemented locally: concurrent Pointer Event tracking,
  primary-touch mouse compatibility, step-based swipe recognition,
  cancellation handling, camera conversion, replay 1.2 snapshots, and a
  public Fruit Punch swipe demo with cross-browser coverage.

Replay compatibility is mandatory: new authoritative inputs need versioned
recording or an explicit replay exclusion.

## P1 — production authoring

### UI and text authoring

Representative upstream areas: `FlxBar`, `FlxSpriteButton`,
`FlxBitmapTextButton`, `FlxAnalog`, `FlxVirtualPad`, `FlxVirtualStick`,
`FlxBitmapText`, and `FlxInputText`.

Priorities:

1. `FlxBar`-style value bars and reusable button variants.
2. Bitmap-font parsing/rendering for stable pixel text and frequent HUD updates.
3. Text input through a DOM-backed accessibility and IME bridge; do not emulate
   browser text entry solely on the canvas.
4. Virtual controls after the gamepad/action abstraction is stable.

All controls require keyboard operation, pointer/touch behavior, focus rules,
screen-reader labeling where applicable, and camera/HUD placement tests.

Compatibility decisions:

- **Adapted:** `FlxBar` retains numeric ranges, parent/property binding,
  callbacks, and eight fill directions while Pixi owns texture-free fill
  geometry.
- **Adapted for the browser:** rendered `FlxButton` instances project to native
  semantic DOM buttons because camera render textures hide individual controls
  from Pixi's stage accessibility traversal.
- **Exact in deterministic intent:** DOM focus and activation are queued and
  consumed on fixed updates; pointer/touch remains on the canvas input path.

Current slice:

- `FlxBar`, renderer-owned filled bars, range callbacks, providers, and parent
  bindings are implemented with unit coverage.
- `FlxButton` exposes text, enabled, focus, accessibility label/tab order, and
  shared activation behavior. The public browser boot path owns the native DOM
  bridge and lifecycle.
- `FlxBitmapFont` and `FlxBitmapText` parse single- or multi-page AngelCode XML
  and monospace grids, register Pixi `BitmapFont` instances, and project labels
  through a dedicated render handle with alignment, spacing, and tint.
- `FlxAssets.loadBitmapFont()` loads `.fnt`/XML descriptors and their page
  textures through Pixi bundles, preserves cache identity, and invalidates its
  non-owning font view when an asset or bundle is unloaded.
- `FlxInputText` projects to native single-line or multiline browser controls
  for selection, mobile keyboards, and IME. DOM edits, focus, composition, and
  submission are consumed on fixed updates, and editable DOM key-downs are
  isolated from gameplay keyboard bindings.
- The public UI demo and cross-browser test cover camera placement, semantic
  labels, disabled state, Enter/Space activation, Kenney atlas bars/buttons,
  an asset-backed two-page bitmap font, bitmap-font HUD labels, and native IME
  text entry.
- `FlxVirtualPad` and `FlxVirtualButton` provide deterministic D-pad/action
  input, serializable digital/scalar action sources, native semantic buttons,
  HUD placement, and replay derivation from recorded pointer/touch frames. The
  public Action demo combines them with keyboard and gamepad bindings.
- `FlxVirtualStick` provides captured proportional pointer movement, radial
  dead-zone remapping, normalized serializable axes, stable texture-free Pixi
  geometry, and replay derivation through the same virtual-input registry.

Checkpoint complete. See [`guides/ui.md`](guides/ui.md) and
[`adr/0017-native-accessibility-over-render-textures.md`](adr/0017-native-accessibility-over-render-textures.md).

### Atlas and content-pipeline expansion

Current atlas support remains the base. Candidate additions:

- TexturePacker JSON/XML variants and richer HaxeFlixel atlas queries;
- Aseprite JSON metadata, tags, slices, frame durations, and trimmed/rotated
  frames;
- BMFont text/JSON parsing beyond the completed multi-page XML, kerning, and
  bundle-ownership path;
- filtered/derived frame collections where Pixi can implement them without
  mutable GPU readback;
- development-time validation with actionable duplicate, missing-frame, and
  malformed-metadata errors.

Every loader must define aliasing, cache identity, bundle progress, background
loading, unload behavior, and texture-source ownership.

Current slice: TexturePacker JSON hash/array parsing validates frame geometry
and duplicate names, preserves rotated/trimmed metadata in Pixi textures, and
restores those transforms when baking tile or animation strips. Bundle-backed
registration, explicit cache ownership, and the dedicated TexturePacker demo
complete this checkpoint.

### Scaling, resize, fullscreen, and focus policy

Representative upstream areas: scale modes, focus-lost UI, HTML5 frontend, and
camera resize behavior.

Planned capabilities:

- fit, fill, fixed, integer/pixel-perfect, and responsive logical scaling;
- resize/fullscreen APIs with correct pointer-to-world conversion;
- DPR and orientation changes without blurry text or camera drift;
- configurable pause/focus behavior and Web Audio resume handling;
- safe-area and mobile viewport support.

This checkpoint must extend the browser support matrix and visual/coordinate
tests rather than relying on CSS inspection alone.

Current slice:

- `FlxBrowserViewport` provides fit, fill, fixed, and integer presentation
  modes without changing the game's logical dimensions or camera model.
- Host resize observation, runtime mode changes, alignment, and fullscreen
  helpers share the canvas bounds already consumed by pointer conversion and
  native accessibility projection.
- Immutable `logicalRect`, `visibleRect`, and `safeRect` snapshots expose crop,
  device cutout, and developer-padding boundaries through `onChange()`.
- The public viewport demo visualizes scale modes, host presets, alignment,
  fullscreen, logical pointer coordinates, and safe HUD anchoring.
- Browser DPR changes resize Pixi's framebuffer and camera render textures up
  to a configurable cap without changing logical game or camera dimensions.
- `autoPause` pauses fixed simulation updates on blur or visibility loss without
  overwriting manual pause state or creating a catch-up burst after focus returns.
- Web Audio visibility suspension is independently configurable, so background
  audio policy does not need to match simulation focus policy.
- Pure layout coverage verifies letterboxing, crop offsets, fixed sizing,
  integer enlargement, safe boundaries, and invalid configuration. Dedicated
  browser coverage verifies pointer, native-overlay, DPR, and focus coordinates
  and lifecycle behavior in Chromium, Firefox, and WebKit.

### Audio organization and system UX

Representative upstream areas: `FlxSoundGroup`, sound frontend behavior, and the
sound tray.

Planned capabilities:

- named sound groups/buses with hierarchical volume and mute;
- music/effects routing and persistence hooks;
- deterministic fade/proximity behavior under pause and state transitions;
- optional accessible DOM volume/mute indicator rather than a mandatory canvas
  tray;
- explicit autoplay unlock, suspended-context, focus, and device-loss policy.

Current slice:

- `FlxSoundGroup` provides named hierarchical volume/mute buses with runtime
  sound rerouting and recursive propagation.
- `FlxG.soundGroup` and `FlxG.musicGroup` provide independent default routes;
  `play`, `stream`, and `playMusic` accept an optional group without breaking
  their existing positional calls.
- Sound and group teardown detach routing references without changing sound
  ownership or backend lifecycle.
- `FlxSound.attachTo()` follows a world object, performs player-relative
  distance attenuation and stereo panning, and gates looping playback against
  any assigned camera with pause/stop and edge-hysteresis policies.
- The ambient-audio demo preloads and auto-tours three supplied looping emitters,
  then exposes live volume/pan/visibility diagnostics, group mute, and
  pause-vs-stop controls.
- Browser coverage deterministically verifies spatial direction, attenuation,
  viewport gating, routing mute, and policy changes in all three engine lanes.
- Optional `FlxAudioControls` expose keyboard/screen-reader-friendly master
  mute and volume controls. Manager change subscriptions keep external changes
  synchronized, while opt-in localStorage persistence restores preferences
  without making storage availability a boot requirement.

## P2 — advanced workflows

### Advanced rendering extensions

Candidate upstream areas: `FlxStrip`, `FlxMatrixSprite`, filter frames, graphics
shaders, draw-triangle items, gradients, color transforms, and sprite utilities.

Evaluate as independent slices:

- mesh/strip rendering for ropes, polygons, and custom UVs;
- supported filters and color-matrix effects;
- shader extension API with typed uniforms and WebGL/WebGPU policy;
- gradients and reusable drawing helpers;
- snapshots or compatibility buffers only where readback cost is explicit.

Each slice needs ownership, context-loss, multi-camera, batching, and teardown
contracts. Mutable Flash `BitmapData` behavior remains compatibility-only and
must not leak into authoritative gameplay.

Current slice:

- **Adapted:** immutable `FlxBlurFilter` and `FlxColorMatrixFilter`
  descriptors live on gameplay sprites without importing Pixi objects.
- Each sprite render handle creates and destroys its own Pixi filter chain, so
  multi-camera projections do not share stateful renderer resources.
- Sprite groups apply a single chain to their adapter-owned container root,
  avoiding one framebuffer pass per child when a composite shares an effect.
- Filter changes are visual-only and occur by replacing the descriptor list;
  collision and deterministic simulation remain unaffected.
- The public filter showcase compares unfiltered, grayscale, blur, and
  composite output, replaces a live chain, and verifies rendered pixels across
  Chromium, Firefox, and WebKit.
- **Adapted:** `FlxShaderFilter` declares separate GLSL/WGSL programs and a
  shared typed-uniform schema without exposing Pixi objects to gameplay code.
- Mutable uniform values synchronize by revision into independent camera-local
  uniform groups, so per-frame changes neither rebuild programs nor replace
  filter chains. Missing renderer programs explicitly mean pass-through output.
- The filter showcase includes a fixed-clock animated dual-renderer shader;
  unit and browser contracts cover validation, multi-camera ownership, runtime
  synchronization, rendered output, and teardown.
- Displacement maps and explicit filter areas remain pending within this
  checkpoint. See [`guides/filters.md`](guides/filters.md),
  [`adr/0018-renderer-neutral-filter-descriptors.md`](adr/0018-renderer-neutral-filter-descriptors.md),
  and [`adr/0019-typed-cross-renderer-shader-filters.md`](adr/0019-typed-cross-renderer-shader-filters.md).

### Debugger and runtime inspection

Candidate upstream areas: debugger console, command history/completion, object
tracking, selection/move tools, bounds toggles, bitmap logs, and stats graphs.

Order by diagnostic value:

1. Structured console commands and history.
2. Object inspection/tracking and editable watches with safe mutation rules.
3. Pointer selection, bounds visualization, and camera-aware transforms.
4. Frame-time/memory graphs and exportable diagnostic snapshots.

Debugger code must remain tree-shakable or disabled-by-default, accessible from
the keyboard, and near-zero-cost when unopened.

### Utilities and frontend normalization

Candidate upstream areas: arrays, colors, directions/axes, alignment, ranges,
bounds, sorting, pools, gradients, destroy helpers, signals, and frontends.

Guidance:

- add helpers when they remove duplicated engine/application logic;
- prefer TypeScript unions, iterables, and structural types over Haxe
  `typeLimit` compatibility wrappers;
- evolve the new signal primitive only from concrete lifecycle/input needs;
- keep `FlxContext` services and `FlxG` facades explicit rather than cloning
  every Haxe frontend class;
- benchmark pools before exposing them—modern garbage collectors change the
  trade-off.

## P3 — optional and platform-specific

These areas are not default parity commitments:

- accelerometer/device-motion input;
- detailed console-specific controller ID/mapping classes;
- Steam-controller-specific APIs;
- Android key abstractions;
- native splash/preloader macros and compile-time asset-path macros;
- target-specific bitmap pools and OpenFL display-list helpers.

Promote one only when there is a concrete browser consumer and all of the
following are defined: standards-based web API, permissions/security model,
fallback behavior, supported-browser scope, automated test strategy, and
maintenance owner.

## Explicit non-goals unless evidence changes

- Reproducing OpenFL, Flash, or Haxe macro internals in TypeScript.
- Making Pixi display objects authoritative gameplay objects.
- Synchronous network asset loading.
- Arbitrary per-frame GPU readback for collision or other gameplay decisions.
- Copying every controller-vendor mapping when the browser already supplies a
  standard mapping.
- Matching HaxeFlixel names when a smaller idiomatic browser API provides the
  same behavior and has a documented migration path.

## Cross-cutting priorities

These apply to every checkpoint:

1. **Determinism:** fixed-step behavior, RNG, callbacks, input, timers, tweens,
   and replay remain reproducible.
2. **Developer experience:** public imports, useful errors, typed configuration,
   lifecycle documentation, and a minimal representative demo.
3. **Performance:** no avoidable per-frame allocation, hidden GPU readback, or
   unbounded renderer/resource growth.
4. **Accessibility:** DOM integration and keyboard/focus semantics accompany
   interactive browser UI.
5. **Browser support:** Chromium, Firefox, and WebKit verification proportional
   to the feature's platform risk.
6. **Resource ownership:** assets, textures, listeners, audio nodes, render
   handles, and DOM overlays have explicit teardown.
7. **Compatibility discipline:** update both the original AS3 ledger and this
   modern parity backlog when a public behavior changes.
8. **Release discipline:** API report, clean-consumer package test, source maps,
   licenses, bundle budgets, soak tests, and changelog remain release gates.

## Review cadence

Review this document:

- after each checkpoint is committed;
- after an external port exposes a new gap;
- before promoting a P2/P3 item;
- when the HaxeFlixel comparison baseline changes;
- before freezing the 1.0 public API.

At review time, update statuses and exit conditions. Keep detailed execution
plans under `docs/history/implementation-plans/` only after the checkpoint is
finished; this file remains the current, concise ordering authority.
