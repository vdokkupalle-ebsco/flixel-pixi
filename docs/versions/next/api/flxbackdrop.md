---
title: FlxBackdrop (Class)
description: API reference documentation for FlxBackdrop in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxBackdrop

Infinitely repeating, independently scrolling texture region.

The authoritative state stays renderer-neutral while the Pixi adapter uses one `TilingSprite`, avoiding duplicate gameplay objects and wrap seams.

```ts
export declare class FlxBackdrop extends FlxSprite
```

## Constructors

```ts
constructor(source?: FlxGraphic | Texture | null, x?: number, y?: number, width?: number, height?: number)
```

Constructs a new instance of the `FlxBackdrop` class

| Parameter | Type                            | Description |
| :-------- | :------------------------------ | :---------- |
| `source`  | `FlxGraphic \| Texture \| null` | -           |
| `x`       | `number`                        | -           |
| `y`       | `number`                        | -           |
| `width`   | `number`                        | -           |
| `height`  | `number`                        | -           |

## Properties

| Property             | Modifiers  | Type       | Description                                                              |
| :------------------- | :--------- | :--------- | :----------------------------------------------------------------------- |
| **`repeatX`**        | -          | `boolean`  | Repeat the texture horizontally.                                         |
| **`repeatY`**        | -          | `boolean`  | Repeat the texture vertically.                                           |
| **`scrollVelocity`** | `readonly` | `FlxPoint` | Deterministic tile-position change in logical pixels per second.         |
| **`tileAngle`**      | -          | `number`   | Rotation applied to each tile, in degrees.                               |
| **`tilePosition`**   | `readonly` | `FlxPoint` | Texture offset in logical pixels.                                        |
| **`tileScale`**      | `readonly` | `FlxPoint` | Scale applied to each repeated tile without resizing the visible region. |

## Methods

### `createRenderHandle()`

```ts
createRenderHandle(): FlxBackdropRenderHandle
```

**Returns:** `FlxBackdropRenderHandle`

### `loadBackdropFrame()`

```ts
loadBackdropFrame(atlas: FlxAtlas, name: string, width?: number, height?: number): this
```

Load one named atlas frame as the repeating texture.

**Parameters:**

| Parameter | Type       | Description |
| :-------- | :--------- | :---------- |
| `atlas`   | `FlxAtlas` | -           |
| `name`    | `string`   | -           |
| `width`   | `number`   | -           |
| `height`  | `number`   | -           |

**Returns:** `this`

### `loadBackdropGraphic()`

```ts
loadBackdropGraphic(source: FlxGraphic | Texture, width?: number, height?: number): this
```

Load a texture and optionally set the visible tiling region.

**Parameters:**

| Parameter | Type                    | Description |
| :-------- | :---------------------- | :---------- |
| `source`  | `FlxGraphic \| Texture` | -           |
| `width`   | `number`                | -           |
| `height`  | `number`                | -           |

**Returns:** `this`

### `loadGraphic()`

```ts
loadGraphic(source: FlxGraphic | Texture, animated?: boolean, reverse?: boolean, width?: number, height?: number, unique?: boolean): this
```

**Parameters:**

| Parameter  | Type                    | Description |
| :--------- | :---------------------- | :---------- |
| `source`   | `FlxGraphic \| Texture` | -           |
| `animated` | `boolean`               | -           |
| `reverse`  | `boolean`               | -           |
| `width`    | `number`                | -           |
| `height`   | `number`                | -           |
| `unique`   | `boolean`               | -           |

**Returns:** `this`

### `onScreen()`

```ts
onScreen(camera?: FlxCameraLike): boolean
```

**Parameters:**

| Parameter | Type            | Description |
| :-------- | :-------------- | :---------- |
| `camera`  | `FlxCameraLike` | -           |

**Returns:** `boolean`

### `preUpdate()`

```ts
preUpdate(): void
```

**Returns:** `void`

### `resize()`

```ts
resize(width: number, height: number): this
```

Resize the visible tiling region without scaling its repeated texture.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `width`   | `number` | -           |
| `height`  | `number` | -           |

**Returns:** `this`

### `update()`

```ts
update(): void
```

**Returns:** `void`
