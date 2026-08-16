# Gamepads & Virtual Controls

Flixel-Pixi supports physical controllers via the standard HTML5 Gamepad API (`FlxGamepadManager`) alongside on-screen touch virtual DPads and analog sticks (`FlxVirtualPad`, `FlxVirtualStick`).

---

## 1. Physical Gamepads with `FlxGamepad`

```ts
const pad = this.context.input.gamepad.getGamepad(0);

if (pad && pad.connected) {
  // Digital Buttons
  if (pad.justPressed('A')) {
    player.jump();
  }

  // Analog Sticks (-1.0 to 1.0)
  const axisX = pad.getAxis('LEFT_X');
  const axisY = pad.getAxis('LEFT_Y');

  if (Math.abs(axisX) > 0.15) {
    player.velocity.x = axisX * 250;
  }
}
```

---

## 2. On-Screen Virtual Controls for Mobile

Add an on-screen D-Pad or action buttons for mobile touch devices:

```ts
import { FlxVirtualPad } from 'flixel-pixi';

// Create a Full D-Pad on bottom-left and A/B buttons on bottom-right
const virtualPad = new FlxVirtualPad('FULL', 'A_B');
this.add(virtualPad);

// In update():
if (virtualPad.buttonA.justPressed()) {
  player.jump();
}
if (virtualPad.dPad.left.pressed()) {
  player.velocity.x = -200;
}
```
