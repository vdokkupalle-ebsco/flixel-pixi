---
title: FlxPhysicsJoint (Interface)
description: API reference documentation for FlxPhysicsJoint in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxPhysicsJoint

Portable joint exposed without leaking a solver-native handle.

```ts
export interface FlxPhysicsJoint
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`bodyA`** | `readonly` | `FlxPhysicsBody` | - |
| **`bodyB`** | `readonly` | `FlxPhysicsBody` | - |
| **`destroyed`** | `readonly` | `boolean` | - |
| **`id`** | `readonly` | `string` | - |
| **`type`** | `readonly` | `FlxPhysicsJointType` | - |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

