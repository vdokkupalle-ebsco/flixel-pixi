# Groups & Containers

Flixel-Pixi provides three distinct group classes for managing collections of game entities, hierarchical transforms, and object pooling:

1. **`FlxGroup`**: Logical container for updates, collisions, and entity pooling.
2. **`FlxSpriteGroup`**: Composite visual entity with collective position, rotation, and alpha.
3. **`FlxContainer`**: Hierarchical scene graph container mapping directly into PixiJS container nodes.

---

## 1. `FlxGroup` & Object Pooling

`FlxGroup` is ideal for bullets, enemies, particles, and items.

```ts
import { FlxGroup, FlxSprite } from 'flixel-pixi';

export class BulletManager extends FlxGroup {
  constructor(maxSize: number = 50) {
    super(maxSize);

    // Pre-populate object pool
    for (let i = 0; i < maxSize; i++) {
      const bullet = new FlxSprite(-100, -100);
      bullet.makeGraphic(6, 6, 0xfacc15);
      bullet.exists = false; // Start inactive
      this.add(bullet);
    }
  }

  public fire(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
  ): void {
    // Recycle an inactive bullet from pool
    const bullet = this.recycle(FlxSprite);
    if (bullet) {
      bullet.reset(x, y);
      bullet.velocity.set(velocityX, velocityY);
    }
  }
}
```

### Key `FlxGroup` Methods

- **`recycle(classType)`**: Finds the first dead (`!exists`) member or replaces the oldest member.
- **`countLiving()`** / **`countDead()`**: Tracks active entities in the pool.
- **`forEach(callback)`**: Iterates over all active members.
- **`callAll(methodName, ...args)`**: Invokes a method on all members.

---

## 2. `FlxSpriteGroup`

`FlxSpriteGroup` acts like a single `FlxSprite` composed of multiple child sprites. Moving or rotating the parent moves all child elements:

```ts
import { FlxSprite, FlxSpriteGroup } from 'flixel-pixi';

export class Vehicle extends FlxSpriteGroup {
  private body: FlxSprite;
  private turret: FlxSprite;

  constructor(x: number, y: number) {
    super(x, y);

    this.body = new FlxSprite(0, 0, 'assets/tank_body.png');
    this.turret = new FlxSprite(8, 4, 'assets/tank_turret.png');

    this.add(this.body);
    this.add(this.turret);
  }

  public aim(angleDeg: number): void {
    this.turret.angle = angleDeg;
  }
}
```

---

## 3. `FlxContainer`

`FlxContainer` connects directly to Pixi's display graph, supporting nested display lists, custom blend modes, and z-index sorting:

```ts
import { FlxContainer } from 'flixel-pixi';

const layer = new FlxContainer();
this.add(layer);
```
