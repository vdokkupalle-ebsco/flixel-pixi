---
title: FlxAssetBackend (Interface)
description: API reference documentation for FlxAssetBackend in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Assets & Loading</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAssetBackend

Injectable subset of Pixi Assets used by the engine service.

```ts
export interface FlxAssetBackend
```

## Methods

### `add()`

```ts
add(asset: FlxAssetDescriptor | FlxAssetDescriptor[]): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `asset` | `FlxAssetDescriptor \| FlxAssetDescriptor[]` | - |

**Returns:** `void`

### `addBundle()`

```ts
addBundle(name: string, assets: FlxAssetDescriptor[]): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | - |
| `assets` | `FlxAssetDescriptor[]` | - |

**Returns:** `void`

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

### `get()`

```ts
get<T>(id: string): T | undefined
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | - |

**Returns:** `T | undefined`

### `init()`

```ts
init(options?: FlxAssetInitOptions): Promise<void>
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `options` | `FlxAssetInitOptions` | - |

**Returns:** `Promise<void>`

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

### `loadBundle()`

```ts
loadBundle<T>(name: string | string[], onProgress?: (progress: number) => void): Promise<T>
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `name` | `string \| string[]` | - |
| `onProgress` | `(progress: number) => void` | - |

**Returns:** `Promise<T>`

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

