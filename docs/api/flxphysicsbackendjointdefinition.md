---
title: FlxPhysicsBackendJointDefinition (TypeAlias)
description: API reference documentation for FlxPhysicsBackendJointDefinition in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-typealias">TypeAlias</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxPhysicsBackendJointDefinition

Joint descriptor after portable bodies have been mapped to backend handles.

```ts
export type FlxPhysicsBackendJointDefinition = (Omit<FlxPhysicsDistanceJointDefinition, 'bodyA' | 'bodyB'> & { readonly bodyA: FlxPhysicsBackendBody; readonly bodyB: FlxPhysicsBackendBody; }) | (Omit<FlxPhysicsRevoluteJointDefinition, 'bodyA' | 'bodyB'> & { readonly bodyA: FlxPhysicsBackendBody; readonly bodyB: FlxPhysicsBackendBody; }) | (Omit<FlxPhysicsPrismaticJointDefinition, 'bodyA' | 'bodyB'> & { readonly bodyA: FlxPhysicsBackendBody; readonly bodyB: FlxPhysicsBackendBody; }) | (Omit<FlxPhysicsWeldJointDefinition, 'bodyA' | 'bodyB'> & { readonly bodyA: FlxPhysicsBackendBody; readonly bodyB: FlxPhysicsBackendBody; }) | (Omit<FlxPhysicsWheelJointDefinition, 'bodyA' | 'bodyB'> & { readonly bodyA: FlxPhysicsBackendBody; readonly bodyB: FlxPhysicsBackendBody; })
```

