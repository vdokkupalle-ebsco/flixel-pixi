---
title: FlxDisplacementFilterOptions (Interface)
description: API reference documentation for FlxDisplacementFilterOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Rendering & Filters</span>
  <span class="api-badge public">@public</span>
</div>

# FlxDisplacementFilterOptions

Options for [link](#).

```ts
export interface FlxDisplacementFilterOptions
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`offset`** | `readonly` | `FlxDisplacementPoint` | Normalized map-texture offset. Defaults to `{ x: 0, y: 0 }`. |
| **`padding`** | `readonly` | `number` | Extra logical pixels rendered around the object. Defaults to the scale. |
| **`repeat`** | `readonly` | `boolean` | Repeat the map outside its normalized bounds. Defaults to true. |
| **`scale`** | `readonly` | `number \| FlxDisplacementPoint` | Pixel displacement; a number applies equally to both axes. Defaults to 20. |

