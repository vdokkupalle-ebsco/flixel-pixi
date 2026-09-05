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

The terrain workflow follows [Tiled’s terrain sets](https://doc.mapeditor.org/en/stable/manual/terrain/).
A corner set marks each tile’s four corners as terrain or empty. An edge set marks
the top, right, bottom and left connections. Painting changes those positions and
chooses matching tiles for neighboring cells automatically.

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

Select an imported sheet or atlas, open **Terrains**, and choose **+ Corner set**.
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

### Define roads, paths and fences

Choose **Add road sample** to try a complete edge set, or select an imported
sheet and choose **+ Edge set**. Edge patterns use clockwise positions: top = 1,
right = 2, bottom = 4 and left = 8. Painting connects only cardinal neighbors,
so diagonal cells remain untouched. A drag follows the stroke direction: its
ends use endpoint tiles, middle cells use straights or turns, and crossing an
existing stroke preserves a junction. Rotation and horizontal flipping also
rotate or reflect the edge meaning. Erase terrain disconnects the selected edge
terrain and rebuilds its adjacent transitions in one undoable action.

The built-in road atlas separates each source region with a transparent gutter
to prevent adjacent artwork from bleeding into a tile during scaling. For an
imported sheet, keep one or two transparent pixels between tiles and enter the
matching **Margin** and **Spacing** values in **Slice settings**. Extrude the tile's
edge colors into the gutter when visible seams must be avoided without changing
the tile's 32 × 32 source region.

### Reuse terrain artwork with transforms

The rule grid derives rotational and reflected equivalents from artwork you have
already assigned. Derived patterns use a dotted cyan border; dashed patterns still
need artwork. Assigning a source tile directly to a derived pattern overrides the
generated result. Variants and their weights rotate or reflect together, and the
choice remains stable for each painted cell. This lets a road reuse one endpoint
for four directions and one straight for horizontal and vertical orientations.
Use **Rotate artwork** and **Reflect artwork** under **Automatic transforms** to
control this per terrain set. Disable either option for directional lighting,
text, asymmetrical decoration, or artwork whose handedness must be preserved.
Legacy sets allow both transforms until you explicitly change these controls.

**Coverage diagnostics** separates explicit assignments, derived transforms and
missing patterns. Choose any nonzero count to jump through the corresponding
patterns. It also reports duplicated source assignments and unreachable rule
numbers in malformed imported metadata; project import rejects those entries so
they cannot create ambiguous painting behavior.

Rules are stored in image asset metadata as `terrainSets`, with stable set IDs,
`kind: "corner"` or `kind: "edge"`, name, color and `{ mask, tile, weight?, variants? }` rules. They use exact source
regions, so grid sheets and atlas images both work. Export/import validates and
preserves the definitions without changing the version 1 document contract.
Terrain tiles remain ordinary sparse tile cells. Copy/paste and stamp transforms
continue to work, and terrain editing recognizes flipped and rotated artwork.
The playable preview uses the already resolved tiles.

This phase supports up to 64 sets per image, with up to three terrain types plus
empty in each corner or edge set. Mixed corner-and-edge sets and Tiled file
interchange are not yet implemented.

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
user scripts, animation timelines, mixed corner-and-edge terrain sets, and Tiled TMX/JSON interchange. It focuses on a
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

## Reordering and duplicating layers

Select a layer in the hierarchy. The separate **Selected layer** toolbar above
the tree provides **Move layer up**, **Move layer down**, **Duplicate**, and
**Delete**. Higher layers draw above lower
layers in both the editor and Preview. Each arrow moves one position; buttons
are disabled at the top/bottom or while the selected layer is locked. Reordering
preserves object positions, layer membership, and the current selection.

**Duplicate layer** creates an independent copy directly above the original and
selects the copy. It preserves tiles, object positions and transforms, custom
properties, collision settings, layer kind, visibility, and locks. Copied objects
receive new IDs; image assets and their source tile collision definitions remain
shared. Names use “copy”, then “copy 2”, and so on to avoid existing layer names.
Hidden and locked layers can be duplicated without modifying the original;
unlock/show the copy before editing it.

Physics bodies are copied with new IDs. Joints between two objects in the copied
layer connect the new bodies. Joints that connect to another layer are not copied;
the status message reports how many were omitted. The originals keep every joint.
Copies stay at the same coordinates, so copied collision-enabled layers and
physics objects overlap until you move or hide them as appropriate.

Each reorder or duplicate is one undo/redo step and survives export/import. A
pending paint gesture is cancelled when the operation runs. Duplication clears
the tile selection and pending paste so it cannot accidentally paint the new layer.

**Delete** opens a confirmation naming the selected layer and listing its tiles,
objects, physics bodies, and connected joints. Cancel or Escape leaves the scene
unchanged. Confirming removes the layer, its objects and bodies, and all joints
attached to those bodies (including connections to other layers). Shared image
assets remain available. The nearest remaining layer becomes active. The entire
deletion is one undo/redo step. Locked layers and the last remaining layer cannot
be deleted. If the scene changes while confirmation is open, reopen the dialog
to review the current contents before deleting.

## Layer groups

Choose **Group** in the Selected layer toolbar to create a group at the scene
root. Select any layer and use the **Group** menu to move it into a group or back
to **Scene root**. Groups can contain other groups; the menu excludes the selected
group and its descendants to prevent cycles. **Add layer** and **Object layer**
create children when an unlocked group is selected. Groups organize layers and
do not directly hold painted tiles or objects.

The hierarchy indents children. Use the plus/minus control to expand or collapse
a group. Up/down arrows reorder siblings; moving a group moves its entire
subtree. A group's position controls its children's rendering order relative to
other groups and layers in both the canvas and Preview.

Hide or lock a group to apply that state to all descendants. Individual child
flags are preserved, so showing or unlocking the parent restores each child's
own state. A child row indicates inherited hiding or locking. Hidden groups omit
all child content and tile collision in Preview. Locked groups protect child
editing and reparenting while keeping their content visible and collidable.

Duplicating a group copies every nested layer, tile, object, and physics body.
Joints between copied children are remapped to the copied bodies; connections
outside the subtree remain only on the originals. Deleting a group requires
confirmation with nested-layer and total content counts. Locked descendants and
the last content layer are protected, even if empty groups remain. Creation,
reparenting, reordering, duplication, deletion, visibility, and locking support
undo/redo and persist in exported projects. Existing flat projects still import.

Drag a layer's name to reorder or change its group. A separate placeholder row opens above or below a
layer to show the sibling position. Drop in the middle of a group row to move inside;
an indented placeholder marks the new child position, and the group expands after the drop. Drag to **Drop here to move to scene root** to
remove the layer from its group without deleting it. A group moves with all its
children. Locked sources and destinations, cycles, and unchanged positions are
ignored. Each drop is one undo step. The arrow buttons and Group menu remain
available for keyboard use.

Layer dragging uses `@dnd-kit/dom`: a short movement threshold separates clicks
from drags, a floating preview follows the pointer, and the list scrolls near its
edges. The scene-root target stays in place so rows do not jump when dragging
starts. The preview describes the pending move and animates into place on drop;
reduced-motion preferences disable that animation. Focus a layer name and press
Space or Enter to start keyboard dragging, use arrow keys to navigate, then press
Space or Enter to drop or Escape to cancel.

### Moving objects between layers

Drag an object's name in the hierarchy onto the destination layer. A floating
preview follows the pointer and a separate placeholder names the receiving layer.
You can drop on its heading or contents, including an empty layer. Expand a group
first to reach its child layers; groups themselves cannot hold objects.

Each drag moves one object and selects it in its destination layer. Position,
size, rotation, custom properties, and physics references remain intact. Objects
locked individually or by their layer/group cannot move; locked destinations do
not accept drops. Hidden destinations are allowed and hide the object according
to that layer's visibility. The move is saved in project exports and is one
Undo/Redo step. Escape cancels without changing the project.

For keyboard dragging, focus the object's name, press Enter or Space, use the
arrow keys to move toward a destination, and press Enter or Space to drop.

Within the same layer, drop an object above or below a sibling to reorder it.
The forward/backward arrows move exactly one position even when objects have
identical or widely spaced order values. Ordering supports Undo/Redo.

With the Select tool (`V`), drag from empty canvas to draw a selection box.
Objects touching the box are selected when you release, accounting for their
rotation, scale, and origin. Hold Shift when starting the drag to add objects
to the current selection. Hidden and locked objects are excluded, including
inherited layer/group flags. Escape cancels the box and preserves the previous
selection. A click on empty canvas clears selection; dragging directly on an
object continues to manipulate that object.

### Aligning and distributing objects

Select multiple objects with a selection box or Shift-click. The top of the
Inspector shows arrangement controls:

- **Left / Center / Right** align horizontal bounds or centers to the selection.
- **Top / Middle / Bottom** align vertical bounds or centers to the selection.
- **Horizontal / Vertical** distribute centers evenly between the outermost
  objects, leaving those endpoints fixed. These require at least three objects.

Alignment uses the combined bounds of the selected objects after rotation,
scale, and origin. Spawn points align by position. Arrangement ignores grid
snapping so edges and centers align precisely. It works across layers, but all
selected objects and their layers/groups must be unlocked; the entire action
is disabled otherwise. Each action is one Undo/Redo step, preserves selection,
and saves the resulting positions in the project. Properties below the selection
controls continue to describe the last selected object.

### Layer opacity and offsets

Select a layer or group in the hierarchy, then use **Layer appearance** in the
Inspector:

- **Opacity (%)** controls visual transparency from 0 to 100.
- **Offset X / Offset Y** shift the layer in scene pixels, including its tiles,
  objects, and collision shapes. Negative offsets are supported.

Group offsets add to each descendant's local offset. Group opacity multiplies
child opacity: a 50% group containing a 50% layer displays that layer at 25%.
For nested layers, the Inspector also shows the combined appearance. Locked
layers and layers inside locked groups cannot change appearance.

Offsets leave the stored tile cells and object coordinates unchanged. Painting,
picking, object manipulation, marquee selection, and alignment account for the
shifted positions. Object coordinates in the Inspector remain local to the
layer. Moving an object to another layer keeps those local coordinates, so its
scene position follows the destination's offsets. Tile bounds remain local to
the map; offsets do not resize it.

The playable preview applies opacity to tiles, sprites, and particle effects,
and shifts their collision bodies and joint anchors. Zero opacity only hides
visuals; collision stays enabled. Use layer visibility or collision settings to
remove collision. Each appearance change supports Undo/Redo and is preserved
in project exports; older projects default to 100% opacity and zero offsets.

### Weighted terrain variants

A corner pattern can contain a primary tile plus up to 15 alternative tiles.
To add one, open **Terrain rules**, choose a source tile, select its matching
corner pattern, and click **Add variant**. **Assign tile** replaces the primary
artwork; **Add variant** keeps it and adds another choice. A source region can
have only one corner pattern within each terrain set.

Each tile has a relative weight from 0.01 to 1000 (default 1). For example,
weights of 3 and 1 produce approximately 75% and 25% usage over many cells.
Percentages beside the controls show each choice's share. Use the trash icon
to remove an alternative; **Clear pattern** removes all choices for that pattern.
The sample grass terrain includes a base tile and three decorative alternatives.

Choices are deterministic for a terrain set, pattern, and cell. Live previews,
committed strokes, and undo/redo agree. Weight changes affect newly resolved
cells; repainting unchanged terrain does not shuffle its artwork. Erase and
repaint to resolve a cell again. Variant tiles remain compatible with collision
shapes, transformed stamps, and project export/import. Removing or reassigning
source artwork preserves existing painted cells, but those cells may no longer
be recognized as part of the terrain set. Rule edits remain undoable.

### Multiple terrain types

Choose **Add grass and dirt sample**, then switch **Terrain to paint** between
Grass and Dirt and paint on the same layer. Shared corners automatically resolve
to a tile combining those materials. Erase terrain clears the targeted corners
regardless of their material, updating neighboring transitions.

For your own sheet, create a set and choose **Add terrain type** in Terrain rules.
A set supports up to three named, colored types plus empty. Click each corner to
cycle through empty and the materials, then assign the corresponding source tile.
Weighted variants work on mixed patterns too. The pattern table contains 15, 80,
or 255 nonempty combinations for one, two, or three types. You only need artwork
for combinations you paint; a missing rule cancels the stroke with its pattern
number. Keep the materials that should connect in the same set.

Adding a type preserves and remaps existing rule assignments, including variants.
Pattern numbers encode four clockwise values in base (terrain count + 1), so
legacy single-terrain pattern numbers are unchanged. Set types, rules, and resolved
tile artwork persist through project export/import and support undo/redo.
