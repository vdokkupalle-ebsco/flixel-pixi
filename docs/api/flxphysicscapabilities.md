---
title: FlxPhysicsCapabilities (Interface)
description: API reference documentation for FlxPhysicsCapabilities in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxPhysicsCapabilities

Immutable feature report for one physics backend.

```ts
export interface FlxPhysicsCapabilities
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`continuousCollision`** | `readonly` | `boolean` | - |
| **`debugGeometry`** | `readonly` | `boolean` | - |
| **`deterministicReplay`** | `readonly` | `boolean` | - |
| **`joints`** | `readonly` | `readonly FlxPhysicsJointType[]` | - |
| **`queries`** | `readonly` | `readonly FlxPhysicsQueryCapability[]` | - |
| **`shapes`** | `readonly` | `readonly FlxPhysicsShapeCapability[]` | - |
| **`sleeping`** | `readonly` | `boolean` | - |

