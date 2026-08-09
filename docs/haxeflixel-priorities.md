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

| Order | Priority | Checkpoint                                      | Status                   | Exit condition                                                                                     |
| ----: | :------: | ----------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------- |
|     1 |    P0    | Core tweening and easing                        | Complete (`5d3cbbf`)     | Deterministic manager, easing families, options, chaining, target control, unit coverage.          |
|     2 |    P0    | Specialized tweens, motion, paths, and showcase | Complete (`0292702`)     | Misc/motion tween families, documentation, public demo, unit and browser coverage.                 |
|     3 |    P0    | State overlays and nested substates             | Implemented; uncommitted | Deferred lifecycle, persistence policies, reuse/destruction, signals, render ordering, demo/tests. |
|     4 |    P0    | Animation and frame model                       | Next                     | Controller-based animation and frame collections work without regressing current sprite APIs.      |
|     5 |    P0    | Container and sprite-group model                | Planned                  | Transformable composite objects and groups preserve collision, camera, and lifecycle semantics.    |
|     6 |    P0    | Input expansion                                 | Planned                  | Gamepad/touch/action behavior is deterministic, remappable, and tested across supported browsers.  |
|     7 |    P1    | UI and text authoring                           | Planned                  | Common HUD/control/input-text needs no application-specific framework code.                        |
|     8 |    P1    | Atlas and content-pipeline expansion            | Planned                  | Standard atlas/font formats load through typed, cached, unloadable asset APIs.                     |
|     9 |    P1    | Scaling, resize, fullscreen, and focus policy   | Planned                  | Logical coordinates remain correct through browser/window lifecycle changes.                       |
|    10 |    P1    | Audio organization and system UX                | Planned                  | Sound groups, routing, focus policy, and optional system controls are coherent and testable.       |
|    11 |    P2    | Advanced rendering extensions                   | Planned                  | Approved filters/shaders/meshes have explicit Pixi ownership and cleanup contracts.                |
|    12 |    P2    | Debugger and runtime inspection                 | Planned                  | High-value console, interaction, and graphing workflows work without production overhead.          |
|    13 |    P2    | Utilities and frontend normalization            | Planned                  | Shared helpers reduce engine duplication without recreating target-specific Haxe abstractions.     |
|    14 |    P3    | Optional platform capabilities                  | Demand-driven            | Each capability has a real browser use case, web API mapping, permission policy, and fallback.     |
|    15 |    P0    | External compatibility validation               | Required before 1.0      | A pinned external game is playable using documented public APIs and has no unclassified gaps.      |
|    16 |    P0    | Release hardening and 1.0 candidate             | Required before 1.0      | The support matrix, budgets, package artifact, provenance, and release gates pass.                 |

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

Planned slices:

1. Introduce a controller without breaking `FlxSprite.addAnimation()` and
   `play()`.
2. Normalize frame collections from grids, atlases, and generated graphics.
3. Add prefix/range selection, per-frame duration, reverse playback, and
   deterministic callbacks.
4. Decide whether pre-rotated animations remain deprecated in favor of Pixi
   transforms.

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

### Atlas and content-pipeline expansion

Current atlas support remains the base. Candidate additions:

- TexturePacker JSON/XML variants and richer HaxeFlixel atlas queries;
- Aseprite JSON metadata, tags, slices, frame durations, and trimmed/rotated
  frames;
- BMFont text/XML/JSON parsing, pages, kerning, and bundle ownership;
- filtered/derived frame collections where Pixi can implement them without
  mutable GPU readback;
- development-time validation with actionable duplicate, missing-frame, and
  malformed-metadata errors.

Every loader must define aliasing, cache identity, bundle progress, background
loading, unload behavior, and texture-source ownership.

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
