# Action Mapping System (`FlxActions`)

Hardcoding `'SPACE'` or `'A'` across gameplay code makes controller remapping and multi-input support difficult. Flixel-Pixi provides `FlxActions` for abstract action binding.

---

## Defining Semantic Actions

```ts
import { FlxActions } from 'flixel-pixi';

export const actions = new FlxActions();

// Map "jump" to keyboard Space/W, Gamepad button A, and Touch virtual button A
actions
  .digital('jump')
  .addKeyboard('SPACE')
  .addKeyboard('W')
  .addGamepadButton(0, 'A')
  .addVirtualButton('jumpBtn');

// Map "move_x" axis to keyboard A/D, arrow keys, and Gamepad Left Stick X
actions
  .analog('move_x')
  .addKeyboardAxis('LEFT', 'RIGHT')
  .addKeyboardAxis('A', 'D')
  .addGamepadAxis(0, 'LEFT_X');
```

---

## Querying Actions in Gameplay

```ts
override update(): void {
  super.update();

  // Digital query
  if (actions.justPressed('jump')) {
    player.jump();
  }

  // Analog axis query (-1.0 to 1.0)
  const moveX = actions.getAxis('move_x');
  player.velocity.x = moveX * 200;
}
```
