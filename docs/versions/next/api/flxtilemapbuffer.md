---
title: FlxTilemapBuffer (Class)
description: API reference documentation for FlxTilemapBuffer in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Tilemaps</span>
  <span class="api-badge public">@public</span>
</div>

# FlxTilemapBuffer

Compatibility metadata for the classic camera-sized bitmap tile buffer. Pixi rendering uses [link](#) chunks instead.

```ts
export declare class FlxTilemapBuffer
```

## Constructors

```ts
constructor(tileWidth: number, tileHeight: number, widthInTiles: number, heightInTiles: number, camera?: FlxCamera)
```

Constructs a new instance of the `FlxTilemapBuffer` class

| Parameter       | Type        | Description |
| :-------------- | :---------- | :---------- |
| `tileWidth`     | `number`    | -           |
| `tileHeight`    | `number`    | -           |
| `widthInTiles`  | `number`    | -           |
| `heightInTiles` | `number`    | -           |
| `camera`        | `FlxCamera` | -           |

## Properties

| Property      | Modifiers  | Type          | Description |
| :------------ | :--------- | :------------ | :---------- |
| **`columns`** | `readonly` | `number`      | -           |
| **`dirty`**   | -          | `boolean`     | -           |
| **`height`**  | `readonly` | `number`      | -           |
| **`pixels`**  | `readonly` | `PixelBuffer` | -           |
| **`rows`**    | `readonly` | `number`      | -           |
| **`width`**   | `readonly` | `number`      | -           |
| **`x`**       | -          | `number`      | -           |
| **`y`**       | -          | `number`      | -           |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `draw()`

```ts
draw(camera: FlxCamera, point: Readonly<FlxPoint>): void
```

Rendering is adapter-owned; this method records the compatibility position.

**Parameters:**

| Parameter | Type                 | Description |
| :-------- | :------------------- | :---------- |
| `camera`  | `FlxCamera`          | -           |
| `point`   | `Readonly<FlxPoint>` | -           |

**Returns:** `void`

### `fill()`

```ts
fill(color?: number): void
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `color`   | `number` | -           |

**Returns:** `void`
