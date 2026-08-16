---
title: FlxSpriteGroupRenderHandle (Class)
description: API reference documentation for FlxSpriteGroupRenderHandle in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxSpriteGroupRenderHandle

Adapter-owned Pixi container branch for one logical sprite composite.

```ts
export declare class FlxSpriteGroupRenderHandle implements FlxRenderHandle
```

## Constructors

```ts
constructor(owner: FlxSpriteGroup, onDestroy?: () => void)
```

Constructs a new instance of the `FlxSpriteGroupRenderHandle` class

| Parameter   | Type             | Description |
| :---------- | :--------------- | :---------- |
| `owner`     | `FlxSpriteGroup` | -           |
| `onDestroy` | `() => void`     | -           |

## Properties

| Property                | Modifiers  | Type                                          | Description                                                      |
| :---------------------- | :--------- | :-------------------------------------------- | :--------------------------------------------------------------- |
| **`destroyed`**         | `readonly` | `boolean`                                     | -                                                                |
| **`memberHandleCount`** | `readonly` | `number`                                      | Number of direct member branches currently owned by this handle. |
| **`view`**              | `readonly` | `Container<import("pixi.js").ContainerChild>` | -                                                                |

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
