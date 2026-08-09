# Phase 9 evidence: audio and save data

- Checkpoint: C9 platform services gate
- Status: Passed
- Date: 2026-08-06
- Upstream oracle: Flixel commit `8989e5044be072c4abbbaa1317c9854786f6447f`
- PixiJS baseline: 8.19

Phase 9 ports `FlxSound` (all 24 AS3 members) and `FlxSave` (all 8 AS3 members),
defines replaceable audio and storage backends (`FlxAudioBackend`, `FlxStorageBackend`, `FlxAsyncStorageBackend`),
and implements browser Web Audio API and localStorage/IndexedDB integration.

## Pinned source contracts

The implementation was verified against the pinned AS3 source:

- `FlxSound` extends `FlxBasic` and retains authoritative simulation state
  (volume, fading, proximity, autoDestroy, survive, alive, exists).
- Fades linearly interpolate volume across fixed-step `update()` ticks.
- Proximity audio computes 2D distance-based volume attenuation and stereo panning.
- Music singleton `FlxG.music` persists across state changes (`survive = true`);
  non-surviving sounds are cleaned up during state switches in `FlxGame.step()`.
- Global volume and mute scale per-instance volume via `getActualVolume()`.
- `FlxSave` manages data binding, namespaced storage keys (`flixel:{name}`),
  versioned schema migration, typed `flush()` result objects, and silent
  recovery from malformed stored data.

## Replaceable architecture & browser risks

- **Audio Backend**: `WebAudioBackend` handles browser autoplay gesture unlocking
  via a real pending-play queue, suspending/resuming audio context on visibility
  loss, URL playback through `HTMLAudioElement`, decoded `AudioBuffer` playback,
  and stereo panning via `StereoPannerNode`. `FlxAudioManager` installs the
  gesture listeners automatically. `NullAudioBackend` provides headless execution for unit tests.
- **Storage Backend**: `LocalStorageBackend` handles quota failure classification
  (`DOMException`), JSON serialization, and safe key namespacing. `IndexedDBBackend`
  provides an async adapter whose `flushAsync()` / `eraseAsync()` methods settle
  only when the IndexedDB transaction commits or fails. Its synchronous
  `flush()` returns an `async` error instead of reporting false durability.
  `NullStorageBackend` provides in-memory map storage.

## Verification results

- Headless suite, including audio/save/backend tests: 29 files and 218 tests pass.
- Real-browser Playwright tests (`tests/browser/phase9.spec.ts`): 9/9 pass
  (three scenarios across Chromium, Firefox, and WebKit), including an actual
  close/reopen IndexedDB durability check.
- TypeScript strict compilation: clean (`npx tsc --noEmit`).
