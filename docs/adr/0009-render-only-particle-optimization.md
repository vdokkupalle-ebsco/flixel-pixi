# ADR 0009: Particle optimization is a render-only projection

- Status: Accepted
- Date: 2026-08-06
- Capability: effects rendering

## Context

The pinned `FlxEmitter` contract relies on `FlxGroup.recycle()` for particle
identity, lifespan, and reuse. PixiJS 8's `ParticleContainer` can render large
effects efficiently, but it has its own lightweight particle collection,
shared-texture constraints, and GPU update flags. Making that collection the
gameplay pool would couple lifecycle semantics to a rendering implementation
and make headless determinism harder to prove.

Timers and plugins pose a related ordering risk. The upstream game updates
plugins before the state and draws them after the state. A plugin may remove
itself during a callback, so direct iteration over a mutable array can skip the
next plugin.

## Decision

`FlxEmitter` always owns authoritative `FlxParticle` instances through
`FlxGroup`, including when no renderer exists. Seeded launch values, lifespan,
motion, kill/revive, custom `onEmit()` hooks, and recycling operate only on
those objects.

`FlxEmitterRenderHandle` has two projections. The default uses ordinary Pixi
sprites. Callers explicitly request `optimized: true` to use a wrapped PixiJS
8 `ParticleContainer`. The optimized view creates one stable Pixi `Particle`
per authoritative pool member and synchronizes it after simulation. Position,
rotation, vertex data, UVs, and color are marked dynamic because Flixel
particles may change all of them. The adapter supplies explicit camera bounds
and never owns or advances gameplay time.

Context plugin updates and draws traverse stable snapshots. A removed plugin is
skipped if its turn has not occurred; additions wait until the next pass.
Plugins update before the state. Renderer-driven plugin draws occur before
camera passes, and path debug geometry is projected into a dedicated
camera-local `Graphics` layer. State transitions clear the `TimerManager`
before destroying the old state.

## Consequences

- Headless and rendered effects share identical allocation and recycling
  behavior.
- Opting into `ParticleContainer` cannot change spawn order or particle
  identity.
- The optimized path expects atlas-compatible textures sharing a texture
  source; the ordinary sprite projection remains available for unrestricted
  rendering features.
- GPU allocations plateau with the authoritative pool and are released by the
  render handle without destroying shared textures.
- Plugin mutation is deterministic, and timer callbacks remain tied to fixed
  game steps rather than browser display cadence.
