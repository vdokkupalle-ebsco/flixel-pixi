# Physics & QuadTree Collision

Collision in Flixel-Pixi is fast, deterministic, and built on spatial partitioning (`FlxQuadTree`).

---

## 1. Separation vs. Overlap

| Method                                              | Physics Response                                                                                           | Use Case                                       |
| :-------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- | :--------------------------------------------- |
| **`FlxObject.separate(objA, objB)`**                | **Yes**: Resolves penetration by pushing solid objects apart and adjusting velocities based on elasticity. | Player vs Solid Platforms, Enemies vs Walls.   |
| **`FlxObject.overlap(objA, objB, notifyCallback)`** | **No**: Does not move objects; only calls a callback when bounding boxes intersect.                        | Pickups, Coins, Bullet triggers, Hazard areas. |

---

## 2. Collision Separation Example

```ts
import { FlxObject } from 'flixel-pixi';

override update(): void {
  super.update();

  // 1. Separate player from all level platforms
  FlxObject.separate(this.player, this.platforms);

  // 2. Separate all enemies from level platforms
  FlxObject.separate(this.enemies, this.platforms);

  // 3. Separate player from enemies (player bounces on top)
  FlxObject.separate(this.player, this.enemies, (p, e) => {
    if (p.isTouching(FlxObject.FLOOR)) {
      e.kill(); // Stomp enemy
      p.velocity.y = -300; // Bounce up
    } else {
      p.takeDamage(10);
    }
  });
}
```

---

## 3. Spatial Broadphase with `FlxQuadTree`

When calling `FlxObject.separate` or `FlxObject.overlap` on groups, Flixel-Pixi constructs a `FlxQuadTree` internally. This partitions the world into quadrants, reducing collision complexity from $O(N^2)$ to $O(N \log N)$.

```ts
import { FlxQuadTree } from 'flixel-pixi';

// Custom QuadTree query over a specific rectangular boundary
const tree = new FlxQuadTree(0, 0, 1000, 1000);
tree.load(this.bullets, this.enemies, (bullet, enemy) => {
  bullet.kill();
  enemy.kill();
});
tree.destroy();
```
