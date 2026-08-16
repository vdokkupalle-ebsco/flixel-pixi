---
title: FlxRadialGradientOptions (Interface)
description: API reference documentation for FlxRadialGradientOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxRadialGradientOptions

Local normalized options for a radial gradient.

```ts
export interface FlxRadialGradientOptions
```

## Properties

| Property          | Modifiers  | Type        | Description                                                         |
| :---------------- | :--------- | :---------- | :------------------------------------------------------------------ |
| **`center`**      | `readonly` | `PointLike` | Normalized local inner-circle center. Defaults to the shape center. |
| **`innerRadius`** | `readonly` | `number`    | Normalized inner radius. Defaults to `0`.                           |
| **`outerCenter`** | `readonly` | `PointLike` | Normalized local outer-circle center. Defaults to `center`.         |
| **`outerRadius`** | `readonly` | `number`    | Normalized outer radius. Defaults to `0.5`.                         |
