import type { FlxGraphic } from '../assets/flx-graphic';

/** Options for {@link FlxBlurFilter}. @public */
export interface FlxBlurFilterOptions {
  /** Number of blur passes. Defaults to 4. */
  quality?: number;
  /** Clamp samples to edge pixels instead of transparent space. */
  repeatEdgePixels?: boolean;
}

/** Renderer-neutral blur effect descriptor. @public */
export class FlxBlurFilter {
  readonly kind = 'blur';
  readonly quality: number;
  readonly repeatEdgePixels: boolean;
  readonly strength: number;

  constructor(strength = 4, options: FlxBlurFilterOptions = {}) {
    const { quality = 4, repeatEdgePixels = false } = options;
    if (!Number.isFinite(strength) || strength < 0) {
      throw new RangeError(
        'Blur strength must be a non-negative finite number.',
      );
    }
    if (!Number.isInteger(quality) || quality < 1) {
      throw new RangeError('Blur quality must be a positive integer.');
    }
    this.strength = strength;
    this.quality = quality;
    this.repeatEdgePixels = repeatEdgePixels;
    Object.freeze(this);
  }
}

/** Renderer-neutral 4×5 color-matrix effect descriptor. @public */
export class FlxColorMatrixFilter {
  readonly kind = 'color-matrix';
  readonly alpha: number;
  readonly matrix: readonly number[];

  constructor(matrix: readonly number[], alpha = 1) {
    if (
      matrix.length !== 20 ||
      matrix.some((value) => !Number.isFinite(value))
    ) {
      throw new RangeError('Color matrix must contain 20 finite numbers.');
    }
    if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
      throw new RangeError('Color matrix alpha must be between 0 and 1.');
    }
    this.matrix = Object.freeze([...matrix]);
    this.alpha = alpha;
    Object.freeze(this);
  }

  /** Standard luminance-preserving grayscale transform. */
  static grayscale(alpha = 1): FlxColorMatrixFilter {
    return new FlxColorMatrixFilter(
      [
        0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0.2126,
        0.7152, 0.0722, 0, 0, 0, 0, 1, 0, 0,
      ],
      alpha,
    );
  }
}

/** Point-like input used by displacement scale and texture offset. @public */
export interface FlxDisplacementPoint {
  /** Horizontal component. */
  readonly x: number;
  /** Vertical component. */
  readonly y: number;
}

/** Options for {@link FlxDisplacementFilter}. @public */
export interface FlxDisplacementFilterOptions {
  /** Pixel displacement; a number applies equally to both axes. Defaults to 20. */
  readonly scale?: number | FlxDisplacementPoint;
  /** Normalized map-texture offset. Defaults to `{ x: 0, y: 0 }`. */
  readonly offset?: FlxDisplacementPoint;
  /** Repeat the map outside its normalized bounds. Defaults to true. */
  readonly repeat?: boolean;
  /** Extra logical pixels rendered around the object. Defaults to the scale. */
  readonly padding?: number;
}

/** Texture-backed displacement effect with revisioned runtime parameters. @public */
export class FlxDisplacementFilter {
  /** Discriminator used by renderer adapters. */
  readonly kind = 'displacement';
  /** Non-owning displacement-map reference. */
  readonly map: FlxGraphic;
  /** Fixed logical padding reserved around the filtered object. */
  readonly padding: number;
  /** Whether normalized map coordinates repeat instead of clamp. */
  readonly repeat: boolean;
  #offsetX: number;
  #offsetY: number;
  #revision = 0;
  #scaleX: number;
  #scaleY: number;

  constructor(map: FlxGraphic, options: FlxDisplacementFilterOptions = {}) {
    if (map.destroyed) {
      throw new TypeError('Displacement map graphic has been destroyed.');
    }
    const scale = normalizePoint(options.scale ?? 20, 'Displacement scale');
    const offset = normalizePoint(
      options.offset ?? { x: 0, y: 0 },
      'Displacement offset',
    );
    const padding =
      options.padding ?? Math.max(Math.abs(scale.x), Math.abs(scale.y));
    if (!Number.isFinite(padding) || padding < 0) {
      throw new RangeError(
        'Displacement padding must be a non-negative finite number.',
      );
    }
    this.map = map;
    this.#scaleX = scale.x;
    this.#scaleY = scale.y;
    this.#offsetX = offset.x;
    this.#offsetY = offset.y;
    this.repeat = options.repeat ?? true;
    this.padding = padding;
    Object.freeze(this);
  }

