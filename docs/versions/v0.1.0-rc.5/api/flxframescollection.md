---
title: FlxFramesCollection (Class)
description: API reference documentation for FlxFramesCollection in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Animation & Atlases</span>
  <span class="api-badge public">@public</span>
</div>

# FlxFramesCollection

Ordered frame views shared by sprite animation and atlas workflows.

```ts
export declare class FlxFramesCollection
```

## Constructors

```ts
constructor(frames?: readonly FlxFrame[])
```

Constructs a new instance of the `FlxFramesCollection` class

| Parameter | Type                  | Description |
| :-------- | :-------------------- | :---------- |
| `frames`  | `readonly FlxFrame[]` | -           |

## Properties

| Property        | Modifiers  | Type         | Description |
| :-------------- | :--------- | :----------- | :---------- |
| **`frames`**    | -          | `FlxFrame[]` | -           |
| **`numFrames`** | `readonly` | `number`     | -           |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `static` `fromAtlas()`

```ts
static fromAtlas(frames: FlxAtlasFrameList): FlxFramesCollection
```

**Parameters:**

| Parameter | Type                | Description |
| :-------- | :------------------ | :---------- |
| `frames`  | `FlxAtlasFrameList` | -           |

**Returns:** `FlxFramesCollection`

### `static` `fromGraphicGrid()`

```ts
static fromGraphicGrid(graphic: FlxGraphic, frameWidth: number, frameHeight: number, options?: FlxGridFramesOptions): FlxFramesCollection
```

**Parameters:**

| Parameter     | Type                   | Description |
| :------------ | :--------------------- | :---------- |
| `graphic`     | `FlxGraphic`           | -           |
| `frameWidth`  | `number`               | -           |
| `frameHeight` | `number`               | -           |
| `options`     | `FlxGridFramesOptions` | -           |

**Returns:** `FlxFramesCollection`

### `getByIndices()`

```ts
getByIndices(indices: readonly number[]): FlxFrame[]
```

**Parameters:**

| Parameter | Type                | Description |
| :-------- | :------------------ | :---------- |
| `indices` | `readonly number[]` | -           |

**Returns:** `FlxFrame[]`

### `getByName()`

```ts
getByName(name: string): FlxFrame
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `name`    | `string` | -           |

**Returns:** `FlxFrame`

### `getByNames()`

```ts
getByNames(names: readonly string[]): FlxFrame[]
```

**Parameters:**

| Parameter | Type                | Description |
| :-------- | :------------------ | :---------- |
| `names`   | `readonly string[]` | -           |

**Returns:** `FlxFrame[]`

### `getByPrefix()`

```ts
getByPrefix(prefix: string): FlxFrame[]
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `prefix`  | `string` | -           |

**Returns:** `FlxFrame[]`

### `getFrame()`

```ts
getFrame(index: number): FlxFrame
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `index`   | `number` | -           |

**Returns:** `FlxFrame`

### `setNames()`

```ts
setNames(names: readonly (string | null)[]): void
```

**Parameters:**

| Parameter | Type                          | Description |
| :-------- | :---------------------------- | :---------- |
| `names`   | `readonly (string \| null)[]` | -           |

**Returns:** `void`
