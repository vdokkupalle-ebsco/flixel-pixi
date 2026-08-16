---
title: FlxFlickerTween (Class)
description: API reference documentation for FlxFlickerTween in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Tweens & Motion</span>
  <span class="api-badge public">@public</span>
</div>

# FlxFlickerTween

Flickers a lifecycle object's visibility using deterministic game time.

```ts
export declare class FlxFlickerTween extends FlxTween
```

## Constructors

```ts
constructor(options?: FlxFlickerTweenOptions, manager?: FlxTweenManager)
```

Constructs a new instance of the `FlxFlickerTween` class

| Parameter | Type                     | Description |
| :-------- | :----------------------- | :---------- |
| `options` | `FlxFlickerTweenOptions` | -           |
| `manager` | `FlxTweenManager`        | -           |

## Properties

| Property            | Modifiers | Type                                  | Description |
| :------------------ | :-------- | :------------------------------------ | :---------- |
| **`basic`**         | -         | `FlxBasic \| null`                    | -           |
| **`endVisibility`** | -         | `boolean`                             | -           |
| **`period`**        | -         | `number`                              | -           |
| **`ratio`**         | -         | `number`                              | -           |
| **`tweenFunction`** | -         | `(tween: FlxFlickerTween) => boolean` | -           |

## Methods

### `static` `defaultTweenFunction()`

```ts
static defaultTweenFunction(tween: FlxFlickerTween): boolean
```

**Parameters:**

| Parameter | Type              | Description |
| :-------- | :---------------- | :---------- |
| `tween`   | `FlxFlickerTween` | -           |

**Returns:** `boolean`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `tween()`

```ts
tween(basic: FlxBasic, duration: number, period: number): this
```

**Parameters:**

| Parameter  | Type       | Description |
| :--------- | :--------- | :---------- |
| `basic`    | `FlxBasic` | -           |
| `duration` | `number`   | -           |
| `period`   | `number`   | -           |

**Returns:** `this`
