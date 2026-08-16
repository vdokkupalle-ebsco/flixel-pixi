---
title: FlxAtlasRegistry (Class)
description: API reference documentation for FlxAtlasRegistry in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Animation & Atlases</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAtlasRegistry

Registry that loads and stores named `FlxAtlas` instances. Access the singleton via `FlxG.atlas`.

```ts
export declare class FlxAtlasRegistry
```

## Methods

### `clear()`

```ts
clear(): void
```

Remove all atlases from the registry.

**Returns:** `void`

### `get()`

```ts
get(key: string): FlxAtlas
```

Return a previously loaded atlas.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `key`     | `string` | -           |

**Returns:** `FlxAtlas`

### `has()`

```ts
has(key: string): boolean
```

Returns true if an atlas with `key` is registered.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `key`     | `string` | -           |

**Returns:** `boolean`

### `load()`

```ts
load(key: string, imageUrl: string, meta: FlxAtlasMeta): Promise<FlxAtlas>
```

Load an atlas from an image URL and metadata, then store it under `key`. Overwrites any previously stored atlas with the same key.

`meta` can be: - A URL string ending in `.json` → TexturePacker/Pixi JSON format. - Any other URL string → TextureAtlas XML format. - Inline XML / JSON text (starts with `<` or `{`) → parsed directly. - A `{ frameWidth, frameHeight }` object → uniform fixed-size grid.

**Parameters:**

| Parameter  | Type           | Description |
| :--------- | :------------- | :---------- |
| `key`      | `string`       | -           |
| `imageUrl` | `string`       | -           |
| `meta`     | `FlxAtlasMeta` | -           |

**Returns:** `Promise<FlxAtlas>`

### `registerFromAssets()`

```ts
registerFromAssets(key: string, assets: FlxAssets, source: FlxAtlasAssetSource): FlxAtlas
```

Register an atlas from aliases that an `FlxAssets` bundle already loaded.

The asset cache retains ownership of the base texture and metadata. Remove the atlas before unloading its bundle; live sprites may continue retaining their own texture views.

TexturePacker JSON descriptors should set `parser: 'text'`. Keeping the payload as text prevents Pixi's post-load spritesheet parser from eagerly converting it before Flixel can validate and normalize the metadata.

**Parameters:**

| Parameter | Type                  | Description |
| :-------- | :-------------------- | :---------- |
| `key`     | `string`              | -           |
| `assets`  | `FlxAssets`           | -           |
| `source`  | `FlxAtlasAssetSource` | -           |

**Returns:** `FlxAtlas`

### `remove()`

```ts
remove(key: string): void
```

Remove one atlas from the registry. Does not destroy textures already referenced by live sprites.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `key`     | `string` | -           |

**Returns:** `void`
