---
title: FlxTile (Class)
description: API reference documentation for FlxTile in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Tilemaps</span>
  <span class="api-badge public">@public</span>
</div>

# FlxTile

Reusable collision proxy for one tile type.

```ts
export declare class FlxTile extends FlxObject
```

## Constructors

```ts
constructor(tilemap: FlxTilemap, index: number, width: number, height: number, visible: boolean, allowCollisions: number)
```

Constructs a new instance of the `FlxTile` class

| Parameter         | Type         | Description |
| :---------------- | :----------- | :---------- |
| `tilemap`         | `FlxTilemap` | -           |
| `index`           | `number`     | -           |
| `width`           | `number`     | -           |
| `height`          | `number`     | -           |
| `visible`         | `boolean`    | -           |
| `allowCollisions` | `number`     | -           |

## Properties

| Property       | Modifiers  | Type                      | Description |
| :------------- | :--------- | :------------------------ | :---------- |
| **`callback`** | -          | `FlxTileCallback \| null` | -           |
| **`filter`**   | -          | `FlxTileFilter \| null`   | -           |
| **`index`**    | `readonly` | `number`                  | -           |
| **`mapIndex`** | -          | `number`                  | -           |
| **`tilemap`**  | -          | `FlxTilemap \| null`      | -           |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`
