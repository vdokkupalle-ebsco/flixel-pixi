# Meshes and strips

Use `FlxStrip` when a sprite's rectangular quad cannot express the shape you
need: textured polygons, ropes, flags, water surfaces, or other deformable 2D
geometry. Use `FlxSprite` for ordinary textured rectangles.

## Define triangle geometry

```ts
const strip = new FlxStrip(100, 80, graphic).setGeometry({
  vertices: [0, 0, 96, 0, 80, 64, 12, 64],
  uvs: [0, 0, 1, 0, 1, 1, 0, 1],
  indices: [0, 1, 2, 0, 2, 3],
});
state.add(strip);
```

- `vertices` are local `x, y` pairs.
- `uvs` are normalized `u, v` pairs and must match the vertex count.
- Each three `triangle-list` indices defines one triangle.
- Inputs are cloned, so later changes to the source arrays do nothing.

For connected rope-style geometry, use `topology: 'triangle-strip'`. Its index
order alternates the two edges of the strip.

## Animate efficiently

For a few edits, the helpers publish the new revision immediately:

```ts
strip.setVertex(2, x, y);
strip.setUv(2, u, v);
```

For many edits, modify the typed-array view and publish once:

```ts
const vertices = strip.vertices;
for (let index = 0; index < vertices.length; index += 2) {
  vertices[index + 1] += wave(index);
}
strip.invalidateGeometry();
```

The revision is uploaded independently to every active camera. No Pixi objects
need to enter game code.

## Bounds, filters, and ownership

Visual culling follows the transformed mesh vertices, including negative local
coordinates, scaling, rotation, and sprite flipping. Collision still uses the
ordinary `FlxObject` rectangle (`x`, `y`, `width`, and `height`); configure that
rectangle for gameplay instead of deriving physics from the visual mesh.

`FlxStrip` inherits sprite tint, alpha, blend mode, camera routing, filters, and
explicit filter areas. Its render handles own and destroy camera-local GPU
geometry. They do not destroy a shared `FlxGraphic`; release that graphic using
the same ownership rules as any other sprite texture.

See the `/meshes/` harbor sample for a deforming water surface and a crane chain
that follows a moving weight.
