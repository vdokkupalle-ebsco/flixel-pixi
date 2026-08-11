import {
  BlurFilter,
  ColorMatrixFilter,
  defaultFilterVert,
  Filter,
  UniformGroup,
  type ColorMatrix,
  type Container,
  type ShaderFromResources,
  type UniformData,
} from 'pixi.js';

import {
  FlxBlurFilter,
  FlxColorMatrixFilter,
  FlxShaderFilter,
  readFlxShaderUniforms,
  type FlxFilter,
} from './flx-filter';

interface MaterializedFilter {
  readonly filter: Filter;
  sync(): void;
}

/** @internal Adapter-owned materialization of renderer-neutral filters. */
export class FlxFilterChain {
  #source: readonly FlxFilter[] | null = null;
  #filters: MaterializedFilter[] = [];

  sync(view: Container, source: readonly FlxFilter[]): void {
    if (source !== this.#source) {
      this.#release(view);
      this.#source = source;
      this.#filters = source.map(materializeFilter);
      view.filters =
        this.#filters.length > 0
          ? this.#filters.map((entry) => entry.filter)
          : null;
    }
    for (const filter of this.#filters) filter.sync();
  }

  destroy(view: Container): void {
    this.#release(view);
    this.#source = null;
  }

  #release(view: Container): void {
    view.filters = null;
    for (const { filter } of this.#filters) filter.destroy();
    this.#filters = [];
  }
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
  if (filter instanceof FlxShaderFilter) return materializeShaderFilter(filter);
  throw new TypeError('Unsupported FlxFilter descriptor.');
}

function staticFilter(filter: Filter): MaterializedFilter {
  return { filter, sync: () => undefined };
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
