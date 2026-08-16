---
title: FlxPoint (Class)
description: API reference documentation for FlxPoint in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Collision & Math</span>
  <span class="api-badge public">@public</span>
</div>

# FlxPoint

Stores a two-dimensional floating-point coordinate.

```ts
export declare class FlxPoint implements PointLike
```

## Constructors

```ts
constructor(x?: number, y?: number)
```

Constructs a new instance of the `FlxPoint` class

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `x`       | `number` | -           |
| `y`       | `number` | -           |

## Properties

| Property | Modifiers | Type     | Description |
| :------- | :-------- | :------- | :---------- |
| **`x`**  | -         | `number` | -           |
| **`y`**  | -         | `number` | -           |

## Methods

### `copyFrom()`

```ts
copyFrom(point: PointLike): this
```

Copies another point into this instance.

**Parameters:**

| Parameter | Type        | Description |
| :-------- | :---------- | :---------- |
| `point`   | `PointLike` | -           |

**Returns:** `this`

### `copyFromFlash()`

```ts
copyFromFlash(point: PointLike): this
```

Browser replacement for copying from `flash.geom.Point`.

**Parameters:**

| Parameter | Type        | Description |
| :-------- | :---------- | :---------- |
| `point`   | `PointLike` | -           |

**Returns:** `this`

### `copyTo()`

```ts
copyTo<T extends PointLike>(point: T): T
```

Copies this point into the supplied mutable target.

**Parameters:**

| Parameter | Type | Description |
| :-------- | :--- | :---------- |
| `point`   | `T`  | -           |

**Returns:** `T`

### `copyToFlash()`

```ts
copyToFlash<T extends PointLike>(point: T): T
```

Browser replacement for copying to `flash.geom.Point`.

**Parameters:**

| Parameter | Type | Description |
| :-------- | :--- | :---------- |
| `point`   | `T`  | -           |

**Returns:** `T`

### `make()`

```ts
make(x?: number, y?: number): this
```

Reuses this point with new coordinates.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `x`       | `number` | -           |
| `y`       | `number` | -           |

**Returns:** `this`
