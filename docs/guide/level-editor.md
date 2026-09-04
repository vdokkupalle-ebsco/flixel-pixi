# Level Editor

The **Flixel-Pixi Level Editor** turns image assets and Particle Editor exports
into a portable, playable scene without requiring a custom editor integration.

👉 [Open the Level Editor](/level-editor/)

## Build a scene

1. Upload a PNG, JPEG, WebP, GIF, SVG, or Particle Editor JSON file from the
   **Assets** panel.
2. Select the asset to place it in the scene. Use the canvas tools or Inspector
   fields to move, rotate, scale, size, and set its normalized origin.
3. Place objects in purpose-aware **Background**, **Gameplay**, **Collision**,
   **Foreground**, or **UI / HUD** layers. Layers and objects can each be hidden
   or locked, and draw order can be adjusted within a layer.
4. Set the scene size, background, and grid size. Snap is enabled by default;
   hold <kbd>Alt</kbd> while dragging to bypass it.
5. Open **Preview** to run the current document through the same public engine
   APIs used by a game.

Keyboard controls include <kbd>V</kbd>, <kbd>H</kbd>, <kbd>G</kbd>, <kbd>O</kbd>,
and <kbd>S</kbd> for tools, arrow keys for precise movement, <kbd>Shift</kbd> for
larger steps or rotation increments, and the platform undo/redo shortcuts.
Hold <kbd>Space</kbd> and drag (or use the Pan tool) to move the stage. The mouse
wheel scrolls the stage, and <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + wheel zooms.
Duplicate selected objects with <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>D</kbd>;
their physics bodies and fully selected joints are copied too.

## Spritesheets and texture regions

For a TextureAtlas spritesheet, select the image and its XML file in the same
upload. The editor matches the XML image reference, validates both `SubTexture`
and TexturePacker `sprite` regions against the image bounds, and presents each
named frame as an individual asset item. Placing a frame stores its exact pixel region while keeping only one copy
of the spritesheet image in the project. The playable preview rebuilds the
region with Flixel-Pixi's atlas and frame APIs.

For a regular grid spritesheet, expand **Texture region** in the Sprite
Inspector. Set the frame width and height, then choose its zero-based column and
row. A zero frame dimension restores the full image. Editor and playable
preview use the same grid calculation.

## Tile painting

