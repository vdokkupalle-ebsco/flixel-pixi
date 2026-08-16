---
title: FlxAnim (Class)
description: API reference documentation for FlxAnim in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Animation & Atlases</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAnim

Named frame sequence used by `FlxSprite`.

```ts
export declare class FlxAnim
```

## Constructors

```ts
constructor(name: string, frames: readonly number[], frameRate?: number, looped?: boolean, defaultSpeed?: number, flipX?: boolean, flipY?: boolean)
```

Constructs a new instance of the `FlxAnim` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | - |
| `frames` | `readonly number[]` | - |
| `frameRate` | `number` | - |
| `looped` | `boolean` | - |
| `defaultSpeed` | `number` | - |
| `flipX` | `boolean` | - |
| `flipY` | `boolean` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`curFrame`** | - | `number` | - |
| **`defaultLooped`** | `readonly` | `boolean` | Default loop flag recorded at `addAnimation` time. Used by `play(name)` (no options) to restore the legacy 4-arg behaviour. |
| **`defaultSpeed`** | `readonly` | `number` | Default playback speed multiplier recorded at `addAnimation` time. 1 = one animation frame per game update; stored for option-less `play`. |
| **`delay`** | `readonly` | `number` | - |
| **`finished`** | - | `boolean` | - |
| **`flipX`** | - | `boolean` | - |
| **`flipY`** | - | `boolean` | - |
| **`frameDuration`** | - | `number` | - |
| **`frameRate`** | - | `number` | - |
| **`frames`** | - | `number[]` | - |
| **`looped`** | - | `boolean` | - |
| **`loopPoint`** | - | `number` | - |
| **`name`** | - | `string` | - |
| **`numFrames`** | `readonly` | `number` | - |
| **`paused`** | - | `boolean` | - |
| **`reversed`** | - | `boolean` | - |
| **`timeScale`** | - | `number` | - |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

