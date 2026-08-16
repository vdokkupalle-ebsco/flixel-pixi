# Sprite Animations

`FlxAnimationController` controls frame-based animations on any `FlxSprite`.

---

## 1. Defining Strip Animations

```ts
import { FlxSprite } from 'flixel-pixi';

const sprite = new FlxSprite(100, 100);
// Load a 192x32 spritesheet containing 6 frames of 32x32
sprite.loadGraphic('assets/character.png', true, 32, 32);

// addAnimation(name, frames, frameRate, looped)
sprite.addAnimation('idle', [0, 1], 4, true);
sprite.addAnimation('walk', [2, 3, 4, 5], 10, true);
sprite.addAnimation('jump', [4], 1, false);

// Play animation
sprite.playAnimation('walk');
```

---

## 2. Animation Control & Callbacks

```ts
// Pause & Resume
sprite.animation.pause();
sprite.animation.resume();

// Frame callbacks
sprite.animation.callback = (name, frameNumber, frameIndex) => {
  if (name === 'walk' && (frameNumber === 1 || frameNumber === 3)) {
    // Play footstep sound on steps
    this.context.audio.play('assets/footstep.ogg');
  }
};
```
