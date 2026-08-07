import { Rectangle, Texture } from 'pixi.js';

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
      const rect = rects[i]!;
      const frame = new Rectangle(rect.x, rect.y, rect.width, rect.height);
      const sub = new Texture({
        frame,
        label: rect.name,
        source: texture.source,
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
   * `options.padding` defaults to 1 (no leading zeros). padding >= 1.
   * Also retries each lookup with a `.png` suffix (Kenney convention).
   *
   * @throws {RangeError} If `padding < 1` or any frame is not found.
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
   * @throws {RangeError} If any index is out of bounds or start > end.
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

  // ── private helpers ────────────────────────────────────────────────────────

  #resolve(name: string): FlxAtlasFrame {
    const frame =
      this.#byName.get(name) ?? this.#byName.get(`${name}.png`);
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
    return this.#ordered[index]!;
  }
}
