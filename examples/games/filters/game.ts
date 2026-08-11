import {
  FlxBlurFilter,
  FlxColorMatrixFilter,
  FlxDisplacementFilter,
  FlxG,
  FlxGraphic,
  FlxShaderFilter,
  FlxSprite,
  FlxSpriteContainer,
  FlxState,
  FlxText,
  makeGraphicPixels,
} from '../../../src';

export interface FilterShowcaseSnapshot {
  blurEnabled: boolean;
  compositeFilters: number;
  displacementRevision: number;
  displacementScale: readonly [number, number];
  explicitArea: boolean;
  grayscaleFilters: number;
  shaderRenderers: readonly ('webgl' | 'webgpu')[];
  shaderRevision: number;
  shaderStrength: number;
}

function label(state: FlxState, x: number, text: string, y = 214): void {
  state.add(
    new FlxText(x - 25, y, 120, text).setFormat(
      undefined,
      11,
      0xffe2e8f0,
      'center',
    ),
  );
}

/** Public-API showcase for renderer-neutral sprite and composite filters. */
export class FilterShowcaseState extends FlxState {
  readonly grayscale = new FlxSprite(165, 116);
  readonly blurred = new FlxSprite(280, 116);
  readonly shaderSprite = new FlxSprite(395, 116);
  readonly composite = new FlxSpriteContainer(510, 116);
  readonly displaced = new FlxSpriteContainer(280, 232);
  readonly displacementMap = createDisplacementMap();
  readonly displacement = new FlxDisplacementFilter(this.displacementMap, {
    padding: 8,
    scale: { x: 8, y: 4 },
  });
  readonly shader = new FlxShaderFilter({
    webGL: { fragment: waveFragment },
    webGPU: { source: waveWgsl },
    uniforms: {
      uTime: { type: 'f32', value: 0 },
      uStrength: { type: 'f32', value: 0.7 },
    },
  });
  blurEnabled = true;
  explicitArea = true;
  shaderStrength = 0.7;
  shaderTime = 0;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff07111f;
    this.add(
      new FlxText(24, 20, 592, 'FILTERS + COLOR MATRIX').setFormat(
        undefined,
        17,
        0xfff8fafc,
        'left',
      ),
    );
    this.add(
      new FlxText(
        24,
        49,
        592,
        'Renderer-neutral descriptors · camera-local Pixi resources · live parameters',
      ).setFormat(undefined, 10, 0xff38bdf8, 'left'),
    );

    this.add(new FlxSprite(50, 116).makeGraphic(70, 70, 0xef4444ff));
    label(this, 50, 'Original');

    this.grayscale.makeGraphic(70, 70, 0xef4444ff);
    this.grayscale.filters = [FlxColorMatrixFilter.grayscale()];
    this.add(this.grayscale);
    label(this, 165, 'Grayscale');

    this.blurred.makeGraphic(70, 70, 0x22d3eeff);
    this.#syncBlur();
    this.add(this.blurred);
    label(this, 280, 'Blur');

    this.shaderSprite.makeGraphic(70, 70, 0xa855f7ff);
    this.shaderSprite.filters = [this.shader];
    this.add(this.shaderSprite);
    label(this, 395, 'Live shader');

    this.composite.add(new FlxSprite(0, 0).makeGraphic(48, 70, 0xfacc15ff));
    this.composite.add(new FlxSprite(28, 18).makeGraphic(48, 52, 0xf472b6ff));
    this.composite.filters = [FlxColorMatrixFilter.grayscale(0.65)];
    this.#syncFilterArea();
    this.add(this.composite);
    label(this, 510, 'Composite');

