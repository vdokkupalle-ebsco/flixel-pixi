# ADR-0012: Replay recording format, VCR controls, and deterministic state verification

- Status: Accepted
- Date: 2026-08-06
- Accepted: 2026-08-06 (Phase 10 replay spike)

## Context

AS3 `FlxReplay` allowed recording and replaying user inputs via a plain-text format (`seed:N` header followed by line-by-line frame indices and mouse/keyboard states).
In modern web applications, display refresh rates vary from 30 Hz to 120 Hz+. Replays must remain 100% deterministic regardless of display cadence, and games need a structured format with checksum diagnostics to detect early simulation divergence.

## Decision

1. **Deterministic Fixed Step Execution**: Replay recording and playback operate strictly within `FlxGame.step()`. The RNG seed (`FlxG.random.initialSeed`) is recorded at start and re-seeded upon replay playback.
2. **Versioned JSON Replay Format (1.0)**: Replays serialize into structured JSON storing `version`, `seed`, `frameCount`, and `FrameRecord` objects containing input states and optional state checksums.
3. **Legacy AS3 Format Adapter**: `as3-replay-adapter.ts` provides bi-directional conversion between legacy AS3 text strings and modern `FlxReplay` instances.
4. **VCR Controls & Cancel Keys**: `FlxG.vcr` provides VCR status flags (`recording`, `replaying`, `stepRequested`, `cancelKeys`). Pressing any cancel key (default `Escape`) or reaching replay end halts playback cleanly.
5. **Divergence Diagnostics**: `FlxReplay.flagDivergence()` records the exact frame index and diagnostic string if a state checksum fails to match during playback.

## Consequences

- Replays recorded at one framerate run identically across 30, 60, and 120 Hz monitors.
- Legacy Flixel AS3 replay files can be imported and executed.
- Headless unit tests and Playwright E2E browser tests can verify replay determinism automatically.
