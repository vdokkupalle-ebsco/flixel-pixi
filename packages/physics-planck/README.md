# `@flixel-pixi/physics-planck`

Optional Planck.js rigid-body adapter for the renderer-neutral physics API in
`flixel-pixi`.

This workspace remains private while its prerelease package contract is being
validated. Once published, a game will install the adapter alongside the
engine; Planck remains outside the root `flixel-pixi` artifact.

```sh
npm install flixel-pixi @flixel-pixi/physics-planck
```

```ts
import { FlxPhysicsWorld } from 'flixel-pixi';
import { createPlanckPhysicsBackend } from '@flixel-pixi/physics-planck';

const physics = new FlxPhysicsWorld(createPlanckPhysicsBackend(), {
  gravity: { x: 0, y: 900 },
});
```

The portable boundary uses logical pixels, degrees, and degrees per second.
The adapter converts them to Planck metres and radians internally. Supported
shapes are boxes, circles, convex polygons, and compound fixtures; supported
queries are point, AABB, and ray queries.

For deliberately non-portable solver features, use the explicit escape hatch:

```ts
const nativeBody = backend.native.getBody(portableBody.id);
```

Code using `native` is tied to Planck and will not work unchanged with another
physics adapter.
