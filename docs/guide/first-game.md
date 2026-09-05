---
title: Build Your First TypeScript Browser Game
description: Build a complete 2D HTML5 platformer with Flixel-Pixi sprites, tilemaps, collision, keyboard input, collectibles, sound, and scoring.
---

# Creating Your First Game

In this tutorial, you will build a complete mini platformer game called **Coin Collector**.

You'll learn how to:

1. Set up a state with gravity and player physics.
2. Build platforms and level geometry with `FlxTilemap` or sprites.
3. Spawn collectible items with `FlxGroup`.
4. Handle collisions using `FlxObject.separate` and overlaps using `FlxObject.overlap`.
5. Add scoring text with `FlxText` and sound effects.

---

## 1. Setting Up the PlayState

Create a new file `src/PlayState.ts`:

```ts
import {
  FlxGroup,
  FlxG,
  FlxObject,
  FlxPoint,
  FlxSprite,
  FlxState,
  FlxText,
} from 'flixel-pixi';

export class PlayState extends FlxState {
  private player!: FlxSprite;
  private platforms!: FlxGroup;
  private coins!: FlxGroup;
  private scoreText!: FlxText;
  private score: number = 0;

  override create(): void {
    super.create();

    // 1. Create Platforms
    this.platforms = new FlxGroup();
    this.add(this.platforms);

    // Floor
    const floor = new FlxSprite(0, 440);
    floor.makeGraphic(640, 40, 0x334155);
    floor.immovable = true;
    this.platforms.add(floor);

    // Floating ledge 1
    const ledge1 = new FlxSprite(100, 320);
    ledge1.makeGraphic(160, 20, 0x475569);
    ledge1.immovable = true;
    this.platforms.add(ledge1);

    // Floating ledge 2
    const ledge2 = new FlxSprite(380, 240);
    ledge2.makeGraphic(180, 20, 0x475569);
    ledge2.immovable = true;
    this.platforms.add(ledge2);

    // 2. Create Coins
    this.coins = new FlxGroup();
    this.add(this.coins);
    this.spawnCoin(150, 280);
    this.spawnCoin(200, 280);
    this.spawnCoin(420, 200);
    this.spawnCoin(480, 200);
    this.spawnCoin(500, 400);

    // 3. Create Player
    this.player = new FlxSprite(50, 350);
    this.player.makeGraphic(24, 32, 0x10b981);
    this.player.acceleration.y = 800; // Gravity
    this.player.maxVelocity = new FlxPoint(220, 500);
    this.player.drag = new FlxPoint(400, 0); // Ground friction
    this.add(this.player);

    // 4. Create HUD
    this.scoreText = new FlxText(16, 16, 200, 'Score: 0', 18);
    this.scoreText.color = 0xf8fafc;
    this.scoreText.scrollFactor.set(0, 0); // Stick to screen
    this.add(this.scoreText);
  }

  private spawnCoin(x: number, y: number): void {
    const coin = new FlxSprite(x, y);
    coin.makeGraphic(12, 12, 0xfacc15);
    this.coins.add(coin);
  }

  override update(): void {
    super.update();

    // Player Controls
    const speed = 200;
    const jumpPower = 420;

    const keyboard = FlxG.keys;

    if (keyboard.pressed('LEFT', 'A')) {
      this.player.velocity.x = -speed;
    } else if (keyboard.pressed('RIGHT', 'D')) {
      this.player.velocity.x = speed;
    }

    // Jump only when on the floor
    if (
      keyboard.justPressed('SPACE', 'UP', 'W') &&
      this.player.isTouching(FlxObject.FLOOR)
    ) {
      this.player.velocity.y = -jumpPower;
    }

    // 1. Separate Player vs Platforms
    FlxObject.separate(this.player, this.platforms);

    // 2. Overlap Player vs Coins
    FlxObject.overlap(this.player, this.coins, (_player, coin) => {
      coin.kill(); // Remove coin
      this.score += 100;
      this.scoreText.text = `Score: ${this.score}`;
    });
  }
}
```

---

## 2. Booting the Game

In `src/main.ts`:

```ts
import { createBrowserGame } from 'flixel-pixi';
import { PlayState } from './PlayState';

async function init(): Promise<void> {
  const host = document.getElementById('game-container');
  if (!host) throw new Error('Host element #game-container not found.');

  const app = await createBrowserGame({
    host,
    initialState: PlayState,
    width: 640,
    height: 480,
  });

  const destroy = (): void => {
    window.removeEventListener('pagehide', destroy);
    app.destroy();
  };
  window.addEventListener('pagehide', destroy, { once: true });
  import.meta.hot?.dispose(destroy);
}

void init();
```

---

## 3. What You Learned

- **`FlxSprite.acceleration.y`**: Provides constant gravitational pull.
- **`FlxSprite.drag`**: Slows down the sprite horizontally when keys are released.
- **`FlxObject.isTouching(FlxObject.FLOOR)`**: Detects whether the player is resting on top of a solid surface.
- **`FlxObject.separate()`**: Automatically pushes overlapping solid objects apart based on velocity and bounding boxes.
- **`FlxObject.overlap()`**: Checks for collisions and triggers a callback (ideal for pickups and triggers).

---

## Next Steps

- Learn more about the fixed-step accumulator and loop in [Core Architecture](/guide/core-concepts).
- Explore [Sprites & Textures](/guide/sprites) to add pixel art animations.
- Check out the full [Retro Platformer Demo](/examples/platformer/) in the Examples gallery.
