---
title: FlxBackdropRenderHandle (Class)
description: API reference documentation for FlxBackdropRenderHandle in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxBackdropRenderHandle

Pixi tiling-sprite projection for one [link](#).

```ts
export declare class FlxBackdropRenderHandle implements FlxRenderHandle
```

## Constructors

```ts
constructor(owner: FlxBackdrop, onDestroy?: () => void)
```

Constructs a new instance of the `FlxBackdropRenderHandle` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `owner` | `FlxBackdrop` | - |
| `onDestroy` | `() => void` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`destroyed`** | `readonly` | `boolean` | - |
| **`tiling`** | `readonly` | `TilingSprite` | - |
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

