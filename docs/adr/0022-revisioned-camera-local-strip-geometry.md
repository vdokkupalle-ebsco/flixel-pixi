# ADR-0022: Revisioned camera-local strip geometry

- Status: Accepted
- Date: 2026-08-11

## Context

HaxeFlixel's `FlxStrip` exposes vertices, triangle indices, and UV data for
ropes, polygons, and deformed textures. Pixi renders the same concepts through
`MeshGeometry`, but a Pixi geometry owns GPU buffers and participates in a
specific renderer context. Sharing it directly from gameplay state would break
the engine's renderer-neutral and multi-camera ownership rules.

Scanning mutable vertex arrays every render would also add an avoidable cost to
unchanged strips. Rebuilding a Pixi mesh for every animated vertex update would
discard batching opportunities and churn GPU resources.

## Decision

1. `FlxStrip` extends `FlxSprite` and stores renderer-neutral `Float32Array`
   vertices/UVs, `Uint32Array` indices, and either `triangle-list` or
   `triangle-strip` connectivity.
2. `setGeometry()` validates and clones caller data. `setVertex()` and
   `setUv()` increment a monotonic revision. Direct typed-array edits require
   one explicit `invalidateGeometry()` call after the mutation batch.
3. Every camera render handle owns a separate Pixi `MeshGeometry` and copies
   new data only when the logical revision changes. Geometry is retained across
   ordinary updates and replaced only when topology changes.
4. The strip owns no texture resource. Its inherited `FlxGraphic` must outlive
   the strip and remains governed by the existing sprite ownership contract.
5. Pixi manages WebGL/WebGPU buffer restoration. Recreated camera handles
   rematerialize all buffers from the authoritative logical arrays.
6. The default Pixi mesh shader and `auto` batch policy are used. Small meshes
   can batch; custom strip shaders and vertex colors are deferred until they
   have separate cross-renderer contracts.
7. Visual culling uses the transformed mesh vertices. Gameplay collision
   remains the inherited `FlxObject` rectangle and is never inferred from
   renderer geometry.
8. Handle teardown destroys camera-local filters and geometry but never the
   caller-owned texture.

## Consequences

- Animated deformations upload only after an explicit revision change.
- Multi-camera rendering duplicates GPU buffers by design and never shares
  mutable renderer state.
- Direct array mutation is efficient for many edits but forgetting
  `invalidateGeometry()` intentionally leaves the previous rendered geometry.
- Perspective `u/v/t`, per-vertex colors, arbitrary custom attributes, and
  non-triangle topology are not part of this slice.
