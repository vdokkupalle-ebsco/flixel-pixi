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
