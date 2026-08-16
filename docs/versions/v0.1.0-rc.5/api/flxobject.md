---
title: FlxObject (Class)
description: API reference documentation for FlxObject in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxObject

Authoritative world-space motion and collision object.

```ts
export declare class FlxObject extends FlxBasic
```

## Constructors

```ts
constructor(x?: number, y?: number, width?: number, height?: number)
```

Constructs a new instance of the `FlxObject` class

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `x`       | `number` | -           |
| `y`       | `number` | -           |
| `width`   | `number` | -           |
| `height`  | `number` | -           |

## Properties

| Property                   | Modifiers           | Type              | Description |
| :------------------------- | :------------------ | :---------------- | :---------- |
| **`acceleration`**         | -                   | `FlxPoint`        | -           |
| **`allowCollisions`**      | -                   | `number`          | -           |
| **`angle`**                | -                   | `number`          | -           |
| **`angularAcceleration`**  | -                   | `number`          | -           |
| **`angularDrag`**          | -                   | `number`          | -           |
| **`angularVelocity`**      | -                   | `number`          | -           |
| **`ANY`**                  | `static` `readonly` | `number`          | -           |
| **`CEILING`**              | `static` `readonly` | ``                | -           |
| **`DOWN`**                 | `static` `readonly` | ``                | -           |
| **`drag`**                 | -                   | `FlxPoint`        | -           |
| **`elasticity`**           | -                   | `number`          | -           |
| **`flickering`**           | `readonly`          | `boolean`         | -           |
| **`FLOOR`**                | `static` `readonly` | ``                | -           |
| **`health`**               | -                   | `number`          | -           |
| **`height`**               | -                   | `number`          | -           |
| **`immovable`**            | -                   | `boolean`         | -           |
| **`last`**                 | -                   | `FlxPoint`        | -           |
| **`LEFT`**                 | `static` `readonly` | ``                | -           |
| **`mass`**                 | -                   | `number`          | -           |
| **`maxAngular`**           | -                   | `number`          | -           |
| **`maxVelocity`**          | -                   | `FlxPoint`        | -           |
| **`moves`**                | -                   | `boolean`         | -           |
| **`NONE`**                 | `static` `readonly` | ``                | -           |
| **`OVERLAP_BIAS`**         | `static` `readonly` | ``                | -           |
| **`PATH_BACKWARD`**        | `static` `readonly` | ``                | -           |
| **`PATH_FORWARD`**         | `static` `readonly` | ``                | -           |
| **`PATH_HORIZONTAL_ONLY`** | `static` `readonly` | ``                | -           |
| **`PATH_LOOP_BACKWARD`**   | `static` `readonly` | ``                | -           |
| **`PATH_LOOP_FORWARD`**    | `static` `readonly` | ``                | -           |
| **`PATH_VERTICAL_ONLY`**   | `static` `readonly` | ``                | -           |
| **`PATH_YOYO`**            | `static` `readonly` | ``                | -           |
| **`path`**                 | -                   | `FlxPath \| null` | -           |
| **`pathAngle`**            | -                   | `number`          | -           |
| **`pathSpeed`**            | -                   | `number`          | -           |
| **`RIGHT`**                | `static` `readonly` | ``                | -           |
| **`scrollFactor`**         | -                   | `FlxPoint`        | -           |
| **`solid`**                | -                   | `boolean`         | -           |
| **`touching`**             | -                   | `number`          | -           |
| **`UP`**                   | `static` `readonly` | ``                | -           |
| **`velocity`**             | -                   | `FlxPoint`        | -           |
| **`WALL`**                 | `static` `readonly` | `number`          | -           |
| **`wasTouching`**          | -                   | `number`          | -           |
| **`width`**                | -                   | `number`          | -           |
| **`x`**                    | -                   | `number`          | -           |
| **`y`**                    | -                   | `number`          | -           |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `flicker()`

```ts
flicker(duration?: number): void
```

**Parameters:**

| Parameter  | Type     | Description |
| :--------- | :------- | :---------- |
| `duration` | `number` | -           |

**Returns:** `void`

### `followPath()`

```ts
followPath(path: FlxPath, speed?: number, mode?: number, autoRotate?: boolean): void
```

**Parameters:**

