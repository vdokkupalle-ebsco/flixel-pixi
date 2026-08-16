---
title: FlxShakeTween (Class)
description: API reference documentation for FlxShakeTween in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Tweens & Motion</span>
  <span class="api-badge public">@public</span>
</div>

# FlxShakeTween

Applies deterministic random offset shake to a sprite.

```ts
export declare class FlxShakeTween extends FlxTween
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`axes`** | - | `FlxTweenAxes` | - |
| **`intensity`** | - | `number` | - |
| **`sprite`** | - | `FlxSprite \| null` | - |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `tween()`

```ts
tween(sprite: FlxSprite, intensity?: number, duration?: number, axes?: FlxTweenAxes): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `sprite` | `FlxSprite` | - |
| `intensity` | `number` | - |
| `duration` | `number` | - |
| `axes` | `FlxTweenAxes` | - |

**Returns:** `this`

