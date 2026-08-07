# Lifecycle guide

How a `flixel-pixi` game starts, steps, switches state, and tears down.

## Minimal boot (recommended)

Use the public helper — it owns Pixi, `FlxGame`, `FlxCameraRenderer`, per-frame
world sync, and teardown:

```ts
import { createBrowserGame } from 'flixel-pixi';

const app = await createBrowserGame({
  host: document.querySelector('#game')!,
  initialState: PlayState,
  width: 640,
  height: 480,
});
// later: app.destroy();
```

In-repo samples may still import `bootGame` from `examples/games/_kit/boot-game.ts`,
which re-exports `createBrowserGame`.

Import engine types only from the package root (`flixel-pixi` or the repo `src`
barrel). Do not import `src/core/...` from game code.

## What the helper does each frame

1. `game.advance(deltaSeconds)` (unless `FlxG.paused`)
2. `syncWorldToRenderer(game, renderer)` — incremental add/remove of sprites,
   tilemaps, and emitters found in the active state tree
3. `renderer.render()`

You do **not** need to call `syncRenderer()` after mid-state `this.add(sprite)`.
Call it only if you mutate the world outside the normal tick (tests, tooling).

## Manual boot (advanced)

If you cannot use `createBrowserGame`:

1. Create a PixiJS `Application` and mount its canvas.
2. Construct `FlxGame(width, height, InitialState, zoom, updateFps, flashFps, useSystemCursor, inputOptions, audioBackend?)`. Prefer `pointerTarget: app.canvas` and `keyboardTarget: window`.
3. Create `FlxCameraRenderer(renderer, stage, game.context)`.
4. Each frame: `game.advance(deltaSeconds)`, `syncWorldToRenderer(game, renderer)`, `renderer.render()`.

## States

- Subclass `FlxState` and override `create()` / `update()` / `destroy()`.
- `FlxG.switchState(new NextState())` queues an atomic swap at the next step boundary.
- World sync picks up the new state's members on the following frames.

## Destroy

`app.destroy()` from `createBrowserGame` (or an equivalent teardown) should:

1. Stop the Pixi ticker
2. Destroy the `FlxCameraRenderer`
3. Call `game.destroy()` (uninstalls `FlxG` context, input, audio, plugins)
4. Destroy the Pixi `Application`

See `examples/games/hello/` for a complete boot → play → destroy loop, and
[`making-games.md`](making-games.md) for pools, actions, and invisible-sprite tips.
