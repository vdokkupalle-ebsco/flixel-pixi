---
title: FlxTilemapRenderHandle (Class)
description: API reference documentation for FlxTilemapRenderHandle in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Tilemaps</span>
  <span class="api-badge public">@public</span>
</div>

# FlxTilemapRenderHandle

Pixi sprite chunks synchronized from one authoritative tilemap.

```ts
export declare class FlxTilemapRenderHandle implements FlxRenderHandle
```

## Constructors

```ts
constructor(owner: FlxTilemap, chunkSizeInTiles?: number)
```

Constructs a new instance of the `FlxTilemapRenderHandle` class

| Parameter          | Type         | Description |
| :----------------- | :----------- | :---------- |
| `owner`            | `FlxTilemap` | -           |
| `chunkSizeInTiles` | `number`     | -           |

## Properties

| Property                  | Modifiers  | Type                | Description                                              |
| :------------------------ | :--------- | :------------------ | :------------------------------------------------------- |
| **`allocatedChunkCount`** | `readonly` | `number`            | Number of chunks materialized so far.                    |
| **`chunkSizeInTiles`**    | `readonly` | `number`            | -                                                        |
| **`destroyed`**           | `readonly` | `boolean`           | -                                                        |
| **`lastRebuiltChunks`**   | `readonly` | `readonly string[]` | Chunk keys rebuilt by the most recent synchronization.   |
| **`rebuildCount`**        | `readonly` | `number`            | Total chunk rebuilds since construction.                 |
| **`view`**                | `readonly` | `Container`         | -                                                        |
| **`visibleChunkCount`**   | `readonly` | `number`            | Number of chunks visible in the most recent camera pass. |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `sync()`

```ts
sync(camera?: FlxCamera, interpolationAlpha?: number): void
```

**Parameters:**

| Parameter            | Type        | Description |
| :------------------- | :---------- | :---------- |
| `camera`             | `FlxCamera` | -           |
| `interpolationAlpha` | `number`    | -           |

**Returns:** `void`
