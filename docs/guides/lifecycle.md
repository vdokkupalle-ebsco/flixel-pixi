# Lifecycle guide

How a `flixel-pixi` game starts, steps, switches state, and tears down.

## Minimal boot

Use the Phase 12 sample kit (`examples/games/_kit/boot-game.ts`) or the same pattern yourself:

1. Create a PixiJS `Application` and mount its canvas.
2. Construct `FlxGame(width, height, InitialState, zoom, updateFps, flashFps, useSystemCursor, inputOptions, audioBackend?)`.
3. Create `FlxCameraRenderer(renderer, stage, game.context)` and register displayables with `renderer.add(...)`.
4. Each frame: `game.advance(deltaSeconds)` then `renderer.render()`.

Import engine types only from the package root (`flixel-pixi` or the repo `src` barrel). Do not import `src/core/...` from game code.

## States

- Subclass `FlxState` and override `create()` / `update()` / `destroy()`.
- `FlxG.switchState(new NextState())` queues an atomic swap at the next step boundary.
- After a switch, re-sync the camera renderer (the sample kit does this automatically when `game.state` changes).

## Destroy

Call a single teardown that:

1. Stops the Pixi ticker
2. Destroys the `FlxCameraRenderer`
3. Calls `game.destroy()` (uninstalls `FlxG` context, input, audio, plugins)
4. Destroys the Pixi `Application`

See `examples/games/hello/` for a complete boot → play → destroy loop.
