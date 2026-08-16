---
title: FlxMotion (Class)
description: API reference documentation for FlxMotion in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Tweens & Motion</span>
  <span class="api-badge public">@public</span>
</div>

# FlxMotion

Base tween for moving an optional physics object through world space.

```ts
export declare class FlxMotion extends FlxTween
```

## Properties

| Property     | Modifiers | Type                | Description |
| :----------- | :-------- | :------------------ | :---------- |
| **`object`** | -         | `FlxObject \| null` | -           |
| **`x`**      | -         | `number`            | -           |
| **`y`**      | -         | `number`            | -           |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `setObject()`

```ts
setObject(object: FlxObject): this
```

**Parameters:**

| Parameter | Type        | Description |
| :-------- | :---------- | :---------- |
| `object`  | `FlxObject` | -           |

**Returns:** `this`
