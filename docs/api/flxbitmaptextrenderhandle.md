---
title: FlxBitmapTextRenderHandle (Class)
description: API reference documentation for FlxBitmapTextRenderHandle in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">UI & Typography</span>
  <span class="api-badge public">@public</span>
</div>

# FlxBitmapTextRenderHandle

Pixi `BitmapText` projection for one [link](#).

```ts
export declare class FlxBitmapTextRenderHandle implements FlxRenderHandle
```

## Constructors

```ts
constructor(owner: FlxBitmapText, onDestroy?: () => void)
```

Constructs a new instance of the `FlxBitmapTextRenderHandle` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `owner` | `FlxBitmapText` | - |
| `onDestroy` | `() => void` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`destroyed`** | `readonly` | `boolean` | - |
| **`textNode`** | `readonly` | `BitmapText` | - |
| **`view`** | `readonly` | `Container` | - |

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

