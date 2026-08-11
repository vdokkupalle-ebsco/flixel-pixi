# ADR-0018: Renderer-neutral filter descriptors with handle-local ownership

- Status: Accepted
- Date: 2026-08-11
- Accepted: 2026-08-11 (advanced-rendering checkpoint)

## Context

HaxeFlixel exposes filter, color-transform, and shader-oriented sprite effects,
while PixiJS implements those effects through renderer resources attached to
display objects. Exposing Pixi `Filter` instances directly on gameplay sprites
would make simulation objects renderer-dependent and would incorrectly share a
stateful GPU resource when one sprite is projected into multiple cameras.

## Decision

1. Gameplay sprites, including sprite groups/containers, store renderer-neutral
   `FlxFilter` descriptors. Built-in configuration and resource/program
   identities are immutable; parameterized effects may expose explicit
   revisioned state.
2. Each render handle materializes its own Pixi filter instances, preserving
   declaration order. Multi-camera projections never share filter instances.
3. Replacing a descriptor list destroys the superseded handle-local filters.
   Destroying a handle releases its filters without touching descriptors,
   textures, or gameplay objects.
4. The first supported descriptors are blur and a 4×5 color matrix. Custom
   shaders follow the separate compatibility and uniform-lifecycle contract in
   [ADR-0019](0019-typed-cross-renderer-shader-filters.md), and displacement
   follows the texture-lifetime contract in
   [ADR-0020](0020-non-owning-displacement-maps.md).
5. Filters remain visual-only: collision, bounds, input, and fixed-step state do
   not query filtered Pixi output.

## Consequences

- Games can express common effects through public Flixel APIs without importing
  Pixi, while the renderer retains direct ownership of GPU resources.
- Adding, removing, or reordering effects requires a new descriptor list.
  Parameterized effects synchronize only when their explicit revision changes.
- Applying filters introduces offscreen render passes. Authors should prefer a
  filtered composite over repeating the same filter on many children, and blur
  quality must be chosen with its framebuffer cost in mind.
- Explicit filter areas remain deferred until their coordinate and performance
  policies are implemented and measured.
