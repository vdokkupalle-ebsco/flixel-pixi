import { Rectangle, Texture } from 'pixi.js';

import {
  atlasBakeCellFromTexture,
  bakeAtlasFrameStrip,
  type FlxAtlasBakeCell,
} from './flx-atlas-bake';
import type {
  FlxAtlasFrame,
  FlxAtlasFrameList,
  FlxAtlasFrameRect,
  FlxAtlasPrefixOptions,
} from './flx-atlas-frame';

/**
 * A loaded texture atlas with named frame lookup and ordered pickers.
 *
 * Obtain instances via `FlxG.atlas.load(...)` / `FlxG.atlas.get(...)`.
 *
 * @public
 */
export class FlxAtlas {
  readonly key: string;
  /** Shared base texture (the full atlas sheet). */
  readonly texture: Texture;

  readonly #byName: Map<string, FlxAtlasFrame>;
  readonly #ordered: FlxAtlasFrame[];

  /**
   * @internal — Use {@link FlxAtlas.fromTextureAndRects} in tests or the
   * registry's `load` method in production code.
   */
  private constructor(
    key: string,
    texture: Texture,
    byName: Map<string, FlxAtlasFrame>,
    ordered: FlxAtlasFrame[],
  ) {
    this.key = key;
    this.texture = texture;
    this.#byName = byName;
    this.#ordered = ordered;
  }

  /**
   * Build a FlxAtlas from a base Pixi Texture and an ordered list of rects.
   * Each rect is sliced from the texture to form a named sub-texture view.
   *
   * This is also the internal test-helper entry point.
   * @internal
   */
  static fromTextureAndRects(
    key: string,
    texture: Texture,
    rects: readonly FlxAtlasFrameRect[],
  ): FlxAtlas {
    const byName = new Map<string, FlxAtlasFrame>();
    const ordered: FlxAtlasFrame[] = [];

    for (let i = 0; i < rects.length; i += 1) {
      const rect = rects[i];
      if (rect === undefined) continue;
      if (byName.has(rect.name)) {
        throw new Error(`FlxAtlas "${key}": duplicate frame "${rect.name}".`);
      }
      const frame = new Rectangle(
        rect.x,
        rect.y,
        rect.rotated === true ? rect.height : rect.width,
        rect.rotated === true ? rect.width : rect.height,
      );
      const orig = new Rectangle(
        0,
        0,
        rect.sourceWidth ?? (rect.rotated === true ? rect.height : rect.width),
        rect.sourceHeight ?? (rect.rotated === true ? rect.width : rect.height),
      );
      const trim =
        rect.trimX === undefined ||
        rect.trimY === undefined ||
        rect.trimWidth === undefined ||
        rect.trimHeight === undefined
          ? undefined
          : new Rectangle(
              rect.trimX,
              rect.trimY,
              rect.trimWidth,
              rect.trimHeight,
            );
      const sub = new Texture({
        frame,
        label: rect.name,
        orig,
        rotate: rect.rotated === true ? 2 : 0,
        source: texture.source,
        ...(trim === undefined ? {} : { trim }),
      });
      const atlasFrame: FlxAtlasFrame = {
        index: i,
        name: rect.name,
        texture: sub,
      };
      byName.set(rect.name, atlasFrame);
      ordered.push(atlasFrame);
    }

    return new FlxAtlas(key, texture, byName, ordered);
  }

  /** Number of named frames in this atlas. */
  get frameCount(): number {
    return this.#ordered.length;
  }

  /**
   * Return the frame with the given exact name, or retry with `.png` appended
   * (Kenney convention). Throws if neither resolves.
   */
  getFrame(name: string): FlxAtlasFrame {
    return this.#resolve(name);
  }

