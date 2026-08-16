---
title: FlxRect (Class)
description: API reference documentation for FlxRect in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Collision & Math</span>
  <span class="api-badge public">@public</span>
</div>

# FlxRect

Stores a mutable axis-aligned rectangle.

```ts
export declare class FlxRect implements RectangleLike
```

## Constructors

```ts
constructor(x?: number, y?: number, width?: number, height?: number)
```

Constructs a new instance of the `FlxRect` class

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `x`       | `number` | -           |
| `y`       | `number` | -           |
| `width`   | `number` | -           |
| `height`  | `number` | -           |

## Properties

| Property     | Modifiers  | Type     | Description |
| :----------- | :--------- | :------- | :---------- |
| **`bottom`** | `readonly` | `number` | -           |
| **`height`** | -          | `number` | -           |
| **`left`**   | `readonly` | `number` | -           |
| **`right`**  | `readonly` | `number` | -           |
| **`top`**    | `readonly` | `number` | -           |
| **`width`**  | -          | `number` | -           |
| **`x`**      | -          | `number` | -           |
| **`y`**      | -          | `number` | -           |

## Methods

### `copyFrom()`

```ts
copyFrom(rectangle: RectangleLike): this
```

Copies another rectangle into this instance.

**Parameters:**

| Parameter   | Type            | Description |
| :---------- | :-------------- | :---------- |
| `rectangle` | `RectangleLike` | -           |

**Returns:** `this`

### `copyFromFlash()`

```ts
copyFromFlash(rectangle: RectangleLike): this
```

Browser replacement for copying from `flash.geom.Rectangle`.

**Parameters:**

| Parameter   | Type            | Description |
| :---------- | :-------------- | :---------- |
| `rectangle` | `RectangleLike` | -           |

**Returns:** `this`

### `copyTo()`

```ts
copyTo<T extends RectangleLike>(rectangle: T): T
```

Copies this rectangle into the supplied mutable target.

**Parameters:**

| Parameter   | Type | Description |
| :---------- | :--- | :---------- |
| `rectangle` | `T`  | -           |

**Returns:** `T`

### `copyToFlash()`

```ts
copyToFlash<T extends RectangleLike>(rectangle: T): T
```

Browser replacement for copying to `flash.geom.Rectangle`.

**Parameters:**

| Parameter   | Type | Description |
| :---------- | :--- | :---------- |
| `rectangle` | `T`  | -           |

**Returns:** `T`

### `make()`

```ts
make(x?: number, y?: number, width?: number, height?: number): this
```

Reuses this rectangle with new bounds.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `x`       | `number` | -           |
| `y`       | `number` | -           |
| `width`   | `number` | -           |
| `height`  | `number` | -           |

**Returns:** `this`

### `overlaps()`

```ts
overlaps(rectangle: RectangleLike): boolean
```

Tests strict-area overlap; touching edges do not overlap.

**Parameters:**

| Parameter   | Type            | Description |
| :---------- | :-------------- | :---------- |
| `rectangle` | `RectangleLike` | -           |

**Returns:** `boolean`
