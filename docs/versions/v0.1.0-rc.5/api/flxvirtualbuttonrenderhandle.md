---
title: FlxVirtualButtonRenderHandle (Class)
description: API reference documentation for FlxVirtualButtonRenderHandle in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Input & Controls</span>
  <span class="api-badge public">@public</span>
</div>

# FlxVirtualButtonRenderHandle

Texture-free Pixi projection for one [link](#).

```ts
export declare class FlxVirtualButtonRenderHandle implements FlxRenderHandle
```

## Constructors

```ts
constructor(owner: FlxVirtualButton, onDestroy?: () => void)
```

Constructs a new instance of the `FlxVirtualButtonRenderHandle` class

| Parameter   | Type               | Description |
| :---------- | :----------------- | :---------- |
| `owner`     | `FlxVirtualButton` | -           |
| `onDestroy` | `() => void`       | -           |

## Properties

| Property         | Modifiers  | Type                                          | Description |
| :--------------- | :--------- | :-------------------------------------------- | :---------- |
| **`background`** | `readonly` | `Graphics`                                    | -           |
| **`destroyed`**  | `readonly` | `boolean`                                     | -           |
| **`view`**       | `readonly` | `Container<import("pixi.js").ContainerChild>` | -           |

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
