---
title: FlxAtlasAssetSource (Interface)
description: API reference documentation for FlxAtlasAssetSource in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Animation & Atlases</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAtlasAssetSource

Already-loaded asset aliases used to construct a non-owning atlas.

```ts
export interface FlxAtlasAssetSource
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`image`** | - | `string` | Alias of a Pixi `Texture` already present in `FlxAssets`. |
| **`meta`** | - | `string \| FlxAtlasGridMeta` | Alias of loaded JSON/XML metadata, or inline fixed-grid dimensions. |

