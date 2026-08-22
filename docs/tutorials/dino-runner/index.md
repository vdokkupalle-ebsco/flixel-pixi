---
title: Build a Dino Runner with Flixel-Pixi
description: Create a playable endless runner step by step while learning Flixel-Pixi states, sprites, animation, input, physics, collision, scoring, and restart flow.
head:
  - - meta
    - property: og:title
      content: Build a Dino Runner with Flixel-Pixi
  - - meta
    - property: og:description
      content: A beginner-friendly TypeScript tutorial for building an endless browser game with Flixel-Pixi.
---

# Build a Dino Runner

In this tutorial you will build a small endless runner in TypeScript. The game is deliberately simple: the player jumps, the world moves left, and a collision ends the run. That small loop is enough to introduce most of the concepts you will reuse in a platformer, arcade game, or action game.

<DemoEmbed
  src="/games/dino-runner/index.html"
  title="Dino Runner tutorial game"
  controlsHint="Click the game, then press Space, Up, W, or tap to jump. Release early for a shorter jump; press Down or S to drop quickly."
  height="280px"
/>

## What you will learn

By the end, you will understand how these engine pieces work together:

| Concept         | Flixel-Pixi API                             | Job in the game                                         |
| --------------- | ------------------------------------------- | ------------------------------------------------------- |
| Scene lifecycle | `FlxState`                                  | Creates and updates the current game screen             |
| Game objects    | `FlxSprite`                                 | Holds position, velocity, acceleration, art, and bounds |
| Animation       | `loadGraphic`, `addAnimation`, `play`       | Switches between running and jumping frames             |
| Asset loading   | `createBrowserGame` assets and `FlxG.atlas` | Preloads one image and selects frames from it           |
| Input           | `FlxG.keys`, `FlxG.mouse`                   | Supports jump, early release, fast drop, and restart    |
| Endless scenery | `FlxBackdrop`                               | Repeats and scrolls the ground texture                  |
| Object pooling  | `kill`, `revive`                            | Reuses randomized cactus groups                         |
| Collision       | `overlaps`                                  | Detects when the dinosaur hits an active cactus         |
| Frame time      | `FlxG.elapsed`                              | Makes score and difficulty independent of frame rate    |

## 1. Create the game and its first state

Every Flixel-Pixi game needs a host element, a game instance, and an initial state. A state is a scene with a lifecycle: `create()` runs once when the state begins, while `update()` runs once per game step.

```ts
import { createBrowserGame, FlxState } from 'flixel-pixi';

class DinoRunnerState extends FlxState {
  override create(): void {
    super.create();
    // We will add the dinosaur, ground, obstacle, and UI here.
  }

  override update(): void {
    // We will read input and advance the run here.
    super.update();
  }
}

const host = document.querySelector<HTMLElement>('#game');

if (host) {
  await createBrowserGame({
    host,
    initialState: DinoRunnerState,
    width: 600,
    height: 150,
    backgroundColor: 0xf7f7f7,
    preloader: false,
  });
}
```

Calling `super.update()` matters. `FlxState` is also a group, so the base update advances the sprites you add to it, applies velocity and acceleration, and updates animations.

## 2. Add a sprite and let the engine apply gravity

Create a player sprite near the left side of the screen. A sprite is more than an image: it already has position, size, velocity, acceleration, and collision bounds.

```ts
import { FlxSprite, FlxState } from 'flixel-pixi';

const DINO_FLOOR_Y = 95;

class DinoRunnerState extends FlxState {
  player!: FlxSprite;

  override create(): void {
    super.create();

    this.player = new FlxSprite(52, DINO_FLOOR_Y);
    this.player.makeGraphic(38, 40, 0xff53565a);
    this.player.acceleration.y = 2_160;
    this.player.maxVelocity.y = 900;
    this.add(this.player);
  }

  override update(): void {
    super.update();

    if (this.player.y >= DINO_FLOOR_Y) {
      this.player.y = DINO_FLOOR_Y;
      this.player.velocity.y = 0;
    }
  }
}
```

`acceleration.y` continuously changes `velocity.y`; velocity then changes the sprite's position. Positive Y points downward on the screen, so a positive acceleration behaves like gravity. Clamping the player to `DINO_FLOOR_Y` gives us a simple floor without introducing a tilemap yet.

## 3. Turn input into a jump

A jump is a single upward impulse. Because upward is negative Y, set a negative vertical velocity only when the player is touching the floor.

