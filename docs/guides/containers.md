# Containers and sprite groups

Use `FlxContainer` when one logical collection must own each member
exclusively. Use `FlxSpriteContainer` when several sprites should move, tint,
route cameras, update, and render as one composite. `FlxSpriteGroup` has the
same composite surface with ordinary non-exclusive group membership.

## Local authoring, world gameplay

Member positions passed to `add()` are local to the composite's translation:

```ts
import { FlxSprite, FlxSpriteContainer } from 'flixel-pixi';

const ship = new FlxSpriteContainer(100, 80);
const engine = ship.add(new FlxSprite(12, 24).makeGraphic(8, 8));

engine.x; // 112: authoritative world x while owned
ship.getMemberLocalPosition(engine).x; // 12

ship.x = 140;
engine.x; // 152: translation propagated synchronously
```

`setMemberLocalPosition()` moves an owned member through this translation-local
space. `getWorldPosition()` converts a local point without consulting Pixi.
Removing a member converts its position back to local coordinates.

Local coordinates deliberately cover translation only. Group rotation and
scale update member rendering properties but do not create an implicit rotated
physics space.

## Collision

`FlxG.overlap()` and `FlxG.collide()` recursively expand sprite composites to
their member `FlxObject` AABBs. Empty gaps inside the composite bounds therefore
do not collide. Member `x`, `y`, `last`, `width`, and `height` remain the source
of truth, so headless tests and replays behave exactly like browser runs.

Setting `solid` or `immovable` on a composite propagates to its existing
members. Setting the composite's `allowCollisions` to `FlxObject.NONE` gates
quadtree expansion even if a member still has collision flags. Nested bounds
recurse to leaf extents, and `overlapsPoint()` ignores invisible members.

Rotation, origin, and scale do not alter collision extents. This is the same
renderer/gameplay boundary used by `FlxSprite`: model a larger or rotated
collision shape explicitly when the game requires one.

## Transform and camera propagation

The composite synchronously propagates:

- translation and angle deltas;
- scale, tint (`color`), scroll factor, and camera arrays;
- alpha as a preserved ratio by default, or direct values with
  `directAlpha = true`;
- `exists`, `alive`, `active`, and `visible` lifecycle flags.

Nested composites receive the same setters and propagate them recursively.
`transformChildren()` and `multiTransformChildren()` provide typed direct-member
helpers for application-specific properties.

## Ownership and lifecycle

`FlxContainer` is exclusive. Adding a member to a second container removes it
from the first and updates `member.container`. `remove()`, `clear()`, capacity
shrink, and `destroy()` clear that reference.

The backing group owns lifecycle traversal. A nested member receives one
`preUpdate()` / `update()` / `postUpdate()` sequence per fixed step, and one
destroy call when the owning branch is destroyed. `kill()` and `revive()` call
member hooks rather than merely copying flags.

## Pixi ownership

Gameplay code never creates or parents Pixi objects. A
`FlxSpriteGroupRenderHandle` owns one Pixi `Container` branch and attaches each
member's render-handle `Container` beneath it in member order. The drawable
Pixi `Sprite` remains a leaf. World sync registers only the composite root, and
destroying a render handle releases only adapter objects.

See the [container ownership ADR](../adr/0013-container-coordinate-and-render-ownership.md)
and the public `/containers/` sample for a nested, moving collision example.
