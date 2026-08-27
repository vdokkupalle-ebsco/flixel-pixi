# Core Concepts & The Game Loop

At the heart of Flixel-Pixi is a decoupled simulation and rendering pipeline designed for deterministic execution and smooth visual output.

---

## The Deterministic Game Loop

In standard web animation (`requestAnimationFrame`), frame callbacks arrive at variable intervals depending on display refresh rate (60Hz, 120Hz, 144Hz) and device load. If game physics are tied directly to variable delta times, jumping heights, collision accuracy, and timing can drift unpredictably.

Flixel-Pixi solves this with the `FixedStepAccumulator`:

```
 Browser frame (dt = 0.033s)
            │
            ▼
 ┌──────────────────────┐
 │ FixedStepAccumulator │ Accumulates raw browser delta
 └──────────┬───────────┘
            │
            ├─► Tick 1: Fixed Step (dt = 0.016667s / 60Hz) ──► FlxState.update()
            ├─► Tick 2: Fixed Step (dt = 0.016667s / 60Hz) ──► FlxState.update()
            │
            ▼
 ┌──────────────────────┐
 │   syncWorldToRenderer│ Copies world positions to PixiJS view handles
 └──────────┬───────────┘
            ▼
 ┌──────────────────────┐
 │   PixiJS Renderer    │ Dispatches WebGL/WebGPU draw calls
 └──────────────────────┘
```

### Determinism Guarantee

- Physics formulas (`velocity += acceleration * dt`, `position += velocity * dt`) always run with the exact same constant `dt` (default: `1/60` second).
- A jump or projectile path will land on the exact same pixel on every device.
- Replays recorded on one machine will reproduce identically on another.

---

## The `FlxBasic` Entity Foundation

Every object that lives inside a state or group inherits from `FlxBasic`.

```ts
export class FlxBasic {
  public ID: number = -1;
  public exists: boolean = true;
  public active: boolean = true;
  public visible: boolean = true;
  public alive: boolean = true;

  public update(): void {}
  public destroy(): void {}
  public kill(): void {}
  public revive(): void {}
}
```

### Key Lifecycle Flags

| Flag          | Description                                                                                   |
| :------------ | :-------------------------------------------------------------------------------------------- |
| **`exists`**  | Master switch. If `false`, the object is skipped by both `update()` and rendering.            |
| **`active`**  | Controls simulation. If `false`, `update()` is skipped, but the object can still be rendered. |
| **`visible`** | Controls rendering. If `false`, the object is updated, but not drawn to the screen.           |
| **`alive`**   | Gameplay status. Often toggled alongside `kill()` / `revive()` for object pooling.            |

---

## Global Access vs. `FlxContext`

Flixel-Pixi keeps services in a modular `FlxContext` and exposes the active
game's common services through the `FlxG` gameplay facade:

```ts
// FlxG delegates to services owned by the active FlxContext.
FlxG.keys.pressed('SPACE');
FlxG.keys.SPACE;
FlxG.camera.shake(0.02, 0.3);
```

---

## Next Steps

- Explore state transitions and pause dialogs in [States & SubStates](/guide/states).
- Learn about dependency injection and service providers in [Context & Services](/guide/context).
