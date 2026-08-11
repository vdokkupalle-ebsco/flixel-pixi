# Vector graphics and gradients

`FlxGraphics` builds stable procedural game visuals without importing Pixi into
game code. It is intended for scenery, HUD panels, markers, paths, and simple
icons whose geometry changes occasionally or never.

## Gradient fills

Colors use packed `0xRRGGBBAA` values:

```ts
const sky = FlxGradient.linear([
  { offset: 0, color: 0x38bdf8ff },
  { offset: 1, color: 0xfef3c7ff },
]);

const glow = FlxGradient.radial([
  { offset: 0, color: 0xfffbebff },
  { offset: 1, color: 0xf59e0b00 },
]);
```

Gradient coordinates are normalized to each shape. Linear gradients default
from top to bottom. Radial gradients default from the center to radius `0.5`.
Options can change the local start, end, centers, and radii.

## Reusable drawing helpers

```ts
const hud = new FlxGraphics(20, 220, 260, 110)
  .roundRect(0, 0, 260, 110, 14, {
    fill: FlxGradient.linear(
      [
        { offset: 0, color: 0x0f172af2 },
        { offset: 1, color: 0x1e293be6 },
      ],
      { end: { x: 1, y: 1 } },
    ),
    stroke: { fill: 0x94a3b8cc, width: 2 },
  })
  .line([20, 80, 90, 45, 170, 75], {
    fill: 0xfacc15ff,
    width: 4,
    cap: 'round',
    join: 'round',
  })
  .star(220, 40, 5, 22, 10, { fill: 0xfffbebff });
state.add(hud);
```

Additional helpers cover rectangles, circles, ellipses, and closed polygons.
Fill and stroke styles are copied into the command list, so callers can safely
reuse their source arrays and option objects.

## Update policy

Animate `x`, `y`, `angle`, `scale`, `alpha`, tint, or filters normally. Those
changes do not rebuild vector geometry. To replace the actual drawing, call
`clearGraphics()` and issue the new commands. The next camera sync performs one
rebuild and releases the old camera-local gradient textures.

Do not clear and redraw every frame. Use `FlxStrip` for continuously deforming
geometry and sprites for ordinary textured rectangles.

The constructor width and height control culling and gameplay collision;
drawing commands do not alter those authoritative bounds.

See `/graphics/` for a quest scene with gradient scenery, terrain polygons, a
route line, a rotating pickup, a HUD panel, and an intentional day/night
rebuild.