    const colors = [0x38bdf8ff, 0xa855f7ff, 0xf472b6ff, 0xfacc15ff, 0x4ade80ff];
    colors.forEach((color, index) => {
      this.displaced.add(
        new FlxSprite(index * 14, 0).makeGraphic(14, 62, color),
      );
    });
    this.displaced.filters = [this.displacement];
    this.add(this.displaced);
    label(this, 280, 'Scrolling displacement', 308);
  }

  override update(): void {
    super.update();
    this.shaderTime += FlxG.elapsed;
    this.shader.uniforms.set('uTime', this.shaderTime);
    this.displacement.setOffset(this.shaderTime * 0.12, 0);
  }

  override destroy(): void {
    super.destroy();
    this.displacementMap.destroy();
  }

  setBlurEnabled(enabled: boolean): void {
    this.blurEnabled = enabled;
    this.#syncBlur();
  }

  setShaderStrength(strength: number): void {
    this.shaderStrength = strength;
    this.shader.uniforms.set('uStrength', strength);
  }

  setExplicitArea(enabled: boolean): void {
    this.explicitArea = enabled;
    this.#syncFilterArea();
  }

  snapshot(): FilterShowcaseSnapshot {
    return {
      blurEnabled: this.blurEnabled,
      compositeFilters: this.composite.filters.length,
      displacementRevision: this.displacement.revision,
      displacementScale: [this.displacement.scaleX, this.displacement.scaleY],
      explicitArea: this.explicitArea,
      grayscaleFilters: this.grayscale.filters.length,
      shaderRenderers: this.shader.compatibleRenderers,
      shaderRevision: this.shader.uniforms.revision,
      shaderStrength: this.shaderStrength,
    };
  }

  #syncBlur(): void {
    this.blurred.filters = this.blurEnabled
      ? [new FlxBlurFilter(7, { quality: 3 })]
      : [];
  }

  #syncFilterArea(): void {
    if (this.explicitArea) this.composite.setFilterArea(0, 0, 76, 70);
    else this.composite.clearFilterArea();
  }
}

function createDisplacementMap(): FlxGraphic {
  const pixels = makeGraphicPixels(32, 32, 0x808080ff);
  for (let y = 0; y < pixels.height; y += 1) {
    for (let x = 0; x < pixels.width; x += 1) {
      const red = Math.round(127.5 + Math.sin((y / 32) * Math.PI * 4) * 127.5);
      const green = Math.round(
        127.5 + Math.cos((x / 32) * Math.PI * 4) * 127.5,
      );
      pixels.data[y * pixels.width + x] =
        ((red << 24) | (green << 16) | 0x80ff) >>> 0;
    }
  }
  return FlxGraphic.fromPixels(pixels, 'filter-displacement-map');
}

const waveFragment = `
  in vec2 vTextureCoord;
  out vec4 finalColor;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uStrength;

  void main(void) {
    vec4 color = texture(uTexture, vTextureCoord);
    float pulse = 0.5 + 0.5 * sin(uTime * 4.0 + vTextureCoord.y * 18.0);
    vec3 shifted = vec3(color.b, color.r, color.g);
    finalColor = vec4(mix(color.rgb, shifted, pulse * uStrength), color.a);
  }
`;

const waveWgsl = `
  struct GlobalFilterUniforms {
    uInputSize: vec4<f32>,
    uInputPixel: vec4<f32>,
    uInputClamp: vec4<f32>,
    uOutputFrame: vec4<f32>,
    uGlobalFrame: vec4<f32>,
    uOutputTexture: vec4<f32>,
  };
  struct FlxShaderUniforms {
    uTime: f32,
    uStrength: f32,
  };
  @group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;
  @group(0) @binding(1) var uTexture: texture_2d<f32>;
  @group(0) @binding(2) var uSampler: sampler;
  @group(1) @binding(0) var<uniform> flxShaderUniforms: FlxShaderUniforms;

  struct VSOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
  };

  fn filterVertexPosition(position: vec2<f32>) -> vec4<f32> {
    var output = position * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;
    output.x = output.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
    output.y = output.y * (2.0 * gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;
    return vec4(output, 0.0, 1.0);
  }

  @vertex fn mainVertex(@location(0) position: vec2<f32>) -> VSOutput {
    let uv = position * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);
    return VSOutput(filterVertexPosition(position), uv);
  }

  @fragment fn mainFragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let color = textureSample(uTexture, uSampler, uv);
    let pulse = 0.5 + 0.5 * sin(flxShaderUniforms.uTime * 4.0 + uv.y * 18.0);
    let shifted = vec3(color.b, color.r, color.g);
    return vec4(mix(color.rgb, shifted, pulse * flxShaderUniforms.uStrength), color.a);
  }
`;
