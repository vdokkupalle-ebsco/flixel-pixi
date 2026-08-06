import { makeGraphicPixels, type PixelBuffer } from '../compat/pixel-buffer';
import type { FlxCamera } from '../core/flx-camera';
import { FlxG } from '../core/flx-g';
import type { FlxPoint } from '../math/flx-point';

/**
 * Compatibility metadata for the classic camera-sized bitmap tile buffer.
 * Pixi rendering uses {@link FlxTilemapRenderHandle} chunks instead. @public
 */
export class FlxTilemapBuffer {
  x = 0;
  y = 0;
  readonly width: number;
  readonly height: number;
  dirty = true;
  readonly rows: number;
  readonly columns: number;
  #pixels: PixelBuffer | null;

  constructor(
    tileWidth: number,
    tileHeight: number,
    widthInTiles: number,
    heightInTiles: number,
    camera: FlxCamera = FlxG.camera,
  ) {
    if (
      !Number.isFinite(tileWidth) ||
      !Number.isFinite(tileHeight) ||
      tileWidth <= 0 ||
      tileHeight <= 0
    ) {
      throw new RangeError('Tile dimensions must be positive.');
    }
    this.columns = Math.min(
      widthInTiles,
      Math.ceil(camera.width / tileWidth) + 1,
    );
    this.rows = Math.min(
      heightInTiles,
      Math.ceil(camera.height / tileHeight) + 1,
    );
    this.width = this.columns * tileWidth;
    this.height = this.rows * tileHeight;
    this.#pixels = makeGraphicPixels(this.width, this.height, 0);
  }

  destroy(): void {
    this.#pixels = null;
  }

  fill(color = 0): void {
    const pixels = this.pixels;
    pixels.data.fill(color >>> 0);
  }

  get pixels(): PixelBuffer {
    if (this.#pixels === null) throw new Error('Tilemap buffer is destroyed.');
    return this.#pixels;
  }

  /** Rendering is adapter-owned; this method records the compatibility position. */
  draw(camera: FlxCamera, point: Readonly<FlxPoint>): void {
    void camera;
    this.x = point.x;
    this.y = point.y;
    this.dirty = false;
  }
}
