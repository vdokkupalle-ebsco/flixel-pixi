---
title: Rigid-body Physics
description: Add optional rigid-body physics to Flixel-Pixi without replacing its built-in arcade collision system.
---

# Rigid-body physics

Flixel-Pixi has two intentionally separate ways to handle collision:

- **Arcade collision** is built in. Use `FlxG.collide()`, `FlxG.overlap()`,
  tilemaps, velocity, acceleration, and axis-aligned separation for platformers,
  shooters, and most classic Flixel games.
- **Rigid-body physics** is opt in. Add a state-scoped `FlxPhysicsWorld` and an
  adapter when you need rotating bodies, material response, sensors, or
  solver-managed contact manifolds.

Neither system silently redirects into the other. That keeps existing games
small and predictable, while allowing a game to select a solver without making
the engine depend on it.

<DemoEmbed
  src="/games/physics-playground/index.html"
  title="Rigid-body physics playground"
  controlsHint="Click or tap a body to run a point query and give dynamic bodies a small impulse."
  height="760px"
/>

<DemoEmbed
  src="/games/physics-joints/index.html"
  title="Portable physics joints"
  controlsHint="Watch all five constraints run together. Click or tap the scene to kick the distance-joint pendulum."
  height="760px"
/>

## Choose the collision system by gameplay need

| Need                           | Arcade collision      | Rigid-body adapter                                  |
| ------------------------------ | --------------------- | --------------------------------------------------- |
| Tilemap platformer             | Best default          | Convert selected solid regions into bodies          |
| Pickups and hazards            | `FlxG.overlap()`      | Sensor fixtures                                     |
| Axis-aligned player movement   | Simple and direct     | Usually unnecessary                                 |
| Tumbling crates or balls       | Limited               | Natural fit                                         |
| Friction, restitution, density | Basic object response | Solver materials                                    |
| Rotated polygons               | No                    | Capability-gated                                    |
| Exact input replay             | Engine-controlled     | Only when the adapter declares deterministic replay |
| Added install/bundle cost      | None                  | Adapter and solver are included by the game         |

Use one collision authority per object. A body bound to a physics world must not
also be passed to `FlxG.collide()` or `FlxObject.separate()` in the same step.
Flixel-Pixi rejects that mixed-authority separation instead of allowing two
systems to move the object differently.

You can still mix systems at the **game** level. For example, use arcade
collision for a tilemap player and rigid-body physics for an isolated machinery
room, as long as individual objects belong to only one system.

## Install an adapter

The Planck reference adapter is currently a private workspace while its
prerelease contract is validated. After it is published, installation is
independent of the root engine package:

```sh
npm install flixel-pixi @flixel-pixi/physics-planck
```

That installation adds Planck only to games that choose the adapter. Existing
`flixel-pixi` installations and the root package artifact do not include it.

## Create a state-scoped world

```ts
import { FlxPhysicsWorld, FlxSprite, FlxState } from 'flixel-pixi';
import { createPlanckPhysicsBackend } from '@flixel-pixi/physics-planck';

class PlayState extends FlxState {
  override create(): void {
    super.create();

    const physics = new FlxPhysicsWorld(createPlanckPhysicsBackend(), {
      gravity: { x: 0, y: 900 },
    });
    this.setPhysicsWorld(physics);

    const floor = new FlxSprite(0, 420).makeGraphic(640, 40, 0x26384fff);
    this.add(floor);
    physics.addBody(floor, {
      id: 'floor',
      type: 'static',
      shapes: [{ kind: 'box', width: 640, height: 40 }],
    });

    const crate = new FlxSprite(280, 80).makeGraphic(40, 40, 0x1de8f1ff);
    this.add(crate);
    physics.addBody(crate, {
      id: 'crate',
      type: 'dynamic',
      shapes: [{ kind: 'box', width: 40, height: 40 }],
      material: { density: 1, friction: 0.5, restitution: 0.15 },
    });
  }
}
```

The state advances its ordinary members first, pushes static and kinematic
objects, steps the backend once, pulls all dynamic objects, and then publishes a
stable contact snapshot. Destroying or replacing the state destroys its world,
bodies, queued contacts, and adapter resources.

## Body authority

| Body type   | Transform authority                              | Typical use                   |
| ----------- | ------------------------------------------------ | ----------------------------- |
| `static`    | Flixel object is pushed before a step            | Floors and fixed walls        |
| `kinematic` | Flixel velocity/position is pushed before a step | Moving platforms and doors    |
| `dynamic`   | Solver transform/velocity is pulled after a step | Crates, balls, debris, actors |

Binding a dynamic body disables built-in `FlxObject` motion so gravity is not
applied twice. Detaching the body restores the object's previous `moves` value.

## Sensors and contacts

Sensors report overlap without pushing bodies apart:

```ts
physics.addBody(trigger, {
  id: 'exit-zone',
  type: 'static',
  shapes: [
    {
      id: 'exit-sensor',
      kind: 'box',
      width: trigger.width,
      height: trigger.height,
      sensor: true,
    },
  ],
});

physics.contactStarted.add((contact) => {
  if (contact.sensor && contact.bodyA.id === 'exit-zone') {
    openExit();
  }
});
```

`contactStarted`, `contactStayed`, and `contactEnded` receive immutable,
normalized contacts after every dynamic object has been synchronized. A
callback may add or remove bodies without changing the snapshot currently being
dispatched.

## Queries and filters

Point and AABB queries are mandatory adapter capabilities:

```ts
const hit = physics.queryPoint({ x: pointerX, y: pointerY })[0];
hit?.body.applyImpulse({ x: 0, y: -0.4 });

const nearby = physics.queryAabb(
  { x: 100, y: 80, width: 240, height: 160 },
  { category: 0x0004, mask: 0xffff, includeSensors: false },
);
```

