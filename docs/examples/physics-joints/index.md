---
title: Portable Physics Joints
description: Play with distance, revolute, prismatic, weld, and wheel joints through the Planck adapter.
---

# Portable Physics Joints

This public-import-only showcase runs every portable joint type in one
state-scoped `FlxPhysicsWorld`. Motors, limits, springs, damping, logical-pixel
anchors, and deterministic cleanup all cross the same adapter boundary.

<DemoEmbed
  src="/games/physics-joints/index.html"
  title="Portable physics joints showcase"
  controlsHint="Click or tap the scene to kick the distance-joint pendulum. Use Reset scene to rebuild all bodies and joints."
  height="760px"
/>

## What it proves

- One engine API creates distance, revolute, prismatic, weld, and wheel joints.
- Public anchors and linear limits stay in logical pixels; angles stay in degrees.
- Planck is isolated in the optional adapter and its own game chunk.
- Motors, angular/linear limits, and spring damping reach the native solver.
- Connected joints are destroyed before a body, and state teardown releases the world.

[Read the rigid-body physics guide](/guide/physics) or
[view the source on GitHub](https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/physics-joints).
