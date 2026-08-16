---
title: FlxStrip (Class)
description: API reference documentation for FlxStrip in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxStrip

Textured triangle geometry with Flixel object/camera semantics.

Geometry inputs are cloned. Prefer [link](#) / [link](#) for animation. If you mutate a typed-array view directly, call [link](#) once after the edits.

```ts
export declare class FlxStrip extends FlxSprite
```

## Constructors

```ts
constructor(x?: number, y?: number, simpleGraphic?: FlxGraphic | Texture | null)
```

Constructs a new instance of the `FlxStrip` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `x` | `number` | - |
| `y` | `number` | - |
| `simpleGraphic` | `FlxGraphic \| Texture \| null` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`geometryRevision`** | `readonly` | `number` | Monotonic version used by camera-local render adapters. |
| **`indices`** | `readonly` | `Uint32Array` | Mutable triangle indices. Call `invalidateGeometry()` after direct edits. |
| **`topology`** | `readonly` | `FlxStripTopology` | - |
| **`uvs`** | `readonly` | `Float32Array` | Mutable normalized u/v storage. Call `invalidateGeometry()` after direct edits. |
| **`vertices`** | `readonly` | `Float32Array` | Mutable local x/y storage. Call `invalidateGeometry()` after direct edits. |

## Methods

### `createRenderHandle()`

```ts
createRenderHandle(): FlxRenderHandle
```

**Returns:** `FlxRenderHandle`

### `invalidateGeometry()`

```ts
invalidateGeometry(): this
```

Mark direct typed-array edits for upload on the next render sync.

**Returns:** `this`

### `onScreen()`

```ts
onScreen(camera?: FlxCameraLike): boolean
```

Cull against transformed geometry; collision bounds remain independent.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCameraLike` | - |

**Returns:** `boolean`

### `setGeometry()`

```ts
setGeometry(geometry: FlxStripGeometry): this
```

Validate, clone, and replace all triangle geometry.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `geometry` | `FlxStripGeometry` | - |

**Returns:** `this`

### `setUv()`

```ts
setUv(index: number, u: number, v: number): this
```

Update one normalized texture coordinate and notify every camera adapter.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `index` | `number` | - |
| `u` | `number` | - |
| `v` | `number` | - |

**Returns:** `this`

### `setVertex()`

```ts
setVertex(index: number, x: number, y: number): this
```

Update one local vertex and notify every camera adapter.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `index` | `number` | - |
| `x` | `number` | - |
| `y` | `number` | - |

**Returns:** `this`

