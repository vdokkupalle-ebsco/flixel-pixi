# Making Games with Flixel-Pixi

Short author notes for the game-maker DX track. Deeper lifecycle detail lives in
[`lifecycle.md`](lifecycle.md).

## Boot

```ts
import { createBrowserGame, FlxG, FlxState } from 'flixel-pixi';

const app = await createBrowserGame({
  host,
  initialState: PlayState,
});
```

`createBrowserGame` runs **incremental world sync** every frame, so sprites
added with `this.add(...)` during play are registered automatically.

In-repo samples can keep using `bootGame` from `examples/games/_kit/` — it is the
same helper.

## Named actions

Bind gameplay intents instead of scattering raw key names:

```ts
FlxG.actions.bind('jump', 'SPACE', 'W');
FlxG.actions.bind('shoot', 'Z', 'J');

if (FlxG.actions.justPressed('jump')) {
  // …
}
```

`FlxG.keys` still works and remains the source of truth for replay/key names.

## Managing object pools

Avoid per-spawn allocation with `FlxGroup.recycle()`:

```ts
import { FlxGroup, FlxSprite, FlxState } from 'flixel-pixi';

class Enemy extends FlxSprite {
  constructor() {
    super(0, 0);
    this.makeGraphic(18, 18, 0xffef4444);
    this.exists = false;
  }

  spawn(x: number, y: number): void {
    this.reset(x, y);
    this.velocity.x = -100;
  }
}

export class PlayState extends FlxState {
  enemies!: FlxGroup<Enemy>;

  override create(): void {
    super.create();
    this.enemies = new FlxGroup<Enemy>(16);
    for (let i = 0; i < 16; i += 1) {
      this.enemies.add(new Enemy());
    }
    this.add(this.enemies);
  }

  spawnEnemy(): void {
    const enemy = this.enemies.recycle(Enemy);
    if (enemy) enemy.spawn(600, 200);
  }
}
```

See `examples/games/external/` for a full shoot-em-up using recycled enemies.

## Troubleshooting invisible sprites

1. **Added to the state/group?** Call `this.add(sprite)` or `group.add(sprite)`.
2. **`exists` / `visible`?** Pooled objects need `reset` / `exists = true` on spawn.
3. **Graphic loaded?** Call `makeGraphic` or `loadGraphic` (zero-size sprites draw nothing).
4. **Using a custom boot path?** If you are not on `createBrowserGame`, call
   `syncWorldToRenderer(game, renderer)` after membership changes (or every frame).
5. **Evidence / DX summary:** [`docs/dx-evidence.md`](../dx-evidence.md).