```ts
override update(): void {
  const jumpPressed =
    FlxG.keys.justPressed('SPACE') ||
    FlxG.keys.justPressed('UP') ||
    FlxG.keys.justPressed('W') ||
    FlxG.mouse.justPressed();
  const grounded = this.player.y >= DINO_FLOOR_Y - 0.5;

  if (jumpPressed && grounded) {
    this.player.velocity.y = -720;
  }

  super.update();

  if (this.player.y >= DINO_FLOOR_Y) {
    this.player.y = DINO_FLOOR_Y;
    this.player.velocity.y = 0;
  }
}
```

Use `justPressed` for an action that should fire once. `pressed` stays true for every update while the control is held and would repeatedly reset the jump velocity.

`FlxG.mouse` is backed by pointer input in the browser, so the same check also makes the game approachable on touch screens.

## 4. Preload and animate the spritesheet

Describe the image and its atlas metadata in the built-in asset manifest. `createBrowserGame` loads the initial bundle before it creates `DinoRunnerState`, shows the engine preloader while work is in progress, and passes the loaded bundle to your `preload` callback.

```ts
import { createBrowserGame, FlxG } from 'flixel-pixi';

await createBrowserGame({
  host,
  initialState: DinoRunnerState,
  width: 600,
  height: 150,
  assets: {
    bundles: [
      {
        name: 'dino-runner',
        assets: [
          {
            alias: 'dino-image',
            src: new URL('./assets/chrome-dinosaur-sprite.png', import.meta.url)
              .href,
          },
          {
            alias: 'dino-meta',
            parser: 'text',
            src: new URL(
              './assets/chrome-dinosaur-sprite.json',
              import.meta.url,
            ).href,
          },
        ],
      },
    ],
    initialBundles: 'dino-runner',
  },
  preload({ assets }) {
    FlxG.atlas.registerFromAssets('dino-runner', assets, {
      image: 'dino-image',
      meta: 'dino-meta',
    });
  },
});
```

The JSON metadata gives names to regions of the supplied image. In the state, ask the atlas for those named frames and register readable animations:

```ts
const atlas = FlxG.atlas.get('dino-runner');
const frameSize = { frameWidth: 88, frameHeight: 94 };
this.player.addAnimation(
  'run',
  atlas.framesByPrefix('dino_run_', 1, 2),
  frameSize,
);
this.player.addAnimation('jump', [atlas.getFrame('dino_jump')], frameSize);
this.player.addAnimation(
  'crashed',
  [atlas.getFrame('dino_crashed')],
  frameSize,
);
this.player.scale.make(0.5, 0.5);
this.player.origin.make(0, 0);
this.player.play('run', { loop: true, speed: 10 / 60 });
```

When a jump begins, switch to the still airborne frame:

```ts
this.player.velocity.y = -720;
this.player.play('jump');
```

When the floor clamp runs, switch back to the looping run animation. Naming animations keeps the state logic readable even when the sheet later grows to dozens of frames.

## 5. Scroll the floor forever

The dinosaur barely moves horizontally. The illusion of running comes from moving the world left. `FlxBackdrop` repeats a graphic as it scrolls, which removes the bookkeeping normally needed to join two ground images without a gap.

```ts
this.ground = new FlxBackdrop(
  FlxG.atlas.get('dino-runner').getFrame('ground').texture,
  0,
  FLOOR_Y,
  600,
  9,
);
this.ground.repeatY = false;
this.ground.tileScale.make(0.5, 0.5);
this.ground.scrollVelocity.x = -360;
this.add(this.ground);
```

`tileScale` shrinks the bundled 2× texture without shrinking the backdrop itself. That distinction matters: scaling the whole backdrop also scales its scroll distance, which makes the ground appear slower than the cactus sprites. Now both use the same logical world speed, and the backdrop wraps automatically without creating another object.

## 6. Pool varied obstacles and calculate fair gaps

The original runner chooses between small and large cacti, groups one to three together once the speed permits it, and widens the safe gap as the game gets faster. Create a few inactive sprites up front, then wake one when a new obstacle is needed.

```ts
for (let index = 0; index < 3; index += 1) {
  const sprite = new FlxSprite();
  sprite.kill();
  this.obstacles.push({ sprite, gap: 0, followingSpawned: false });
  this.add(sprite);
}
```

When spawning, select a named atlas frame such as `cactus_small_2`, call `revive()`, and scale the 2× art to its original display size. The reference game's gap formula is useful because it accounts for both obstacle width and current speed:

```ts
const normalizedSpeed = this.speed / 60;
const minGap = Math.round(obstacleWidth * normalizedSpeed + 120 * 0.6);
slot.gap = minGap + Math.random() * (minGap * 1.5 - minGap);
```

Mark the current obstacle after its follower is spawned. When it leaves the screen, `kill()` returns that sprite to the pool. This supports overlapping obstacle lifetimes without allocating a new object in the game loop.

## 7. Detect the crash

Both objects already have rectangular bounds, so collision detection is one readable condition:

