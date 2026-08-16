---
title: FlxAngleTween (Class)
description: API reference documentation for FlxAngleTween in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Tweens & Motion</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAngleTween

Tweens a numeric angle and optionally writes it to an object.

```ts
export declare class FlxAngleTween extends FlxTween
```

## Properties

| Property     | Modifiers | Type                | Description |
| :----------- | :-------- | :------------------ | :---------- |
| **`angle`**  | -         | `number`            | -           |
| **`sprite`** | -         | `FlxObject \| null` | -           |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `tween()`

```ts
tween(fromAngle: number, toAngle: number, duration: number, sprite?: FlxObject | null): this
```

**Parameters:**

| Parameter   | Type                | Description |
| :---------- | :------------------ | :---------- |
| `fromAngle` | `number`            | -           |
| `toAngle`   | `number`            | -           |
| `duration`  | `number`            | -           |
| `sprite`    | `FlxObject \| null` | -           |

**Returns:** `this`
