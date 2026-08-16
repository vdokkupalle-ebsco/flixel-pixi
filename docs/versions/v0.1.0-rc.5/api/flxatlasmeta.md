---
title: FlxAtlasMeta (TypeAlias)
description: API reference documentation for FlxAtlasMeta in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-typealias">TypeAlias</span>
  <span class="api-badge category">Animation & Atlases</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAtlasMeta

Third argument to [link](#). - A string ending in `.json` (or whose content parses as JSON) → TexturePacker/Pixi JSON. - A string ending in `.xml` (or any other string) → TextureAtlas XML. - A `FlxAtlasGridMeta` object → uniform fixed-size grid.

```ts
export type FlxAtlasMeta = string | FlxAtlasGridMeta;
```
