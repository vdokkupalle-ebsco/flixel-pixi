# Filters

`FlxSprite.filters` accepts immutable renderer-neutral descriptors. Game code
does not import or own Pixi filters:

```ts
const ghost = new FlxSprite(80, 80).makeGraphic(48, 48, 0x38bdf8ff);
ghost.filters = [FlxColorMatrixFilter.grayscale(0.8)];

const panel = new FlxSpriteContainer(200, 100);
panel.add(icon);
panel.add(label);
panel.filters = [new FlxBlurFilter(4, { quality: 2 })];
```

Descriptor order is filter order. Assign a new list to change an effect; lists
and descriptors are immutable so the renderer can rebuild only when identity
changes:

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

Filters render through intermediate framebuffers. Prefer one filter on a
`FlxSpriteContainer` when the same effect applies to several children, keep
blur quality as low as the art permits, and avoid replacing descriptors every
frame. Displacement textures and explicit filter-area tuning are later
advanced-rendering slices because they require additional ownership and backend
contracts.
