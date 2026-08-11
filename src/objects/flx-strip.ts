import type { Texture } from 'pixi.js';

import type { FlxGraphic } from '../assets/flx-graphic';
import { FlxG } from '../core/flx-g';
import type { FlxRenderHandle } from '../rendering/flx-render-handle';
import { FlxStripRenderHandle } from '../rendering/flx-strip-render-handle';
import type { FlxCameraLike } from './flx-object';
import { FlxSprite } from './flx-sprite';

/** Supported renderer-neutral triangle connectivity. @public */
export type FlxStripTopology = 'triangle-list' | 'triangle-strip';

/** Geometry accepted by {@link FlxStrip.setGeometry}. @public */
export interface FlxStripGeometry {
  /** Local x/y pairs. At least three vertices are required. */
  readonly vertices: ArrayLike<number>;
  /** Normalized u/v pairs; length must equal `vertices.length`. */
  readonly uvs: ArrayLike<number>;
  /** Vertex indices. Defaults to sequential indices when omitted. */
  readonly indices?: ArrayLike<number>;
  /** Triangle connectivity. Defaults to `triangle-list`. */
  readonly topology?: FlxStripTopology;
}

/**
 * Textured triangle geometry with Flixel object/camera semantics.
 *
 * Geometry inputs are cloned. Prefer {@link FlxStrip.setVertex} /
 * {@link FlxStrip.setUv} for animation. If you mutate a typed-array view
 * directly, call {@link FlxStrip.invalidateGeometry} once after the edits.
 * @public
 */
export class FlxStrip extends FlxSprite {
  #vertices: Float32Array = new Float32Array();
  #uvs: Float32Array = new Float32Array();
  #indices: Uint32Array = new Uint32Array();
  #topology: FlxStripTopology = 'triangle-list';
  #geometryRevision = 0;

  constructor(x = 0, y = 0, simpleGraphic: FlxGraphic | Texture | null = null) {
    super(x, y, simpleGraphic);
    this.setGeometry({
      indices: [0, 1, 2, 0, 2, 3],
      uvs: [0, 0, 1, 0, 1, 1, 0, 1],
      vertices: [
        0,
        0,
        this.frameWidth,
        0,
        this.frameWidth,
        this.frameHeight,
        0,
        this.frameHeight,
      ],
    });
  }

  /** Mutable local x/y storage. Call `invalidateGeometry()` after direct edits. */
  get vertices(): Float32Array {
    return this.#vertices;
  }

  /** Mutable normalized u/v storage. Call `invalidateGeometry()` after direct edits. */
  get uvs(): Float32Array {
    return this.#uvs;
  }

  /** Mutable triangle indices. Call `invalidateGeometry()` after direct edits. */
  get indices(): Uint32Array {
    return this.#indices;
  }

  get topology(): FlxStripTopology {
    return this.#topology;
  }

  /** Monotonic version used by camera-local render adapters. */
  get geometryRevision(): number {
    return this.#geometryRevision;
  }

  /** Validate, clone, and replace all triangle geometry. */
  setGeometry(geometry: FlxStripGeometry): this {
    const vertices = toFloat32(geometry.vertices, 'vertices');
    const uvs = toFloat32(geometry.uvs, 'uvs');
    const topology = geometry.topology ?? 'triangle-list';
    if (topology !== 'triangle-list' && topology !== 'triangle-strip') {
      throw new RangeError(
        `Unsupported FlxStrip topology: ${String(topology)}.`,
      );
    }
    if (vertices.length < 6 || vertices.length % 2 !== 0) {
      throw new RangeError(
        'FlxStrip vertices must contain at least three x/y pairs.',
      );
    }
    if (uvs.length !== vertices.length) {
      throw new RangeError('FlxStrip uvs must match the vertices length.');
    }
    const vertexCount = vertices.length / 2;
    const indices =
      geometry.indices === undefined
        ? Uint32Array.from({ length: vertexCount }, (_, index) => index)
        : toIndices(geometry.indices, vertexCount);
    if (topology === 'triangle-list' && indices.length % 3 !== 0) {
      throw new RangeError(
        'FlxStrip triangle-list indices must contain complete triangles.',
      );
    }
    if (indices.length < 3) {
      throw new RangeError('FlxStrip requires at least three indices.');
    }

    this.#vertices = vertices;
    this.#uvs = uvs;
    this.#indices = indices;
    this.#topology = topology;
    return this.invalidateGeometry();
  }

  /** Update one local vertex and notify every camera adapter. */
  setVertex(index: number, x: number, y: number): this {
    validateVertexIndex(index, this.#vertices.length / 2);
    validateFinite(x, 'x');
    validateFinite(y, 'y');
    this.#vertices[index * 2] = x;
    this.#vertices[index * 2 + 1] = y;
    return this.invalidateGeometry();
  }

  /** Update one normalized texture coordinate and notify every camera adapter. */
  setUv(index: number, u: number, v: number): this {
    validateVertexIndex(index, this.#uvs.length / 2);
    validateFinite(u, 'u');
    validateFinite(v, 'v');
    this.#uvs[index * 2] = u;
    this.#uvs[index * 2 + 1] = v;
    return this.invalidateGeometry();
  }

  /** Mark direct typed-array edits for upload on the next render sync. */
  invalidateGeometry(): this {
    this.#geometryRevision += 1;
    return this;
  }

  /** Cull against transformed geometry; collision bounds remain independent. */
  override onScreen(camera: FlxCameraLike = FlxG.camera): boolean {
    const screen = this.getScreenXY(undefined, camera);
    screen.x -= this.offset.x;
    screen.y -= this.offset.y;
    const radians = (this.angle * Math.PI) / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < this.#vertices.length; index += 2) {
      const sourceX = this.#vertices[index] ?? 0;
      const sourceY = this.#vertices[index + 1] ?? 0;
      const localX =
        ((this.renderFlipped ? this.frameWidth - sourceX : sourceX) -
          this.origin.x) *
        this.scale.x;
      const localY =
        ((this.renderFlippedY ? this.frameHeight - sourceY : sourceY) -
          this.origin.y) *
        this.scale.y;
      const x = screen.x + this.origin.x + localX * cosine - localY * sine;
      const y = screen.y + this.origin.y + localX * sine + localY * cosine;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    return maxX > 0 && minX < camera.width && maxY > 0 && minY < camera.height;
  }

  override createRenderHandle(): FlxRenderHandle {
    return this.trackRenderHandle((onDestroy) => {
      return new FlxStripRenderHandle(this, onDestroy);
    });
  }
}

function toFloat32(values: ArrayLike<number>, label: string): Float32Array {
  const result = Float32Array.from(values);
  for (const value of result) validateFinite(value, label);
  return result;
}

function toIndices(
  values: ArrayLike<number>,
  vertexCount: number,
): Uint32Array {
  const result = new Uint32Array(values.length);
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (
      value === undefined ||
      !Number.isSafeInteger(value) ||
      value < 0 ||
      value >= vertexCount
    ) {
      throw new RangeError(
        `FlxStrip index ${index} is outside the vertex range.`,
      );
    }
    result[index] = value;
  }
  return result;
}

function validateVertexIndex(index: number, count: number): void {
  if (!Number.isSafeInteger(index) || index < 0 || index >= count) {
    throw new RangeError(`FlxStrip vertex index ${index} is out of range.`);
  }
}

function validateFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`FlxStrip ${label} values must be finite.`);
  }
}
