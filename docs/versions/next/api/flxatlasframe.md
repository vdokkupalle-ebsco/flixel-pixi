---
title: FlxAtlasFrame (Interface)
description: API reference documentation for FlxAtlasFrame in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Animation & Atlases</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAtlasFrame

A named region inside a shared atlas texture. `index` is the stable 0-based insertion order within this atlas.

```ts
export interface FlxAtlasFrame
```

## Properties

| Property       | Modifiers  | Type      | Description                                                       |
| :------------- | :--------- | :-------- | :---------------------------------------------------------------- |
| **`duration`** | `readonly` | `number`  | Optional display duration in seconds supplied by source metadata. |
| **`index`**    | `readonly` | `number`  | 0-based position in insertion order.                              |
| **`name`**     | `readonly` | `string`  | -                                                                 |
| **`texture`**  | `readonly` | `Texture` | Pixi sub-texture view into the shared atlas source.               |