```ts
if (
  this.obstacles.some(
    ({ sprite }) => sprite.exists && this.player.overlaps(sprite),
  )
) {
  this.running = false;
  this.gameOver = true;
  this.obstacle.velocity.x = 0;
  this.ground.scrollVelocity.x = 0;
}
```

`overlaps()` answers whether the bounds intersect; it does not move either object. That is exactly what this game needs because a cactus hit ends the run. For solid platforms where objects should be separated, use Flixel-Pixi's collision and physics helpers instead.

## 8. Score with elapsed time and raise the speed

Frames are not a unit of time: a fast display can render more frames than a slow one. Use `FlxG.elapsed`, the seconds advanced by the current update, to make scoring consistent.

```ts
const START_SPEED = 360;
const MAX_SPEED = 720;
const ACCELERATION = 3.6;
const SCORE_COEFFICIENT = 0.025;

this.distance += this.speed * FlxG.elapsed;
this.score = Math.floor(this.distance * SCORE_COEFFICIENT);
this.speed = Math.min(MAX_SPEED, this.speed + ACCELERATION * FlxG.elapsed);
this.ground.scrollVelocity.x = -this.speed;
```

The values are the reference implementation's frame-based rules converted into per-second units. The game also waits three seconds before spawning the first obstacle, scrolls clouds at one fifth of the ground speed, flashes the meter at each 100-point milestone, and caps the speed before the gaps become unreasonable.

The score is not browser text. The atlas names the `0`–`9`, `H`, and `I` cells already present in the spritesheet, and the UI composes them from small `FlxSprite` glyphs. The game-over banner is another named atlas frame, so both pieces retain the original pixel lettering at every responsive size.

## 9. Make jump height responsive

The familiar Dino jump is not one fixed arc. Releasing the jump after the minimum height trims the remaining upward velocity, while Down or S applies stronger gravity for a fast landing:

```ts
if (jumpReleased && this.player.y < DINO_GROUND_Y - 35) {
  this.player.velocity.y = Math.max(this.player.velocity.y, -300);
}

this.player.acceleration.y = dropping ? 6_480 : 2_160;
```

That small amount of control lets players handle short and long obstacle patterns without adding a second jump.

## 10. Give the crash weight

A crash should communicate the impact without delaying the restart. Convert the current speed into a `0`–`1` ratio, then use it to tune a short forward tumble:

```ts
const speedRatio = Math.max(
  0,
  Math.min(1, (this.speed - START_SPEED) / (MAX_SPEED - START_SPEED)),
);

this.player.velocity.x = 55 + speedRatio * 75;
this.player.velocity.y = -(260 + speedRatio * 100);
this.player.acceleration.y = 1_800;
this.player.angularVelocity = (10 + speedRatio * 14) / 0.32;
```

The implementation temporarily moves the sprite's transform origin to its center before rotating, clamps the final angle, and stops the dinosaur when it returns to the floor. Faster impacts therefore travel and rotate a little farther, while the whole motion still settles in well under the restart delay.

## 11. Restart by resetting the state you own

On game over, keep the high score and reset the values that belong to the current run:

```ts
private restart(): void {
  this.score = 0;
  this.distance = 0;
  this.runTime = 0;
  this.speed = START_SPEED;
  this.running = true;
  this.gameOver = false;
  this.player.origin.make(0, 0);
  this.player.x = DINO_X;
  this.player.y = DINO_FLOOR_Y;
  this.player.velocity.make(0, 0);
  this.player.acceleration.y = GRAVITY;
  this.player.angle = 0;
  this.player.angularVelocity = 0;
  for (const obstacle of this.obstacles) obstacle.sprite.kill();
}
```

The finished version also shows the crash frame and restart icon from the atlas, preserves the high score, and waits 750 milliseconds before accepting the jump key as a restart. Enter restarts immediately. This prevents the key that caused a late jump from accidentally dismissing the result.

## Try these next

Once your version runs, make one change at a time:

1. Add the pterodactyl frames and turn Down or S into a duck action on the ground.
2. Replace the simple rectangular bounds with several tighter collision boxes.
3. Save the high score with `FlxSave` so it survives a reload.
4. Add a day/night color transition every 100 points.
5. Add coyote time or jump buffering and compare how the controls feel.

## Finished source

The complete implementation separates asset declarations, state logic, and browser startup so each file has one job:

- [`assets.ts`](https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/dino-runner) declares bundle and atlas names;
- `assets/chrome-dinosaur-sprite.json` names the dinosaur, cactus groups, clouds, ground, and restart frames;
- `game.ts` owns game rules and state;
- `main.ts` mounts and tears down the browser game.

[View the complete Dino Runner source on GitHub](https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/dino-runner)

[Back to all tutorials](/tutorials/)
