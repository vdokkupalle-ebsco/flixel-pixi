---
title: FlxTweenManager (Class)
description: API reference documentation for FlxTweenManager in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Tweens & Motion</span>
  <span class="api-badge public">@public</span>
</div>

# FlxTweenManager

Owns and advances deterministic game-time tweens.

```ts
export declare class FlxTweenManager extends FlxBasic
```

## Constructors

```ts
constructor()
```

Constructs a new instance of the `FlxTweenManager` class

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`tweenCount`** | `readonly` | `number` | - |

## Methods

### `angle()`

```ts
angle(sprite: FlxObject | null, fromAngle: number, toAngle: number, duration?: number, options?: FlxTweenOptions): FlxAngleTween
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `sprite` | `FlxObject \| null` | - |
| `fromAngle` | `number` | - |
| `toAngle` | `number` | - |
| `duration` | `number` | - |
| `options` | `FlxTweenOptions` | - |

**Returns:** `FlxAngleTween`

### `cancelTweensOf()`

```ts
cancelTweensOf(target: object, fieldPaths?: readonly string[]): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `target` | `object` | - |
| `fieldPaths` | `readonly string[]` | - |

**Returns:** `void`

### `circularMotion()`

```ts
circularMotion(object: FlxObject, centerX: number, centerY: number, radius: number, angle: number, clockwise: boolean, durationOrSpeed?: number, useDuration?: boolean, options?: FlxTweenOptions): FlxCircularMotion
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `object` | `FlxObject` | - |
| `centerX` | `number` | - |
| `centerY` | `number` | - |
| `radius` | `number` | - |
| `angle` | `number` | - |
| `clockwise` | `boolean` | - |
| `durationOrSpeed` | `number` | - |
| `useDuration` | `boolean` | - |
| `options` | `FlxTweenOptions` | - |

**Returns:** `FlxCircularMotion`

### `clear()`

```ts
clear(): void
```

**Returns:** `void`

### `color()`

```ts
color(sprite: FlxColorTweenTarget | null, duration: number, fromColor: FlxTweenColorValue, toColor: FlxTweenColorValue, options?: FlxTweenOptions): FlxColorTween
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `sprite` | `FlxColorTweenTarget \| null` | - |
| `duration` | `number` | - |
| `fromColor` | `FlxTweenColorValue` | - |
| `toColor` | `FlxTweenColorValue` | - |
| `options` | `FlxTweenOptions` | - |

**Returns:** `FlxColorTween`

### `completeTweensOf()`

```ts
completeTweensOf(target: object, fieldPaths?: readonly string[]): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `target` | `object` | - |
| `fieldPaths` | `readonly string[]` | - |

**Returns:** `void`

### `containsTweensOf()`

```ts
containsTweensOf(target: object, fieldPaths?: readonly string[]): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `target` | `object` | - |
| `fieldPaths` | `readonly string[]` | - |

**Returns:** `boolean`

### `cubicMotion()`

```ts
cubicMotion(object: FlxObject, fromX: number, fromY: number, controlAX: number, controlAY: number, controlBX: number, controlBY: number, toX: number, toY: number, duration?: number, options?: FlxTweenOptions): FlxCubicMotion
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `object` | `FlxObject` | - |
| `fromX` | `number` | - |
| `fromY` | `number` | - |
| `controlAX` | `number` | - |
| `controlAY` | `number` | - |
| `controlBX` | `number` | - |
| `controlBY` | `number` | - |
| `toX` | `number` | - |
| `toY` | `number` | - |
| `duration` | `number` | - |
| `options` | `FlxTweenOptions` | - |

**Returns:** `FlxCubicMotion`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `flicker()`

```ts
flicker(basic: FlxBasic, duration?: number, period?: number, options?: FlxFlickerTweenOptions): FlxFlickerTween
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `basic` | `FlxBasic` | - |
| `duration` | `number` | - |
| `period` | `number` | - |
| `options` | `FlxFlickerTweenOptions` | - |

**Returns:** `FlxFlickerTween`

### `isFlickering()`

```ts
isFlickering(basic: FlxBasic): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `basic` | `FlxBasic` | - |

**Returns:** `boolean`

### `linearMotion()`

```ts
linearMotion(object: FlxObject, fromX: number, fromY: number, toX: number, toY: number, durationOrSpeed?: number, useDuration?: boolean, options?: FlxTweenOptions): FlxLinearMotion
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `object` | `FlxObject` | - |
| `fromX` | `number` | - |
| `fromY` | `number` | - |
| `toX` | `number` | - |
| `toY` | `number` | - |
| `durationOrSpeed` | `number` | - |
| `useDuration` | `boolean` | - |
| `options` | `FlxTweenOptions` | - |

**Returns:** `FlxLinearMotion`

### `linearPath()`

```ts
linearPath(object: FlxObject, points: readonly PointLike[], durationOrSpeed?: number, useDuration?: boolean, options?: FlxTweenOptions): FlxLinearPath
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `object` | `FlxObject` | - |
| `points` | `readonly PointLike[]` | - |
| `durationOrSpeed` | `number` | - |
| `useDuration` | `boolean` | - |
| `options` | `FlxTweenOptions` | - |

**Returns:** `FlxLinearPath`

### `num()`

```ts
num(fromValue: number, toValue: number, duration?: number, options?: FlxTweenOptions, tweenFunction?: (value: number) => void): FlxNumTween
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `fromValue` | `number` | - |
| `toValue` | `number` | - |
| `duration` | `number` | - |
| `options` | `FlxTweenOptions` | - |
| `tweenFunction` | `(value: number) => void` | - |

**Returns:** `FlxNumTween`

### `quadMotion()`

```ts
quadMotion(object: FlxObject, fromX: number, fromY: number, controlX: number, controlY: number, toX: number, toY: number, durationOrSpeed?: number, useDuration?: boolean, options?: FlxTweenOptions): FlxQuadMotion
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `object` | `FlxObject` | - |
| `fromX` | `number` | - |
| `fromY` | `number` | - |
| `controlX` | `number` | - |
| `controlY` | `number` | - |
| `toX` | `number` | - |
| `toY` | `number` | - |
| `durationOrSpeed` | `number` | - |
| `useDuration` | `boolean` | - |
| `options` | `FlxTweenOptions` | - |

**Returns:** `FlxQuadMotion`

### `quadPath()`

```ts
quadPath(object: FlxObject, points: readonly PointLike[], durationOrSpeed?: number, useDuration?: boolean, options?: FlxTweenOptions): FlxQuadPath
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `object` | `FlxObject` | - |
| `points` | `readonly PointLike[]` | - |
| `durationOrSpeed` | `number` | - |
| `useDuration` | `boolean` | - |
| `options` | `FlxTweenOptions` | - |

**Returns:** `FlxQuadPath`

### `shake()`

```ts
shake(sprite: FlxSprite, intensity?: number, duration?: number, axes?: FlxTweenAxes, options?: FlxTweenOptions): FlxShakeTween
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `sprite` | `FlxSprite` | - |
| `intensity` | `number` | - |
| `duration` | `number` | - |
| `axes` | `FlxTweenAxes` | - |
| `options` | `FlxTweenOptions` | - |

**Returns:** `FlxShakeTween`

### `tween()`

```ts
tween<T extends object>(target: T, values: Record<string, number>, duration?: number, options?: FlxTweenOptions): FlxVarTween<T>
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `target` | `T` | - |
| `values` | `Record<string, number>` | - |
| `duration` | `number` | - |
| `options` | `FlxTweenOptions` | - |

**Returns:** `FlxVarTween<T>`

### `update()`

```ts
update(): void
```

**Returns:** `void`

