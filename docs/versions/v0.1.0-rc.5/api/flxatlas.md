---
title: FlxAtlas (Class)
description: API reference documentation for FlxAtlas in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Animation & Atlases</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAtlas

A loaded texture atlas with named frame lookup and ordered pickers.

Obtain instances via `FlxG.atlas.load(...)` / `FlxG.atlas.get(...)`.

```ts
export declare class FlxAtlas
```

## Properties

| Property         | Modifiers  | Type      | Description                                 |
| :--------------- | :--------- | :-------- | :------------------------------------------ |
| **`frameCount`** | `readonly` | `number`  | Number of named frames in this atlas.       |
| **`key`**        | `readonly` | `string`  | -                                           |
| **`texture`**    | `readonly` | `Texture` | Shared base texture (the full atlas sheet). |

## Methods

### `framesByNumber()`

```ts
framesByNumber(start: number, end: number): FlxAtlasFrameList
```

Return frames by 0-based index range (inclusive) or explicit index array.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `start`   | `number` | -           |
| `end`     | `number` | -           |

**Returns:** `FlxAtlasFrameList`

### `framesByNumber()`

```ts
framesByNumber(indices: readonly number[]): FlxAtlasFrameList
```

**Parameters:**

| Parameter | Type                | Description |
| :-------- | :------------------ | :---------- |
| `indices` | `readonly number[]` | -           |

**Returns:** `FlxAtlasFrameList`

### `framesByPrefix()`

```ts
framesByPrefix(prefix: string, start: number, end: number, options?: FlxAtlasPrefixOptions): FlxAtlasFrameList
```

Return an ordered list of frames whose names match `prefix + paddedNumber` for each integer in `[start, end]` inclusive.

`options.padding` defaults to 1 (no leading zeros) and must be at least 1. Also retries each lookup with a `.png` suffix (Kenney convention).

**Parameters:**

| Parameter | Type                    | Description |
| :-------- | :---------------------- | :---------- |
| `prefix`  | `string`                | -           |
| `start`   | `number`                | -           |
| `end`     | `number`                | -           |
| `options` | `FlxAtlasPrefixOptions` | -           |

**Returns:** `FlxAtlasFrameList`

### `getFrame()`

```ts
getFrame(name: string): FlxAtlasFrame
```

Return the frame with the given exact name, or retry with `.png` appended (Kenney convention). Throws if neither resolves.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `name`    | `string` | -           |

**Returns:** `FlxAtlasFrame`

### `makeGraphic()`

```ts
makeGraphic(frames: readonly (FlxAtlasFrame | null)[], frameWidth?: number, frameHeight?: number): Texture
```

Build a Flixel `Texture` strip for `loadGraphic` / tilemaps. Pass `null` for a fully transparent cell (e.g. tilemap air = index 0). Optional `frameWidth` / `frameHeight` scale cells while copying.

**Parameters:**

| Parameter     | Type                                 | Description |
| :------------ | :----------------------------------- | :---------- |
| `frames`      | `readonly (FlxAtlasFrame \| null)[]` | -           |
| `frameWidth`  | `number`                             | -           |
| `frameHeight` | `number`                             | -           |

**Returns:** `Texture`
