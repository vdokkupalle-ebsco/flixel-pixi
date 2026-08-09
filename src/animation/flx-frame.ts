import type { Texture } from 'pixi.js';

/** One named animation frame backed by a lazily resolved Pixi texture view. @public */
export class FlxFrame {
  name: string | null;
  duration: number;
  readonly index: number;
  readonly width: number;
  readonly height: number;

  readonly #resolveTexture: () => Texture;

  constructor(options: {
    index: number;
    name?: string | null;
    texture: Texture | (() => Texture);
    duration?: number;
    width?: number;
    height?: number;
  }) {
    if (!Number.isInteger(options.index) || options.index < 0) {
      throw new RangeError('FlxFrame index must be a non-negative integer.');
    }
    const texture =
      typeof options.texture === 'function' ? null : options.texture;
    this.index = options.index;
    this.name = options.name ?? null;
    this.duration = options.duration ?? 0;
    if (!Number.isFinite(this.duration) || this.duration < 0) {
      throw new RangeError(
        'FlxFrame duration must be a non-negative finite number.',
      );
    }
    this.width = options.width ?? texture?.frame.width ?? 0;
    this.height = options.height ?? texture?.frame.height ?? 0;
    if (this.width <= 0 || this.height <= 0) {
      throw new RangeError('FlxFrame dimensions must be positive.');
    }
    this.#resolveTexture =
      typeof options.texture === 'function'
        ? options.texture
        : () => options.texture as Texture;
  }

  get texture(): Texture {
    return this.#resolveTexture();
  }
}
