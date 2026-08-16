---
title: FlxTween (Class)
description: API reference documentation for FlxTween in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Tweens & Motion</span>
  <span class="api-badge public">@public</span>
</div>

# FlxTween

Base deterministic tween. Use the static factories for common tweens.

```ts
export declare class FlxTween
```

## Constructors

```ts
constructor(options?: FlxTweenOptions, manager?: FlxTweenManager)
```

Constructs a new instance of the `FlxTween` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `options` | `FlxTweenOptions` | - |
| `manager` | `FlxTweenManager` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`active`** | - | `boolean` | - |
| **`backward`** | - | `boolean` | - |
| **`BACKWARD`** | `static` `readonly` | `FlxTweenType` | - |
| **`duration`** | - | `number` | - |
| **`ease`** | - | `FlxEaseFunction \| null` | - |
| **`executions`** | - | `number` | - |
| **`finished`** | - | `boolean` | - |
| **`framerate`** | - | `number` | - |
| **`globalManager`** | `static` `readonly` | `FlxTweenManager` | - |
| **`loopDelay`** | - | `number` | - |
| **`LOOPING`** | `static` `readonly` | `FlxTweenType` | - |
| **`manager`** | `readonly` | `FlxTweenManager` | - |
| **`onComplete`** | - | `FlxTweenCallback \| null` | - |
| **`ONESHOT`** | `static` `readonly` | `FlxTweenType` | - |
| **`onStart`** | - | `FlxTweenCallback \| null` | - |
| **`onUpdate`** | - | `FlxTweenCallback \| null` | - |
| **`percent`** | - | `number` | - |
| **`PERSIST`** | `static` `readonly` | `FlxTweenType` | - |
| **`PINGPONG`** | `static` `readonly` | `FlxTweenType` | - |
| **`scale`** | - | `number` | - |
| **`startDelay`** | - | `number` | - |
| **`time`** | `readonly` | `number` | - |
| **`type`** | - | `FlxTweenType` | - |

## Methods

### `static` `angle()`

```ts
static angle(sprite: FlxObject | null, fromAngle: number, toAngle: number, duration?: number, options?: FlxTweenOptions): FlxAngleTween
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

### `cancel()`

```ts
cancel(): void
```

**Returns:** `void`

### `cancelChain()`

```ts
cancelChain(): void
```

**Returns:** `void`

### `static` `cancelTweensOf()`

```ts
static cancelTweensOf(target: object, fieldPaths?: readonly string[]): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `target` | `object` | - |
| `fieldPaths` | `readonly string[]` | - |

**Returns:** `void`

### `static` `circularMotion()`

```ts
static circularMotion(object: FlxObject, centerX: number, centerY: number, radius: number, angle: number, clockwise: boolean, durationOrSpeed?: number, useDuration?: boolean, options?: FlxTweenOptions): FlxCircularMotion
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

### `static` `color()`

```ts
static color(sprite: FlxColorTweenTarget | null, duration: number, fromColor: FlxTweenColorValue, toColor: FlxTweenColorValue, options?: FlxTweenOptions): FlxColorTween
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

### `static` `completeTweensOf()`

```ts
static completeTweensOf(target: object, fieldPaths?: readonly string[]): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `target` | `object` | - |
| `fieldPaths` | `readonly string[]` | - |

**Returns:** `void`

### `static` `cubicMotion()`

```ts
static cubicMotion(object: FlxObject, fromX: number, fromY: number, controlAX: number, controlAY: number, controlBX: number, controlBY: number, toX: number, toY: number, duration?: number, options?: FlxTweenOptions): FlxCubicMotion
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

### `static` `flicker()`

```ts
static flicker(basic: FlxBasic, duration?: number, period?: number, options?: FlxFlickerTweenOptions): FlxFlickerTween
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `basic` | `FlxBasic` | - |
| `duration` | `number` | - |
| `period` | `number` | - |
| `options` | `FlxFlickerTweenOptions` | - |

**Returns:** `FlxFlickerTween`

### `static` `isFlickering()`

```ts
static isFlickering(basic: FlxBasic): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `basic` | `FlxBasic` | - |

**Returns:** `boolean`

### `static` `linearMotion()`

```ts
static linearMotion(object: FlxObject, fromX: number, fromY: number, toX: number, toY: number, durationOrSpeed?: number, useDuration?: boolean, options?: FlxTweenOptions): FlxLinearMotion
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

### `static` `linearPath()`

```ts
static linearPath(object: FlxObject, points: readonly PointLike[], durationOrSpeed?: number, useDuration?: boolean, options?: FlxTweenOptions): FlxLinearPath
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

### `static` `num()`

```ts
static num(fromValue: number, toValue: number, duration?: number, options?: FlxTweenOptions, tweenFunction?: (value: number) => void): FlxNumTween
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

### `static` `quadMotion()`

```ts
static quadMotion(object: FlxObject, fromX: number, fromY: number, controlX: number, controlY: number, toX: number, toY: number, durationOrSpeed?: number, useDuration?: boolean, options?: FlxTweenOptions): FlxQuadMotion
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

### `static` `quadPath()`

```ts
static quadPath(object: FlxObject, points: readonly PointLike[], durationOrSpeed?: number, useDuration?: boolean, options?: FlxTweenOptions): FlxQuadPath
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

### `static` `shake()`

```ts
static shake(sprite: FlxSprite, intensity?: number, duration?: number, axes?: FlxTweenAxes, options?: FlxTweenOptions): FlxShakeTween
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

### `start()`

```ts
start(): this
```

**Returns:** `this`

### `then()`

```ts
then(tween: FlxTween): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `tween` | `FlxTween` | - |

**Returns:** `this`

### `static` `tween()`

```ts
static tween<T extends object>(target: T, values: Record<string, number>, duration?: number, options?: FlxTweenOptions): FlxVarTween<T>
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `target` | `T` | - |
| `values` | `Record<string, number>` | - |
| `duration` | `number` | - |
| `options` | `FlxTweenOptions` | - |

**Returns:** `FlxVarTween<T>`

### `wait()`

```ts
wait(delay: number): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `delay` | `number` | - |

**Returns:** `this`

