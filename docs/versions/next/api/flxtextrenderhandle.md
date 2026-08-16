---
title: FlxTextRenderHandle (Class)
description: API reference documentation for FlxTextRenderHandle in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">UI & Typography</span>
  <span class="api-badge public">@public</span>
</div>

# FlxTextRenderHandle

Pixi text leaf wrapped by a transform-owning container.

```ts
export declare class FlxTextRenderHandle implements FlxRenderHandle
```

## Constructors

```ts
constructor(owner: FlxText, onDestroy?: () => void)
```

Constructs a new instance of the `FlxTextRenderHandle` class

| Parameter   | Type         | Description |
| :---------- | :----------- | :---------- |
| `owner`     | `FlxText`    | -           |
| `onDestroy` | `() => void` | -           |

## Properties

| Property        | Modifiers  | Type              | Description |
| :-------------- | :--------- | :---------------- | :---------- |
| **`destroyed`** | `readonly` | `boolean`         | -           |
| **`textNode`**  | `readonly` | `FlxPixiTextNode` | -           |
| **`view`**      | `readonly` | `Container`       | -           |

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
