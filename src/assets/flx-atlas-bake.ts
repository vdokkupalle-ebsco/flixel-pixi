import { BufferImageSource, Texture } from 'pixi.js';

/** One cell to blit into a horizontal strip. @internal */
export interface FlxAtlasBakeCell {
  readonly source: CanvasImageSource;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Bake an ordered list of source regions into a single horizontal-strip Texture.
 * `null` cells are left fully transparent.
 *
 * @internal
 */
export function bakeAtlasFrameStrip(
  frames: readonly (FlxAtlasBakeCell | null)[],
  outW: number,
  outH: number,
): Texture {
  if (frames.length === 0) {
    throw new RangeError('bakeAtlasFrameStrip requires at least one cell');
  }
  if (outW <= 0 || outH <= 0) {
    throw new RangeError('bakeAtlasFrameStrip out dimensions must be positive');
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW * frames.length;
  canvas.height = outH;

  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    throw new Error('bakeAtlasFrameStrip: could not obtain 2D canvas context.');
  }

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < frames.length; i += 1) {
    const frame = frames[i];
    if (frame == null) continue;
    ctx.drawImage(
      frame.source,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      i * outW,
      0,
      outW,
      outH,
    );
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const bytes = new Uint8Array(imageData.data.buffer);

  const bufSource = new BufferImageSource({
    autoGenerateMipmaps: false,
    height: outH,
    resource: bytes,
    scaleMode: 'nearest',
    width: canvas.width,
  });

  return new Texture({ source: bufSource });
}