| Parameter    | Type      | Description |
| :----------- | :-------- | :---------- |
| `path`       | `FlxPath` | -           |
| `speed`      | `number`  | -           |
| `mode`       | `number`  | -           |
| `autoRotate` | `boolean` | -           |

**Returns:** `void`

### `getMidpoint()`

```ts
getMidpoint(point?: FlxPoint): FlxPoint
```

**Parameters:**

| Parameter | Type       | Description |
| :-------- | :--------- | :---------- |
| `point`   | `FlxPoint` | -           |

**Returns:** `FlxPoint`

### `getScreenXY()`

```ts
getScreenXY(point?: FlxPoint, camera?: FlxCameraLike): FlxPoint
```

**Parameters:**

| Parameter | Type            | Description |
| :-------- | :-------------- | :---------- |
| `point`   | `FlxPoint`      | -           |
| `camera`  | `FlxCameraLike` | -           |

**Returns:** `FlxPoint`

### `hurt()`

```ts
hurt(damage: number): void
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `damage`  | `number` | -           |

**Returns:** `void`

### `isTouching()`

```ts
isTouching(direction: number): boolean
```

**Parameters:**

| Parameter   | Type     | Description |
| :---------- | :------- | :---------- |
| `direction` | `number` | -           |

**Returns:** `boolean`

### `justTouched()`

```ts
justTouched(direction: number): boolean
```

**Parameters:**

| Parameter   | Type     | Description |
| :---------- | :------- | :---------- |
| `direction` | `number` | -           |

**Returns:** `boolean`

### `onScreen()`

```ts
onScreen(camera?: FlxCameraLike): boolean
```

**Parameters:**

| Parameter | Type            | Description |
| :-------- | :-------------- | :---------- |
| `camera`  | `FlxCameraLike` | -           |

**Returns:** `boolean`

### `overlaps()`

```ts
overlaps(objectOrGroup: FlxBasic): boolean
```

**Parameters:**

| Parameter       | Type       | Description |
| :-------------- | :--------- | :---------- |
| `objectOrGroup` | `FlxBasic` | -           |

**Returns:** `boolean`

### `overlapsAt()`

```ts
overlapsAt(x: number, y: number, objectOrGroup: FlxBasic): boolean
```

**Parameters:**

| Parameter       | Type       | Description |
| :-------------- | :--------- | :---------- |
| `x`             | `number`   | -           |
| `y`             | `number`   | -           |
| `objectOrGroup` | `FlxBasic` | -           |

**Returns:** `boolean`

### `overlapsPoint()`

```ts
overlapsPoint(point: Readonly<FlxPoint>): boolean
```

**Parameters:**

| Parameter | Type                 | Description |
| :-------- | :------------------- | :---------- |
| `point`   | `Readonly<FlxPoint>` | -           |

**Returns:** `boolean`

### `postUpdate()`

```ts
postUpdate(): void
```

**Returns:** `void`

### `preUpdate()`

```ts
preUpdate(): void
```

**Returns:** `void`

### `reset()`

```ts
reset(x: number, y: number): void
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `x`       | `number` | -           |
| `y`       | `number` | -           |

**Returns:** `void`

### `static` `separate()`

```ts
static separate(first: FlxObject, second: FlxObject): boolean
```

**Parameters:**

| Parameter | Type        | Description |
| :-------- | :---------- | :---------- |
| `first`   | `FlxObject` | -           |
| `second`  | `FlxObject` | -           |

**Returns:** `boolean`

### `static` `separateX()`

```ts
static separateX(first: FlxObject, second: FlxObject): boolean
```

**Parameters:**

| Parameter | Type        | Description |
| :-------- | :---------- | :---------- |
| `first`   | `FlxObject` | -           |
| `second`  | `FlxObject` | -           |

**Returns:** `boolean`

### `static` `separateY()`

```ts
static separateY(first: FlxObject, second: FlxObject): boolean
```

**Parameters:**

| Parameter | Type        | Description |
| :-------- | :---------- | :---------- |
| `first`   | `FlxObject` | -           |
| `second`  | `FlxObject` | -           |

**Returns:** `boolean`

### `stopFollowingPath()`

```ts
stopFollowingPath(destroyPath?: boolean): void
```

**Parameters:**

| Parameter     | Type      | Description |
| :------------ | :-------- | :---------- |
| `destroyPath` | `boolean` | -           |

**Returns:** `void`
