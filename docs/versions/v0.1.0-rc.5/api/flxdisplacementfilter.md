---
title: FlxDisplacementFilter (Class)
description: API reference documentation for FlxDisplacementFilter in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Rendering & Filters</span>
  <span class="api-badge public">@public</span>
</div>

# FlxDisplacementFilter

Texture-backed displacement effect with revisioned runtime parameters.

```ts
export declare class FlxDisplacementFilter
```

## Constructors

```ts
constructor(map: FlxGraphic, options?: FlxDisplacementFilterOptions)
```

Constructs a new instance of the `FlxDisplacementFilter` class

| Parameter | Type                           | Description |
| :-------- | :----------------------------- | :---------- |
| `map`     | `FlxGraphic`                   | -           |
| `options` | `FlxDisplacementFilterOptions` | -           |

## Properties

| Property       | Modifiers  | Type         | Description                                                   |
| :------------- | :--------- | :----------- | :------------------------------------------------------------ |
| **`kind`**     | `readonly` | ``           | Discriminator used by renderer adapters.                      |
| **`map`**      | `readonly` | `FlxGraphic` | Non-owning displacement-map reference.                        |
| **`offsetX`**  | `readonly` | `number`     | Horizontal normalized map offset.                             |
| **`offsetY`**  | `readonly` | `number`     | Vertical normalized map offset.                               |
| **`padding`**  | `readonly` | `number`     | Fixed logical padding reserved around the filtered object.    |
| **`repeat`**   | `readonly` | `boolean`    | Whether normalized map coordinates repeat instead of clamp.   |
| **`revision`** | `readonly` | `number`     | Monotonic parameter change counter used by renderer adapters. |
| **`scaleX`**   | `readonly` | `number`     | Horizontal displacement in logical pixels.                    |
| **`scaleY`**   | `readonly` | `number`     | Vertical displacement in logical pixels.                      |

## Methods

### `setOffset()`

```ts
setOffset(x: number, y: number): this
```

Scroll the displacement map in normalized texture coordinates.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `x`       | `number` | -           |
| `y`       | `number` | -           |

**Returns:** `this`

### `setScale()`

```ts
setScale(x: number, y?: number): this
```

Change pixel displacement without rebuilding the filter chain.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `x`       | `number` | -           |
| `y`       | `number` | -           |

**Returns:** `this`
