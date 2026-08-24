---
title: FlxPhysicsDistanceJointDefinition (Interface)
description: API reference documentation for FlxPhysicsDistanceJointDefinition in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxPhysicsDistanceJointDefinition

Keeps two world-space anchor points at a configured distance.

```ts
export interface FlxPhysicsDistanceJointDefinition extends FlxPhysicsJointDefinitionBase
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`anchorA`** | `readonly` | `FlxPhysicsVector` | - |
| **`anchorB`** | `readonly` | `FlxPhysicsVector` | - |
| **`dampingRatio`** | `readonly` | `number` | - |
| **`frequencyHz`** | `readonly` | `number` | - |
| **`length`** | `readonly` | `number` | - |
| **`type`** | `readonly` | `'distance'` | - |

