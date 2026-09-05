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
recognizable. Corner sets support up to three terrain types plus empty, with shared transition
rules. Edge sets use top, right, bottom and left connections for roads, paths and
fences; dragging follows the stroke direction to select endpoints, straights,
turns and existing junctions. **Add road sample** provides a complete example.
Terrain rules automatically reuse equivalent artwork through quarter-turn rotation
and reflection; an explicit pattern assignment always overrides a derived one.
Selected image assets can import or export Tiled tileset JSON with Wang sets,
colors, probabilities and transformation permissions.

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

Drag an object's name onto another content layer to move it. A floating copy and
placeholder name the destination. Object and inherited layer locks prevent moves;
groups cannot directly hold objects. The moved object stays selected, its position
and physics references are preserved, and Undo/Redo restores the move. With the
object name focused, Enter/Space starts a keyboard drag, arrow keys move it,
Enter/Space drops, and Escape cancels. Each drag moves one object.

Within a layer, drag an object above or below a sibling to change drawing order,
or use its forward/backward arrows to move exactly one position. With Select
(`V`), drag from empty canvas to select objects intersecting the selection box.
Shift adds to the existing selection; Escape cancels. Hidden and locked objects
are excluded, including objects hidden or locked by a parent layer group.

Select two or more objects to reveal arrangement controls at the top of the
Inspector. Align left/center/right or top/middle/bottom to the combined selection
bounds. With three or more objects, distribute their centers horizontally or
vertically between the outermost objects. Bounds account for rotation, scale,
and origin; spawn points use their positions. All selected objects and their
layers must be unlocked. Every arrangement is one undo step and retains selection.

Select a layer or group to edit **Layer appearance** in the Inspector: opacity
(0–100%) and X/Y offsets in pixels. Nested offsets add and opacity multiplies.
Tile cells and object positions remain local; canvas picking, painting, selection,
and alignment account for the resulting scene positions. Preview applies the
same appearance to tiles, sprites, and particles, and offsets collision bodies.
Opacity does not disable collisions; use visibility or collision controls for that.
Appearance is saved with the project and supports Undo/Redo.

Terrain patterns support up to 16 weighted tile choices. In **Terrain rules**,
select a source tile and a pattern, then choose **Add variant**. Adjust each
weight to control its relative frequency; the displayed percentages update
accordingly. The sample grass set includes three decorative variants. Choices
are stable by cell, so previews match painting and unchanged terrain does not
shuffle. Variant edits support undo/redo and project export.

Choose **Add grass and dirt sample** to try a complete two-terrain atlas. Use
**Terrain to paint** to switch materials within the same set. For custom artwork,
open Terrain rules, use **Add terrain type**, name/color each material, and click
corner markers to cycle their material before assigning a tile. Adding a type
preserves existing artwork and remaps pattern numbers. Missing combinations block
painting atomically; all rule edits and terrain strokes remain undoable.
