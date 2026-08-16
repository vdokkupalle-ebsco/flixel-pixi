---
title: FlxBmFontData (Interface)
description: API reference documentation for FlxBmFontData in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">UI & Typography</span>
  <span class="api-badge public">@public</span>
</div>

# FlxBmFontData

Parsed AngelCode / BMFont XML payload for Pixi `BitmapFont`.

```ts
export interface FlxBmFontData
```

## Properties

| Property             | Modifiers | Type                                                                                                                                                                                                      | Description |
| :------------------- | :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------- |
| **`baseLineOffset`** | -         | `number`                                                                                                                                                                                                  | -           |
| **`chars`**          | -         | `Record<string, { id: number; kerning: Record<string, number>; letter: string; page: number; width: number; height: number; x: number; xAdvance: number; xOffset: number; y: number; yOffset: number; }>` | -           |
| **`distanceField`**  | -         | `{ range: number; type: 'none' \| 'sdf' \| 'msdf'; }`                                                                                                                                                     | -           |
| **`fontFamily`**     | -         | `string`                                                                                                                                                                                                  | -           |
| **`fontSize`**       | -         | `number`                                                                                                                                                                                                  | -           |
| **`lineHeight`**     | -         | `number`                                                                                                                                                                                                  | -           |
| **`pages`**          | -         | `{ id: number; file: string; }[]`                                                                                                                                                                         | -           |
