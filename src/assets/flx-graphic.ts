import {
  BufferImageSource,
  Rectangle,
  Texture,
  type TextureSource,
} from 'pixi.js';

import type { PixelBuffer } from '../compat/pixel-buffer';

function pixelBytes(buffer: PixelBuffer): Uint8Array {
  const bytes = new Uint8Array(buffer.width * buffer.height * 4);

  for (let index = 0; index < buffer.data.length; index += 1) {
    const color = buffer.data[index] ?? 0;
    const byteIndex = index * 4;
    bytes[byteIndex] = color >>> 24;
    bytes[byteIndex + 1] = (color >>> 16) & 0xff;
    bytes[byteIndex + 2] = (color >>> 8) & 0xff;
    bytes[byteIndex + 3] = color & 0xff;
  }

  return bytes;
}

/** A loaded or generated Pixi texture plus optional CPU-side pixel data. @public */
export class FlxGraphic {
  readonly texture: Texture;
  readonly pixels: PixelBuffer | null;

  readonly #frameTextures = new Map<string, Texture>();
  readonly #ownsTexture: boolean;
  #destroyed = false;

  constructor(
    texture: Texture,
    options: { ownsTexture?: boolean; pixels?: PixelBuffer | null } = {},
  ) {
    this.texture = texture;
    this.pixels = options.pixels ?? null;
    this.#ownsTexture = options.ownsTexture ?? false;
  }

  static fromPixels(buffer: PixelBuffer, label?: string): FlxGraphic {
    const source = new BufferImageSource({
      autoGenerateMipmaps: false,
      height: buffer.height,
      ...(label === undefined ? {} : { label }),
      resource: pixelBytes(buffer),
      scaleMode: 'nearest',
      width: buffer.width,
    });
    const texture = new Texture({
      ...(label === undefined ? {} : { label }),
      source,
    });
    return new FlxGraphic(texture, { ownsTexture: true, pixels: buffer });
  }

  get width(): number {
    return this.texture.width;
  }

  get height(): number {
    return this.texture.height;
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  /** Number of cached subtextures; useful for lifecycle diagnostics. */
  get cachedFrameCount(): number {
    return this.#frameTextures.size;
  }

  frameTexture(
    frameIndex: number,
    frameWidth: number,
    frameHeight: number,
  ): Texture {
    this.#assertUsable();
    if (!Number.isInteger(frameIndex) || frameIndex < 0) {
      throw new RangeError('frameIndex must be a non-negative integer.');
    }
    if (
      !Number.isInteger(frameWidth) ||
      !Number.isInteger(frameHeight) ||
      frameWidth <= 0 ||
      frameHeight <= 0
    ) {
      throw new RangeError('Frame dimensions must be positive integers.');
    }

    const columns = Math.floor(this.width / frameWidth);
    const rows = Math.floor(this.height / frameHeight);
    if (columns === 0 || frameIndex >= columns * rows) {
      throw new RangeError('Frame is outside the graphic.');
    }

    const key = `${frameWidth}:${frameHeight}:${frameIndex}`;
    const cached = this.#frameTextures.get(key);
    if (cached !== undefined) return cached;

    const sourceFrame = this.texture.frame;
    const frame = new Rectangle(
      sourceFrame.x + (frameIndex % columns) * frameWidth,
      sourceFrame.y + Math.floor(frameIndex / columns) * frameHeight,
      frameWidth,
      frameHeight,
    );
    const texture = new Texture({
      frame,
      label: this.texture.label ? `${this.texture.label}:${key}` : key,
      source: this.texture.source as TextureSource,
    });
    this.#frameTextures.set(key, texture);
    return texture;
  }

  /** Uploads mutations made to an owned CPU pixel buffer. */
  refresh(): void {
    this.#assertUsable();
    if (this.pixels === null) {
      throw new Error('Only pixel-backed graphics can be refreshed.');
    }
    const resource = this.texture.source.resource;
    if (!(resource instanceof Uint8Array)) {
      throw new Error('The graphic does not use an uploadable byte buffer.');
    }
    resource.set(pixelBytes(this.pixels));
    this.texture.source.update();
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    for (const texture of this.#frameTextures.values()) texture.destroy(false);
    this.#frameTextures.clear();
    if (this.#ownsTexture) this.texture.destroy(true);
  }

  #assertUsable(): void {
    if (this.#destroyed) throw new Error('FlxGraphic has been destroyed.');
  }
}
