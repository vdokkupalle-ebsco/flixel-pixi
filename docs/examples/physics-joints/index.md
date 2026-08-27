---
title: Portable Physics Joints
description: Play with distance, revolute, prismatic, weld, and wheel joints through the Planck adapter.
---

# Portable Physics Joints

This public-import-only showcase puts every portable joint type into a familiar
machine: a crane load, swing gate, warehouse door, welded robot tool, and
vehicle suspension. Drag the moving parts to feel motors, limits, springs, and
damping while logical-pixel anchors cross the same adapter boundary.

<DemoEmbed
  src="/games/physics-joints/index.html"
  title="Portable physics joints showcase"
  controlsHint="Drag any bright object to pull against its joint. Use Reset scene to rebuild all bodies and joints."
  height="760px"
/>

## What it proves

- One engine API creates distance, revolute, prismatic, weld, and wheel joints.
- Public anchors and linear limits stay in logical pixels; angles stay in degrees.
- Planck is isolated in the optional adapter and its own game chunk.
- Motors, angular/linear limits, and spring damping reach the native solver.
- Physics point queries select draggable bodies without exposing Planck types.
- Pointer dragging drives bodies through the portable body-control API, so each
  constraint remains active while the user pulls against it.
- Connected joints are destroyed before a body, and state teardown releases the world.

[Read the rigid-body physics guide](/guide/physics) or
[view the source on GitHub](https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/physics-joints).
