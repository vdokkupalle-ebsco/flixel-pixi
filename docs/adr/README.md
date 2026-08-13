# Architecture decision records

Architecture decisions use the following states:

- **Proposed**: documented but still open to validation evidence.
- **Accepted**: the implementation may depend on the decision.
- **Superseded**: retained for history with a link to its replacement.

The initial architecture review was completed on 2026-08-06. All six records
are accepted as the basis for the port. Camera implementation details and pixel
API classifications were locked by the measured rendering spike. Collision work
added the reentrant quadtree callback contract, and input handling was locked to
simulation-step boundaries. Effects keep particle optimization render-only and
use mutation-safe plugin ordering. Platform services provide replaceable audio
and storage backends with gesture-unlock queuing and versioned save slots.

| ADR                                                       | Decision                                                   | Status   |
| --------------------------------------------------------- | ---------------------------------------------------------- | -------- |
| [0001](0001-composition-over-pixi-inheritance.md)         | Gameplay objects compose Pixi render handles               | Accepted |
| [0002](0002-fixed-timestep.md)                            | Fixed-timestep simulation                                  | Accepted |
| [0003](0003-camera-render-passes.md)                      | Per-camera render passes                                   | Accepted |
| [0004](0004-flxg-context-facade.md)                       | `FlxG` delegates to an engine context                      | Accepted |
| [0005](0005-async-assets.md)                              | Explicit asynchronous asset service                        | Accepted |
| [0006](0006-compatibility-modules.md)                     | Expensive Flash emulation is isolated                      | Accepted |
| [0007](0007-reentrant-quadtree-callbacks.md)              | Reentrant, pair-unique quadtree callbacks                  | Accepted |
| [0008](0008-step-boundary-input.md)                       | Step-boundary browser input queues                         | Accepted |
| [0009](0009-render-only-particle-optimization.md)         | Render-only particle optimization                          | Accepted |
| [0010](0010-browser-audio-backend.md)                     | Replaceable audio backend with unlock queue                | Accepted |
| [0011](0011-browser-storage-backend.md)                   | Replaceable storage backend with versioned slots           | Accepted |
| [0012](0012-replay-and-determinism.md)                    | Fixed-step versioned replay and diagnostics                | Accepted |
| [0013](0013-container-coordinate-and-render-ownership.md) | World-authoritative composites with adapter-owned branches | Accepted |
| [0014](0014-step-polled-gamepads-and-stable-identity.md)  | Fixed-step gamepads with stable logical device IDs         | Accepted |
| [0015](0015-serializable-multi-source-actions.md)         | Serializable keyboard, pointer, and gamepad actions        | Accepted |
| [0016](0016-deterministic-pointer-event-touches.md)       | Step-published multi-touch and swipe recognition           | Accepted |
| [0017](0017-native-accessibility-over-render-textures.md) | Native DOM accessibility over camera render textures       | Accepted |
| [0018](0018-renderer-neutral-filter-descriptors.md)       | Handle-local Pixi filters from neutral descriptors         | Accepted |
| [0019](0019-typed-cross-renderer-shader-filters.md)       | Typed cross-renderer shader filters                        | Accepted |
| [0020](0020-non-owning-displacement-maps.md)              | Non-owning normalized displacement maps                    | Accepted |
| [0021](0021-local-explicit-filter-areas.md)               | Local explicit filter areas with automatic fallback        | Accepted |
| [0022](0022-revisioned-camera-local-strip-geometry.md)    | Revisioned camera-local strip geometry                     | Accepted |
| [0023](0023-stable-camera-local-vector-graphics.md)       | Stable camera-local vector graphics                        | Accepted |
| [0024](0024-explicit-asynchronous-renderer-readback.md)   | Explicit asynchronous renderer readback                    | Accepted |
