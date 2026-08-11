import type { Texture } from 'pixi.js';

// ── Rect-only type (internal, produced by parsers) ────────────────────────────

/**
 * Raw axis-aligned bounding rect for one atlas sub-image.
 * Produced by the three parsers; consumed by FlxAtlas to build textures.
 * @public
 */
export interface FlxAtlasFrameRect {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Whether TexturePacker stored the pixels rotated 90 degrees clockwise. */
  readonly rotated?: boolean;
  /** Logical untrimmed source width, when transparent padding was removed. */
  readonly sourceWidth?: number;
  /** Logical untrimmed source height, when transparent padding was removed. */
  readonly sourceHeight?: number;
  /** Horizontal placement of the trimmed pixels in the logical source. */
  readonly trimX?: number;
  /** Vertical placement of the trimmed pixels in the logical source. */
  readonly trimY?: number;
  /** Logical width of the trimmed pixels. */
  readonly trimWidth?: number;
  /** Logical height of the trimmed pixels. */
  readonly trimHeight?: number;
}

// ── Public frame type (FlxAtlas output) ───────────────────────────────────────

/**
 * A named region inside a shared atlas texture.
 * `index` is the stable 0-based insertion order within this atlas.
 * @public
 */
export interface FlxAtlasFrame {
  readonly name: string;
  /** Pixi sub-texture view into the shared atlas source. */
  readonly texture: Texture;
  /** 0-based position in insertion order. */
  readonly index: number;
  /** Optional display duration in seconds supplied by source metadata. */
  readonly duration?: number;
}

/** An ordered, immutable list of atlas frames. @public */
export type FlxAtlasFrameList = readonly FlxAtlasFrame[];

// ── Picker options ─────────────────────────────────────────────────────────────

/**
 * Options for {@link FlxAtlas.framesByPrefix}.
 * @public
 */
export interface FlxAtlasPrefixOptions {
  /**
   * Width of the numeric suffix, padded with leading zeros.
   * Must be at least 1. Defaults to 1.
   * - padding 1 → `walk_1`
   * - padding 2 → `walk_01`
   */
  readonly padding?: number;
}

// ── Load-time meta ─────────────────────────────────────────────────────────────

/**
 * Grid-based atlas descriptor. Frames are named `"0"`, `"1"`, … in
 * row-major (left-to-right, top-to-bottom) order.
 * @public
 */
export interface FlxAtlasGridMeta {
  readonly frameWidth: number;
  readonly frameHeight: number;
}

/**
 * Third argument to {@link FlxAtlasRegistry.load}.
 * - A string ending in `.json` (or whose content parses as JSON) → TexturePacker/Pixi JSON.
 * - A string ending in `.xml` (or any other string) → TextureAtlas XML.
 * - A `FlxAtlasGridMeta` object → uniform fixed-size grid.
 * @public
 */
export type FlxAtlasMeta = string | FlxAtlasGridMeta;