  /** Horizontal displacement in logical pixels. */
  get scaleX(): number {
    return this.#scaleX;
  }

  /** Vertical displacement in logical pixels. */
  get scaleY(): number {
    return this.#scaleY;
  }

  /** Horizontal normalized map offset. */
  get offsetX(): number {
    return this.#offsetX;
  }

  /** Vertical normalized map offset. */
  get offsetY(): number {
    return this.#offsetY;
  }

  /** Monotonic parameter change counter used by renderer adapters. */
  get revision(): number {
    return this.#revision;
  }

  /** Change pixel displacement without rebuilding the filter chain. */
  setScale(x: number, y = x): this {
    validateFinitePair(x, y, 'Displacement scale');
    if (x === this.#scaleX && y === this.#scaleY) return this;
    this.#scaleX = x;
    this.#scaleY = y;
    this.#revision += 1;
    return this;
  }

  /** Scroll the displacement map in normalized texture coordinates. */
  setOffset(x: number, y: number): this {
    validateFinitePair(x, y, 'Displacement offset');
    if (x === this.#offsetX && y === this.#offsetY) return this;
    this.#offsetX = x;
    this.#offsetY = y;
    this.#revision += 1;
    return this;
  }
}

/** Uniform data types supported by {@link FlxShaderFilter}. @public */
export type FlxShaderUniformType =
  | 'f32'
  | 'i32'
  | 'vec2<f32>'
  | 'vec3<f32>'
  | 'vec4<f32>'
  | 'vec2<i32>'
  | 'vec3<i32>'
  | 'vec4<i32>'
  | 'mat2x2<f32>'
  | 'mat3x3<f32>'
  | 'mat4x4<f32>';

/** Type-safe JavaScript value for a shader uniform type. @public */
export type FlxShaderUniformValue<T extends FlxShaderUniformType> = T extends
  'f32' | 'i32'
  ? number
  : T extends 'vec2<f32>' | 'vec2<i32>'
    ? readonly [number, number]
    : T extends 'vec3<f32>' | 'vec3<i32>'
      ? readonly [number, number, number]
      : T extends 'vec4<f32>' | 'vec4<i32>' | 'mat2x2<f32>'
        ? readonly [number, number, number, number]
        : T extends 'mat3x3<f32>'
          ? readonly [
              number,
              number,
              number,
              number,
              number,
              number,
              number,
              number,
              number,
            ]
          : readonly [
              number,
              number,
              number,
              number,
              number,
              number,
              number,
              number,
              number,
              number,
              number,
              number,
              number,
              number,
              number,
              number,
            ];

/** Initial type and value for one shader uniform. @public */
export interface FlxShaderUniformDefinition<
  T extends FlxShaderUniformType = FlxShaderUniformType,
> {
  /** Scalar, vector, or matrix storage type shared by GLSL and WGSL. */
  readonly type: T;
  /** Initial value; vector and matrix lengths are checked at compile time. */
  readonly value: FlxShaderUniformValue<T>;
}

/** Named shader-uniform schema inferred by {@link FlxShaderFilter}. @public */
export type FlxShaderUniformSchema = Record<string, FlxShaderUniformDefinition>;

type StoredUniformValue = number | Float32Array | Int32Array;
interface StoredUniform {
  readonly type: FlxShaderUniformType;
  value: StoredUniformValue;
}
interface StoredUniformState {
  readonly entries: Record<string, StoredUniform>;
  revision: number;
}

const shaderUniformStates = new WeakMap<
  FlxShaderUniforms<FlxShaderUniformSchema>,
  StoredUniformState
>();

/** Mutable, type-checked values shared by every projection of a shader filter. @public */
export class FlxShaderUniforms<
  TSchema extends FlxShaderUniformSchema = FlxShaderUniformSchema,
> {
  constructor(schema: TSchema) {
    const entries: Record<string, StoredUniform> = {};
    for (const [name, definition] of Object.entries(schema)) {
      validateUniformName(name);
      entries[name] = {
        type: definition.type,
        value: normalizeUniformValue(
          definition.type,
          definition.value as FlxShaderUniformValue<FlxShaderUniformType>,
        ),
      };
    }
    shaderUniformStates.set(this as FlxShaderUniforms<FlxShaderUniformSchema>, {
      entries,
      revision: 0,
    });
  }

  /** Monotonic change counter used to avoid redundant renderer updates. */
  get revision(): number {
    return getUniformState(this).revision;
  }

  /** Read one value without exposing the renderer-owned backing array. */
  get<K extends keyof TSchema>(
    name: K,
  ): FlxShaderUniformValue<TSchema[K]['type']> {
    const uniform = getNamedUniform(this, String(name));
    return clonePublicUniformValue(uniform.value) as FlxShaderUniformValue<
      TSchema[K]['type']
    >;
  }

  /** Update one value without rebuilding shader programs or filter chains. */
  set<K extends keyof TSchema>(
    name: K,
    value: FlxShaderUniformValue<TSchema[K]['type']>,
  ): this {
    const state = getUniformState(this);
    const uniform = getNamedUniform(this, String(name));
    uniform.value = normalizeUniformValue(
      uniform.type,
      value as FlxShaderUniformValue<FlxShaderUniformType>,
    );
    state.revision += 1;
    return this;
  }
}

/** WebGL fragment program for a custom filter. @public */
export interface FlxShaderWebGLProgram {
  /** GLSL fragment source using Pixi's filter uniforms and `vTextureCoord`. */
  readonly fragment: string;
}

/** Combined WebGPU program for a custom filter. @public */
export interface FlxShaderWebGPUProgram {
  /** WGSL source containing both vertex and fragment entry points. */
  readonly source: string;
  /** Vertex entry point. Defaults to `mainVertex`. */
  readonly vertexEntryPoint?: string;
  /** Fragment entry point. Defaults to `mainFragment`. */
  readonly fragmentEntryPoint?: string;
}

/** Options for {@link FlxShaderFilter}. @public */
export interface FlxShaderFilterOptions<
  TSchema extends FlxShaderUniformSchema = FlxShaderUniformSchema,
> {
  /** WebGL program. Omit only when the effect intentionally targets WebGPU. */
  readonly webGL?: FlxShaderWebGLProgram;
  /** WebGPU program. Omit only when the effect intentionally targets WebGL. */
  readonly webGPU?: FlxShaderWebGPUProgram;
  /** Typed uniforms exposed to both renderer programs. */
  readonly uniforms?: TSchema;
  /** Extra logical pixels rendered around the object. Defaults to 0. */
  readonly padding?: number;
  /** Filter render-target resolution multiplier. Defaults to 1. */
  readonly resolution?: number;
}

/** Renderer-neutral custom filter descriptor with typed runtime uniforms. @public */
export class FlxShaderFilter<
  TSchema extends FlxShaderUniformSchema = FlxShaderUniformSchema,
> {
  /** Discriminator used by renderer adapters. */
  readonly kind = 'shader';
  /** Extra logical pixels rendered around the filtered object. */
  readonly padding: number;
  /** Filter render-target resolution multiplier. */
  readonly resolution: number;
  /** Runtime values shared logically by all camera projections. */
  readonly uniforms: FlxShaderUniforms<TSchema>;
  /** Optional GLSL program declaration. */
  readonly webGL?: Readonly<FlxShaderWebGLProgram>;
  /** Optional WGSL program declaration. */
  readonly webGPU?: Readonly<FlxShaderWebGPUProgram>;

  constructor(options: FlxShaderFilterOptions<TSchema>) {
    if (!options.webGL && !options.webGPU) {
      throw new TypeError(
        'A shader filter requires a WebGL or WebGPU program.',
      );
    }
    const { padding = 0, resolution = 1 } = options;
    if (!Number.isFinite(padding) || padding < 0) {
      throw new RangeError('Shader padding must be a non-negative number.');
    }
    if (!Number.isFinite(resolution) || resolution <= 0) {
      throw new RangeError('Shader resolution must be a positive number.');
    }
    if (options.webGL) {
      validateShaderSource(options.webGL.fragment, 'WebGL fragment');
      this.webGL = Object.freeze({ ...options.webGL });
    }
    if (options.webGPU) {
      validateShaderSource(options.webGPU.source, 'WebGPU');
      this.webGPU = Object.freeze({ ...options.webGPU });
    }
    this.uniforms = new FlxShaderUniforms((options.uniforms ?? {}) as TSchema);
    this.padding = padding;
    this.resolution = resolution;
    Object.freeze(this);
  }

  /** Renderer backends for which source code was supplied. */
  get compatibleRenderers(): readonly ('webgl' | 'webgpu')[] {
    return [
      ...(this.webGL ? (['webgl'] as const) : []),
      ...(this.webGPU ? (['webgpu'] as const) : []),
    ];
  }
}

/** Built-in renderer-neutral sprite effects. @public */
export type FlxFilter =
  | FlxBlurFilter
  | FlxColorMatrixFilter
  | FlxDisplacementFilter
  | FlxShaderFilter;

/** @internal */
export function readFlxShaderUniforms(
  uniforms: FlxShaderUniforms,
): Readonly<StoredUniformState> {
  return getUniformState(uniforms);
}

function getUniformState(uniforms: FlxShaderUniforms): StoredUniformState {
  const state = shaderUniformStates.get(uniforms);
  if (!state) throw new TypeError('Unknown shader uniform state.');
  return state;
}

function getNamedUniform(
  uniforms: FlxShaderUniforms,
  name: string,
): StoredUniform {
  const uniform = getUniformState(uniforms).entries[name];
  if (!uniform) throw new RangeError(`Unknown shader uniform: ${name}`);
  return uniform;
}

function validateUniformName(name: string): void {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new TypeError(`Invalid shader uniform name: ${name}`);
  }
}

function validateShaderSource(source: string, label: string): void {
  if (source.trim().length === 0) {
    throw new TypeError(`${label} shader source cannot be empty.`);
  }
}

function normalizeUniformValue(
  type: FlxShaderUniformType,
  value: FlxShaderUniformValue<FlxShaderUniformType>,
): StoredUniformValue {
  const expected = uniformElementCount(type);
  if (expected === 1) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError(`${type} uniforms require one finite number.`);
    }
    if (type === 'i32' && !Number.isInteger(value)) {
      throw new TypeError('i32 uniforms require an integer.');
    }
    return value;
  }
  if (!Array.isArray(value) || value.length !== expected) {
    throw new TypeError(`${type} uniforms require ${expected} values.`);
  }
  if (value.some((element) => !Number.isFinite(element))) {
    throw new TypeError(`${type} uniforms require finite values.`);
  }
  if (type.endsWith('<i32>')) {
    if (value.some((element) => !Number.isInteger(element))) {
      throw new TypeError(`${type} uniforms require integer values.`);
    }
    return new Int32Array(value);
  }
  return new Float32Array(value);
}

function uniformElementCount(type: FlxShaderUniformType): number {
  if (type === 'f32' || type === 'i32') return 1;
  if (type.startsWith('vec2')) return 2;
  if (type.startsWith('vec3')) return 3;
  if (type.startsWith('vec4')) return 4;
  if (type === 'mat2x2<f32>') return 4;
  if (type === 'mat3x3<f32>') return 9;
  return 16;
}

function clonePublicUniformValue(
  value: StoredUniformValue,
): number | readonly number[] {
  return typeof value === 'number' ? value : [...value];
}

function normalizePoint(
  value: number | FlxDisplacementPoint,
  label: string,
): FlxDisplacementPoint {
  const x = typeof value === 'number' ? value : value.x;
  const y = typeof value === 'number' ? value : value.y;
  validateFinitePair(x, y, label);
  return { x, y };
}

function validateFinitePair(x: number, y: number, label: string): void {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new RangeError(`${label} values must be finite numbers.`);
  }
}
