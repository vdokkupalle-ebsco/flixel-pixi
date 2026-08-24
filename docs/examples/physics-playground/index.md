# Rigid-body Physics Playground

This public-import-only example connects `FlxPhysicsWorld` to the optional
Planck adapter. It includes static geometry, dynamic boxes and circles, a moving
kinematic obstacle, a sensor, normalized contact telemetry, and a point query.

<DemoEmbed
  src="/games/physics-playground/index.html"
  title="Rigid-body physics playground"
  controlsHint="Click or tap a body to query it. Dynamic hits receive a small upward impulse."
  height="760px"
/>

## What it proves

- The game imports runtime APIs only from `flixel-pixi` and
  `@flixel-pixi/physics-planck`.
- Planck stays in the example chunk rather than the root engine package.
- State ownership steps and destroys the world at predictable lifecycle points.
- Static, kinematic, dynamic, and sensor bodies share normalized contacts.
- Point queries return portable bodies instead of Planck objects.

[Read the rigid-body physics guide](/guide/physics) or
[view the source on GitHub](https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/physics-playground).
