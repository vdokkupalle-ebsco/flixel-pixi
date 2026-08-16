---
title: FlxNumTween (Class)
description: API reference documentation for FlxNumTween in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Tweens & Motion</span>
  <span class="api-badge public">@public</span>
</div>

# FlxNumTween

Standalone numeric tween created by `FlxTween.num`.

```ts
export declare class FlxNumTween extends FlxTween
```

## Constructors

```ts
constructor(fromValue: number, toValue: number, duration: number, options?: FlxTweenOptions, tweenFunction?: (value: number) => void, manager?: FlxTweenManager)
```

Constructs a new instance of the `FlxNumTween` class

| Parameter       | Type                      | Description |
| :-------------- | :------------------------ | :---------- |
| `fromValue`     | `number`                  | -           |
| `toValue`       | `number`                  | -           |
| `duration`      | `number`                  | -           |
| `options`       | `FlxTweenOptions`         | -           |
| `tweenFunction` | `(value: number) => void` | -           |
| `manager`       | `FlxTweenManager`         | -           |

## Properties

| Property    | Modifiers | Type     | Description |
| :---------- | :-------- | :------- | :---------- |
| **`value`** | -         | `number` | -           |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`
