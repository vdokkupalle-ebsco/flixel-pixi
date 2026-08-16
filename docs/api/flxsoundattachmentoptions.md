---
title: FlxSoundAttachmentOptions (Interface)
description: API reference documentation for FlxSoundAttachmentOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Audio System</span>
  <span class="api-badge public">@public</span>
</div>

# FlxSoundAttachmentOptions

Configuration for [link](#).

```ts
export interface FlxSoundAttachmentOptions
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`cameras`** | - | `readonly FlxCameraLike[]` | Override the source object's cameras for visibility checks. |
| **`listener`** | - | `FlxObject` | Object used as the center of hearing, normally the player. |
| **`margin`** | - | `number` | Extra logical pixels beyond the viewport before suspending. Defaults to 0. |
| **`offscreen`** | - | `FlxSoundOffscreenBehavior` | Pause in place or stop/restart after leaving the viewport. Defaults to `pause`. |
| **`pan`** | - | `boolean` | Apply player-relative left/right stereo panning. Defaults to true. |
| **`radius`** | - | `number` | Maximum audible distance in logical world units. |
| **`viewport`** | - | `'ignore' \| 'visible'` | Gate playback by camera visibility. Defaults to `visible`. |

