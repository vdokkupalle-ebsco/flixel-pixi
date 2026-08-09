# Phase 10 evidence: replay and deterministic verification

- Checkpoint: C10 replay gate
- Status: Passed
- Date: 2026-08-06
- Upstream oracle: Flixel commit `8989e5044be072c4abbbaa1317c9854786f6447f`
- PixiJS baseline: 8.19

Phase 10 ports `FlxReplay`, `FrameRecord`, `MouseRecord`, and `FlxVCR`, and completes the `FlxG` replay facade (`FlxG.recordReplay`, `FlxG.stopRecording`, `FlxG.loadReplay`, `FlxG.reloadReplay`). It establishes deterministic fixed-step simulation verification, seed persistence, frame checksum divergence tracking, and bi-directional legacy AS3 text replay conversion via `AS3ReplayAdapter`.

## Pinned source contracts & VCR design

The implementation was verified against the pinned AS3 source:

- **Deterministic RNG & Fixed-Step Execution**: Replay recording and playback operate strictly within `FlxGame.step()`. The RNG seed (`FlxG.random.initialSeed`) is captured when recording starts and restored upon playback.
- **Input Snapshots & Alignment**: Mouse coordinates, button states, wheel movement, and keyboard key transitions are captured into per-step `FrameRecord` objects during `FlxGame.step()`. Playback feeds these exact input states back into the input system at the start of each simulation step.
- **Versioned JSON Serialization**: `FlxReplay` serializes to/from structured JSON format storing `version`, `seed`, `frameCount`, and array of `FrameRecord` entries.
- **AS3 Legacy Converter**: `convertAS3ReplayToFlxReplay()` and `convertFlxReplayToAS3Text()` enable bi-directional conversion between AS3 plaintext format (`seed:N` header followed by indexed lines) and modern `FlxReplay` objects.
- **VCR State Management & Cancel Keys**: `FlxG.vcr` tracks VCR mode (`recording`, `replaying`, `stepRequested`, `cancelKeys`). Playback automatically halts upon reaching replay end or when a cancel key (e.g. `Escape`) is pressed.
- **State Divergence Diagnostics**: `FlxReplay.flagDivergence(frame, expectedChecksum, actualChecksum)` marks divergent state simulation and outputs diagnostic details.

## Verification results

- **Headless unit tests** (`tests/unit/flx-replay.test.ts`): 100% pass across all 5 test suites.
- **Full Unit Test Suite**: 21 test files, 138 tests passed.
- **Real-browser Playwright tests** (`tests/browser/replay.spec.ts` & complete suite): 100% pass (51 browser tests passed across Chromium, Firefox, and WebKit).
- **TypeScript strict compilation**: clean (`npx tsc --noEmit`).

## Demo Workbench

The interactive smoke workbench is hosted at `http://localhost:5173/replay.html` (served via `npm run dev` / `vite --config vite.smoke.config.ts`).
It features:

- Interactive ball motion and marker placement driven by keyboard and mouse input.
- Real-time VCR controls (`● Record`, `■ Stop Record`, `▶ Play`, `≪ Rewind`, `❚❚ Step 1 Frame`, `Export AS3 Text`).
- Live frame counter, VCR status indicator, and ball position readouts.
- AS3 plaintext export alert and console logging.

## Checkpoint verdict

C10 passes. Replays reliably capture and re-execute input sequences with exact seed restoration; display refresh rate variations (30, 60, 120 Hz) do not alter simulation outcome; state divergence is detected cleanly; legacy AS3 text replays convert bi-directionally; and clean page/game destruction releases all resources.
