import {
  BlurFilter,
  ColorMatrixFilter,
  defaultFilterVert,
  Filter,
  Rectangle,
  UniformGroup,
  type ColorMatrix,
  type Container,
  type ShaderFromResources,
  type UniformData,
} from 'pixi.js';

import {
  FlxBlurFilter,
  FlxColorMatrixFilter,
  FlxDisplacementFilter,
  FlxShaderFilter,
  readFlxShaderUniforms,
  type FlxFilter,
} from './flx-filter';
import type { RectangleLike } from '../math/flx-rect';

interface MaterializedFilter {
  readonly filter: Filter;
  destroy(): void;
  sync(): void;
}

/** @internal Adapter-owned materialization of renderer-neutral filters. */
export class FlxFilterChain {
  #area: Rectangle | null = null;
  #areaSource: Readonly<RectangleLike> | null = null;
  #source: readonly FlxFilter[] | null = null;
  #filters: MaterializedFilter[] = [];

  sync(
    view: Container,
    source: readonly FlxFilter[],
    area: Readonly<RectangleLike> | null = null,
  ): void {
    if (source !== this.#source) {
      this.#release(view);
      this.#source = source;
      this.#filters = source.map(materializeFilter);
      view.filters =
        this.#filters.length > 0
          ? this.#filters.map((entry) => entry.filter)
          : null;
    }
    this.#syncArea(view, source.length > 0 ? area : null);
    for (const filter of this.#filters) filter.sync();
  }

  destroy(view: Container): void {
    this.#release(view);
    this.#source = null;
    this.#areaSource = null;
    this.#area = null;
  }

  #release(view: Container): void {
    view.filters = null;
    clearFilterArea(view);
    this.#areaSource = null;
    for (const filter of this.#filters) filter.destroy();
    this.#filters = [];
  }

  #syncArea(view: Container, source: Readonly<RectangleLike> | null): void {
    if (source === this.#areaSource) return;
    this.#areaSource = source;
    if (source === null) {
      clearFilterArea(view);
      return;
    }
    this.#area ??= new Rectangle();
    this.#area.x = source.x;
    this.#area.y = source.y;
    this.#area.width = source.width;
    this.#area.height = source.height;
    view.filterArea = this.#area;
  }
}

function clearFilterArea(view: Container): void {
  view.filterArea = null as unknown as Rectangle;
}

function materializeFilter(filter: FlxFilter): MaterializedFilter {
  if (filter instanceof FlxBlurFilter) {
    const pixiFilter = new BlurFilter({
      quality: filter.quality,
      strength: filter.strength,
    });
    pixiFilter.repeatEdgePixels = filter.repeatEdgePixels;
    return staticFilter(pixiFilter);
  }
  if (filter instanceof FlxColorMatrixFilter) {
    const pixiFilter = new ColorMatrixFilter();
    pixiFilter.matrix = [...filter.matrix] as unknown as ColorMatrix;
    pixiFilter.alpha = filter.alpha;
    return staticFilter(pixiFilter);
  }
  if (filter instanceof FlxDisplacementFilter) {
    return materializeDisplacementFilter(filter);
  }
  if (filter instanceof FlxShaderFilter) return materializeShaderFilter(filter);
  throw new TypeError('Unsupported FlxFilter descriptor.');
}

function staticFilter(filter: Filter): MaterializedFilter {
  return {
    filter,
    destroy: () => filter.destroy(),
    sync: () => undefined,
  };
}

function materializeDisplacementFilter(
  descriptor: FlxDisplacementFilter,
): MaterializedFilter {
  const uniformGroup = new UniformGroup({
    uOffset: {
      type: 'vec2<f32>',
      value: new Float32Array([descriptor.offsetX, descriptor.offsetY]),
    },
    uRepeat: { type: 'f32', value: descriptor.repeat ? 1 : 0 },
    uScale: {
      type: 'vec2<f32>',
      value: new Float32Array([descriptor.scaleX, descriptor.scaleY]),
    },
  });
  const mapSource = descriptor.map.texture.source;
  const filter = Filter.from({
    gl: {
      vertex: defaultFilterVert,
      fragment: displacementFragment,
    },
    gpu: {
      vertex: { source: displacementWgsl, entryPoint: 'mainVertex' },
      fragment: { source: displacementWgsl, entryPoint: 'mainFragment' },
    },
    padding: descriptor.padding,
    resources: {
      flxDisplacementUniforms: uniformGroup,
      uMapSampler: mapSource.style,
      uMapTexture: mapSource,
    },
  });
  let revision = descriptor.revision;
  return {
    filter,
    destroy: () => filter.destroy(),
    sync() {
      if (descriptor.map.destroyed) {
        throw new Error(
          'A displacement map must outlive every filter that references it.',
        );
      }
      if (revision === descriptor.revision) return;
      const offset = uniformGroup.uniforms.uOffset as Float32Array;
      const scale = uniformGroup.uniforms.uScale as Float32Array;
      offset[0] = descriptor.offsetX;
      offset[1] = descriptor.offsetY;
      scale[0] = descriptor.scaleX;
      scale[1] = descriptor.scaleY;
      uniformGroup.update();
      revision = descriptor.revision;
    },
  };
}

function materializeShaderFilter(
  descriptor: FlxShaderFilter,
): MaterializedFilter {
  const source = readFlxShaderUniforms(descriptor.uniforms);
  const structures: Record<string, UniformData> = {};
  for (const [name, uniform] of Object.entries(source.entries)) {
    structures[name] = {
      type: uniform.type,
      value: cloneRendererValue(uniform.value),
    };
  }
  const uniformGroup = new UniformGroup(structures);
  const programs = shaderPrograms(descriptor);
  const filter = Filter.from({
    ...programs,
    padding: descriptor.padding,
    resolution: descriptor.resolution,
    resources: { flxShaderUniforms: uniformGroup },
  });
  let revision = source.revision;
  return {
    filter,
    destroy: () => filter.destroy(),
    sync() {
      if (revision === source.revision) return;
      for (const [name, uniform] of Object.entries(source.entries)) {
        uniformGroup.uniforms[name] = cloneRendererValue(uniform.value);
      }
      uniformGroup.update();
      revision = source.revision;
    },
  };
}

const displacementFragment = `
  precision highp float;
  in vec2 vTextureCoord;
  out vec4 finalColor;
  uniform sampler2D uTexture;
  uniform sampler2D uMapTexture;
  uniform vec4 uInputSize;
  uniform vec4 uInputClamp;
  uniform vec4 uOutputFrame;
  uniform vec2 uOffset;
  uniform vec2 uScale;
  uniform float uRepeat;

  void main(void) {
    vec2 mapCoord = vTextureCoord * uInputSize.xy / uOutputFrame.zw + uOffset;
    vec2 clampedCoord = clamp(mapCoord, vec2(0.0), vec2(1.0));
    mapCoord = mix(clampedCoord, fract(mapCoord), uRepeat);
    vec2 displacement = (texture(uMapTexture, mapCoord).rg * 2.0 - 1.0)
      * uScale * uInputSize.zw;
    vec2 inputCoord = clamp(
      vTextureCoord + displacement,
      uInputClamp.xy,
      uInputClamp.zw
    );
    finalColor = texture(uTexture, inputCoord);
  }
`;

const displacementWgsl = `
  struct GlobalFilterUniforms {
    uInputSize: vec4<f32>,
    uInputPixel: vec4<f32>,
    uInputClamp: vec4<f32>,
    uOutputFrame: vec4<f32>,
    uGlobalFrame: vec4<f32>,
    uOutputTexture: vec4<f32>,
  };
  struct FlxDisplacementUniforms {
    uOffset: vec2<f32>,
    uRepeat: f32,
    uScale: vec2<f32>,
  };
  @group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;
  @group(0) @binding(1) var uTexture: texture_2d<f32>;
  @group(0) @binding(2) var uSampler: sampler;
  @group(1) @binding(0) var<uniform> flxDisplacementUniforms: FlxDisplacementUniforms;
  @group(1) @binding(1) var uMapTexture: texture_2d<f32>;
  @group(1) @binding(2) var uMapSampler: sampler;

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
    var mapCoord = uv * gfu.uInputSize.xy / gfu.uOutputFrame.zw
      + flxDisplacementUniforms.uOffset;
    if (flxDisplacementUniforms.uRepeat > 0.5) {
      mapCoord = fract(mapCoord);
    } else {
      mapCoord = clamp(mapCoord, vec2(0.0), vec2(1.0));
    }
    let map = textureSample(uMapTexture, uMapSampler, mapCoord);
    let displacement = (map.rg * 2.0 - 1.0)
      * flxDisplacementUniforms.uScale * gfu.uInputSize.zw;
    let inputCoord = clamp(
      uv + displacement,
      gfu.uInputClamp.xy,
      gfu.uInputClamp.zw
    );
    return textureSample(uTexture, uSampler, inputCoord);
  }
`;

function shaderPrograms(descriptor: FlxShaderFilter): ShaderFromResources {
  const gl = descriptor.webGL
    ? { vertex: defaultFilterVert, fragment: descriptor.webGL.fragment }
    : undefined;
  const gpu = descriptor.webGPU
    ? {
        vertex: {
          source: descriptor.webGPU.source,
          entryPoint: descriptor.webGPU.vertexEntryPoint ?? 'mainVertex',
        },
        fragment: {
          source: descriptor.webGPU.source,
          entryPoint: descriptor.webGPU.fragmentEntryPoint ?? 'mainFragment',
        },
      }
    : undefined;
  if (gl && gpu) return { gl, gpu };
  if (gl) return { gl };
  if (gpu) return { gpu };
  throw new TypeError('A shader filter requires a renderer program.');
}

function cloneRendererValue<T extends number | Float32Array | Int32Array>(
  value: T,
): T {
  if (typeof value === 'number') return value;
  return value.slice() as T;
}
