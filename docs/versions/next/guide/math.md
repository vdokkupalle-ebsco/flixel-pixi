# Math & Deterministic RNG

Flixel-Pixi includes mathematical structures for 2D geometry and seedable deterministic random number generation.

---

## 1. 2D Points & Rectangles

```ts
import { FlxPoint, FlxRect } from 'flixel-pixi';

// 2D Vector
const pos = new FlxPoint(100, 200);
pos.add(10, 20);
pos.scale(2);

// Bounding Rectangle
const bounds = new FlxRect(0, 0, 640, 480);
if (bounds.containsPoint(pos)) {
  console.log('Inside bounds');
}
```

---

## 2. Deterministic Pseudo-RNG (`FlxRandom`)

To guarantee identical procedural generation across playthroughs and replays, use `FlxRandom`:

```ts
import { FlxRandom } from 'flixel-pixi';

const rng = new FlxRandom(1337); // Seed with 1337

const intVal = rng.int(1, 10); // Integer between 1 and 10
const floatVal = rng.float(0, 1); // Float between 0 and 1
const coinFlip = rng.bool(0.5); // 50% probability true
const item = rng.getObject(['Sword', 'Shield', 'Potion']);
```
