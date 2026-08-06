# ADR-0001: Compose Pixi render handles

- Status: Accepted
- Date: 2026-08-06
- Accepted: 2026-08-06 (Phase 0 architecture review)

## Context

Flixel gives nonvisual systems such as groups, sounds, timers, and plugins the
same `FlxBasic` lifecycle as sprites. PixiJS v8 uses a retained scene graph and
expects only containers to own children. A Pixi node also has one parent, while
one Flixel object may be drawn by multiple cameras.

## Decision

Flixel gameplay classes remain plain TypeScript objects. Renderable classes own
private adapter-managed Pixi handles instead of extending Pixi `Container` or
`Sprite`. Simulation state is authoritative; render handles synchronize after
simulation updates.

## Consequences

Headless tests do not require a DOM or GPU, and collision cannot accidentally
depend on rendered transforms. The renderer needs an explicit registry and
synchronization boundary. The C1 camera spike must validate that this approach
supports multi-camera rendering without duplicating gameplay objects.
