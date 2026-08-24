---
title: FlxPhysicsContact (Interface)
description: API reference documentation for FlxPhysicsContact in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxPhysicsContact

Normalized contact published after body synchronization.

```ts
export interface FlxPhysicsContact
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`bodyA`** | `readonly` | `FlxPhysicsBody` | - |
| **`bodyB`** | `readonly` | `FlxPhysicsBody` | - |
| **`depth`** | `readonly` | `number` | Maximum penetration depth in logical pixels. |
| **`fixtureA`** | `readonly` | `string` | - |
| **`fixtureB`** | `readonly` | `string` | - |
| **`id`** | `readonly` | `string` | - |
| **`normal`** | `readonly` | `FlxPhysicsVector` | - |
| **`objectA`** | `readonly` | `FlxObject` | - |
| **`objectB`** | `readonly` | `FlxObject` | - |
| **`phase`** | `readonly` | `FlxPhysicsContactPhase` | - |
| **`points`** | `readonly` | `readonly FlxPhysicsContactPoint[]` | - |
| **`sensor`** | `readonly` | `boolean` | - |

