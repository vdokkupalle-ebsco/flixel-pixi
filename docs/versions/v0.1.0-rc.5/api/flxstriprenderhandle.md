---
title: FlxStripRenderHandle (Class)
description: API reference documentation for FlxStripRenderHandle in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxStripRenderHandle

Camera-local Pixi materialization of renderer-neutral strip geometry.

```ts
export declare class FlxStripRenderHandle implements FlxRenderHandle
```

## Constructors

```ts
constructor(owner: FlxStrip, onDestroy?: () => void)
```

Constructs a new instance of the `FlxStripRenderHandle` class

| Parameter   | Type         | Description |
| :---------- | :----------- | :---------- |
| `owner`     | `FlxStrip`   | -           |
| `onDestroy` | `() => void` | -           |

## Properties

| Property        | Modifiers  | Type                                          | Description |
| :-------------- | :--------- | :-------------------------------------------- | :---------- |
| **`destroyed`** | `readonly` | `boolean`                                     | -           |
| **`mesh`**      | `readonly` | `Mesh<MeshGeometry>`                          | -           |
| **`view`**      | `readonly` | `Container<import("pixi.js").ContainerChild>` | -           |

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

| Parameter            | Type        | Description |
| :------------------- | :---------- | :---------- |
| `camera`             | `FlxCamera` | -           |
| `interpolationAlpha` | `number`    | -           |

**Returns:** `void`
