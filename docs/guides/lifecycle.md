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

The helper also owns the bootstrap loading session: renderer initialization,
critical bundles, custom preparation, game creation, and the first rendered
frame. See [`loading.md`](loading.md) for customization and in-game loading.

Import engine types only from the package root (`flixel-pixi` or the repo `src`
barrel). Do not import `src/core/...` from game code.

## What the helper does each frame

1. `game.advance(deltaSeconds)` (unless `FlxG.paused`)
2. `syncWorldToRenderer(game, renderer)` when `game.context.renderablesDirty` — incremental add/remove of sprites, tilemaps, and emitters (skipped on frames with no membership changes)
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

## Substates and overlays

Use `FlxSubState` for pause menus, modal screens, and overlays that should not
replace the current state. Opening and closing are deferred to a safe update
boundary, so a substate can request its own close without mutating the active
state stack during traversal.

```ts
import { FlxState, FlxSubState } from 'flixel-pixi';

class PauseMenu extends FlxSubState {
  override update(): void {
    // Close from a button or input action.
    if (shouldResume()) this.close();
  }
}

class PlayState extends FlxState {
  override create(): void {
    this.openSubState(new PauseMenu());
  }
}
```

The parent defaults match HaxeFlixel: `persistentUpdate` is `false`, so gameplay
pauses under the overlay; `persistentDraw` is `true`, so it remains visible.
Set either property on the parent before opening the substate to change that
behavior. Substates can open nested substates, and `openCallback`,
`closeCallback`, `subStateOpened`, and `subStateClosed` expose lifecycle events.

Closed substates are destroyed by default. Set `destroySubStates = false` on
the parent when you intentionally want to retain and reopen the same instance;
its `create()` hook runs only once.

## Destroy

`app.destroy()` from `createBrowserGame` (or an equivalent teardown) should:

1. Stop the Pixi ticker
2. Destroy the `FlxCameraRenderer`
3. Call `game.destroy()` (uninstalls `FlxG` context, input, audio, plugins)
4. Destroy the Pixi `Application`

See `examples/games/hello/` for a complete boot → play → destroy loop, and
[`making-games.md`](making-games.md) for pools, actions, and invisible-sprite tips.
