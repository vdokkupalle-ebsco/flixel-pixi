---
title: FlxAtlasFrameRect (Interface)
description: API reference documentation for FlxAtlasFrameRect in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Animation & Atlases</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAtlasFrameRect

Raw axis-aligned bounding rect for one atlas sub-image. Produced by the three parsers; consumed by FlxAtlas to build textures.

```ts
export interface FlxAtlasFrameRect
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`height`** | `readonly` | `number` | - |
| **`name`** | `readonly` | `string` | - |
| **`rotated`** | `readonly` | `boolean` | Whether TexturePacker stored the pixels rotated 90 degrees clockwise. |
| **`sourceHeight`** | `readonly` | `number` | Logical untrimmed source height, when transparent padding was removed. |
| **`sourceWidth`** | `readonly` | `number` | Logical untrimmed source width, when transparent padding was removed. |
| **`trimHeight`** | `readonly` | `number` | Logical height of the trimmed pixels. |
| **`trimWidth`** | `readonly` | `number` | Logical width of the trimmed pixels. |
| **`trimX`** | `readonly` | `number` | Horizontal placement of the trimmed pixels in the logical source. |
| **`trimY`** | `readonly` | `number` | Vertical placement of the trimmed pixels in the logical source. |
| **`width`** | `readonly` | `number` | - |
| **`x`** | `readonly` | `number` | - |
| **`y`** | `readonly` | `number` | - |

