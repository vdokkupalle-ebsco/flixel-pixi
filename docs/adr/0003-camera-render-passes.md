# ADR-0003: Render the world once per active camera

- Status: Accepted; implementation details validated by the rendering spike
- Date: 2026-08-06
- Accepted: 2026-08-06 (Foundation architecture review)

## Context

Original Flixel cameras render objects into independent bitmap buffers. PixiJS
uses a retained scene graph, and the same node cannot be attached to multiple
camera parents.

## Decision

Maintain one logical world and render registry. Each camera owns viewport,
masking, transform, output, and effects state. The renderer performs a filtered
pass for each active camera and composites the results on the screen stage.

## Consequences

This preserves per-object camera lists and split-screen behavior but may add
render-texture and draw-call cost. The rendering spike compares direct viewport rendering with
render-texture composition before this ADR can be accepted.

## Rendering validation

The 2026-08-06 browser spike passed with one world parent, two independently
masked render-texture outputs, camera-specific object filters, and isolated FX.
Render-texture composition is locked as the correctness baseline. A direct
single-camera path is deferred until profiling demonstrates that it is needed.
See the [historical rendering evidence](../history/porting/rendering-spikes.md).
