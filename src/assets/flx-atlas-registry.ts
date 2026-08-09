import { Texture } from 'pixi.js';

import { FlxAtlas } from './flx-atlas';
import type { FlxAtlasGridMeta, FlxAtlasMeta } from './flx-atlas-frame';
import {
  parseFixedGridAtlas,
  parseTextureAtlasJson,
  parseTextureAtlasXml,
} from './flx-atlas-parse';

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

    let rects;
    if (typeof meta === 'string') {
      const trimmed = meta.trim();
      const inlineXml = trimmed.startsWith('<');
      const inlineJson = trimmed.startsWith('{') || trimmed.startsWith('[');
      let text: string;
      let isJson: boolean;

      if (inlineXml || inlineJson) {
        text = meta;
        isJson = inlineJson;
      } else {
        isJson = meta.endsWith('.json');
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

      rects = isJson ? parseTextureAtlasJson(text) : parseTextureAtlasXml(text);
    } else {
      const grid = meta as FlxAtlasGridMeta;
      rects = parseFixedGridAtlas(
        baseTexture.width,
        baseTexture.height,
        grid.frameWidth,
        grid.frameHeight,
      );
    }

    const atlas = FlxAtlas.fromTextureAndRects(key, baseTexture, rects);
    this.#atlases.set(key, atlas);
    return atlas;
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
}
