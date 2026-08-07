import { BufferImageSource, Texture } from 'pixi.js';

/**
 * Bake an ordered list of source regions into a single horizontal-strip Texture.
 * Transparent (null) slots are left blank.
 *
 * All non-null frames must have the same dimensions (outW × outH).
 * The resulting canvas is `(outW * frames.length) × outH`.
 *
 * @internal
 */
export function bakeAtlasFrameStrip(
  source: CanvasImageSource,
  frames: readonly ({ x: number; y: number; width: number; height: number } | null)[],
  outW: number,
  outH: number,
): Texture {
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
      source,
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

  // Read back as Uint8Array for Pixi's BufferImageSource
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
