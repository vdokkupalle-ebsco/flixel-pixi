# FlxObject & Sprites

`FlxSprite` is the primary visual and physical entity in Flixel-Pixi. It extends `FlxObject` to add textures, animations, scale, tinting, blend modes, and PixiJS post-processing filters.

---

## `FlxObject` Physics & Motion

`FlxObject` provides 2D Newtonian motion variables calculated deterministically on every fixed step:

```ts
const obj = new FlxObject(100, 100, 32, 32);

// Position & Motion
obj.velocity.x = 150; // Move right at 150 px/sec
obj.acceleration.y = 600; // Gravitational acceleration
obj.maxVelocity.set(300, 800); // Speed limit caps
obj.drag.set(200, 0); // Horizontal friction

// Collision properties
obj.solid = true; // Participates in collision separation
obj.immovable = false; // If true, incoming objects bounce/separate without moving this
obj.allowCollisions = FlxObject.ANY; // Or FlxObject.UP | FlxObject.FLOOR | FlxObject.NONE
```

---

## Creating Sprites

### 1. Procedural Graphic Box with `makeGraphic`

Ideal for rapid prototyping before art assets are ready:

```ts
const box = new FlxSprite(50, 50);
box.makeGraphic(32, 32, 0x10b981); // 32x32 green rectangle
this.add(box);
```

### 2. Loading from Image or Texture

```ts
import { FlxAssets, FlxSprite } from 'flixel-pixi';

const hero = new FlxSprite(100, 200, 'assets/hero.png');
this.add(hero);
```

### 3. Animated Sprites from a Spritesheet

```ts
const runner = new FlxSprite(100, 100);
// 128x32 image with four 32x32 frames
runner.loadGraphic('assets/runner.png', true, 32, 32);

// Add animations: (name, frameIndices, frameRate, looped)
runner.addAnimation('idle', [0], 1, false);
runner.addAnimation('run', [0, 1, 2, 3], 12, true);

runner.playAnimation('run');
this.add(runner);
```

---

## Transforms, Tint & Blend Modes

```ts
// Alpha transparency (0.0 to 1.0)
hero.alpha = 0.85;

// Color tint (0xRRGGBB)
hero.color = 0xff3366;

// Scaling & Origin
hero.scale.set(2.0, 2.0);
hero.origin.set(16, 16); // Center of 32x32 sprite

// Flipping
hero.facing = FlxObject.LEFT;

// Blend Modes ('normal', 'add', 'multiply', 'screen', etc.)
hero.blend = 'add';
```

---

## Bounding Box & Offset

Often, the visible sprite image is larger than the physical hit box (for shadows or animations). Use `offset` to adjust:

```ts
// Visual graphic is 48x48, but hit box is 24x32
hero.setSize(24, 32);
hero.offset.set(12, 16); // Shift collision box inside the 48x48 graphic
```

---

## Next Steps

- Learn how to manage collections of sprites in [Groups & Containers](/guide/groups).
- Discover complex animations in [Sprite Animations](/guide/animation).
