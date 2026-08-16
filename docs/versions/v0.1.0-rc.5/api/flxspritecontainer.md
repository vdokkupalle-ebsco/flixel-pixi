---
title: FlxSpriteContainer (Class)
description: API reference documentation for FlxSpriteContainer in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxSpriteContainer

Sprite composite whose backing group enforces exclusive ownership.

```ts
export declare class FlxSpriteContainer<T extends FlxSprite = FlxSprite> extends FlxSpriteGroup<T>
```

## Methods

### `createGroup()`

```ts
protected createGroup(maxSize: number): FlxContainer<T>
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `maxSize` | `number` | -           |

**Returns:** `FlxContainer<T>`
