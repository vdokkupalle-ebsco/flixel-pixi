---
title: FlxCameraRenderer (Class)
description: API reference documentation for FlxCameraRenderer in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Rendering & Filters</span>
  <span class="api-badge public">@public</span>
</div>

# FlxCameraRenderer

Pixi render-texture adapter for one logical world and any number of cameras.

```ts
export declare class FlxCameraRenderer implements FlxCameraHost
```

## Constructors

```ts
constructor(renderer: Renderer, outputStage: Container, context: FlxContext)
```

Constructs a new instance of the `FlxCameraRenderer` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `renderer` | `Renderer` | - |
| `outputStage` | `Container` | - |
| `context` | `FlxContext` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`cameraCount`** | `readonly` | `number` | - |
| **`debugBounds`** | - | `boolean` | - |
| **`destroyed`** | `readonly` | `boolean` | - |
| **`registeredObjectCount`** | `readonly` | `number` | - |
| **`registeredObjects`** | `readonly` | `IterableIterator<FlxSprite \| FlxTilemap \| FlxEmitter>` | - |
| **`renderTargetBytes`** | `readonly` | `number` | - |
| **`selectedObject`** | - | `FlxObject \| null` | - |

## Methods

### `add()`

```ts
add(object: FlxSprite | FlxTilemap | FlxEmitter, emitterOptions?: FlxEmitterRenderOptions): FlxRenderHandle
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `object` | `FlxSprite \| FlxTilemap \| FlxEmitter` | - |
| `emitterOptions` | `FlxEmitterRenderOptions` | - |

**Returns:** `FlxRenderHandle`

### `addCamera()`

```ts
addCamera(camera: FlxCamera): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCamera` | - |

**Returns:** `void`

### `clearObjects()`

```ts
clearObjects(): void
```

**Returns:** `void`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `getCameraView()`

```ts
getCameraView(camera: FlxCamera): FlxCameraView | null
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCamera` | - |

**Returns:** `FlxCameraView | null`

### `pickObject()`

```ts
pickObject(point: Readonly<PointLike>): FlxCameraObjectPick | null
```

Picks the topmost registered object at a logical screen coordinate.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `point` | `Readonly<PointLike>` | - |

**Returns:** `FlxCameraObjectPick | null`

### `remove()`

```ts
remove(object: FlxSprite | FlxTilemap | FlxEmitter, destroyHandle?: boolean): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `object` | `FlxSprite \| FlxTilemap \| FlxEmitter` | - |
| `destroyHandle` | `boolean` | - |

**Returns:** `boolean`

### `removeCamera()`

```ts
removeCamera(camera: FlxCamera): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCamera` | - |

**Returns:** `void`

### `render()`

```ts
render(cameras?: readonly FlxCamera[], interpolationAlpha?: number): void
```

Render selected cameras, optionally between their previous and current fixed states.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `cameras` | `readonly FlxCamera[]` | - |
| `interpolationAlpha` | `number` | - |

**Returns:** `void`

### `resize()`

```ts
resize(resolution?: number): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `resolution` | `number` | - |

**Returns:** `void`

### `snapshotCamera()`

```ts
snapshotCamera(camera: FlxCamera): Promise<{ height: number; pixels: Uint8ClampedArray; width: number; }>
```

Asynchronously extracts rendered RGBA pixel data for a camera.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCamera` | - |

**Returns:** `Promise<{ height: number; pixels: Uint8ClampedArray; width: number; }>`

