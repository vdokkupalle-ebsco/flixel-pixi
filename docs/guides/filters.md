# Filters

`FlxSprite.filters` accepts renderer-neutral descriptors. Game code does not
import or own Pixi filters:

```ts
const ghost = new FlxSprite(80, 80).makeGraphic(48, 48, 0x38bdf8ff);
ghost.filters = [FlxColorMatrixFilter.grayscale(0.8)];

const panel = new FlxSpriteContainer(200, 100);
panel.add(icon);
panel.add(label);
panel.filters = [new FlxBlurFilter(4, { quality: 2 })];
```

Descriptor order is filter order. Assign a new list to add, remove, or reorder
effects. Lists and resource/program identities are immutable, while shader and
displacement parameters use explicit revisioned state:

```ts
sprite.filters = []; // Releases every camera-local Pixi filter instance.
```

Each camera projection owns a separate Pixi filter chain. Replacing the list,
removing a camera, or destroying the sprite releases those renderer resources
without changing textures or gameplay state. Collision, input, bounds, and
fixed-step updates never read filtered pixels.

## Custom shaders

`FlxShaderFilter` declares renderer programs explicitly and infers a typed
uniform API from the supplied schema. Update uniforms in place; do not replace
the descriptor every frame:

```ts
const pulse = new FlxShaderFilter({
  webGL: {
    fragment: `
      in vec2 vTextureCoord;
      out vec4 finalColor;
      uniform sampler2D uTexture;
      uniform float uStrength;

      void main(void) {
        vec4 color = texture(uTexture, vTextureCoord);
        finalColor = vec4(color.rgb * uStrength, color.a);
      }
    `,
  },
  uniforms: {
    uStrength: { type: 'f32', value: 1 },
  },
});

sprite.filters = [pulse];
pulse.uniforms.set('uStrength', 0.5); // `number` is inferred.
```

Add `webGPU.source` for WebGPU support. WGSL must contain both entry points
(`mainVertex` and `mainFragment` by default) and declare the custom uniform
buffer as `@group(1) @binding(0) var<uniform> flxShaderUniforms`. Its fields and
order must match the TypeScript schema. GLSL uses ordinary uniforms with the
same field names. `compatibleRenderers` reports the supplied backends.

If the active renderer has no matching program, the filter is skipped and its
input is rendered unchanged. This is useful for optional decoration; games
whose art direction requires the effect should supply both sources or check
compatibility during boot. Shader source is intentionally not translated or
parsed by the engine.

## Displacement maps

Use a loaded or generated `FlxGraphic` as a red/green displacement map. The map
is stretched across the filtered object's bounds and repeats by default:

```ts
const ripple = new FlxDisplacementFilter(displacementGraphic, {
  scale: { x: 12, y: 6 },
  padding: 12,
});

water.filters = [ripple];

// Fixed-step animation; no filter-chain rebuild.
ripple.setOffset(elapsed * 0.1, 0);
```

Red controls horizontal displacement and green controls vertical displacement;
the midpoint value `128` is approximately neutral. Scale uses logical pixels,
while offset uses normalized map coordinates. Use `repeat: false` to clamp the
map at its edges.

The filter does not own `displacementGraphic`. Keep the graphic or its asset
bundle loaded until all referencing filters have been removed or destroyed.
Conversely, destroying a sprite or camera releases its filter bindings without
destroying the shared map. Padding does not grow when `setScale()` changes, so
choose it for the largest animated scale to prevent clipping.

## Explicit filter areas

Pixi normally measures filtered bounds every rendered frame. For a known-size
sprite or composite, define the participating content rectangle in local render
coordinates:

```ts
const panel = new FlxSpriteContainer(200, 100);
panel.filters = [new FlxBlurFilter(4)];
panel.setFilterArea(0, 0, 320, 180);

// Return to safe automatic bounds measurement.
panel.clearFilterArea();
```

The engine clones the input and creates a separate renderer rectangle for every
camera projection. Pixi transforms that local rectangle with the object, so do
not subtract camera scroll or apply zoom yourself. Filter padding is applied
afterward; the area should describe the unfiltered local content.

An explicit area improves CPU cost by avoiding recursive bounds traversal, but
an area that is too small or stale clips visual output. Prefer automatic bounds
for dynamic composites unless maintaining the rectangle is cheaper and
reliable. The setting affects only filter rendering—not collision, input,
culling, or `onScreen()` checks. It is dormant while the filter list is empty
and becomes active again when filters are assigned.

Filters render through intermediate framebuffers. Prefer one filter on a
`FlxSpriteContainer` when the same effect applies to several children, keep
blur quality as low as the art permits, and avoid replacing descriptors every
frame. Use explicit areas for measured bounds-traversal bottlenecks rather than
adding them to every filtered sprite by default.
