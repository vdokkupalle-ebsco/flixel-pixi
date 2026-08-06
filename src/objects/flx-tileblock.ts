import type { Texture } from 'pixi.js';

import { FlxGraphic } from '../assets/flx-graphic';
import {
  makeGraphicPixels,
  selectFramePixels,
  stampPixels,
} from '../compat/pixel-buffer';
import { FlxG } from '../core/flx-g';
import { FlxSprite } from './flx-sprite';

/** Generated, immovable block filled from random sprite-sheet frames. @public */
export class FlxTileblock extends FlxSprite {
  constructor(x: number, y: number, width: number, height: number) {
    super(x, y);
    this.makeGraphic(width, height, 0, true);
    this.active = false;
    this.immovable = true;
  }

  loadTiles(
    source: FlxGraphic | Texture | null,
    tileWidth = 0,
    tileHeight = 0,
    empties = 0,
  ): this {
    if (source === null) return this;
    const graphic =
      source instanceof FlxGraphic ? source : new FlxGraphic(source);
    const pixels = graphic.pixels;
    if (pixels === null) {
      throw new Error(
        'FlxTileblock requires a pixel-backed FlxGraphic; preprocess URL assets before tiling.',
      );
    }

    const width = tileWidth === 0 ? pixels.height : tileWidth;
    const height = tileHeight === 0 ? width : tileHeight;
    if (width <= 0 || height <= 0) {
      throw new RangeError('Tile dimensions must be positive.');
    }
    const columns = Math.floor(pixels.width / width);
    const rows = Math.floor(pixels.height / height);
    const frameCount = columns * rows;
    if (frameCount === 0) throw new RangeError('No tiles fit in the graphic.');
    if (!Number.isInteger(empties) || empties < 0) {
      throw new RangeError('empties must be a non-negative integer.');
    }

    this.width = Math.ceil(this.width / width) * width;
    this.height = Math.ceil(this.height / height) * height;
    const destination = makeGraphicPixels(this.width, this.height, 0);
    const total = frameCount + empties;
    for (let y = 0; y < this.height; y += height) {
      for (let x = 0; x < this.width; x += width) {
        if (FlxG.random() * total <= empties) continue;
        const index = Math.floor(FlxG.random() * frameCount);
        const frame = selectFramePixels(
          pixels,
          (index % columns) * width,
          Math.floor(index / columns) * height,
          width,
          height,
        );
        stampPixels(destination, frame, x, y);
      }
    }
    this.loadPixelBuffer(destination, 'FlxTileblock');
    return this;
  }
}
