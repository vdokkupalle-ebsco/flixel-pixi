---
title: FlxQuadMotion (Class)
description: API reference documentation for FlxQuadMotion in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Tweens & Motion</span>
  <span class="api-badge public">@public</span>
</div>

# FlxQuadMotion

Motion along a quadratic Bézier curve.

```ts
export declare class FlxQuadMotion extends FlxMotion
```

## Properties

| Property       | Modifiers | Type     | Description |
| :------------- | :-------- | :------- | :---------- |
| **`distance`** | -         | `number` | -           |

## Methods

### `setMotion()`

```ts
setMotion(fromX: number, fromY: number, controlX: number, controlY: number, toX: number, toY: number, durationOrSpeed?: number, useDuration?: boolean): this
```

**Parameters:**

| Parameter         | Type      | Description |
| :---------------- | :-------- | :---------- |
| `fromX`           | `number`  | -           |
| `fromY`           | `number`  | -           |
| `controlX`        | `number`  | -           |
| `controlY`        | `number`  | -           |
| `toX`             | `number`  | -           |
| `toY`             | `number`  | -           |
| `durationOrSpeed` | `number`  | -           |
| `useDuration`     | `boolean` | -           |

**Returns:** `this`
