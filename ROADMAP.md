# flixel-pixi roadmap

The AS3-to-TypeScript engine port is feature-complete enough for stabilization.
Current work is organized by release outcomes rather than chronological milestones.

## Modern HaxeFlixel parity

Modern authoring improvements discovered from HaxeFlixel are tracked in the
[HaxeFlixel parity priorities](/resources/haxeflixel-priorities). That document is
the ordered feature backlog and records completed, active, planned, deferred,
and unsupported work. This roadmap remains the release-outcome view; avoid
duplicating the detailed parity list here.

The modern parity sequence through the pinned external game port is complete.
The active checkpoint is release hardening and the `0.1.0-rc.1` candidate. A
1.0 release is intentionally deferred until multiple public release cycles and
real games validate the API.

## Implemented engine capabilities

- Fixed-step lifecycle, state management, groups, math, and deterministic RNG.
- Motion, paths, quadtree broad phase, overlap, and collision separation.
- PixiJS assets, sprites, atlas animation, text, cameras, effects, and tilemaps.
- Keyboard, pointer, actions, buttons, audio, storage, replay, and debugger UI.
- Public browser bootstrap, playable samples, stress benchmarks, and soak tests.
- A compatibility ledger covering all 43 upstream classes and 766 public members.

## External compatibility validation

- Complete: AdamAtomic's MIT-licensed Flx-Invaders is pinned and ported through
  public APIs.
- Complete: every discovered gap is classified and the clean-room review passed
  after adding a documented, opt-in terminal-state validation mode.

Exit condition: the external game is playable, its gap report has no unknowns,
and documentation feedback is resolved or explicitly tracked.

## Release hardening

- Restored: 429 passing unit tests now report 88.02% branch coverage without
  lowering the configured 88% gate or excluding production modules.
- Restored: swipe browser validation now asserts cumulative interaction
  milestones instead of short-lived render objects; it passes 10 repeated
  isolated runs and the 58-test Chromium suite with six concurrent workers.
- Restored: the 30-cycle boot/destroy probe now verifies generated texture
  sources, Web Audio contexts and handles, event listeners, camera render
  targets and bytes, registered render handles, and DOM canvases. All owned
  resources return to zero; the process-wide listener baseline remains flat.
- Complete: an uninterrupted 30.2-minute Chromium soak executed 2,359 full
  boot/render/audio/destroy cycles. Registered handles stayed at 2, retained
  process listeners stayed at 13, and every engine-owned resource returned to
  zero after every cycle. Re-run with `npm run test:soak:30m`.
- Complete: deterministic Chromium, Firefox, and WebKit coverage makes WebGPU
  capability detection succeed, forces renderer initialization to fail, and
  verifies fresh WebGL recovery with unchanged state transition, movement, and
  teardown behavior.
- Complete: `performance-budgets.json` freezes raw/gzip bundle ceilings, seven
  deterministic CPU means, median FPS floors for 2k/5k/10k sprite scenes, and
  renderer/audio/listener/teardown resource ceilings against the documented
  Apple M4 Pro reference profile. `npm run verify:budgets` passes.
- Complete (automated): the focused five-profile browser/device matrix validates
  resize/orientation, DPR bounds, fullscreen state, focus/visibility timing,
  semantic HUD controls, repeated teardown pressure, and Chromium memory-pressure
  notifications. Physical Edge, Android, and iOS/Safari approval remains in the
  final release-candidate pass.
- Complete: the npm artifact is restricted to nine release files and a 750 KB
  compressed ceiling. `npm run check:package` packs with an isolated cache,
  installs into a clean project, and verifies ESM/types/source maps/licenses,
  export boundaries, Vite bundling, Pixi peer use, provenance configuration, and
  browser boot/destroy. The current artifact is 464 KB compressed.

Exit condition: no critical or high-severity correctness bugs remain and the
published browser/device budgets pass.

## 0.1 release candidate

- Complete: freeze the public API baseline and define prerelease/stable
  compatibility rules.
- Complete: test the packed npm artifact from a clean consumer project.
- Complete: verify declarations, source maps, exports, licenses, provenance
  configuration, and a representative browser boot/destroy example.
- Complete: establish the changelog and upgrade policy for `0.1.0-rc.1`.
- Publish the release candidate and complete the final physical-device support
  matrix.

Exit condition: the release candidate installs and runs from the package alone,
all verification lanes pass, and the first external prerelease is approved.

## Historical record

The chronological implementation plan, checkpoint evidence, and design notes are
preserved in the [repository history folder](https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/docs/history). They are not part of
the current product taxonomy.
