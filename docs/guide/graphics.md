# Vector Graphics & Gradients

Flixel-Pixi provides `FlxGraphics` and `FlxGradient` for drawing procedural shapes, outlines, polygons, and linear/radial gradient fills.

---

## Procedural Drawing with `FlxGraphics`

```ts
import { FlxGraphics } from 'flixel-pixi';

const gfx = new FlxGraphics(50, 50);

// Draw a bordered rounded rectangle
gfx.drawRoundedRect(0, 0, 160, 60, 8, {
  fill: { color: 0x1e293b, alpha: 0.9 },
  stroke: { color: 0x10b981, width: 2 },
});

// Draw a circle
gfx.drawCircle(80, 120, 24, {
  fill: { color: 0x3b82f6, alpha: 1 },
});

// Draw custom path or lines
gfx.drawLine(10, 10, 100, 50, {
  color: 0xf43f5e,
  width: 3,
});

this.add(gfx);
```

---

## Linear & Radial Gradients with `FlxGradient`

`FlxGradient` creates smooth gradient textures on sprites:

```ts
import { FlxGradient, FlxSprite } from 'flixel-pixi';

// Create a sky background with a vertical linear gradient
const sky = new FlxSprite(0, 0);
FlxGradient.createLinearGradient(sky, 640, 480, [
  { color: 0x0f172a, ratio: 0 },
  { color: 0x1e3a8a, ratio: 0.5 },
  { color: 0x38bdf8, ratio: 1 },
]);
this.add(sky);
```
