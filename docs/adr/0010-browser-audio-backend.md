# ADR-0010: Browser audio via replaceable backend with gesture-unlock queue

- Status: Accepted
- Date: 2026-08-06
- Accepted: 2026-08-06 (Phase 9 audio spike)

## Context

Browser autoplay policies forbid audio playback before a user gesture. Flash had
no such restriction, so AS3 `FlxSound` begins playback immediately. The Web
Audio `AudioContext` may also suspend on tab switch, focus loss, or mobile
interruption. Flixel's global volume, mute, music singleton, sound effects
group, proximity pan, fading, and auto-destroy must all survive these lifecycle
transitions.

## Decision

`FlxSound` remains a `FlxBasic` subclass with authoritative gameplay state:
volume, loop, fade target, proximity coordinates, and alive/exists flags. It
delegates actual playback to a `FlxSoundHandle` obtained from a replaceable
`FlxAudioBackend`.

`FlxAudioManager` owns the backend, the `music` singleton, the `sounds` group,
and global volume/mute. It is registered on the `FlxContext` service map via
`FLX_AUDIO_SERVICE` and resolved through `FlxG` statics.

The browser implementation (`WebAudioBackend`) creates an `AudioContext` lazily
and manages gesture-unlock as a play queue: any `play()` call before unlock
queues the sound and replays it on the first user gesture. Focus loss suspends
the context; visibility return resumes it. Volume hot-keys (`+`/`-`/`0`) are
retained and bound by `FlxGame` when `useSoundHotKeys` is true.

Proximity audio uses `StereoPannerNode` for left/right pan with linear
distance-based volume attenuation, matching the AS3 2D behavior without the
overhead of 3D `PannerNode` HRTF processing.

A `NullAudioBackend` enables headless unit tests with no browser dependencies.
All methods are stubs; `unlocked` is always true.

## Consequences

Games that call `FlxG.play()` before a gesture receive silent but queued audio.
Once any click, keydown, or touchstart arrives, the queue drains and subsequent
calls play immediately. Tab suspension and resume are transparent to gameplay
code. Headless tests use the null backend and never touch browser APIs. Proximity
panning is simple stereo, not 3D spatialized.
