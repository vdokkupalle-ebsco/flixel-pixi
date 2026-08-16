---
title: DebugPathDisplay (Class)
description: API reference documentation for DebugPathDisplay in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# DebugPathDisplay

Plugin that owns path-debug registration and Pixi geometry projection.

```ts
export declare class DebugPathDisplay extends FlxBasic
```

## Constructors

```ts
constructor()
```

Constructs a new instance of the `DebugPathDisplay` class

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`pathCount`** | `readonly` | `number` | - |

## Methods

### `add()`

```ts
add(path: FlxPath): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `path` | `FlxPath` | - |

**Returns:** `void`

### `clear()`

```ts
clear(): void
```

**Returns:** `void`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `drawTo()`

```ts
drawTo(graphics: Graphics, camera: FlxCamera): void
```

Draws registered paths into an adapter-owned, camera-local layer.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `graphics` | `Graphics` | - |
| `camera` | `FlxCamera` | - |

**Returns:** `void`

### `remove()`

```ts
remove(path: FlxPath): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `path` | `FlxPath` | - |

**Returns:** `void`

