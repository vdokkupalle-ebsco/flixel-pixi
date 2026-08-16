# PixiJS Filters & Shaders

Flixel-Pixi integrates directly with PixiJS v8's post-processing filter pipeline, providing `FlxBlurFilter`, `FlxColorMatrixFilter`, `FlxDisplacementFilter`, and custom `FlxShaderFilter`.

---

## 1. Built-in Filters

```ts
import { FlxBlurFilter, FlxColorMatrixFilter } from 'flixel-pixi';

// 1. Motion/Gaussian Blur
const blur = new FlxBlurFilter({ strength: 4, quality: 3 });
this.player.filters = [blur];

// 2. Grayscale / Sepia Color Matrix
const colorMatrix = new FlxColorMatrixFilter();
colorMatrix.desaturate(); // Or .sepia(), .negative(), .brightness(1.5)
this.camera.filters = [colorMatrix];
```

---

## 2. Water / Heat Displacement Maps

```ts
import { FlxDisplacementFilter } from 'flixel-pixi';

const waterFilter = new FlxDisplacementFilter(
  'assets/displacement_map.png',
  20,
);
this.background.filters = [waterFilter];
```

---

## 3. Custom GLSL / WGSL Shader Filters

```ts
import { FlxShaderFilter } from 'flixel-pixi';

const crtShader = new FlxShaderFilter({
  gl: {
    fragment: `
      precision mediump float;
      in vec2 vTextureCoord;
      out vec4 finalColor;
      uniform sampler2D uTexture;
      uniform float uTime;

      void main() {
        vec2 uv = vTextureCoord;
        float scanline = sin(uv.y * 400.0 + uTime * 5.0) * 0.08;
        vec4 color = texture(uTexture, uv);
        finalColor = color - scanline;
      }
    `,
  },
  uniforms: {
    uTime: { value: 0 },
  },
});

this.camera.filters = [crtShader];
```