The tile workflow follows [Tiled’s stamp, fill, and eraser tools](https://doc.mapeditor.org/en/stable/manual/editing-tile-layers/).
The layer stack stays on the left, tile tools sit above the canvas, and the
**Tilesets** dock stays visible above the Inspector.

1. Select a layer. Hidden and locked layers cannot be painted.
2. Choose **Use starter tiles**, select a source image, or use **Import tileset**
   to upload a sheet. An image and TextureAtlas XML can be imported together.
3. For a regular sheet, expand **Slice settings** and set source tile width,
   height, margin, and spacing. Atlas frames use their exact source rectangles.
4. Set **Tile cell size** in the active layer’s properties before painting.
   Source regions scale to these square map cells. Cell size stays fixed while
   the layer contains tiles. Changing the scene’s snap grid does not resize tiles.
5. Click a palette tile to paint. Shift-click a second tile to select a rectangular
   multi-tile stamp. Empty cells in captured stamps leave existing tiles untouched.

| Action         | Shortcut / interaction                                                |
| -------------- | --------------------------------------------------------------------- |
| Stamp brush    | `B`; drag to paint, Shift-click to connect to the last brush endpoint |
| Eraser         | `E`; drag to erase cells on the active layer                          |
| Bucket fill    | `F`; fill the four-connected area matching the clicked tile           |
| Rectangle fill | `P`; drag a rectangle with a live preview                             |
| Pick tile      | `I`, or Alt-click with a tile tool                                    |
| Capture stamp  | Right-click or right-drag on the active layer                         |
| Cancel stroke  | Escape; cancellation leaves the document unchanged                    |
| Pan            | Hold Space and drag, middle-drag, or use `H`                          |
| Undo / redo    | Command/Ctrl+Z and Command/Ctrl+Shift+Z                               |

Fill tools repeat the active stamp. Fast brush movements interpolate the cells
between pointer events, and each stroke is a single undo step. Grid visibility
is separate from snapping. The footer shows cell coordinates and tile counts.
Tool shortcuts work in the workspace and palette without intercepting text fields.

Tiles are stored as `tilemap: { tileSize, cells }` on each scene layer, with
`"column,row"` cell keys and source image rectangles. They do not become objects
in the scene hierarchy. Export/import preserves tile grids and validates their
asset references. Assets used by tiles cannot be deleted. The playable preview
renders tiles below objects within each layer and respects layer visibility/order.
Tiles outside a resized canvas are retained in the document and reappear when
it is enlarged; tools operate only on full cells within the current canvas.

This pass supports finite orthogonal maps, up to 4,096 source tiles or cells in a
stamp, and up to 262,144 cells per fill operation. Preview currently uses sprites
for tile rendering. Optimized tilemap rendering and Tiled file interchange are follow-up work. A collision layer’s purpose label alone does not generate bodies; enable **Tile collision** in its Inspector.

### Selections, clipboard, and stamp transforms

Press **R** or choose **Select tiles**, then drag a rectangular selection.
The selection toolbar shows its dimensions and offers Copy, Cut, Paste, Delete,
and Deselect. Brush, eraser, rectangle fill, and bucket fill affect only cells
inside the active selection. Press Escape to clear it. Selecting another layer
clears the selection; hidden or locked layers remain protected from edits.

- **Command/Ctrl+C** copies the selected rectangle, including empty cells.
- **Command/Ctrl+X** copies and deletes it in one undoable edit.
- **Command/Ctrl+V** shows a floating paste preview. Click to place it once,
  or press Escape to cancel. Empty copied cells erase destination cells.
- **Delete / Backspace** removes selected tiles when the canvas has focus.
- **Command/Ctrl+A** selects all full cells of the active layer.

The tile clipboard is internal to the current editor session and is independent
of undo history. It supports rectangles of up to 4,096 cells; it does not read or
write the operating system clipboard. Paste rejects clipboard images that are
missing or different in the current project.

Use the **Active stamp** controls to flip horizontally (**X**), flip vertically
(**Y**), rotate clockwise (**Z**), or rotate counterclockwise (**Shift+Z**).
Transforms change both the stamp arrangement and the artwork inside each tile.
They affect future painting or the pending paste, and do not modify already
painted tiles. The miniature stamp preview and canvas preview show the result.
To transform an existing area, cut it, paste it, transform the floating stamp,
and click to place it. Object rotation now uses **O**, leaving **R** for tiles.

Per-tile `rotation` (0–3 clockwise quarter turns) and `flipX` flags are optional
in the version 1 extension. Existing files load with their original orientation;
new transforms survive export/import and render in the playable preview.

## Terrain auto-tiling

The terrain workflow follows [Tiled’s corner terrain sets](https://doc.mapeditor.org/en/stable/manual/terrain/).
A corner set marks each tile’s four corners as terrain or empty. Painting changes
the corners and chooses matching tiles for the surrounding cells automatically.

### Try terrain painting

1. Open **Tilesets → Terrains** (or press **T**).
2. Choose **Add sample terrain**. This adds a complete **Grass** corner set.
3. Drag on an empty, visible, unlocked layer. Each painted cell fills all four
   corners and updates its neighboring transitions. Fast strokes interpolate.
4. Choose **Erase terrain** to clear corners and rebuild the surrounding edges.
   The ordinary **Eraser (E)** still removes whole tiles without reconnecting them.
5. Hover to preview the affected cells. A stroke is committed only on release,
   with all neighbor changes in a single undo step. Escape cancels the stroke.

Terrain painting respects tile selections. A selection must include every
neighbor whose transition would change; otherwise the entire stroke is cancelled
with an explanation. The brush also protects tiles that are not in the active
set. Use a separate layer for different terrain sets or unrelated artwork.

### Define your own corner set

Select an imported sheet or atlas, open **Terrains**, and choose **+ New set**.
Expand **Terrain rules** to name the set, choose its identifying color and assign
source regions:

1. Choose a source tile in the palette.
2. Toggle the four corner markers over the tile preview. Filled markers mean
   terrain; unfilled markers mean empty.
3. Choose **Assign tile**. The pattern grid shows assigned artwork and dashed
   outlines for missing patterns. Click any pattern to edit that corner layout.

The 16 patterns use clockwise corner bits: top left = 1, top right = 2,
bottom right = 4, bottom left = 8. Pattern 0 always clears the cell and needs no
tile. A complete set has 15 assigned patterns. Partial sets are allowed, but an
operation needing a missing pattern cancels the whole stroke and reports its
number. Each source tile can describe only one pattern within a set; assigning
it again moves it from the previous pattern. Rule edits and set removal support
undo. Removing a set preserves the painted artwork.

Rules are stored in image asset metadata as `terrainSets`, with stable set IDs,
`kind: "corner"`, name, color and `{ mask, tile }` rules. They use exact source
regions, so grid sheets and atlas images both work. Export/import validates and
preserves the definitions without changing the version 1 document contract.
Terrain tiles remain ordinary sparse tile cells. Copy/paste and stamp transforms
continue to work, and terrain editing recognizes flipped and rotated artwork.
The playable preview uses the already resolved tiles.

This phase supports up to 64 sets per image, with **one terrain transitioning to
empty per set**. It does not yet implement transitions between different terrain
types, edge/mixed sets, random variants, automatic tile rotation to fill missing
rules, or Tiled file interchange.

## Tile collision layers

Select a layer in the Hierarchy, then check **Enable collision** in the
Inspector’s **Tile collision** section. Collision can be enabled on any layer;
the **Collision** purpose label is organizational and does not enable it
implicitly. Existing projects remain non-colliding until you opt in.

- **Occupied cells are solid by default.** Custom source tile shapes override
  the full-cell box; transparency alone does not affect collision. Use a separate tile layer
  to author collision independently from decorative terrain when needed.
- **Adjacent cells merge.** Horizontal runs with the same span on consecutive
  rows become one static rectangle. Holes and gaps are preserved. The Inspector
  reports the number of generated colliders that Preview will generate.
- **Friction** controls sliding resistance and **Bounce** controls restitution;
  both accept values from 0 to 1. Defaults are 0.4 friction and no bounce.
- **Show tile collisions** in the canvas toolbar toggles amber outlines. The
  outlines follow brush, terrain, paste and erase previews. Hiding the overlay
  does not disable physics or change the saved project.
- **Hidden layers** do not render or collide in Preview. Locking a layer protects
  its tiles and collision settings from editing but leaves its collision active.
- Only full cells inside the current canvas produce colliders. Tiles retained
  outside a resized canvas become collidable again when the canvas is enlarged.

To test a floor, paint a row of tiles, enable its collision, add a sprite above
it, and choose **Add physics body** for that sprite. Open **Preview**: the dynamic
sprite falls under gravity and lands on the tiles. Preview and Resume focus the
playable scene automatically. Pause and Reset remain available in the dialog.

Painting, erasing and collision settings participate in undo/redo. Export/import
preserves optional `tileCollision: { enabled, friction, restitution }` settings
on each layer in the version 1 editor extension, with validation on import.
Merged bodies are derived from the current grid when Preview starts; they do
not become editable objects or saved entries in the physics-body list. Game
integrations consuming editor exports must generate equivalent bodies
from these settings and source tile shape metadata; the base project schema does not do this automatically.

Static full cells and custom rectangles/convex polygons are supported. One-way
platforms, sensors and collision filters remain future work.

## Physics bodies and joints

Select a sprite and choose **Add physics body**. The editor supports static,
kinematic, and dynamic bodies with box, circle, or capsule colliders, friction,
bounce, and gravity scale.

To author a joint, add bodies to two sprites and Shift-select both on the canvas
or in the Hierarchy. Choose a
distance/spring, revolute/hinge, prismatic/slider, weld/rigid, or
wheel/suspension joint. Joint connectors and selected collider outlines appear
on the editor canvas. Deleting a body also removes joints that reference it.

Physics data uses the versioned portable Flixel-Pixi schemas. The playable
preview loads the Planck adapter when the scene contains a sprite body or an enabled, visible tile collider.

## Particle Editor effects

Export a layered effect from the [Particle Editor](/particle-editor/), then
upload its JSON and texture PNG files in the Level Editor. Image asset IDs are
derived from their filenames, so a bundle texture such as `ember-glow.png`
matches the effect's `ember-glow` asset ID. The effect appears as a placeable object;
its emitters, layer order, offsets, blend modes, and texture references are
validated before preview. The starter project includes a small embedded effect
that demonstrates the pipeline.

## Import, export, and runtime boundary

**Export** downloads deterministic JSON built on `ProjectDocumentV1`. Image
assets and particle documents are embedded as data URLs, while the
`flixelPixiLevelEditor` extension stores scene canvas, semantic layers, and
physics settings, sparse tile grids, and tile collision settings.
**Import** rejects malformed projects, unsupported extension versions, missing
active scenes, and invalid physics documents with a visible diagnostic.

The playable iframe receives projects through the versioned Editor Protocol,
preloads images with `FlxAssets`, builds sprites with `FlxSprite`, creates
effects with `FlxParticleEffect.fromAssets`, and runs physics through
`FlxPhysicsWorld`. The game runtime does not import Pixi directly.

## Current scope

The first release deliberately excludes soft bodies, collaborative editing,
user scripts, animation timelines, edge/mixed terrain sets, and Tiled TMX/JSON interchange. It focuses on a
stable asset-to-scene-to-preview loop that future editor features can extend
without changing the version `1` document contract.

### Tool cursors

The canvas cursor follows the active tool, with distinct icons for painting,
erasing, filling, picking, tile selection, paste, terrain, and stamp capture.
The small cross on tile-tool icons marks the exact pointer position. Icons have
a light outline for contrast over dark and light tiles; browsers that cannot
load custom cursors fall back to a crosshair.

Hold Alt with a tile tool to see the picker cursor. Hold Space while the canvas
is focused for a grab cursor; dragging shows a grabbing hand. Middle-drag also
pans. Releasing the modifier, cancelling a gesture, or leaving canvas focus
restores the current tool cursor. During a gesture, the cursor reflects the
operation that started it.

Object tools show move, rotate, or resize feedback, including the existing
bottom-right resize target. A blocked cursor indicates locked objects, painting
on locked or hidden layers, missing tile/terrain sources, or cells outside the
map. Tile selection and picking remain available on locked layers.

### Source tile collision shapes

Select a source tile in **Tilesets**, then choose **Edit tile collision shapes**.
The editor shows the untransformed source image. For a multi-tile stamp it opens
the first non-empty source tile; choose a single palette tile to edit another.

- **Rectangle:** drag across the image, then adjust x, y, width and height in source pixels.
- **Polygon:** click 3–8 corners in order and choose **Finish polygon**. **Undo point** removes the last corner. You can also edit the x,y vertex pairs numerically.
- **Full tile**, **Lower half**, **Slope up**, and **Slope down** add common shapes.
- Select a shape in the dropdown to edit or delete it. Up to 16 shapes are supported.
- **No collision** makes this source tile passable even on a collision-enabled layer.
- **Use layer default** removes the override and restores full-cell collision.

Polygons must be convex, non-crossing and inside the tile. Combine multiple
convex shapes for concave areas. Pointer drawing snaps to source pixels; numeric
fields accept fractional pixels. **Apply shapes** saves the draft as one undoable
edit. **Cancel** or Escape discards it. Select either drawing tool to discard an
unfinished polygon.

Shapes are shared by every placement of that source region, across scenes and
layers. Enable collision on a layer to activate them. They scale to the map cell
size and follow tile flips and quarter-turn rotations. Amber outlines and Preview
use the same transformed geometry. Only default full cells are merged; custom
shapes remain separate fixtures and use the layer's friction and bounce.

Shape metadata is stored with the image asset under `tileCollisionShapes`, keyed
by source rectangle. Coordinates are normalized to the source tile. Export/import
preserves it; changing tileset slicing does not remap existing source regions.
Game integrations must pass image assets along with scene settings when generating
colliders. This is editor metadata, not Tiled TMX/TSX interchange support.

## Gameplay objects and custom properties

The controls above the hierarchy add an **Object layer**, **Spawn point**,
**Trigger region**, or **Region**. Adding a gameplay object uses the active object
layer, otherwise an existing visible, unlocked object layer or a new one. The
new object starts near the scene center; drag it into place or edit X and Y.
Locked or hidden active layers must be unlocked/shown before adding objects.
Object layers accept objects, including sprites, but cannot contain painted tiles.
Older mixed layers continue to work unchanged.

Spawn points display as green crosshair markers and represent a location only.
They can move but do not rotate or scale. Trigger regions display as amber boxes;
generic regions are violet. Regions use center coordinates and support width,
height, rotation, scale, and the existing bottom-right resize target. Names appear
on the canvas. Hidden objects/layers hide their markers, and locks protect edits.
Select from the hierarchy or canvas; arrow keys move by one pixel, Shift+arrows
by one grid cell. Duplicate, delete, and undo/redo work with gameplay objects.

The Inspector has a **Class** label for gameplay objects and a **Custom properties**
section for all objects. Give each property a unique name and choose String,
Number, Boolean, or Color. Add it, then edit its value; numbers must be finite and
colors use `#RRGGBB`. Names can be renamed and properties removed. Each successful
edit is undoable. Failed validation leaves saved data unchanged. To change a
property's type, remove it and add it again with the desired type.

Export/import preserves gameplay objects as ordinary scene entities with types
`spawn-point`, `trigger`, and `region`. Their `properties` include `layerId`,
`gameplayClass`, and a `customProperties` array of `{ name, type, value }` records.
Region dimensions are in `properties.width` and `properties.height`; position is
the center, rotation is radians, and scale is stored on the entity. Object layers
use `kind: "objects"` in the editor extension.

These objects describe gameplay; they do not execute scripts. Preview omits their
authoring markers and does not spawn players or activate triggers. Your game
loads the entity data and implements those behaviors. Trigger regions are not
physics sensors automatically. Object references, polygon regions, and shared
class templates are future additions.
