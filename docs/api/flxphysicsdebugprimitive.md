---
title: FlxPhysicsDebugPrimitive (TypeAlias)
description: API reference documentation for FlxPhysicsDebugPrimitive in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-typealias">TypeAlias</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxPhysicsDebugPrimitive

Renderer-neutral debug geometry produced by a physics backend.

```ts
export type FlxPhysicsDebugPrimitive = { readonly kind: 'line'; readonly from: FlxPhysicsVector; readonly to: FlxPhysicsVector; readonly color: number; } | { readonly kind: 'polygon'; readonly vertices: readonly FlxPhysicsVector[]; readonly color: number; readonly filled?: boolean; } | { readonly kind: 'circle'; readonly center: FlxPhysicsVector; readonly radius: number; readonly color: number; readonly filled?: boolean; } | { readonly kind: 'point'; readonly point: FlxPhysicsVector; readonly color: number; readonly size?: number; }
```

