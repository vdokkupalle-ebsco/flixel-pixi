---
title: FlxColorMatrixFilter (Class)
description: API reference documentation for FlxColorMatrixFilter in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Rendering & Filters</span>
  <span class="api-badge public">@public</span>
</div>

# FlxColorMatrixFilter

Renderer-neutral 4×5 color-matrix effect descriptor.

```ts
export declare class FlxColorMatrixFilter
```

## Constructors

```ts
constructor(matrix: readonly number[], alpha?: number)
```

Constructs a new instance of the `FlxColorMatrixFilter` class

| Parameter | Type                | Description |
| :-------- | :------------------ | :---------- |
| `matrix`  | `readonly number[]` | -           |
| `alpha`   | `number`            | -           |

## Properties

| Property     | Modifiers  | Type                | Description |
| :----------- | :--------- | :------------------ | :---------- |
| **`alpha`**  | `readonly` | `number`            | -           |
| **`kind`**   | `readonly` | ``                  | -           |
| **`matrix`** | `readonly` | `readonly number[]` | -           |

## Methods

### `static` `grayscale()`

```ts
static grayscale(alpha?: number): FlxColorMatrixFilter
```

Standard luminance-preserving grayscale transform.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `alpha`   | `number` | -           |

**Returns:** `FlxColorMatrixFilter`
