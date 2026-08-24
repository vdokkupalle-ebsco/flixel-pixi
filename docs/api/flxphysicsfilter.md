---
title: FlxPhysicsFilter (Interface)
description: API reference documentation for FlxPhysicsFilter in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxPhysicsFilter

Collision filtering shared by bodies, shapes, contacts, and queries.

```ts
export interface FlxPhysicsFilter
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`category`** | `readonly` | `number` | Category bits owned by this fixture. Defaults to `1`. |
| **`group`** | `readonly` | `number` | Optional solver collision group. Defaults to `0`. |
| **`mask`** | `readonly` | `number` | Category bits this fixture accepts. Defaults to all 16 bits. |

