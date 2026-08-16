---
title: FlxGraphicsRenderHandle (Class)
description: API reference documentation for FlxGraphicsRenderHandle in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxGraphicsRenderHandle

Camera-local Pixi materialization of stable vector commands.

```ts
export declare class FlxGraphicsRenderHandle implements FlxRenderHandle
```

## Constructors

```ts
constructor(owner: FlxGraphics, onDestroy?: () => void)
```

Constructs a new instance of the `FlxGraphicsRenderHandle` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `owner` | `FlxGraphics` | - |
| `onDestroy` | `() => void` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`destroyed`** | `readonly` | `boolean` | - |
| **`graphics`** | `readonly` | `Graphics` | - |
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

