---
title: FlxSpriteRenderHandle (Class)
description: API reference documentation for FlxSpriteRenderHandle in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxSpriteRenderHandle

Pixi container/sprite pair synchronized from one `FlxSprite`.

```ts
export declare class FlxSpriteRenderHandle implements FlxRenderHandle
```

## Constructors

```ts
constructor(owner: FlxSprite, onDestroy?: () => void)
```

Constructs a new instance of the `FlxSpriteRenderHandle` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `owner` | `FlxSprite` | - |
| `onDestroy` | `() => void` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`destroyed`** | `readonly` | `boolean` | - |
| **`sprite`** | `readonly` | `Sprite` | - |
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

