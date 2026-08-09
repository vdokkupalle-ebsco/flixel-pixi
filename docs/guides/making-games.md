# Making Games with Flixel-Pixi

Short author notes for the game-maker DX track. Deeper lifecycle detail lives in
[`lifecycle.md`](lifecycle.md).

## Boot

```ts
import { createBrowserGame, FlxG, FlxState } from 'flixel-pixi';

const app = await createBrowserGame({
  host,
  initialState: PlayState,
  updateFramerate: 60,
  renderFramerate: 60,
  renderInterpolation: true,
});
```

`updateFramerate` controls the deterministic simulation rate and defaults to 60. `renderFramerate` is an optional visual cap; omit it to render at the
browser display's refresh rate. They are independent, so a game can update at
60 Hz while rendering at 30 FPS.

Render interpolation is enabled by default. It projects moving objects,
rotations, particles, and camera scroll between the previous and current fixed
states without mutating deterministic game state. Set `renderInterpolation:
false` when deliberately testing raw fixed-step presentation.

Enable the lightweight in-game FPS display when profiling a game:

```ts
createBrowserGame({
  // ...
  fpsDisplay: true,
});
```

It defaults to a detailed report in the top-right of the game host. Alongside
average FPS it shows average/P95/max frame time, jank frames, simulation updates
per second (`UPS`), renders with no update (`IDLE`), and renders that caught up
with multiple updates (`CATCH`). This separates throughput from frame pacing:
an average near 60 FPS can still feel uneven when P95, JANK, IDLE, or CATCH are
high.

Pass an options object to choose another corner, sampling interval, CSS classes,
theme colors, or `mode: 'compact'` for the original single-line FPS reading.
The display is DOM-based, adds no Pixi draw calls, and is removed by
`app.destroy()`.

`createBrowserGame` runs **incremental world sync** every frame, so sprites
added with `this.add(...)` during play are registered automatically.

In-repo samples can keep using `bootGame` from `examples/games/_kit/` — it is the
same helper.

Critical assets, custom preloading, branded bootstrap screens, retry, and
in-game loading states are covered in [`loading.md`](loading.md).

Property animation, easing, loop modes, delays, and chains are covered in
[`tweens.md`](tweens.md).

## Touches and swipes

`FlxG.touches` publishes every touch on simulation steps. Pointer coordinates
are logical canvas coordinates; use `touch.getWorldPosition(camera)` for world
interaction. Only the browser's primary touch mirrors `FlxG.mouse`, preserving
one-finger compatibility without letting a second finger affect mouse buttons.

```ts
for (const touch of FlxG.touches.active) {
  if (touch.justPressed) placeMarker(touch.getWorldPosition());
}

for (const swipe of FlxG.touches.swipes) {
  if (swipe.direction === 'left') selectNextItem();
}
```

Configure swipe thresholds through `FlxInputManagerOptions.touch`; distance is
in logical pixels and duration is in fixed simulation steps. Cancelled pointers
never produce swipes.

The public [Fruit Punch demo](../../examples/games/swipe/game.ts) combines
multi-touch swipes, mouse-drag fallback, deterministic fruit arcs, gesture
trails, continuous swept-segment hit detection, and animated cut halves.
Fruit-colored juice bursts preserve the target palette, while deterministic
bomb launches demonstrate hazardous swipe targets, score penalties, explosion
particles, and camera shake. Its burst effects reuse a fixed sprite pool and
prebuilt graphics so gesture-heavy play does not allocate particle textures.

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

Mixed-device actions use serializable structural sources:

```ts
import { FlxG, FlxGamepadButton } from 'flixel-pixi';

FlxG.actions.bindSources(
  'jump',
  { device: 'keyboard', key: 'SPACE' },
  { device: 'mouse', button: 0 },
  { device: 'gamepad-button', button: FlxGamepadButton.A },
);

FlxG.actions.bindSources(
  'move-x',
  { device: 'keyboard-axis', negative: 'A', positive: 'D' },
  { device: 'gamepad-axis', axis: 0 },
);

player.acceleration.x = FlxG.actions.value('move-x') * 900;
```

`rebind()` assigns one source and removes the same source from other actions by
default, avoiding accidental conflicts. Pass `{ exclusive: false }` to share a
control deliberately. Binding profiles are JSON-safe and validated atomically:

```ts
save.data.controls = FlxG.actions.save();
FlxG.actions.load(save.data.controls);
```

Gamepad sources may target `'first'` (the default), `'all'`, or one stable
numeric gamepad UID. When several analog sources are active, `value()` returns
the strongest magnitude; source order breaks equal ties.

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

## Atlases & animation

Load a TextureAtlas XML, TexturePacker JSON, or fixed-size grid with `FlxG.atlas`:

```ts
// XML (Kenney / LibGDX / Shoebox)
await FlxG.atlas.load('player', './assets/player.png', './assets/player.xml');

// TexturePacker / Pixi JSON (hash or array format)
await FlxG.atlas.load('ui', './assets/ui.png', './assets/ui.json');

// Fixed-size grid (frameWidth × frameHeight cells, named "0","1",…)
await FlxG.atlas.load('tiles', './assets/tiles.png', {
  frameWidth: 64,
  frameHeight: 64,
});

const playerAtlas = FlxG.atlas.get('player');
```

### Frame pickers

```ts
// framesByPrefix — pick a numbered range; retries with ".png" suffix (Kenney)
const walkFrames = playerAtlas.framesByPrefix('walk_', 1, 2); // padding=1 → walk_1, walk_2
const runFrames = playerAtlas.framesByPrefix('run_', 1, 4, { padding: 2 }); // run_01…run_04

// framesByNumber — 0-based index range or explicit list
const first2 = playerAtlas.framesByNumber(0, 1);
const custom = playerAtlas.framesByNumber([0, 2, 1]);

// getFrame — single named frame (also retries name+".png")
const idle = playerAtlas.getFrame('idle');
```

### Registering animations from atlas frames

Pass a `FlxAtlasFrameList` directly to `addAnimation`. The engine bakes the
frames into a horizontal strip internally — games never call bake helpers:

```ts
sprite.addAnimation('walk', playerAtlas.framesByPrefix('walk_', 1, 2));
sprite.addAnimation('jump', playerAtlas.framesByNumber(4, 6));

// Optional: scale frames while baking (e.g. half-size art for 64px tiles)
sprite.addAnimation('walk', playerAtlas.framesByPrefix('walk_', 1, 2), {
  frameWidth: 64,
  frameHeight: 128,
});
```

For tilemaps and single-frame items, use `atlas.makeGraphic(...)` then
`loadGraphic` / `loadMap` — still no internal bake API.

### Unified `play` API

```ts
// Options form — loop default false, speed default 1 (one anim frame per update)
sprite.play('walk', { loop: true });
sprite.play('jump', { loop: false, speed: 2 }); // 2× faster
sprite.play('idle', { loop: false, speed: 0.5, force: true }); // half speed, force restart

// Legacy boolean form — still works; loop/speed come from addAnimation defaults
sprite.addAnimation('run', [0, 1, 2], 12, true); // frameRate=12, looped=true
sprite.play('run'); // uses stored defaults
sprite.play('run', true); // force restart (legacy)
```

`speed` is relative to the game update rate (default 60 fps). `speed=1` means
one animation frame per game update; `speed=2` means two frames per update.

### Registry management

```ts
FlxG.atlas.has('player'); // boolean
FlxG.atlas.remove('player'); // drop from registry (does not destroy live textures)
FlxG.atlas.clear(); // drop all atlases
```

See `examples/games/kenney-platformer/` for a full game using TextureAtlas XML.
