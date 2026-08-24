# Pluggable physics implementation plan

- Status: Complete
- Owner: Flixel-Pixi maintainers
- Started: 2026-08-24
- Decision:
  [ADR-0025](https://github.com/vdokkupalle-ebsco/flixel-pixi/blob/main/docs/adr/0025-state-scoped-pluggable-physics.md)

## Goal

Add optional rigid-body physics without changing the default arcade engine,
forcing a solver into the `flixel-pixi` bundle, or making games install a
separate contracts package.

The work is intentionally split into mergeable pull requests. Each branch must
leave `main` releasable and must not depend on an unmerged follow-up.

## Non-goals

- replacing `FlxG.collide()` or `FlxG.overlap()`;
- reproducing every solver feature in a lowest-common-denominator API;
- selecting two adapters before the first abstraction is proven;
- integrating physics authoring into a level editor in this checkpoint;
- guaranteeing cross-browser deterministic replay for a solver that does not
  provide that guarantee;
- moving the root `flixel-pixi` package into `packages/core`.

## Target authoring flow

The names below are the intended shape, not a frozen API report:

```ts
import { FlxPhysicsWorld, FlxSprite, FlxState } from 'flixel-pixi';
import { createPhysicsBackend } from '@flixel-pixi/physics-adapter';

class PlayState extends FlxState {
  override create(): void {
    const world = new FlxPhysicsWorld(createPhysicsBackend(), {
      gravity: { x: 0, y: 900 },
    });
    this.setPhysicsWorld(world);

    const player = new FlxSprite(80, 40);
    this.add(player);
    world.addBody(player, {
      type: 'dynamic',
      shapes: [{ kind: 'box', width: 24, height: 32 }],
      fixedRotation: true,
    });
  }
}
```

The root package supplies `FlxPhysicsWorld` and all portable descriptors. Only
the adapter import changes when a game selects another solver.

## Pull request A — contracts and state lifecycle

Branch: `feature/physics-contracts`

Deliverables:

- Add renderer-neutral public types for vectors, transforms, body descriptors,
  shapes, filters, materials, contacts, queries, capability reporting, backend
  bodies, and backend worlds.
- Add a state-owned `FlxPhysicsWorld` host with `setPhysicsWorld()`, replacement,
  pause, reset, and destruction behavior.
- Advance the world after ordinary state members and before audio/camera updates;
  preserve parent/substate persistent-update behavior.
- Implement a minimal fake backend in tests. It should record calls rather than
  simulate collisions.
- Export contracts from the root package and update the public API report.

Required tests:

- no world preserves the exact current lifecycle;
- one backend step occurs per active fixed update using `FlxG.elapsed`;
- a paused parent world does not step while an updating substate world does;
- replacing a world destroys the previous world exactly once;
- state switch and game destruction release every world and body;
- contracts and core physics modules have no Pixi imports.

Exit gate:

```bash
npm run format:check
npm run lint
npm run typecheck
npx vitest run tests/unit/flx-physics-world.test.ts tests/unit/flx-state.test.ts
npm run api:check
```

## Pull request B — object bindings, contacts, queries, and schemas

Branch: `feature/physics-bindings`

Deliverables:

- Bind `FlxObject` instances to static, kinematic, or dynamic backend bodies.
- Disable and restore built-in motion for backend-authoritative dynamic bodies.
- Push static/kinematic transforms before step and pull dynamic transforms and
  velocities after step.
- Normalize pixels/degrees at the public boundary; test a backend scale other
  than one to catch unit leaks.
- Add stable begin/stay/end contact dispatch with sensor, normal, point, depth,
  and body identity data.
- Add mandatory point and AABB queries with filter support.
- Add versioned physics body/world schema documents, validation, deterministic
  serialization, and root re-exports.
- Reject a body that is simultaneously configured for external physics and
  arcade separation through the provided helpers.

Required tests:

- all three body authority modes synchronize in the documented order;
- `moves`, velocity, angle, `last`, and touching state survive attach/detach;
- removing a body during a callback does not alter the current event snapshot;
- body/object destruction in either order is idempotent;
- queries return normalized, stably ordered results;
- invalid or unsupported shapes report an actionable path and capability;
- schema fixtures validate and round-trip without installing schemas separately.

Exit gate: root quality checks plus focused bindings, contact, query, schema,
package-contract, and declaration tests.

## Pull request C — adapter selection and first adapter

Branch: `feature/physics-reference-adapter`

Before implementation, prototype the two strongest candidates without merging
the prototypes. Record:

- minified and gzip contribution;
- browser and Node/headless support;
- license and maintenance status;
- fixed-step and determinism characteristics;
- shape, sensor, query, continuous-collision, sleeping, and joint support;
- resource disposal and world reset behavior;
- coordinate conversion complexity;
- TypeScript quality and documentation;
- 100, 1,000, and 5,000-body representative costs.

Then:

- add one optional adapter workspace with `flixel-pixi` as a peer dependency;
- keep the solver out of root dependencies and root artifacts;
- implement mandatory capabilities and accurately report optional ones;
- run the same black-box behavior suite used by the fake backend;
- add repeated create/step/destroy and memory-retention checks;
- document the exact portable API and the namespaced native escape hatch;
- keep the workspace private until its prerelease package contract is approved.

Exit gate: adapter conformance, package boundary, bundle delta, performance, and
cleanup evidence is recorded in the pull request.

## Pull request D — playable proof and author guidance

Branch: `feature/physics-playground`

Deliverables:

- Add a public-import-only physics playground covering a platform, dynamic
  bodies, a kinematic obstacle, a sensor, contact UI, and a pointer query.
- Add a guide that distinguishes arcade collision from rigid-body physics and
  shows how to choose one authority per object.
- Document capability checks, units, cleanup, replay limitations, and adapter
  installation.
- Add a migration recipe for a small `FlxG.collide()` platformer while keeping
  the original arcade example.
- Add Chromium/Firefox/WebKit smoke coverage and responsive iframe verification.
- Promote ADR-0025 to Accepted only when all acceptance evidence is present.

Exit gate:

```bash
npm run verify:quality
npm run test:e2e
npm run test:matrix
npm run check:package
```

## Proposed portable contract

### Mandatory capabilities

- one state-scoped world;
- static, kinematic, and dynamic bodies;
- box and circle shapes;
- categories, masks, groups, and sensors;
- density, friction, and restitution;
- position, angle, linear velocity, and angular velocity;
- begin, stay, and end contacts;
- point and AABB queries;
- explicit reset and idempotent destruction.

### Optional capability flags

- capsule, convex polygon, and compound shapes;
- ray and shape casts;
- constraints or joints;
- sleeping and wake control;
- continuous collision detection;
- deterministic replay on declared targets;
- backend-provided debug geometry.

Portable code must branch on capabilities before requesting optional behavior.
The host throws a typed unsupported-capability error when it cannot honor a
descriptor.

## Follow-up checkpoint — portable joints

Completed on 2026-08-24 as three independently mergeable, stacked branches:

1. `feature/physics-joint-contracts` added portable definitions, capability
   checks, stable handles, and deterministic body/world cleanup.
2. `feature/physics-joints-planck` added backward-compatible serialized joint
   documents and implemented distance, revolute, prismatic, weld, and wheel
   joints in the Planck adapter with logical-unit conversion.
3. `feature/physics-joints-showcase` added the playable cross-browser proof and
   author documentation.

The schema keeps `joints` optional so existing version 1 world documents remain
valid. New joint documents refer to stable body IDs and never serialize runtime
or backend handles.

## Lifecycle contract

For each active state and substate:

```text
member pre/update/post
        |
        v
push static + kinematic transforms
        |
        v
backend fixed step
        |
        v
pull dynamic transforms + velocities
        |
        v
publish stable contact snapshot
```

The world does not step from the current global plugin list because plugins run
before the state. Rendering remains downstream and reads the synchronized
`FlxObject` values as usual.

## Schema boundary

Physics documents should identify bodies and constraints with stable IDs and
contain only serializable values. They must not store backend handles, functions,
Pixi textures, or runtime object references. Unknown extension fields are
preserved according to the existing schema policy.

The schema workspace remains an implementation detail of the monorepo release
pipeline. Physics document types and validators used by games are re-exported
from `flixel-pixi`, matching the particle-editor decision that consumers install
the engine rather than a separate schemas package.

## Risks and mitigations

| Risk                           | Mitigation                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| Double integration             | Dynamic binding disables built-in `moves` and restores it on detach.               |
| Stale game-side changes        | Push authoritative transforms after member updates, immediately before stepping.   |
| Leaky abstraction              | Opaque handles, plain descriptors, capability flags, namespaced native access.     |
| Callback mutation              | Queue contacts, sync all bodies, dispatch a stable snapshot.                       |
| Arcade/rigid-body disagreement | Do not redirect `FlxG.collide`; require one authority per body.                    |
| Bundle growth                  | Root contains contracts and host only; adapters and solvers are optional packages. |
| Replay overclaim               | Adapter capability and platform evidence gate deterministic replay claims.         |
| Cleanup leaks                  | State ownership, idempotent destruction, repeated teardown tests.                  |
| Premature API breadth          | Mandatory box/circle baseline; advanced features remain optional.                  |

## Completion evidence

All four original pull requests and the portable-joints follow-up satisfy the
criteria: the Planck adapter passes the portable suite, packed examples work
from public exports, the root artifact excludes solver code, cleanup checks
pass, and ADR-0025 is Accepted.
