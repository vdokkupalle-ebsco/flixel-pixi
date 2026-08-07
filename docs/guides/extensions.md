# Extension points

How to extend `flixel-pixi` without forking the core.

## Plugins

`FlxG.addPlugin` / `getPlugin` / `removePlugin` register `FlxBasic` plugins updated/drawn by `FlxContext` (Phase 8). Prefer plugins for timers, debug overlays, and cross-state systems.

## Render handles

Sprites, tilemaps, emitters, and buttons expose `createRenderHandle()`.
`FlxCameraRenderer.add` attaches handles into the world layer. Prefer
`createBrowserGame` / `syncWorldToRenderer` so membership stays in sync; custom
drawables should still follow simulation object + handle that `sync(camera)` each
pass (ADR 0001).

## Compatibility modules

CPU pixel ops (`stamp`, `replaceColor`, mutable `pixels`) live in the explicit compatibility path (ADR 0006). Keep them out of hot gameplay loops; preprocess assets when possible.

## Services

`FlxContext.setService` / `getService` host audio, storage, camera host, log, watch, and actions. Swap backends (`WebAudioBackend`, `LocalStorageBackend`, …) at construction time for tests or alternate platforms.

## Input / audio / save

- Input: `FlxInputManager` options on `FlxGame`; optional `FlxG.actions` for named key bindings
- Audio: pass `FlxAudioBackend` into `FlxGame` / `createBrowserGame` (ADR 0010)
- Save: `FlxSave.bind` with versioned migrations (ADR 0011)

## What not to do

Do not subclass Pixi display objects to express Flixel entities. Do not import private `src/**` modules from games — only the package public export.
