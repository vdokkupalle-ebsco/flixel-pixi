# Flixel-Pixi Level Editor

The Level Editor is a private workspace application deployed as part of the
Flixel-Pixi documentation site. It is not published as an npm package.

It authors self-contained `ProjectDocumentV1` files with a versioned
`flixelPixiLevelEditor` extension. Scenes can contain image-backed sprites,
Particle Editor effects, transforms, layer order, grid settings, portable
physics bodies, and distance, revolute, prismatic, weld, or wheel joints.

```bash
npm run dev --workspace @flixel-pixi/level-editor
npm run test --workspace @flixel-pixi/level-editor
npm run build --workspace @flixel-pixi/level-editor
```

The production preview uses public `flixel-pixi` APIs and loads the Planck
adapter only for projects that contain physics bodies.
