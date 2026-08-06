# Browser guide

Browser constraints for `flixel-pixi` games. Full matrix and CI policy: [browser-support.md](../browser-support.md).

## Audio unlock

Web Audio starts suspended until a user gesture. Call `WebAudioBackend.unlockAudio()` (or play after a click/key). The Action sample does this on boot and again on burst.

## Storage

`FlxSave` uses `LocalStorageBackend` or `IndexedDBBackend` (ADR 0011). Expect quota errors and private-mode quirks; check `flush()` results.

## Input

Keyboard and pointer bind to DOM targets you pass into `FlxGame` (canvas / window). Fullscreen, focus loss, and visibility should pause or ignore stale keys as needed for your game.

## Assets

Flash embeds are gone. Use `FlxAssets` / Pixi `Assets` with URLs or generated `makeGraphic` / pixel buffers (ADR 0005). Prefer nearest sampling for pixel art.

## Rendering

WebGL is the primary path; WebGPU may be available via Pixi preference. Camera FX and multi-camera layouts assume GPU render textures.
