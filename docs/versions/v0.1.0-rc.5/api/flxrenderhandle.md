---
title: FlxRenderHandle (Interface)
description: API reference documentation for FlxRenderHandle in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Rendering & Filters</span>
  <span class="api-badge public">@public</span>
</div>

# FlxRenderHandle

Adapter-owned Pixi view synchronized from an authoritative Flixel object.

```ts
export interface FlxRenderHandle
```

## Properties

| Property        | Modifiers  | Type        | Description |
| :-------------- | :--------- | :---------- | :---------- |
| **`destroyed`** | `readonly` | `boolean`   | -           |
| **`view`**      | `readonly` | `Container` | -           |

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

Project authoritative state into the view for one camera and render alpha.

**Parameters:**

| Parameter            | Type        | Description |
| :------------------- | :---------- | :---------- |
| `camera`             | `FlxCamera` | -           |
| `interpolationAlpha` | `number`    | -           |

**Returns:** `void`
