---
title: FlxGraphic (Class)
description: API reference documentation for FlxGraphic in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Assets & Loading</span>
  <span class="api-badge public">@public</span>
</div>

# FlxGraphic

A loaded or generated Pixi texture plus optional CPU-side pixel data.

```ts
export declare class FlxGraphic
```

## Constructors

```ts
constructor(texture: Texture, options?: { ownsTexture?: boolean; pixels?: PixelBuffer | null; })
```

Constructs a new instance of the `FlxGraphic` class

| Parameter | Type                                                       | Description |
| :-------- | :--------------------------------------------------------- | :---------- |
| `texture` | `Texture`                                                  | -           |
| `options` | `{ ownsTexture?: boolean; pixels?: PixelBuffer \| null; }` | -           |

## Properties

| Property               | Modifiers  | Type                  | Description                                                     |
| :--------------------- | :--------- | :-------------------- | :-------------------------------------------------------------- |
| **`cachedFrameCount`** | `readonly` | `number`              | Number of cached subtextures; useful for lifecycle diagnostics. |
| **`destroyed`**        | `readonly` | `boolean`             | -                                                               |
| **`height`**           | `readonly` | `number`              | -                                                               |
| **`pixels`**           | `readonly` | `PixelBuffer \| null` | -                                                               |
| **`texture`**          | `readonly` | `Texture`             | -                                                               |
| **`width`**            | `readonly` | `number`              | -                                                               |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `frameTexture()`

```ts
frameTexture(frameIndex: number, frameWidth: number, frameHeight: number): Texture
```

**Parameters:**

| Parameter     | Type     | Description |
| :------------ | :------- | :---------- |
| `frameIndex`  | `number` | -           |
| `frameWidth`  | `number` | -           |
| `frameHeight` | `number` | -           |

**Returns:** `Texture`

### `static` `fromPixels()`

```ts
static fromPixels(buffer: PixelBuffer, label?: string): FlxGraphic
```

**Parameters:**

| Parameter | Type          | Description |
| :-------- | :------------ | :---------- |
| `buffer`  | `PixelBuffer` | -           |
| `label`   | `string`      | -           |

**Returns:** `FlxGraphic`

### `refresh()`

```ts
refresh(): void
```

Uploads mutations made to an owned CPU pixel buffer.

**Returns:** `void`
