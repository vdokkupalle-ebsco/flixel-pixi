# Level Editor

The **Flixel-Pixi Level Editor** turns image assets and Particle Editor exports
into a portable, playable scene without requiring a custom editor integration.

👉 [Open the Level Editor](/level-editor/)

## Build a scene

1. Upload a PNG, JPEG, WebP, GIF, SVG, or Particle Editor JSON file from the
   **Assets** panel.
2. Select the asset to place it in the scene. Use the canvas tools or Inspector
   fields to move, rotate, scale, size, and set its normalized origin.
3. Arrange draw order with **Layer** or the up/down controls in the Hierarchy.
   Visibility and locking are stored per object.
4. Set the scene size, background, and grid size. Snap is enabled by default;
   hold <kbd>Alt</kbd> while dragging to bypass it.
5. Open **Preview** to run the current document through the same public engine
   APIs used by a game.

Keyboard controls include <kbd>V</kbd>, <kbd>G</kbd>, <kbd>R</kbd>, and
<kbd>S</kbd> for tools, arrow keys for precise movement, <kbd>Shift</kbd> for
larger steps or rotation increments, and the platform undo/redo shortcuts.

## Spritesheets and texture regions

For a regular grid spritesheet, expand **Texture region** in the Sprite
Inspector. Set the frame width and height, then choose its zero-based column and
row. A zero frame dimension restores the full image. Editor and playable
preview use the same grid calculation.

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
preview loads the Planck adapter only when the scene contains a body.

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
`flixelPixiLevelEditor` extension stores scene canvas and physics settings.
**Import** rejects malformed projects, unsupported extension versions, missing
active scenes, and invalid physics documents with a visible diagnostic.

The playable iframe receives projects through the versioned Editor Protocol,
preloads images with `FlxAssets`, builds sprites with `FlxSprite`, creates
effects with `FlxParticleEffect.fromAssets`, and runs physics through
`FlxPhysicsWorld`. The game runtime does not import Pixi directly.

## Current scope

The first release deliberately excludes soft bodies, collaborative editing,
user scripts, animation timelines, and full tilemap painting. It focuses on a
stable asset-to-scene-to-preview loop that future editor features can extend
without changing the version `1` document contract.
