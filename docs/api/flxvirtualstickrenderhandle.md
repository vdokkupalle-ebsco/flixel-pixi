---
title: FlxVirtualStickRenderHandle (Class)
description: API reference documentation for FlxVirtualStickRenderHandle in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Input & Controls</span>
  <span class="api-badge public">@public</span>
</div>

# FlxVirtualStickRenderHandle

Pixi projection for a texture-free virtual analog stick.

```ts
export declare class FlxVirtualStickRenderHandle implements FlxRenderHandle
```

## Constructors

```ts
constructor(owner: FlxVirtualStick, onDestroy?: () => void)
```

Constructs a new instance of the `FlxVirtualStickRenderHandle` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `owner` | `FlxVirtualStick` | - |
| `onDestroy` | `() => void` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`base`** | `readonly` | `Graphics` | - |
| **`destroyed`** | `readonly` | `boolean` | - |
| **`knob`** | `readonly` | `Graphics` | - |
| **`view`** | `readonly` | `Container<import("pixi.js").ContainerChild>` | - |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `sync()`

```ts
sync(camera?: FlxCamera, interpolationAlpha?: number): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCamera` | - |
| `interpolationAlpha` | `number` | - |

**Returns:** `void`

