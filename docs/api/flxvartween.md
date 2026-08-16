---
title: FlxVarTween (Class)
description: API reference documentation for FlxVarTween in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Tweens & Motion</span>
  <span class="api-badge public">@public</span>
</div>

# FlxVarTween

Numeric property tween created by `FlxTween.tween`.

```ts
export declare class FlxVarTween<T extends object = object> extends FlxTween
```

## Constructors

```ts
constructor(target: T, values: Record<string, number>, duration: number, options?: FlxTweenOptions, manager?: FlxTweenManager)
```

Constructs a new instance of the `FlxVarTween` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `target` | `T` | - |
| `values` | `Record<string, number>` | - |
| `duration` | `number` | - |
| `options` | `FlxTweenOptions` | - |
| `manager` | `FlxTweenManager` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`target`** | `readonly` | `T` | - |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

