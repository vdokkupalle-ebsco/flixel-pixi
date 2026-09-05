---
title: parseTextureAtlasXml (Function)
description: API reference documentation for parseTextureAtlasXml in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-function">Function</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# parseTextureAtlasXml

Parse a TextureAtlas XML string (Kenney / LibGDX / Shoebox format) into an ordered array of frame rects.

Supports Sparrow/Kenney `SubTexture` entries and TexturePacker-style `sprite` entries. Frame names may use `name` or `n`, and dimensions may use `width`/`height` or `w`/`h`. Throws if no supported frame elements are found.

```ts
export declare function parseTextureAtlasXml(xmlText: string): FlxAtlasFrameRect[]
```

## Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `xmlText` | `string` | - |

## Returns

`FlxAtlasFrameRect[]`

