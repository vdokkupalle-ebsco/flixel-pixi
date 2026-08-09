# ADR-0013: Container coordinates, collision, lifecycle, and render ownership

- Status: Accepted
- Date: 2026-08-09
- Accepted: 2026-08-09 (HaxeFlixel container checkpoint)

## Context

The HaxeFlixel baseline at commit
`8c7b551f203a78ab0e7ee6757f39693d35108d24` separates ordinary groups from
exclusive containers and models a sprite group as one logical sprite backed by
a member group. `flixel-pixi` must preserve that useful authoring model without
making authoritative gameplay depend on Pixi transforms or bounds.

PixiJS v8 also treats `Sprite`, `Graphics`, `Text`, and other drawing objects as
leaf nodes. A composite therefore cannot attach children to a leaf sprite even
though HaxeFlixel calls the gameplay abstraction a sprite group.

## Decision

1. **World-space member authority.** While owned by a `FlxSpriteGroup`, every
   member's `x`, `y`, `last`, width, and height remain authoritative world-space
   gameplay values. `add()` interprets incoming `x`/`y` as translation-local,
   converts them to world space, and `remove()` converts them back. Explicit
   helpers expose local/world conversion without reading renderer state.
2. **AABB collision expansion.** Composite collision expands recursively to
   member AABBs. Rotation, origin, scale, alpha, and tint are visual properties;
   they do not silently resize or rotate collision rectangles, matching the
   existing `FlxSprite` collision boundary. A composite with collisions disabled
   is not expanded into the quadtree; `solid` and `immovable` assignments also
   propagate to existing members.
3. **Transform propagation.** Translation and angle apply deltas to members;
   scale, tint, scroll factor, visibility, activity, existence, life, and camera
   routing propagate as values. Point overlap considers only existing, visible
   members. Nested composites recurse through the same setters and bounds
   queries. These mutations happen synchronously in simulation state.
4. **Single lifecycle owner.** A composite's backing group performs stable
   member traversal. Nested members update, draw, kill, revive, recycle, and
   destroy once. `FlxContainer` adds exclusive ownership and synchronous
   reparenting through `FlxBasic.container`.
5. **Adapter-owned Pixi hierarchy.** One `FlxSpriteGroupRenderHandle` owns a
   Pixi `Container`; direct member render handles are child branches in logical
   member order. Leaf sprites never receive children. Destroying the composite
   handle destroys the branch handles but never gameplay objects or textures.
6. **Camera boundary.** The camera renderer routes and positions the composite
   root. Member camera and scroll-factor state remains plain TypeScript data;
   collision and fixed-step simulation never call Pixi coordinate APIs.

## Consequences

- Existing `FlxSprite` and `FlxGroup` APIs remain usable; the new classes are
  additive, while scalar fields retain property-compatible accessors.
- Local coordinates are translation-local, not an implicit rotated/scaled
  physics space. Games needing rotated or scaled collision should model those
  shapes explicitly rather than querying Pixi bounds.
- Renderer handles may be nested, but world sync registers only the composite
  root, so members are neither drawn nor destroyed twice.
- Reparenting between ordinary `FlxContainer` instances is exclusive. A plain
  `FlxGroup` remains intentionally non-exclusive for organizational and
  collision use cases.
