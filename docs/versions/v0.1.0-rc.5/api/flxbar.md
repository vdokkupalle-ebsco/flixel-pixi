---
title: FlxBar (Class)
description: API reference documentation for FlxBar in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">UI & Typography</span>
  <span class="api-badge public">@public</span>
</div>

# FlxBar

Deterministic value bar with renderer-owned fill geometry.

The optional parent/property binding is read once per fixed update. Rendering never regenerates textures when the value changes.

```ts
export declare class FlxBar extends FlxSprite
```

## Constructors

```ts
constructor(x?: number, y?: number, direction?: FlxBarFillDirection, width?: number, height?: number, parent?: object | null, variable?: string, minimum?: number, maximum?: number, showBorder?: boolean)
```

Constructs a new instance of the `FlxBar` class

| Parameter    | Type                  | Description |
| :----------- | :-------------------- | :---------- |
| `x`          | `number`              | -           |
| `y`          | `number`              | -           |
| `direction`  | `FlxBarFillDirection` | -           |
| `width`      | `number`              | -           |
| `height`     | `number`              | -           |
| `parent`     | `object \| null`      | -           |
| `variable`   | `string`              | -           |
| `minimum`    | `number`              | -           |
| `maximum`    | `number`              | -           |
| `showBorder` | `boolean`             | -           |

## Properties

| Property                    | Modifiers           | Type                     | Description                                                        |
| :-------------------------- | :------------------ | :----------------------- | :----------------------------------------------------------------- |
| **`barHeight`**             | `readonly`          | `number`                 | Logical bar height in pixels.                                      |
| **`barWidth`**              | `readonly`          | `number`                 | Logical bar width in pixels.                                       |
| **`borderColor`**           | `readonly`          | `number`                 | Packed `0xRRGGBBAA` border color.                                  |
| **`BOTTOM_TO_TOP`**         | `static` `readonly` | ``                       | -                                                                  |
| **`direction`**             | -                   | `FlxBarFillDirection`    | -                                                                  |
| **`emptyCallback`**         | -                   | `FlxBarCallback \| null` | -                                                                  |
| **`emptyColor`**            | `readonly`          | `number`                 | Packed `0xRRGGBBAA` empty/background color.                        |
| **`fillColor`**             | `readonly`          | `number`                 | Packed `0xRRGGBBAA` fill color.                                    |
| **`filledCallback`**        | -                   | `FlxBarCallback \| null` | -                                                                  |
| **`fixedPosition`**         | -                   | `boolean`                | When false, the bar follows its parent position each fixed update. |
| **`fraction`**              | `readonly`          | `number`                 | Current value normalized to the inclusive range, from 0 through 1. |
| **`HORIZONTAL_INSIDE_OUT`** | `static` `readonly` | ``                       | -                                                                  |
| **`HORIZONTAL_OUTSIDE_IN`** | `static` `readonly` | ``                       | -                                                                  |
| **`killOnEmpty`**           | -                   | `boolean`                | -                                                                  |
| **`LEFT_TO_RIGHT`**         | `static` `readonly` | ``                       | -                                                                  |
| **`maximum`**               | `readonly`          | `number`                 | -                                                                  |
| **`minimum`**               | `readonly`          | `number`                 | -                                                                  |
| **`parent`**                | `readonly`          | `object \| null`         | Bound parent object, when value tracking is active.                |
| **`parentVariable`**        | `readonly`          | `string`                 | Property name read from the bound parent object each fixed update. |
| **`percent`**               | `readonly`          | `number`                 | Current value as a percentage from 0 through 100.                  |
| **`positionOffset`**        | `readonly`          | `FlxPoint`               | -                                                                  |
| **`RIGHT_TO_LEFT`**         | `static` `readonly` | ``                       | -                                                                  |
| **`showBorder`**            | `readonly`          | `boolean`                | -                                                                  |
| **`TOP_TO_BOTTOM`**         | `static` `readonly` | ``                       | -                                                                  |
| **`value`**                 | -                   | `number`                 | -                                                                  |
| **`VERTICAL_INSIDE_OUT`**   | `static` `readonly` | ``                       | -                                                                  |
| **`VERTICAL_OUTSIDE_IN`**   | `static` `readonly` | ``                       | -                                                                  |

## Methods

### `createFilledBar()`

```ts
createFilledBar(emptyColor?: number, fillColor?: number, showBorder?: boolean, borderColor?: number): this
```

**Parameters:**

| Parameter     | Type      | Description |
| :------------ | :-------- | :---------- |
| `emptyColor`  | `number`  | -           |
| `fillColor`   | `number`  | -           |
| `showBorder`  | `boolean` | -           |
| `borderColor` | `number`  | -           |

**Returns:** `this`

### `createRenderHandle()`

```ts
createRenderHandle(): FlxBarRenderHandle
```

**Returns:** `FlxBarRenderHandle`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `setCallbacks()`

```ts
setCallbacks(emptyCallback?: FlxBarCallback | null, filledCallback?: FlxBarCallback | null, killOnEmpty?: boolean): this
```

**Parameters:**

| Parameter        | Type                     | Description |
| :--------------- | :----------------------- | :---------- |
| `emptyCallback`  | `FlxBarCallback \| null` | -           |
| `filledCallback` | `FlxBarCallback \| null` | -           |
| `killOnEmpty`    | `boolean`                | -           |

**Returns:** `this`

### `setParent()`

```ts
setParent(parent: object | null, variable: string, track?: boolean, offsetX?: number, offsetY?: number): this
```

Bind a parent object and optional property for value tracking.

When `track` is true the bar also follows the parent position using `offsetX` and `offsetY`.

**Parameters:**

| Parameter  | Type             | Description |
| :--------- | :--------------- | :---------- |
| `parent`   | `object \| null` | -           |
| `variable` | `string`         | -           |
| `track`    | `boolean`        | -           |
| `offsetX`  | `number`         | -           |
| `offsetY`  | `number`         | -           |

**Returns:** `this`

### `setRange()`

```ts
setRange(minimum: number, maximum: number): this
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `minimum` | `number` | -           |
| `maximum` | `number` | -           |

**Returns:** `this`

### `setValueProvider()`

```ts
setValueProvider(provider: FlxBarValueProvider | null): this
```

**Parameters:**

| Parameter  | Type                          | Description |
| :--------- | :---------------------------- | :---------- |
| `provider` | `FlxBarValueProvider \| null` | -           |

**Returns:** `this`

### `stopTrackingParent()`

```ts
stopTrackingParent(posX: number, posY: number): this
```

Stop following the parent and remain at the given world position.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `posX`    | `number` | -           |
| `posY`    | `number` | -           |

**Returns:** `this`

### `trackParent()`

```ts
trackParent(offsetX: number, offsetY: number): this
```

Bind a parent object property for value tracking, or follow an already-bound parent's position when the first argument is a numeric offset.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `offsetX` | `number` | -           |
| `offsetY` | `number` | -           |

**Returns:** `this`

### `trackParent()`

```ts
trackParent(parent: object | null, variable: string): this
```

**Parameters:**

| Parameter  | Type             | Description |
| :--------- | :--------------- | :---------- |
| `parent`   | `object \| null` | -           |
| `variable` | `string`         | -           |

**Returns:** `this`

### `update()`

```ts
update(): void
```

**Returns:** `void`
