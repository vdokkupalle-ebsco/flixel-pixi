---
title: FlxPhysicsBackendContact (Interface)
description: API reference documentation for FlxPhysicsBackendContact in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxPhysicsBackendContact

Contact emitted by a backend before Flixel object binding.

```ts
export interface FlxPhysicsBackendContact
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`bodyA`** | `readonly` | `FlxPhysicsBackendBody` | - |
| **`bodyB`** | `readonly` | `FlxPhysicsBackendBody` | - |
| **`fixtureA`** | `readonly` | `string` | - |
| **`fixtureB`** | `readonly` | `string` | - |
| **`id`** | `readonly` | `string` | - |
| **`normal`** | `readonly` | `FlxPhysicsVector` | - |
| **`phase`** | `readonly` | `FlxPhysicsContactPhase` | - |
| **`points`** | `readonly` | `readonly FlxPhysicsContactPoint[]` | - |
| **`sensor`** | `readonly` | `boolean` | - |

