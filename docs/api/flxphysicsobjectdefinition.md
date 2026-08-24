---
title: FlxPhysicsObjectDefinition (TypeAlias)
description: API reference documentation for FlxPhysicsObjectDefinition in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-typealias">TypeAlias</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxPhysicsObjectDefinition

Body descriptor accepted when binding a `FlxObject` to a world.

```ts
export type FlxPhysicsObjectDefinition = Omit<FlxPhysicsBodyDefinition, 'position' | 'angle' | 'velocity' | 'angularVelocity'>
```

