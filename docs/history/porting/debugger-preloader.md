# Phase 11 evidence: debugger and preloader

- Checkpoint: C11 tooling gate
- Status: Passed
- Date: 2026-08-06
- Upstream oracle: Flixel commit `8989e5044be072c4abbbaa1317c9854786f6447f`
- PixiJS baseline: 8.19

Phase 11 ports an optional DOM debugger (`FlxDebugger`) with Log, Watch, Perf, VCR, and Vis panels, plus an accessible HTML `FlxPreloader`. Engine-side services (`FlxLog`, `FlxWatch`, `DebugChannel`) feed structured debug events into the overlay without requiring Flash-era UI. VCR controls drive the existing Phase 10 replay facade (`FlxG.recordReplay` / `stopRecording` / `loadReplay` / `reloadReplay`).

## Pinned source contracts & tooling design

The implementation was verified against the pinned AS3 debugger / preloader surface:

- **DebugChannel**: Typed pub/sub for `log`, `watch`, and `step-complete` events. `FlxGame` emits step timing; `FlxG.log` / `FlxG.watch` publish through the channel so the DOM overlay can subscribe without mutating simulation state.
- **Log panel**: `FlxLog.add()` entries appear live with color; clear control and `aria-live` list for screen readers.
- **Watch panel**: Named property watches (`FlxG.watch.add`) refresh each step with live object values (demo: `player.x/y`, `velocity.x/y`).
- **Perf panel**: FPS and update timing derived from `step-complete` events.
- **VCR panel**: Record / stop / rewind / step / play invoke explicit VCR callbacks only — the overlay does not write simulation state except through those commands.
- **Vis panel**: Visual-debug toggle dispatches `flxdbg:vis-debug`; the smoke demo wires it to `FlxG.visualDebug` and `FlxCameraRenderer.debugBounds` for bounding-box overlays.
- **FlxPreloader**: Accessible loading screen (`role="status"`, progress bar, retry / error states) that fades out and removes itself on `complete()`.
- **Keyboard / a11y**: Tab bar arrow-key navigation, `aria-selected` / `aria-controls`, focus-visible outlines, labeled VCR and Vis controls.

## Verification results

- **Headless unit tests** (`tests/unit/flx-debugger.test.ts`): 18/18 passed (DebugChannel, FlxLog, FlxWatch, FlxPreloader).
- **Real-browser Playwright tests** (`tests/browser/debugger.spec.ts`): **24/24 passed** — 8 C11 scenarios × Chromium, Firefox, and WebKit:
  1. Preloader appears then dismisses; debugger overlay and all 5 tabs visible
  2. Log panel shows messages from `FlxG.log.add()`
  3. Watch panel shows live player position values
  4. Perf panel shows FPS
  5. VCR record / stop / rewind / step / play workflow
  6. Toggle shows/hides debugger overlay
  7. Tab keyboard navigation (arrow keys)
  8. Clean destruction removes debugger from DOM
- **Manual demo verification** (`http://localhost:5173/debugger.html`): all 5 debugger panels working; Vis toggle shows bounding boxes; preloader appears and dismisses; VCR record / rewind / step / play confirmed.

## Demo workbench

The interactive smoke workbench is at `http://localhost:5173/debugger.html` (via `npm run dev` / `vite --config vite.smoke.config.ts`).

It features:

- Bouncing player sprite with arrow-key steering
- Live Log / Watch / Perf / VCR / Vis debugger panels
- Preloader splash during boot
- Visual-debug bounds toggle
- External debugger toggle, manual log entry, and destroy controls

## Checkpoint verdict

C11 passes. Logs, watches, perf readout, visual toggles, and VCR record/replay/step work in the sample game; debugger simulation mutation is limited to explicit VCR commands; keyboard navigation and screen-reader labels cover debugger controls and the loading UI; production consumers can omit `FlxDebugger` / `FlxPreloader` imports so the DOM overlay tree-shakes out of builds that do not use it.
