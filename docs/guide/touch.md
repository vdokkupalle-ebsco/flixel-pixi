# Touch & Swipe Gestures

Mobile web games require responsive multi-touch input and directional swipe detection. Flixel-Pixi provides `FlxTouch` and `FlxTouchManager`.

---

## 1. Multi-Touch Tracking

```ts
import { FlxG } from 'flixel-pixi';

const touchManager = FlxG.touches;

// Active touches on screen
const touches = touchManager.active;

for (const touch of touches) {
  if (touch.justPressed) {
    console.log(`Touch #${touch.pointerId} tapped at (${touch.x}, ${touch.y})`);
  }
}
```

---

## 2. Swipe Detection

`FlxTouchManager` automatically calculates swipe direction, angle, and distance:

```ts
// Check for completed swipes this frame
const swipes = touchManager.swipes;

for (const swipe of swipes) {
  console.log(`Swipe direction: ${swipe.direction}`); // 'up', 'down', 'left', 'right'
  console.log(
    `Swipe distance: ${swipe.distance}px, duration: ${swipe.duration}s`,
  );

  if (swipe.direction === 'up') {
    player.jump();
  } else if (swipe.direction === 'left') {
    player.dashLeft();
  } else if (swipe.direction === 'right') {
    player.dashRight();
  }
}
```
