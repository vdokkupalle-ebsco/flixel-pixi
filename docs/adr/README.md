# Architecture decision records

Architecture decisions use the following states:

- **Proposed**: documented but still open to Phase 1 evidence.
- **Accepted**: the implementation may depend on the decision.
- **Superseded**: retained for history with a link to its replacement.

The Phase 0 architecture review was completed on 2026-08-06. All six records
are accepted as the basis for Phase 1. Camera implementation details and pixel
API classifications were locked by the measured C1 spike. Phase 3 added the
reentrant quadtree callback contract, and Phase 7 locked browser input to
simulation-step boundaries. Phase 8 keeps particle optimization render-only and
locks mutation-safe plugin ordering.

| ADR                                               | Decision                                     | Status   |
| ------------------------------------------------- | -------------------------------------------- | -------- |
| [0001](0001-composition-over-pixi-inheritance.md) | Gameplay objects compose Pixi render handles | Accepted |
| [0002](0002-fixed-timestep.md)                    | Fixed-timestep simulation                    | Accepted |
| [0003](0003-camera-render-passes.md)              | Per-camera render passes                     | Accepted |
| [0004](0004-flxg-context-facade.md)               | `FlxG` delegates to an engine context        | Accepted |
| [0005](0005-async-assets.md)                      | Explicit asynchronous asset service          | Accepted |
| [0006](0006-compatibility-modules.md)             | Expensive Flash emulation is isolated        | Accepted |
| [0007](0007-reentrant-quadtree-callbacks.md)      | Reentrant, pair-unique quadtree callbacks    | Accepted |
| [0008](0008-step-boundary-input.md)               | Step-boundary browser input queues           | Accepted |
| [0009](0009-render-only-particle-optimization.md) | Render-only particle optimization            | Accepted |
