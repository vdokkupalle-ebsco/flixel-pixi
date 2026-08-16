---
title: FlxColorTween (Class)
description: API reference documentation for FlxColorTween in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Tweens & Motion</span>
  <span class="api-badge public">@public</span>
</div>

# FlxColorTween

Interpolates packed ARGB colors and optionally updates a sprite-like target.

```ts
export declare class FlxColorTween extends FlxTween
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`color`** | - | `number` | - |
| **`sprite`** | - | `FlxColorTweenTarget \| null` | - |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `tween()`

```ts
tween(duration: number, fromColor: FlxTweenColorValue, toColor: FlxTweenColorValue, sprite?: FlxColorTweenTarget | null): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `duration` | `number` | - |
| `fromColor` | `FlxTweenColorValue` | - |
| `toColor` | `FlxTweenColorValue` | - |
| `sprite` | `FlxColorTweenTarget \| null` | - |

**Returns:** `this`