  /**
   * Return an ordered list of frames whose names match `prefix + paddedNumber`
   * for each integer in `[start, end]` inclusive.
   *
   * `options.padding` defaults to 1 (no leading zeros) and must be at least 1.
   * Also retries each lookup with a `.png` suffix (Kenney convention).
   *
   * @throws RangeError if `padding` is less than 1 or a frame is not found.
   */
  framesByPrefix(
    prefix: string,
    start: number,
    end: number,
    options?: FlxAtlasPrefixOptions,
  ): FlxAtlasFrameList {
    const padding = options?.padding ?? 1;
    if (padding < 1) {
      throw new RangeError(
        `framesByPrefix: padding must be >= 1, got ${padding}.`,
      );
    }
    if (start > end) {
      throw new RangeError(
        `framesByPrefix: start (${start}) must be <= end (${end}).`,
      );
    }
    const result: FlxAtlasFrame[] = [];
    for (let n = start; n <= end; n += 1) {
      const suffix = String(n).padStart(padding, '0');
      result.push(this.#resolve(`${prefix}${suffix}`));
    }
    return result;
  }

  /**
   * Return frames by 0-based index range (inclusive) or explicit index array.
   * @throws RangeError if an index is out of bounds or start exceeds end.
   */
  framesByNumber(start: number, end: number): FlxAtlasFrameList;
  framesByNumber(indices: readonly number[]): FlxAtlasFrameList;
  framesByNumber(
    startOrIndices: number | readonly number[],
    end?: number,
  ): FlxAtlasFrameList {
    if (Array.isArray(startOrIndices)) {
      return (startOrIndices as readonly number[]).map((idx) =>
        this.#frameAt(idx),
      );
    }
    const start = startOrIndices as number;
    const endVal = end ?? start;
    if (start > endVal) {
      throw new RangeError(
        `framesByNumber: start (${start}) must be <= end (${endVal}).`,
      );
    }
    const result: FlxAtlasFrame[] = [];
    for (let i = start; i <= endVal; i += 1) {
      result.push(this.#frameAt(i));
    }
    return result;
  }

  /**
   * Build a Flixel `Texture` strip for `loadGraphic` / tilemaps.
   * Pass `null` for a fully transparent cell (e.g. tilemap air = index 0).
   * Optional `frameWidth` / `frameHeight` scale cells while copying.
   *
   * @public
   */
  makeGraphic(
    frames: readonly (FlxAtlasFrame | null)[],
    frameWidth?: number,
    frameHeight?: number,
  ): Texture {
    if (frames.length === 0) {
      throw new RangeError('makeGraphic requires at least one cell');
    }
    const sample = frames.find((f) => f !== null);
    if (sample === undefined) {
      throw new RangeError('makeGraphic requires at least one non-null frame');
    }
    const width = frameWidth ?? sample.texture.orig.width;
    const height = frameHeight ?? sample.texture.orig.height;
    const source = canvasSourceFromTexture(this.texture);
    const cells: (FlxAtlasBakeCell | null)[] = frames.map((frame) => {
      if (frame === null) return null;
      return atlasBakeCellFromTexture(frame.texture, source);
    });
    return bakeAtlasFrameStrip(cells, width, height);
  }

  #resolve(name: string): FlxAtlasFrame {
    const frame = this.#byName.get(name) ?? this.#byName.get(`${name}.png`);
    if (frame === undefined) {
      throw new Error(
        `FlxAtlas "${this.key}": frame "${name}" not found. ` +
          `Available: ${[...this.#byName.keys()].slice(0, 5).join(', ')}…`,
      );
    }
    return frame;
  }

  #frameAt(index: number): FlxAtlasFrame {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.#ordered.length
    ) {
      throw new RangeError(
        `FlxAtlas "${this.key}": index ${index} is out of range 0..${this.#ordered.length - 1}.`,
      );
    }
    return this.#ordered[index] as FlxAtlasFrame;
  }
}

/** @internal */
export function canvasSourceFromTexture(texture: Texture): CanvasImageSource {
  const atlasTexture = texture.source;
  const resource = (atlasTexture as { resource?: unknown }).resource;
  if (
    resource instanceof HTMLImageElement ||
    resource instanceof HTMLCanvasElement ||
    resource instanceof HTMLVideoElement
  ) {
    return resource;
  }

  const offscreen = document.createElement('canvas');
  const srcW = (atlasTexture as { width: number }).width ?? texture.width;
  const srcH = (atlasTexture as { height: number }).height ?? texture.height;
  offscreen.width = srcW;
  offscreen.height = srcH;
  const ctx2d = offscreen.getContext('2d');
  if (ctx2d !== null && resource instanceof Uint8Array) {
    const plainBuffer = resource.buffer.slice(0) as ArrayBuffer;
    const imgData = new ImageData(
      new Uint8ClampedArray(plainBuffer),
      srcW,
      srcH,
    );
    ctx2d.putImageData(imgData, 0, 0);
  }
  return offscreen;
}
