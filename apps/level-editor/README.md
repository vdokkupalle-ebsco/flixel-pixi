# Flixel-Pixi Level Editor

The Level Editor is a private workspace application deployed as part of the
Flixel-Pixi documentation site. It is not published as an npm package.

It authors self-contained `ProjectDocumentV1` files with a versioned
`flixelPixiLevelEditor` extension. Scenes can contain image-backed sprites,
Particle Editor effects, XML TextureAtlas spritesheets, transforms,
purpose-aware layers, a pannable stage, grid settings, portable physics bodies,
and distance, revolute, prismatic, weld, or wheel joints.

```bash
npm run dev --workspace @flixel-pixi/level-editor
npm run test --workspace @flixel-pixi/level-editor
npm run build --workspace @flixel-pixi/level-editor
```

The production preview uses public `flixel-pixi` APIs and loads the Planck
adapter only for projects that contain physics bodies.

Tile painting uses the **Tilesets** dock and a dedicated tool strip inspired by
Tiled. Choose **Use starter tiles** or import a sheet, select a tile (Shift-click
for a rectangular stamp), and paint on the active layer. Brush (`B`), eraser
(`E`), bucket fill (`F`), rectangle fill (`P`), and tile picker (`I`) support
undoable operations; right-drag captures a stamp and Escape cancels a stroke.
Tile grids and source image regions are saved in the editor extension and shown
in the playable preview. See the [tile authoring guide](../../docs/guide/level-editor.md).
