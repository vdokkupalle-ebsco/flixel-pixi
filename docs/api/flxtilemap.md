---
title: FlxTilemap (Class)
description: API reference documentation for FlxTilemap in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Tilemaps</span>
  <span class="api-badge public">@public</span>
</div>

# FlxTilemap

Renderer-neutral tile data, collision, ray, and pathfinding object.

```ts
export declare class FlxTilemap extends FlxObject
```

## Constructors

```ts
constructor()
```

Constructs a new instance of the `FlxTilemap` class

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`ALT`** | `static` `readonly` | `` | - |
| **`auto`** | - | `number` | - |
| **`AUTO`** | `static` `readonly` | `` | - |
| **`heightInTiles`** | - | `number` | - |
| **`OFF`** | `static` `readonly` | `` | - |
| **`tileHeight`** | `readonly` | `number` | Height of one tile in pixels. |
| **`tileWidth`** | `readonly` | `number` | Width of one tile in pixels. |
| **`totalTiles`** | - | `number` | - |
| **`widthInTiles`** | - | `number` | - |

## Methods

### `static` `arrayToCSV()`

```ts
static arrayToCSV(data: readonly number[], width: number, invert?: boolean): string
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `data` | `readonly number[]` | - |
| `width` | `number` | - |
| `invert` | `boolean` | - |

**Returns:** `string`

### `static` `bitmapToCSV()`

```ts
static bitmapToCSV(bitmap: { readonly width: number; readonly height: number; readonly data: Uint32Array; }, invert?: boolean, scale?: number): string
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `bitmap` | `{ readonly width: number; readonly height: number; readonly data: Uint32Array; }` | - |
| `invert` | `boolean` | - |
| `scale` | `number` | - |

**Returns:** `string`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `findPath()`

```ts
findPath(start: Readonly<FlxPoint>, end: Readonly<FlxPoint>, simplify?: boolean, raySimplify?: boolean): FlxPath | null
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `start` | `Readonly<FlxPoint>` | - |
| `end` | `Readonly<FlxPoint>` | - |
| `simplify` | `boolean` | - |
| `raySimplify` | `boolean` | - |

**Returns:** `FlxPath | null`

### `follow()`

```ts
follow(camera?: FlxCamera, border?: number, updateWorld?: boolean): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCamera` | - |
| `border` | `number` | - |
| `updateWorld` | `boolean` | - |

**Returns:** `void`

### `getBounds()`

```ts
getBounds(bounds?: FlxRect): FlxRect
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `bounds` | `FlxRect` | - |

**Returns:** `FlxRect`

### `getData()`

```ts
getData(simple?: boolean): number[]
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `simple` | `boolean` | - |

**Returns:** `number[]`

### `getTile()`

```ts
getTile(x: number, y: number): number
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `x` | `number` | - |
| `y` | `number` | - |

**Returns:** `number`

### `getTileByIndex()`

```ts
getTileByIndex(index: number): number
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `index` | `number` | - |

**Returns:** `number`

### `getTileCoords()`

```ts
getTileCoords(index: number, midpoint?: boolean): FlxPoint[] | null
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `index` | `number` | - |
| `midpoint` | `boolean` | - |

**Returns:** `FlxPoint[] | null`

### `getTileInstances()`

```ts
getTileInstances(index: number): number[] | null
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `index` | `number` | - |

**Returns:** `number[] | null`

### `loadMap()`

```ts
loadMap(mapData: string, tileGraphic: FlxGraphic | Texture, tileWidth?: number, tileHeight?: number, autoTile?: number, startingIndex?: number, drawIndex?: number, collideIndex?: number): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `mapData` | `string` | - |
| `tileGraphic` | `FlxGraphic \| Texture` | - |
| `tileWidth` | `number` | - |
| `tileHeight` | `number` | - |
| `autoTile` | `number` | - |
| `startingIndex` | `number` | - |
| `drawIndex` | `number` | - |
| `collideIndex` | `number` | - |

**Returns:** `this`

### `loadMapData()`

```ts
loadMapData(data: readonly number[], widthInTiles: number, tileGraphic: FlxGraphic | Texture, options?: Partial<FlxTilemapLoadOptions>): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `data` | `readonly number[]` | - |
| `widthInTiles` | `number` | - |
| `tileGraphic` | `FlxGraphic \| Texture` | - |
| `options` | `Partial<FlxTilemapLoadOptions>` | - |

**Returns:** `this`

### `overlaps()`

```ts
overlaps(objectOrGroup: FlxBasic): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `objectOrGroup` | `FlxBasic` | - |

**Returns:** `boolean`

### `overlapsAt()`

```ts
overlapsAt(x: number, y: number, objectOrGroup: FlxBasic): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `x` | `number` | - |
| `y` | `number` | - |
| `objectOrGroup` | `FlxBasic` | - |

**Returns:** `boolean`

### `overlapsPoint()`

```ts
overlapsPoint(point: Readonly<FlxPoint>): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `point` | `Readonly<FlxPoint>` | - |

**Returns:** `boolean`

### `overlapsWithCallback()`

```ts
overlapsWithCallback(object: FlxObject, callback?: FlxTilemapOverlapCallback | null, flipCallbackParams?: boolean, position?: Readonly<FlxPoint> | null): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `object` | `FlxObject` | - |
| `callback` | `FlxTilemapOverlapCallback \| null` | - |
| `flipCallbackParams` | `boolean` | - |
| `position` | `Readonly<FlxPoint> \| null` | - |

**Returns:** `boolean`

### `ray()`

```ts
ray(start: Readonly<FlxPoint>, end: Readonly<FlxPoint>, result?: FlxPoint | null, resolution?: number): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `start` | `Readonly<FlxPoint>` | - |
| `end` | `Readonly<FlxPoint>` | - |
| `result` | `FlxPoint \| null` | - |
| `resolution` | `number` | - |

**Returns:** `boolean`

### `setDirty()`

```ts
setDirty(dirty?: boolean): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `dirty` | `boolean` | - |

**Returns:** `void`

### `setTile()`

```ts
setTile(x: number, y: number, tile: number, updateGraphics?: boolean): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `x` | `number` | - |
| `y` | `number` | - |
| `tile` | `number` | - |
| `updateGraphics` | `boolean` | - |

**Returns:** `boolean`

### `setTileByIndex()`

```ts
setTileByIndex(index: number, tile: number, updateGraphics?: boolean): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `index` | `number` | - |
| `tile` | `number` | - |
| `updateGraphics` | `boolean` | - |

**Returns:** `boolean`

### `setTileProperties()`

```ts
setTileProperties(tileIndex: number, allowCollisions?: number, callback?: FlxTileCallback | null, callbackFilter?: FlxTileFilter | null, range?: number): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `tileIndex` | `number` | - |
| `allowCollisions` | `number` | - |
| `callback` | `FlxTileCallback \| null` | - |
| `callbackFilter` | `FlxTileFilter \| null` | - |
| `range` | `number` | - |

**Returns:** `void`

