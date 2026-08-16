---
title: FlxParticle (Class)
description: API reference documentation for FlxParticle in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxParticle

Sprite with lifespan and gravity-contact behavior for emitters.

```ts
export declare class FlxParticle extends FlxSprite
```

## Properties

| Property       | Modifiers | Type     | Description |
| :------------- | :-------- | :------- | :---------- |
| **`friction`** | -         | `number` | -           |
| **`lifespan`** | -         | `number` | -           |

## Methods

### `onEmit()`

```ts
onEmit(): void
```

Hook invoked after the emitter has reset all launch properties.

**Returns:** `void`

### `update()`

```ts
update(): void
```

**Returns:** `void`
