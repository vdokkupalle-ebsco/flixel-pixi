---
title: FlxAnimationPlayOptions (Interface)
description: API reference documentation for FlxAnimationPlayOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Animation & Atlases</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAnimationPlayOptions

Options for `FlxSprite.play` when using the object-form overload.

```ts
export interface FlxAnimationPlayOptions
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`force`** | - | `boolean` | Force restart even if this animation is already playing. Default `false`. |
| **`frame`** | - | `number` | Starting frame number within the animation. Default `0`. |
| **`loop`** | - | `boolean` | Whether the animation loops. Default `false` for the options-object form. Use the legacy `addAnimation(name, frames, frameRate, looped)` call if you want looping to be the stored default. |
| **`reversed`** | - | `boolean` | Play frames in reverse order. Default `false`. |
| **`speed`** | - | `number` | Playback speed multiplier relative to the game update rate. `1` = one animation frame per update. Must be positive. Default `1`. |