Category and mask values are unsigned 16-bit fields. Group indices are signed
16-bit values. Queries without a category/mask filter inspect every fixture;
`includeSensors: false` removes sensor hits.

## Check optional capabilities

Do not infer a feature from the adapter name. Ask the world before requesting
an optional shape or query:

```ts
if (physics.capabilities.shapes.includes('polygon')) {
  physics.addBody(rock, {
    type: 'dynamic',
    shapes: [
      {
        kind: 'polygon',
        vertices: [
          { x: -18, y: -12 },
          { x: 20, y: -8 },
          { x: 12, y: 16 },
          { x: -14, y: 18 },
        ],
      },
    ],
  });
}
```

The Planck adapter currently supports boxes, circles, convex polygons, compound
fixtures, point/AABB/ray queries, sleeping, continuous collision detection, and
distance, revolute, prismatic, weld, and wheel joints. It deliberately reports
no capsules, debug geometry, or deterministic replay support. Requesting an unsupported feature throws
`FlxPhysicsUnsupportedCapabilityError` before backend creation.

## Connect bodies with portable joints

Create bodies first, then pass their portable handles to `addJoint()`. Anchors
are world-space logical pixels. Angular limits and motor speeds use degrees and
degrees per second; linear limits and speeds use pixels and pixels per second.

```ts
const chassisBody = physics.addBody(chassis, {
  id: 'chassis',
  type: 'dynamic',
  shapes: [{ kind: 'box', width: 120, height: 28 }],
});
const wheelBody = physics.addBody(wheel, {
  id: 'front-wheel',
  type: 'dynamic',
  shapes: [{ kind: 'circle', radius: 22 }],
});

const suspension = physics.addJoint({
  id: 'front-suspension',
  type: 'wheel',
  bodyA: chassisBody,
  bodyB: wheelBody,
  anchor: { x: 420, y: 310 },
  axis: { x: 0, y: 1 },
  frequencyHz: 4,
  dampingRatio: 0.65,
  enableMotor: true,
  motorSpeed: 180,
  maxMotorTorque: 32_000,
});
```

| Type        | Constraint                                                 |
| ----------- | ---------------------------------------------------------- |
| `distance`  | Keeps two world anchors at a fixed or springy distance     |
| `revolute`  | Shares one pivot, with optional angular limits and motor   |
| `prismatic` | Restricts motion to one axis, with linear limits and motor |
| `weld`      | Locks relative position and angle                          |
| `wheel`     | Combines suspension travel with a rotary motor             |

`physics.capabilities.joints` reports the supported set. Destroying a joint is
idempotent. Removing either connected body destroys its joints first, and
resetting or destroying the world invalidates all body and joint handles.

## Units and solver differences

Portable positions and geometry use logical pixels. Linear velocity and gravity
use pixels per second and pixels per second squared. Angles and angular velocity
use degrees and degrees per second. Time uses seconds.

The adapter converts these values to solver metres and radians. Material,
force, and impulse values remain gameplay tuning inputs: different solvers can
produce different stacking, friction, sleeping, and contact results even when
given equivalent descriptors. Test tuning against every adapter you support.

## Cleanup and native access

A state owns the world installed through `setPhysicsWorld()`, so ordinary state
teardown is enough. If you create a world outside a state, call `destroy()` when
finished; destruction is idempotent.

The Planck adapter has an explicit escape hatch for code that accepts solver
lock-in:

```ts
const nativeBody = backend.native.getBody(portableBody.id);
```

Keep `native` calls in a small integration module. Native Planck bodies are not
portable, serializable schema values, query results, or contact handles.

## Replay limitations

Flixel-Pixi's input and fixed-step replay do not automatically make a solver
deterministic. Exact physics replay is supported only when an adapter declares
`deterministicReplay: true` for the tested browser/platform matrix. The Planck
reference adapter declares `false`; use snapshots or gameplay-level correction
when exact cross-platform reconstruction matters.

## Migration recipe: a small arcade platformer

Keep the existing arcade version while migrating one isolated scene. That gives
you a direct behavior comparison and an immediate fallback.

An arcade platformer usually owns gravity and collision in its update:

```ts
player.acceleration.y = 900;

override update(): void {
  FlxG.collide(player, platforms);
  super.update();
}
```

Migrate in this order:

1. Create a state-scoped physics world and set the same logical gravity.
2. Turn each small platform rectangle into one static box body. For a tilemap,
   merge adjacent solid tiles into rectangles rather than creating one body per
   tile.
3. Bind the player as a dynamic body with one box or circle fixture.
4. Remove the player's Flixel gravity/acceleration and remove that player from
   `FlxG.collide()` calls.
5. Move jump and movement code to `setVelocity()`, `applyForce()`, or
   `applyImpulse()` on the portable body.
6. Replace pickup overlaps with sensors only if they need to live in the rigid
   world; ordinary arcade pickups may stay separate.
7. Retune friction, density, restitution, jump impulse, and movement force.
8. Test state switches and repeated reset/destroy before removing the old scene.

The original [arcade platformer example](/examples/platformer/) remains the
recommended starting point for classic Flixel movement. The
[rigid-body playground](/examples/physics-playground/) demonstrates the opt-in
path rather than replacing it. The
[portable joints showcase](/examples/physics-joints/) demonstrates all five
joint descriptors side by side.

## Related architecture

- [ADR-0025: State-scoped pluggable physics](https://github.com/vdokkupalle-ebsco/flixel-pixi/blob/main/docs/adr/0025-state-scoped-pluggable-physics.md)
- [Adapter evaluation and benchmark](https://github.com/vdokkupalle-ebsco/flixel-pixi/blob/main/docs/reports/physics-adapter-evaluation.md)
