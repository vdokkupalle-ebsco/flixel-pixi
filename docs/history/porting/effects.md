# Phase 8 evidence: particles, timers, and plugins

- Checkpoint: C8 effects gate
- Status: Passed
- Date: 2026-08-06
- Upstream oracle: Flixel commit `8989e5044be072c4abbbaa1317c9854786f6447f`
- PixiJS baseline: 8.19

Phase 8 ports `FlxParticle`, `FlxEmitter`, `FlxTimer`, `TimerManager`, and
`DebugPathDisplay`, and completes the scheduled `FlxG` plugin facade. Effects
remain deterministic, headless TypeScript state. Pixi receives a synchronized
view only after simulation and never owns a particle lifespan, timer clock, or
plugin callback.

## Pinned source contracts

The implementation was checked against the exact source at the pinned commit.
The resulting order and default-value contracts are:

- plugins update before the state and cameras;
- state switches clear managed timers before destroying the old state;
- a final timer stops before its callback runs;
- timer catch-up invokes every elapsed loop while the timer remains active;
- emitters process burst/stream scheduling before updating particles;
- stream scheduling subtracts `frequency` repeatedly, retaining remainder;
- burst quantity `0` means the complete attached pool;
- particles launch from the emitter rectangle with seeded velocity, rotation,
  and initial angle ranges; and
- particle lifespan `0` means no automatic expiry.

The port deliberately improves plugin removal. Update and draw passes traverse
a stable snapshot and confirm membership before invoking a plugin. Removing the
current plugin therefore does not shift and skip the next unrelated plugin;
plugins added during a callback wait until the next pass.

## Particle simulation and allocation plateau

`FlxEmitter` owns `FlxParticle` members through the existing `FlxGroup` pool.
`makeParticles()` preallocates the bounded pool and marks members nonexistent.
`emitParticle()` recycles an identity, then resets its authoritative position,
velocity, acceleration, angular velocity, drag, elasticity, lifespan, and
custom `onEmit()` hook.

Committed seeded tests run the same burst twice from seed `0.375` and compare
spawn order plus position, velocity, angle, angular velocity, and lifespan.
Stream tests cover multi-emission catch-up, finite quantity, infinite streams,
expiry, custom particle classes, manual emission, collision scaling, gravity
friction, contact spin, and validation failures.

The long stress vector advances 1,000 fixed steps through a 16-particle pool
and asserts both its length and every member identity remain unchanged. The
benchmark advances 3,600 fixed steps through a 256-particle pool; its measured
mean was 62.108 ms for the complete run. These measurements prove a stable
allocation plateau rather than setting a cross-device frame budget.

## Pixi render projections

`FlxEmitterRenderHandle` defaults to ordinary Pixi sprites. Passing
`{ optimized: true }` selects a wrapped PixiJS 8 `ParticleContainer`. Both modes
mirror the same fixed `FlxParticle` identities. The optimized mode uses
`particleChildren`, supplies explicit camera bounds, and marks position,
rotation, vertex, UV, and color data dynamic. It expects pool textures to share
one texture source, as atlas frames do.

The 256-particle projection benchmark performed 1,000 complete synchronizations
in a 27.008 ms mean. Browser teardown destroys view objects and render targets
without destroying shared particle textures. The production ESM bundle is
178,722 bytes raw and 41,467 bytes gzip.

## Timers, state boundaries, and plugins

Timer tests cover one-shot, finite and infinite loops, large elapsed catch-up,
pause/resume, stop/cancel, restart, invalid configuration, zero-time inert
timers, manager clear, game pause, and atomic state switching. A three-loop
catch-up records callback states `[false, false, true]`, proving the final timer
is stopped before its callback. The 1,000-callback catch-up benchmark measured a
0.0026 ms mean on the development machine.

`FlxGame.step()` calls context plugins once per authoritative step before the
state. Paused games do not advance them. `FlxGame` installs one
`DebugPathDisplay` and one `TimerManager`; state transitions clear the timer
manager, while game destruction releases every remaining plugin once.

## Debug paths and C8 browser scene

`FlxPath` self-registers with the current `DebugPathDisplay` and unregisters on
destruction. The camera renderer owns a dedicated `FlxPathDebug` graphics layer
and projects each path using its debug color, scroll factor, endpoint colors,
and per-camera scroll. Gameplay code never receives the Pixi `Graphics` object.

Open `/effects.html` for the deterministic effects lab. It runs a periodic
seeded burst, a continuous recycled gravity stream, an animated debug path, and
live fixed-step/pool/timer counters. Both emitters use the explicit optimized
projection. The page exposes pause, reset, exact-step advance, state metrics,
and clean destroy hooks to the browser harness.

Chromium, Firefox, and WebKit all verify seeded repeatability, timer catch-up,
safe plugin removal, the 224-object allocation plateau, optimized projection,
debug-path registration, 240 deterministic steps, active effects, and complete
canvas teardown. A separate live visual inspection confirmed visible burst and
stream particles, unclipped debug geometry, readable labels, and no browser
console warnings or errors.

## Verification

The complete repository gate passes:

- 122 unit tests across 18 files;
- 96.39% statements, 90.09% branches, 97.52% functions, and 98.01% lines;
- 39 Playwright engine/test combinations across Chromium, Firefox, and WebKit;
- formatting, ESLint, TypeScript, declaration generation, production library
  and demo builds, public API report, bundle report, and all benchmarks.

## Checkpoint verdict

C8 passes. Seeded emitter launches are repeatable; long-running effects retain
a stable authoritative and render allocation plateau; timers preserve loop
counts through pause, catch-up, cancel, restart, and state transitions; plugin
removal is mutation-safe; and debug paths use a dedicated camera-local layer.
Phase 9 may add browser audio and save data without changing the fixed-step
effects or render-only particle ownership boundary.
