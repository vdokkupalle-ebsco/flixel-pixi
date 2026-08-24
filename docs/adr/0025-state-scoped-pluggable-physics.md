# ADR-0025: State-scoped pluggable physics

- Status: Accepted
- Date: 2026-08-24

## Context

Flixel-Pixi currently provides deterministic arcade motion through
`FlxObject.postUpdate()` and broad-phase overlap and separation through
`FlxG.overlap()` and `FlxG.collide()`. Those APIs are useful for many 2D games,
have established callback and touching-flag behavior, and must remain the
zero-configuration default.

Some games need rigid bodies, rotation-aware shapes, sensors, constraints, or
continuous collision detection. Adding one physics library directly to the
engine would increase the core bundle, expose implementation-specific objects,
and make a future adapter difficult. Letting an adapter run as an ordinary
global plugin is also unsafe: plugins currently update before the active state,
while `FlxObject` motion runs during each member's `postUpdate()`. A solver that
runs there can observe stale gameplay changes or move an object twice.

The ecosystem already keeps the public engine at the repository root and adds
optional capabilities as workspaces. Physics should follow that model without
requiring games to install a separate contracts package.

## Decision

### Core and package boundary

1. The public `flixel-pixi` package owns the renderer-neutral physics contracts,
   the state integration, and the Flixel object binding layer. Games receive the
   contracts by installing `flixel-pixi`; there is no separately installed
   `physics-api` package.
2. Concrete solvers live in optional adapter packages. An adapter depends on its
   solver and declares a compatible `flixel-pixi` peer range. Neither the solver
   nor an adapter is included in the root engine bundle.
3. The first adapter is selected only after a small prototype comparison. The
   contract is validated against one adapter before it is marked Accepted; a
   second adapter is not required to design the first version.
4. Serialized physics documents live with the existing versioned schemas and
   are re-exported through `flixel-pixi`. Game authors do not need to install the
   schema workspace separately.

### Runtime ownership and update order

5. A `FlxState` may own one optional `FlxPhysicsWorld`. Substates own their own
   world and follow their existing persistent-update policy. Replacing or
   destroying a state deterministically destroys its world, bodies, queued
   contacts, and adapter resources.
6. A state with a physics world advances in this order on each fixed simulation
   step:

   1. update ordinary state members using the existing
      `preUpdate()` / `update()` / `postUpdate()` traversal;
   2. copy Flixel-authoritative static and kinematic transforms to the backend;
   3. step the backend once with `FlxG.elapsed`;
   4. copy backend-authoritative dynamic transforms and velocities to bound
      `FlxObject`s;
   5. publish a mutation-safe snapshot of contact events.

7. Binding a dynamic object disables built-in `FlxObject` integration for that
   object and restores its previous `moves` value when detached. Kinematic
   objects may use ordinary Flixel motion before their resulting transform is
   pushed to the backend. The binding layer preserves `last`, `lastAngle`,
   `touching`, and `wasTouching` semantics at the state boundary.
8. Public transforms use Flixel units: pixels, pixels per second, and degrees.
   Adapters own any conversion to metres, radians, or solver-specific scales.

### Contract shape

9. The mandatory first-version contract covers world lifecycle; static,
   kinematic, and dynamic bodies; box and circle shapes; transforms and
   velocities; collision categories and masks; sensors; friction, restitution,
   and density; begin, stay, and end contacts; and point and AABB queries.
10. Capsules, polygons, compound shapes, ray or shape casts, sleeping,
    continuous collision detection, and joints are capability-reported optional
    extensions. Unsupported requested features fail during creation with a
    descriptive error rather than silently degrading.
11. Backend handles are opaque and never exposed as the portable game API.
    Adapter-specific escape hatches, if provided, are explicitly namespaced and
    make that code non-portable.
12. Backends enqueue normalized contacts. The Flixel layer synchronizes all
    dynamic objects first, then dispatches begin/stay/end events in stable body
    registration and contact order. Callbacks may add or remove bodies without
    mutating the current dispatch snapshot.
13. Debug geometry is plain line, polygon, circle, point, and color data. It does
    not contain Pixi, canvas, or solver renderer objects.

### Compatibility and determinism

14. `FlxG.overlap()`, `FlxG.collide()`, tilemap separation, and quadtree behavior
    remain unchanged and continue to work without a physics world. They are not
    transparently redirected into an external solver.
15. Games choose one collision authority for a body. A bound physics body must
    not also participate in arcade separation during the same step. Mixed games
    may use arcade collision for unbound objects and a physics world for bound
    objects.
16. Every adapter reports capabilities including deterministic replay support.
    Fixed-step input replay is guaranteed only when the selected solver and
    adapter declare and test deterministic behavior for the target platforms.
    Non-deterministic adapters remain usable but cannot claim exact replay.
17. Portable joints connect two existing portable bodies. Version 1 supports
    distance, revolute, prismatic, weld, and wheel descriptors. Anchors are
    world-space logical pixels, axes are unitless directions, and angular
    values use degrees. Removing a body destroys its connected joints before
    the backend body; world reset and destruction invalidate every joint.

## Consequences

- Existing games, package installation, and bundle size remain unchanged unless
  a game opts into an adapter.
- The core API is large enough to support useful rigid-body gameplay but small
  enough to test with a fake backend before selecting a solver.
- State ownership gives physics predictable pause, substate, switch, and cleanup
  behavior without changing global plugin ordering.
- The engine must add a small post-member state phase and carefully test binding
  restoration, contact ordering, and state teardown.
- Solver-specific features remain available, but code using them is intentionally
  less portable.
- Built-in arcade collision and external rigid-body collision coexist as
  separate, explicit systems rather than pretending to have identical semantics.

## Acceptance evidence

All acceptance conditions are covered as of 2026-08-24:

1. `tests/unit/flx-physics-world.test.ts` exercises the fake backend across
   lifecycle, synchronization, contacts, queries, mutations, reset, and state
   cleanup.
2. `@flixel-pixi/physics-planck` implements the renderer-free boundary and its
   package tests cover logical-unit simulation, solid and sensor contacts,
   filters, queries, capabilities, native access, and repeated reset/destroy.
3. `examples/games/physics-playground` demonstrates dynamic, kinematic, static,
   sensor, contact, and point-query behavior using only `flixel-pixi` and the
   optional adapter's public exports. The packed-playground check installs the
   root engine, adapter, and solver tarballs into a clean consumer, then
   typechecks, bundles, boots, simulates, queries, and destroys that exact
   example. Chromium, Firefox, and WebKit exercise its runtime and teardown;
   Android and iOS browser profiles exercise the embedded documentation layout.
4. The root package check confirms that Planck is absent from the core artifact,
   the adapter has its own package-size budget, replay support is reported as
   unsupported rather than implied, and repeated boot/destroy checks pass. The
   benchmark and package evidence is recorded in
   `docs/reports/physics-adapter-evaluation.md`.
5. Portable host tests cover capability rejection, stable IDs, mutation-safe
   teardown, body-before-joint cleanup, reset, and destruction. Schema fixtures
   round-trip all five joint descriptors and reject invalid body references,
   axes, limits, motors, and springs. Planck package tests verify native unit
   conversion and motor motion. `examples/games/physics-joints` provides the
   Chromium, Firefox, and WebKit runtime proof.
