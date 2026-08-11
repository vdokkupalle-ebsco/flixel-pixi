# ADR-0023: Stable camera-local vector graphics

- Status: Accepted
- Date: 2026-08-11

## Context

Games frequently need procedural but stable visuals: gradient skies, HUD
panels, route lines, markers, glows, polygons, and debug decoration. Baking
every variation into an asset adds content overhead, while exposing Pixi
`Graphics` or `FillGradient` objects to gameplay would violate the established
renderer-neutral ownership boundary.

Pixi tessellates vector paths into GPU geometry. Clearing and redrawing those
paths every frame causes unnecessary tessellation and allocation. Gradients
also own generated texture resources that require explicit teardown.

## Decision

1. `FlxGraphics` stores an append-only list of renderer-neutral vector commands
   until `clearGraphics()` is called. Supported helpers are rectangles, rounded
   rectangles, circles, ellipses, polygons, stars, and open lines.
2. Fill and stroke colors use the engine's packed `0xRRGGBBAA` convention.
   `FlxGradient` stores immutable local normalized linear or radial gradients.
3. Commands and gradient inputs are validated and cloned. Each command change
   increments a monotonic revision.
4. Every camera handle owns its Pixi `Graphics` context and materializes one
   `FillGradient` per logical descriptor. It clears and retessellates only when
   the logical revision changes.
5. Reused logical gradients share one materialized gradient within a camera
   handle, but never across cameras. Rebuild and teardown destroy all generated
   gradient textures.
6. Per-frame animation should change the inherited object transform, alpha,
   tint, or filters without changing commands. Geometry that genuinely changes
   every frame belongs in `FlxStrip`.
7. The constructor's width and height remain authoritative for collision and
   culling. Drawing commands do not silently change gameplay bounds.

## Consequences

- Game code can build common procedural scenery and HUD elements without Pixi
  imports or mutable bitmap emulation.
- Stable objects retain tessellated geometry across frames.
- Theme or layout changes can intentionally clear and rebuild a command list.
- Arbitrary SVG parsing, texture patterns, holes, masks, and animated gradient
  stops are deferred until they have explicit security, ownership, and update
  policies.
