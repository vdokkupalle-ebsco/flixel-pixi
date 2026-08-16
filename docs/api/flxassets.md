---
title: FlxAssets (Class)
description: API reference documentation for FlxAssets in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Assets & Loading</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAssets

Typed, explicitly asynchronous facade over PixiJS v8 `Assets`.

```ts
export declare class FlxAssets
```

## Constructors

```ts
constructor(backend?: FlxAssetBackend)
```

Constructs a new instance of the `FlxAssets` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `backend` | `FlxAssetBackend` | - |

## Methods

### `add()`

```ts
add(descriptor: FlxAssetDescriptor | FlxAssetDescriptor[]): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `descriptor` | `FlxAssetDescriptor \| FlxAssetDescriptor[]` | - |

**Returns:** `this`

### `addBundle()`

```ts
addBundle(name: string, assets: FlxAssetDescriptor[]): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | - |
| `assets` | `FlxAssetDescriptor[]` | - |

**Returns:** `this`

### `backgroundLoad()`

```ts
backgroundLoad(ids: string | string[]): Promise<void>
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `ids` | `string \| string[]` | - |

**Returns:** `Promise<void>`

### `backgroundLoadBundle()`

```ts
backgroundLoadBundle(names: string | string[]): Promise<void>
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `names` | `string \| string[]` | - |

**Returns:** `Promise<void>`

### `failureFor()`

```ts
failureFor(id: string): FlxAssetLoadError | undefined
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | - |

**Returns:** `FlxAssetLoadError | undefined`

### `static` `fromContext()`

```ts
static fromContext(context: FlxContext): FlxAssets | undefined
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `context` | `FlxContext` | - |

**Returns:** `FlxAssets | undefined`

### `get()`

```ts
get<T>(id: string): T | undefined
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | - |

**Returns:** `T | undefined`

### `getBitmapFont()`

```ts
getBitmapFont(id: string): FlxBitmapFont | undefined
```

Return an already-loaded Pixi bitmap font as a non-owning engine wrapper.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | - |

**Returns:** `FlxBitmapFont | undefined`

### `getGraphic()`

```ts
getGraphic(id: string): FlxGraphic | undefined
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | - |

**Returns:** `FlxGraphic | undefined`

### `init()`

```ts
init(options?: FlxAssetInitOptions): Promise<void>
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `options` | `FlxAssetInitOptions` | - |

**Returns:** `Promise<void>`

### `install()`

```ts
install(context: FlxContext): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `context` | `FlxContext` | - |

**Returns:** `this`

### `isLoaded()`

```ts
isLoaded(id: string): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | - |

**Returns:** `boolean`

### `load()`

```ts
load<T>(id: string | FlxAssetDescriptor, options?: FlxAssetLoadOptions): Promise<T>
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string \| FlxAssetDescriptor` | - |
| `options` | `FlxAssetLoadOptions` | - |

**Returns:** `Promise<T>`

### `loadBitmapFont()`

```ts
loadBitmapFont(id: string | FlxAssetDescriptor, options?: FlxAssetLoadOptions): Promise<FlxBitmapFont>
```

Load a `.fnt`/`.xml` bitmap font and every page it references. Page textures and the Pixi font remain owned by the asset cache.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string \| FlxAssetDescriptor` | - |
| `options` | `FlxAssetLoadOptions` | - |

**Returns:** `Promise<FlxBitmapFont>`

### `loadBundle()`

```ts
loadBundle<T = Record<string, unknown>>(name: string | string[], onProgress?: (progress: number) => void): Promise<T>
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `name` | `string \| string[]` | - |
| `onProgress` | `(progress: number) => void` | - |

**Returns:** `Promise<T>`

### `loadGraphic()`

```ts
loadGraphic(id: string | FlxAssetDescriptor, options?: FlxAssetLoadOptions): Promise<FlxGraphic>
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string \| FlxAssetDescriptor` | - |
| `options` | `FlxAssetLoadOptions` | - |

**Returns:** `Promise<FlxGraphic>`

### `unload()`

```ts
unload(id: string | string[]): Promise<void>
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string \| string[]` | - |

**Returns:** `Promise<void>`

### `unloadBundle()`

```ts
unloadBundle(name: string | string[]): Promise<void>
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `name` | `string \| string[]` | - |

**Returns:** `Promise<void>`

