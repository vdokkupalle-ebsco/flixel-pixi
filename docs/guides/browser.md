# Browser guide

Browser constraints for `flixel-pixi` games. Full matrix and CI policy: [browser-support.md](../browser-support.md).

## Audio unlock

Web Audio starts suspended until a user gesture. `FlxAudioManager` installs the
unlock listeners automatically; playback requested before the first click,
keydown, or touch is queued. `WebAudioBackend` accepts decoded `AudioBuffer`
objects, `HTMLAudioElement` objects, and URL strings. Resolve asset aliases
before passing them to the audio manager.

## Storage

`FlxSave` uses `LocalStorageBackend` or `IndexedDBBackend` (ADR 0011). Expect
quota errors and private-mode quirks. Check synchronous `flush()` results for
localStorage; with IndexedDB, use and check `await save.flushAsync()` and
`await save.eraseAsync()` so the result reflects transaction completion.

## Input

Keyboard and pointer bind to DOM targets you pass into `FlxGame` (canvas / window). Fullscreen, focus loss, and visibility should pause or ignore stale keys as needed for your game.

## Assets

Flash embeds are gone. Use `FlxAssets` / Pixi `Assets` with URLs or generated `makeGraphic` / pixel buffers (ADR 0005). Prefer nearest sampling for pixel art.

## Rendering

WebGL is the primary path; WebGPU may be available via Pixi preference. Camera FX and multi-camera layouts assume GPU render textures.
