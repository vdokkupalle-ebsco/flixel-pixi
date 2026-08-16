---
title: FlxStripGeometry (Interface)
description: API reference documentation for FlxStripGeometry in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxStripGeometry

Geometry accepted by [link](#).

```ts
export interface FlxStripGeometry
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`indices`** | `readonly` | `ArrayLike<number>` | Vertex indices. Defaults to sequential indices when omitted. |
| **`topology`** | `readonly` | `FlxStripTopology` | Triangle connectivity. Defaults to `triangle-list`. |
| **`uvs`** | `readonly` | `ArrayLike<number>` | Normalized u/v pairs; length must equal `vertices.length`. |
| **`vertices`** | `readonly` | `ArrayLike<number>` | Local x/y pairs. At least three vertices are required. |

