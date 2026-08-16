# Tweens & Motion Paths

Flixel-Pixi includes `FlxTween` and `FlxEase` for smooth animations, color transitions, camera shakes, and curved motion paths.

---

## 1. Property Tweens with `FlxTween.tween`

```ts
import { FlxEase, FlxTween } from 'flixel-pixi';

// Tween sprite position and alpha over 1.5 seconds
FlxTween.tween(this.player, { x: 400, y: 150, alpha: 0.5 }, 1.5, {
  ease: FlxEase.bounceOut,
  onComplete: () => {
    console.log('Tween completed!');
  },
});
```

---

## 2. Specialized Tweens

```ts
// Color transition
FlxTween.color(sprite, 2.0, 0xffffff, 0xff0055);

// Angle rotation
FlxTween.angle(turret, 0, 180, 1.0, { ease: FlxEase.sineInOut });

// Sprite flicker
FlxTween.flicker(player, 1.0, 0.04);
```

---

## 3. Curved Motion Paths

```ts
import { FlxPoint, FlxQuadPath, FlxTween } from 'flixel-pixi';

// Define a bezier curve path
const path = new FlxQuadPath();
path.addPoint(new FlxPoint(50, 400));
path.addPoint(new FlxPoint(320, 50)); // Control point
path.addPoint(new FlxPoint(590, 400)); // End point

FlxTween.quadPath(bullet, path, 2.0, true, { ease: FlxEase.quadInOut });
```
