---
title: FlxNineSliceRenderHandle (Class)
description: API reference documentation for FlxNineSliceRenderHandle in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">UI & Typography</span>
  <span class="api-badge public">@public</span>
</div>

# FlxNineSliceRenderHandle

Pixi 9-slice projection for one [link](#).

```ts
export declare class FlxNineSliceRenderHandle implements FlxRenderHandle
```

## Constructors

```ts
constructor(owner: FlxNineSliceSprite, onDestroy?: () => void)
```

Constructs a new instance of the `FlxNineSliceRenderHandle` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `owner` | `FlxNineSliceSprite` | - |
| `onDestroy` | `() => void` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`destroyed`** | `readonly` | `boolean` | - |
| **`slice`** | `readonly` | `NineSliceSprite` | - |
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

