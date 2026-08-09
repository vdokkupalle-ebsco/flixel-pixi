# Phase 3 evidence: motion, paths, and collision

- Checkpoint: C3 collision oracle
- Status: Passed
- Date: 2026-08-06
- Upstream oracle: Flixel commit `8989e5044be072c4abbbaa1317c9854786f6447f`

Phase 3 adds the authoritative simulation geometry used by later sprites,
tilemaps, particles, and replay. `FlxObject` positions and Flixel AABBs remain
the source of truth; Pixi transforms and renderer bounds are not imported by the
collision core.

## Delivered surface

The public package now exports `FlxPath`, `FlxObject`, `FlxQuadTree`, structural
camera and callback types, plus `FlxG.overlap` and `FlxG.collide`. The AS3
`FlxList` helper is implemented internally for quadtree leaves.

`FlxObject` includes linear and angular velocity, acceleration, drag, caps,
half-step motion integration, last-position tracking, dimensions, mass,
elasticity, immovability, collision masks, touching/just-touched state, reset,
health, flicker timing, strict overlap queries, midpoint/screen-coordinate
helpers, and all upstream path modes.

## Motion and path oracle

The motion tests preserve Flixel's midpoint integration. With a 0.5 second step
and X acceleration of 10, a stationary object moves 1.25 units and ends at
velocity 5. Angular acceleration follows the same two-half-delta rule.

Path contracts cover forward, backward, loop-forward, loop-backward, yoyo,
horizontal-only, vertical-only, negative directions, node snapping, automatic
rotation, completion, copy/reference nodes, and optional path destruction.

## Separation oracle

Golden tests cover:

- stationary overlap and two immovable objects;
- left, right, up, and down contacts with opposing touching flags;
- one-way collision masks on either participant;
- equal movable masses with elastic velocity transfer;
- an actor landing on an immovable platform;
- horizontal carry by a moving platform in either object order;
- X-before-Y corner resolution and strict edge adjacency;
- high-speed swept hull overlap;
- nested groups, self-overlap, disabled/dead objects, and process callbacks.

Separation follows the pinned AS3 order: X is attempted before Y, and each axis
uses the other axis's swept/last-position hull. The principal `separateX` and
`separateY` paths allocate no temporary points or rectangles.

## Quadtree adaptations

The quadtree retains AS3 list inheritance, four-way subdivision, world bounds,
configurable divisions, single-list self comparison, dual-list comparison, and
swept bulk hulls.

Two JavaScript-safety adaptations are committed:

- callback/process state belongs to each tree run instead of AS3 static scratch
  fields, so a callback may start a nested overlap query safely;
- a pair that spans multiple leaf boundaries is processed once per execution,
  preventing duplicate user callbacks.

This contract is recorded in
[ADR-0007](../../adr/0007-reentrant-quadtree-callbacks.md).

Tests exercise all four quadrants, inherited spanning objects, nested overlap
calls, filtered pairs, objects outside world bounds, and invalid tree settings.

## Performance and verification

Representative Vitest benchmark means on the development machine were:

| Workload                                     | Mean time |
| -------------------------------------------- | --------- |
| Broad-phase self-check of 2,000 sparse AABBs | 0.357 ms  |
| 10,000 allocation-free X separations         | 0.462 ms  |

These are diagnostic regression baselines, not cross-device promises. The
automated checkpoint budget is 5 ms for the 2,000-object sparse desktop
workload; physical mobile profiling remains part of the later browser performance
matrix.

The suite contains 56 passing tests across nine files. Coverage is 96.44%
statements, 92.18% branches, 98.07% functions, and 98.35% lines. Formatting,
ESLint, strict TypeScript, API extraction, declarations, and benchmark reporting
pass.

## Checkpoint verdict

The C3 numerical and architecture criteria pass: motion is fixed-step and
renderer-independent, collision behavior has committed golden vectors, nested
and self overlap are covered, the principal separation loop is allocation-free,
and the broad phase is below its automated desktop budget. Phase 4 may layer
asset-backed sprites and animation over these authoritative objects.
