---
title: FlxCameraHost (Interface)
description: API reference documentation for FlxCameraHost in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Rendering & Filters</span>
  <span class="api-badge public">@public</span>
</div>

# FlxCameraHost

Adapter hook used to mirror logical camera lifecycle into a renderer.

```ts
export interface FlxCameraHost
```

## Methods

### `addCamera()`

```ts
addCamera(camera: FlxCamera): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCamera` | - |

**Returns:** `void`

### `removeCamera()`

```ts
removeCamera(camera: FlxCamera): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCamera` | - |

**Returns:** `void`

### `snapshotCamera()`

```ts
snapshotCamera?(camera: FlxCamera): Promise<{ height: number; pixels: Uint8ClampedArray; width: number; }>
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCamera` | - |

**Returns:** `Promise<{ height: number; pixels: Uint8ClampedArray; width: number; }>`

