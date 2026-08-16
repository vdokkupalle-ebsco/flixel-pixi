---
title: FlxContext (Class)
description: API reference documentation for FlxContext in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Core & Lifecycle</span>
  <span class="api-badge public">@public</span>
</div>

# FlxContext

Explicit owner of mutable engine state and replaceable services.

```ts
export declare class FlxContext
```

## Constructors

```ts
constructor(width: number, height: number, seed?: number)
```

Constructs a new instance of the `FlxContext` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `width` | `number` | - |
| `height` | `number` | - |
| `seed` | `number` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`camera`** | - | `FlxCamera` | - |
| **`cameras`** | `readonly` | `FlxCamera[]` | - |
| **`elapsed`** | - | `number` | - |
| **`height`** | `readonly` | `number` | - |
| **`level`** | - | `number` | - |
| **`levels`** | `readonly` | `unknown[]` | - |
| **`paused`** | - | `boolean` | - |
| **`plugins`** | `readonly` | `FlxBasic[]` | - |
| **`randomSource`** | `readonly` | `FlxRandom` | - |
| **`renderablesDirty`** | - | `boolean` | When true, browser boot should re-run [link](#). Cleared after a successful sync. Group membership changes set this. |
| **`score`** | - | `number` | - |
| **`scores`** | `readonly` | `unknown[]` | AS3-compatible cross-state values; individual games define their shape. |
| **`state`** | `readonly` | `FlxState \| null` | - |
| **`timeScale`** | - | `number` | - |
| **`updateFramerate`** | - | `number` | Fixed update rate of the active [link](#) (updates per second). Defaults to 60 before a game attaches; [link](#) overwrites this. |
| **`visualDebug`** | - | `boolean` | - |
| **`width`** | `readonly` | `number` | - |
| **`worldBounds`** | - | `FlxRect` | - |
| **`worldDivisions`** | - | `number` | - |

## Methods

### `addCamera()`

```ts
addCamera(camera: FlxCamera): FlxCamera
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCamera` | - |

**Returns:** `FlxCamera`

### `addPlugin()`

```ts
addPlugin<T extends FlxBasic>(plugin: T): T
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `plugin` | `T` | - |

**Returns:** `T`

### `attachRuntime()`

```ts
attachRuntime(runtime: FlxStateRuntime): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `runtime` | `FlxStateRuntime` | - |

**Returns:** `void`

### `clearRenderablesDirty()`

```ts
clearRenderablesDirty(): void
```

Clear the renderables dirty flag after syncing.

**Returns:** `void`

### `clearServices()`

```ts
clearServices(): void
```

**Returns:** `void`

### `destroyPlugins()`

```ts
destroyPlugins(): void
```

**Returns:** `void`

### `detachRuntime()`

```ts
detachRuntime(runtime: FlxStateRuntime): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `runtime` | `FlxStateRuntime` | - |

**Returns:** `void`

### `drawPlugins()`

```ts
drawPlugins(): void
```

**Returns:** `void`

### `getPlugin()`

```ts
getPlugin<T extends FlxBasic>(pluginClass: abstract new (...args: never[]) => T): T | null
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `pluginClass` | `abstract new (...args: never[]) => T` | - |

**Returns:** `T | null`

### `getService()`

```ts
getService<T>(token: symbol): T | undefined
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `token` | `symbol` | - |

**Returns:** `T | undefined`

### `markRenderablesDirty()`

```ts
markRenderablesDirty(): void
```

Mark the active world's renderable membership as needing a renderer sync.

**Returns:** `void`

### `removeCamera()`

```ts
removeCamera(camera: FlxCamera, destroy?: boolean): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCamera` | - |
| `destroy` | `boolean` | - |

**Returns:** `boolean`

### `removePlugin()`

```ts
removePlugin<T extends FlxBasic>(plugin: T): T
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `plugin` | `T` | - |

**Returns:** `T`

### `removePluginType()`

```ts
removePluginType<T extends FlxBasic>(pluginClass: abstract new (...args: never[]) => T): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `pluginClass` | `abstract new (...args: never[]) => T` | - |

**Returns:** `boolean`

### `removeService()`

```ts
removeService(token: symbol): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `token` | `symbol` | - |

**Returns:** `boolean`

### `requestState()`

```ts
requestState(state: FlxState): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `state` | `FlxState` | - |

**Returns:** `void`

### `resetCameras()`

```ts
resetCameras(camera?: FlxCamera): FlxCamera
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCamera` | - |

**Returns:** `FlxCamera`

### `resetState()`

```ts
resetState(): void
```

**Returns:** `void`

### `setPrimaryCamera()`

```ts
setPrimaryCamera(camera: FlxCamera): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCamera` | - |

**Returns:** `void`

### `setService()`

```ts
setService<T>(token: symbol, service: T): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `token` | `symbol` | - |
| `service` | `T` | - |

**Returns:** `void`

### `updateCameras()`

```ts
updateCameras(): void
```

**Returns:** `void`

### `updatePlugins()`

```ts
updatePlugins(): void
```

**Returns:** `void`

