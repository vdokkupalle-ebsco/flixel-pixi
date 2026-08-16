---
title: FlxBarRenderHandle (Class)
description: API reference documentation for FlxBarRenderHandle in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">UI & Typography</span>
  <span class="api-badge public">@public</span>
</div>

# FlxBarRenderHandle

Pixi projection for a texture-free [link](#).

```ts
export declare class FlxBarRenderHandle implements FlxRenderHandle
```

## Constructors

```ts
constructor(owner: FlxBar, onDestroy?: () => void)
```

Constructs a new instance of the `FlxBarRenderHandle` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `owner` | `FlxBar` | - |
| `onDestroy` | `() => void` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`background`** | `readonly` | `Sprite` | - |
| **`border`** | `readonly` | `Graphics` | - |
| **`destroyed`** | `readonly` | `boolean` | - |
| **`fill`** | `readonly` | `Sprite` | - |
| **`secondaryFill`** | `readonly` | `Sprite` | - |
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

