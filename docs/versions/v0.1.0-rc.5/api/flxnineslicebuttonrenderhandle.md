---
title: FlxNineSliceButtonRenderHandle (Class)
description: API reference documentation for FlxNineSliceButtonRenderHandle in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">UI & Typography</span>
  <span class="api-badge public">@public</span>
</div>

# FlxNineSliceButtonRenderHandle

Composite Pixi view for a 9-slice button background and optional label.

```ts
export declare class FlxNineSliceButtonRenderHandle implements FlxRenderHandle
```

## Constructors

```ts
constructor(owner: FlxNineSliceButton, onDestroy?: () => void)
```

Constructs a new instance of the `FlxNineSliceButtonRenderHandle` class

| Parameter   | Type                 | Description |
| :---------- | :------------------- | :---------- |
| `owner`     | `FlxNineSliceButton` | -           |
| `onDestroy` | `() => void`         | -           |

## Properties

| Property        | Modifiers  | Type                                          | Description |
| :-------------- | :--------- | :-------------------------------------------- | :---------- |
| **`destroyed`** | `readonly` | `boolean`                                     | -           |
| **`slice`**     | `readonly` | `NineSliceSprite`                             | -           |
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
