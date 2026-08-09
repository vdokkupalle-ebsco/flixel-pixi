# flixel-pixi roadmap

The AS3-to-TypeScript engine port is feature-complete enough for stabilization.
Current work is organized by release outcomes rather than chronological milestones.

## Modern HaxeFlixel parity

Modern authoring improvements discovered from HaxeFlixel are tracked in the
[HaxeFlixel parity priorities](docs/haxeflixel-priorities.md). That document is
the ordered feature backlog and records completed, active, planned, deferred,
and unsupported work. This roadmap remains the release-outcome view; avoid
duplicating the detailed parity list here.

The immediate sequence is:

1. finish and commit state overlays/substates;
2. implement the animation and frame model;
3. define transformable containers/sprite groups;
4. expand gamepad, action, and touch input;
5. validate priorities through a pinned external game port.

## Implemented engine capabilities

- Fixed-step lifecycle, state management, groups, math, and deterministic RNG.
- Motion, paths, quadtree broad phase, overlap, and collision separation.
- PixiJS assets, sprites, atlas animation, text, cameras, effects, and tilemaps.
- Keyboard, pointer, actions, buttons, audio, storage, replay, and debugger UI.
- Public browser bootstrap, playable samples, stress benchmarks, and soak tests.
- A compatibility ledger covering all 43 upstream classes and 766 public members.

## External compatibility validation

- Select a suitably licensed open-source AS3 Flixel game and pin its revision.
- Port from its source using only documented public APIs.
- Classify every discovered gap as Exact, Adapted, Emulated, Deprecated, or
  Unsupported.
- Record independent clean-room feedback from a developer who did not implement
  the port.

Exit condition: the external game is playable, its gap report has no unknowns,
and documentation feedback is resolved or explicitly tracked.

## Release hardening

- Extend leak probes to textures, audio nodes, listeners, render targets, and
  registered render handles.
- Run and record a 30-minute automated soak.
- Verify WebGPU failure falls back to WebGL without gameplay differences.
- Freeze named performance, memory, and bundle budgets on representative
  hardware.
- Validate resize, fullscreen, focus, visibility, accessibility, and memory
  pressure across the supported browser matrix.

Exit condition: no critical or high-severity correctness bugs remain and the
published browser/device budgets pass.

## 1.0 release candidate

- Freeze the public API and regenerate the API report.
- Test the packed npm artifact from a clean consumer project.
- Verify declarations, source maps, exports, licenses, provenance, and examples.
- Publish a release candidate, complete the final support matrix, and write the
  changelog and upgrade policy.

Exit condition: the release candidate installs and runs from the package alone,
all verification lanes pass, and the 1.0 release is approved.

## Historical record

The chronological implementation plan, checkpoint evidence, and design notes are
preserved under [`docs/history/`](docs/history/README.md). They are not part of
the current product taxonomy.
