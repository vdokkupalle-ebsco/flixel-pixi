# Keyboard & Mouse Input

Input management in Flixel-Pixi provides deterministic frame-by-frame state tracking for `Keyboard` and `Mouse`.

---

## 1. Keyboard Input

Access the active game's keyboard through `FlxG.keys`. Browser games created by
`createBrowserGame` attach the DOM listeners automatically:

```ts
import { FlxG } from 'flixel-pixi';

const kb = FlxG.keys;

// Pressed: true while key is held down
if (kb.pressed('LEFT', 'A')) {
  player.velocity.x = -200;
}

// Just Pressed: true only on the initial fixed-step frame of key press
if (kb.justPressed('SPACE', 'UP', 'W')) {
  player.jump();
}

// Just Released: true only on the frame the key was let go
if (kb.justReleased('SPACE')) {
  player.cutJumpShort();
}
```

### Supported Key Names

`'LEFT'`, `'RIGHT'`, `'UP'`, `'DOWN'`, `'SPACE'`, `'ESCAPE'`, `'ENTER'`, `'SHIFT'`, `'CONTROL'`, `'ALT'`, `'A'` through `'Z'`, `'ZERO'` through `'NINE'`, `'F1'` through `'F12'`.

---

## 2. Mouse Input

Access the active game's mouse through `FlxG.mouse`:

```ts
const mouse = FlxG.mouse;

// World coordinates (accounting for camera scroll)
const worldX = mouse.x;
const worldY = mouse.y;

// Screen coordinates (fixed on HUD)
const screenX = mouse.screenX;
const screenY = mouse.screenY;

// Mouse buttons: 0 (Left), 1 (Middle), 2 (Right)
if (mouse.pressed(0)) {
  gun.aimAt(worldX, worldY);
}

if (mouse.justPressed(0)) {
  gun.shoot();
}

// Mouse wheel delta
if (mouse.wheel !== 0) {
  camera.zoom += mouse.wheel * 0.1;
}
```
