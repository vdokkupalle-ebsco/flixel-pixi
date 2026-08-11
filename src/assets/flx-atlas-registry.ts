import { Texture } from 'pixi.js';

import { FlxAtlas } from './flx-atlas';
import type { FlxAssets } from './flx-assets';
import type { FlxAtlasGridMeta, FlxAtlasMeta } from './flx-atlas-frame';
import {
  parseFixedGridAtlas,
  parseTextureAtlasJson,
  parseTextureAtlasXml,
} from './flx-atlas-parse';

/** Already-loaded asset aliases used to construct a non-owning atlas. @public */
export interface FlxAtlasAssetSource {
  /** Alias of a Pixi `Texture` already present in `FlxAssets`. */
  image: string;
  /** Alias of loaded JSON/XML metadata, or inline fixed-grid dimensions. */
  meta: string | FlxAtlasGridMeta;
}

/**
 * Registry that loads and stores named `FlxAtlas` instances.
 * Access the singleton via `FlxG.atlas`.
 *
 * @public
 */
export class FlxAtlasRegistry {
  readonly #atlases = new Map<string, FlxAtlas>();

  /**
   * Load an atlas from an image URL and metadata, then store it under `key`.
   * Overwrites any previously stored atlas with the same key.
   *
   * `meta` can be:
   * - A URL string ending in `.json` → TexturePacker/Pixi JSON format.
   * - Any other URL string → TextureAtlas XML format.
   * - Inline XML / JSON text (starts with `<` or `{`) → parsed directly.
   * - A `{ frameWidth, frameHeight }` object → uniform fixed-size grid.
   *
   * @public
   */
  async load(
    key: string,
    imageUrl: string,
    meta: FlxAtlasMeta,
  ): Promise<FlxAtlas> {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () =>
        reject(new Error(`FlxAtlas: failed to load image "${imageUrl}".`));
      img.src = imageUrl;
    });

    const baseTexture = Texture.from(img);

    let resolvedMeta: unknown;
    if (typeof meta === 'string') {
      const trimmed = meta.trim();
      const inlineXml = trimmed.startsWith('<');
      const inlineJson = trimmed.startsWith('{') || trimmed.startsWith('[');
      let text: string;

      if (inlineXml || inlineJson) {
        text = meta;
      } else {
        try {
          const response = await fetch(meta);
          if (!response.ok) {
            throw new Error(
              `HTTP ${response.status} loading atlas meta "${meta}".`,
            );
          }
          text = await response.text();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          throw new Error(
            `FlxAtlas: could not fetch atlas meta "${meta}". ${message}`,
            { cause: err },
          );
        }
      }

      resolvedMeta = text;
    } else {
      resolvedMeta = meta;
    }

    return this.#register(key, baseTexture, resolvedMeta);
  }

  /**
   * Register an atlas from aliases that an `FlxAssets` bundle already loaded.
   *
   * The asset cache retains ownership of the base texture and metadata. Remove
   * the atlas before unloading its bundle; live sprites may continue retaining
   * their own texture views.
   *
   * TexturePacker JSON descriptors should set `parser: 'text'`. Keeping the
   * payload as text prevents Pixi's post-load spritesheet parser from eagerly
   * converting it before Flixel can validate and normalize the metadata.
   *
   * @public
   */
  registerFromAssets(
    key: string,
    assets: FlxAssets,
    source: FlxAtlasAssetSource,
  ): FlxAtlas {
    const texture = assets.get<unknown>(source.image);
    if (!(texture instanceof Texture)) {
      throw new TypeError(
        `FlxAtlas "${key}": asset "${source.image}" is not a loaded Pixi Texture.`,
      );
    }

    const meta =
      typeof source.meta === 'string'
        ? assets.get<unknown>(source.meta)
        : source.meta;
    if (meta === undefined) {
      throw new Error(
        `FlxAtlas "${key}": metadata asset "${String(source.meta)}" is not loaded.`,
      );
    }

    return this.#register(key, texture, meta);
  }

  /**
   * Return a previously loaded atlas.
   * @throws Error if no atlas with `key` is registered.
   * @public
   */
  get(key: string): FlxAtlas {
    const atlas = this.#atlases.get(key);
    if (atlas === undefined) {
      throw new Error(
        `FlxAtlas registry: no atlas loaded under key "${key}". ` +
          `Call FlxG.atlas.load("${key}", ...) first.`,
      );
    }
    return atlas;
  }

  /** Returns true if an atlas with `key` is registered. @public */
  has(key: string): boolean {
    return this.#atlases.has(key);
  }

  /**
   * Remove one atlas from the registry.
   * Does not destroy textures already referenced by live sprites.
   * @public
   */
  remove(key: string): void {
    this.#atlases.delete(key);
  }

  /** Remove all atlases from the registry. @public */
  clear(): void {
    this.#atlases.clear();
  }

  #register(key: string, texture: Texture, meta: unknown): FlxAtlas {
    if (key.length === 0) throw new RangeError('Atlas key cannot be empty.');

    let rects;
    if (isGridMeta(meta)) {
      rects = parseFixedGridAtlas(
        texture.width,
        texture.height,
        meta.frameWidth,
        meta.frameHeight,
      );
    } else if (typeof meta === 'string') {
      const trimmed = meta.trimStart();
      rects =
        trimmed.startsWith('{') || trimmed.startsWith('[')
          ? parseTextureAtlasJson(meta)
          : parseTextureAtlasXml(meta);
    } else if (meta !== null && typeof meta === 'object') {
      let json: string;
      try {
        json = JSON.stringify(meta);
      } catch (cause) {
        throw new TypeError(
          `FlxAtlas "${key}": metadata is not raw JSON. ` +
            `Load TexturePacker metadata with parser: 'text' to bypass Pixi's spritesheet conversion.`,
          { cause },
        );
      }
      rects = parseTextureAtlasJson(json);
    } else {
      throw new TypeError(
        `FlxAtlas "${key}": metadata must be TexturePacker JSON, TextureAtlas XML, or fixed-grid dimensions.`,
      );
    }

    const atlas = FlxAtlas.fromTextureAndRects(key, texture, rects);
    this.#atlases.set(key, atlas);
    return atlas;
  }
}

function isGridMeta(value: unknown): value is FlxAtlasGridMeta {
  if (value === null || typeof value !== 'object') return false;
  const candidate = value as Partial<FlxAtlasGridMeta>;
  return (
    Number.isInteger(candidate.frameWidth) &&
    Number.isInteger(candidate.frameHeight)
  );
}
