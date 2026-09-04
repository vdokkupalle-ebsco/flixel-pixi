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
adapter only for scenes with physics bodies or enabled tile colliders.

Tile painting uses the **Tilesets** dock and a dedicated tool strip inspired by
Tiled. Choose **Use starter tiles** or import a sheet, select a tile (Shift-click
for a rectangular stamp), and paint on the active layer. Brush (`B`), eraser
(`E`), bucket fill (`F`), rectangle fill (`P`), and tile picker (`I`) support
undoable operations; right-drag captures a stamp and Escape cancels a stroke.
Tile grids and source image regions are saved in the editor extension and shown
in the playable preview. See the [tile authoring guide](../../docs/guide/level-editor.md).

Tile editing includes rectangular selections (`R`), an internal tile
clipboard (Command/Ctrl+C/X/V), Delete and Select All, plus stamp flips (`X`/`Y`)
and quarter-turn rotations (`Z`/Shift+`Z`). Paste has a floating preview and
commits once on click. Painting respects the active selection. Object rotation
uses `O` to keep `R` consistent with Tiled.

Terrain auto-tiling uses **Tilesets → Terrains**. Choose **Add sample terrain**
for a complete grass-to-empty corner set, then paint with **T** or choose
**Erase terrain**. Neighboring transitions update in the live preview and each
stroke is one undo step. In **Terrain rules**, choose a source tile, mark its
four corners, and assign it to a pattern. Missing patterns are shown explicitly.
Rules save with the image asset; copied and transformed terrain tiles remain
recognizable. This phase supports one terrain transitioning to empty per corner
set; edge/mixed sets, multiple interacting terrains and weighted variants are
future work.

Select a layer and enable **Tile collision** in the Inspector to make its painted
cells solid. Adjacent cells merge into static boxes without filling gaps. Set
layer friction and bounce, and toggle amber outlines with **Show tile collisions**
in the canvas toolbar. Outlines follow painting previews. Hidden layers have no
preview collision; locked layers still collide. Tiles without custom shapes use full cells regardless
of tile transparency or terrain shape. Collision settings save with the layer,
while the merged bodies are generated for Preview and stay out of the hierarchy.

Select a tile and use **Edit tile collision shapes** for rectangles, convex
polygons, slopes, or explicit passable tiles. Apply saves one undoable change;
source shapes follow flips and rotations on collision-enabled layers. See the
[level editor guide](../../docs/guide/level-editor.md#source-tile-collision-shapes)
for authoring and runtime metadata details.

Use the controls above the hierarchy to add object layers, spawn points, trigger
regions, and generic regions. Move markers on the canvas and edit geometry,
classes, and typed custom properties in the Inspector. Gameplay metadata saves
with scene entities and supports undo/redo. Preview omits authoring markers;
your game implements spawn/trigger behaviors from the exported data.

Select a layer and use the separate **Selected layer** toolbar for up/down,
**Duplicate**, and **Delete**. Deletion requires confirmation and supports Undo. Copies
preserve tiles, objects, properties and collision settings at the same positions,
with new object/body IDs and remapped internal joints. Cross-layer joints stay
with the originals. Each operation supports undo/redo and project export.

Use **Group** in the Selected layer toolbar to create a layer group. The **Group**
menu moves the selected layer or group under another group, or back to **Scene
root**. Groups nest, collapse, and move as a unit. Hiding or locking a group
applies to every descendant without changing their individual flags. Hidden
children are also omitted from Preview and tile collision. Group duplication
copies the entire subtree and remaps joints across its children; group deletion
confirms all nested contents and remains one undo step.

Drag layer names to reorder them. Drop above/below a row to place a sibling, in
the middle of a group to move inside, or on the scene-root drop area to move out.
A separate placeholder row previews the destination. Dragging groups preserves their children;
locks and cycle checks apply, and each move is undoable.
