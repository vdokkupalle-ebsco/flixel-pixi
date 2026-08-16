# Buttons & 9-Slice UI

Flixel-Pixi provides UI controls including clickable `FlxButton`, scalable `FlxNineSliceButton`, status `FlxBar`, and input text fields `FlxInputText`.

---

## 1. `FlxButton`

```ts
import { FlxButton } from 'flixel-pixi';

const btn = new FlxButton(220, 200, 'PLAY AGAIN', () => {
  this.restartLevel();
});
this.add(btn);
```

---

## 2. 9-Slice Resizable Panels (`FlxNineSliceSprite` & `FlxNineSliceButton`)

9-slice scaling keeps borders sharp while stretching the central panel:

```ts
import { FlxNineSliceButton, FlxNineSliceSprite } from 'flixel-pixi';

// 9-slice dialogue box
const dialog = new FlxNineSliceSprite(40, 320, 'assets/panel.png', {
  width: 560,
  height: 140,
  borders: { top: 12, bottom: 12, left: 12, right: 12 },
});
this.add(dialog);
```

---

## 3. Progress / Health Bars with `FlxBar`

```ts
import { FlxBar } from 'flixel-pixi';

// Health bar tracking player.health (0 to 100)
const healthBar = new FlxBar(
  16,
  16,
  'LEFT_TO_RIGHT',
  150,
  16,
  this.player,
  'health',
  0,
  100,
  true,
);
healthBar.createFilledBar(0xff334155, 0xff10b981);
healthBar.scrollFactor.set(0, 0);
this.add(healthBar);
```
