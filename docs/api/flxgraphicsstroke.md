---
title: FlxGraphicsStroke (Interface)
description: API reference documentation for FlxGraphicsStroke in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxGraphicsStroke

Renderer-neutral vector stroke style.

```ts
export interface FlxGraphicsStroke
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`alignment`** | `readonly` | `number` | Stroke placement: `0` outside, `0.5` centered, `1` inside. |
| **`cap`** | `readonly` | `'butt' \| 'round' \| 'square'` | Open-line end shape. |
| **`fill`** | `readonly` | `FlxGraphicsFill` | Packed `0xRRGGBBAA` color or local gradient. |
| **`join`** | `readonly` | `'bevel' \| 'miter' \| 'round'` | Connected-segment corner shape. |
| **`width`** | `readonly` | `number` | Positive logical-pixel stroke width. |

