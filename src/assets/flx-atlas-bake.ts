import { BufferImageSource, Texture } from 'pixi.js';

/** One cell to blit into a horizontal strip. @internal */
export interface FlxAtlasBakeCell {
  readonly source: CanvasImageSource;
  /** Packed source rectangle (before undoing atlas rotation). */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Logical, untrimmed frame dimensions. Defaults to the packed dimensions. */
  readonly sourceWidth?: number;
  readonly sourceHeight?: number;
  /** Logical visible-content rectangle within the untrimmed frame. */
  readonly trimX?: number;
  readonly trimY?: number;
  readonly trimWidth?: number;
  readonly trimHeight?: number;
  /** TexturePacker/Pixi clockwise-packed frame (`Texture.rotate === 2`). */
  readonly rotated?: boolean;
}

/** Convert a Pixi atlas texture into the source geometry used by the baker. */
export function atlasBakeCellFromTexture(
  texture: Texture,
  source: CanvasImageSource,
): FlxAtlasBakeCell {
  if (texture.rotate !== 0 && texture.rotate !== 2) {
    throw new Error(
      `Atlas strip baking only supports Pixi rotation 0 or 2, got ${texture.rotate}.`,
    );
  }

  const rotated = texture.rotate === 2;
  const trim = texture.trim;
  return {
    height: texture.frame.height,
    rotated,
    source,
    sourceHeight: texture.orig.height,
    sourceWidth: texture.orig.width,
    trimHeight: trim?.height ?? texture.orig.height,
    trimWidth: trim?.width ?? texture.orig.width,
    trimX: trim?.x ?? 0,
    trimY: trim?.y ?? 0,
    width: texture.frame.width,
    x: texture.frame.x,
    y: texture.frame.y,
  };
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
    drawBakeCell(ctx, frame, i * outW, outW, outH);
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

function drawBakeCell(
  ctx: CanvasRenderingContext2D,
  frame: FlxAtlasBakeCell,
  cellX: number,
  outW: number,
  outH: number,
): void {
  const logicalW =
    frame.sourceWidth ?? (frame.rotated ? frame.height : frame.width);
  const logicalH =
    frame.sourceHeight ?? (frame.rotated ? frame.width : frame.height);
  const trimX = frame.trimX ?? 0;
  const trimY = frame.trimY ?? 0;
  const trimW = frame.trimWidth ?? logicalW;
  const trimH = frame.trimHeight ?? logicalH;

  if (
    frame.width <= 0 ||
    frame.height <= 0 ||
    logicalW <= 0 ||
    logicalH <= 0 ||
    trimX < 0 ||
    trimY < 0 ||
    trimW <= 0 ||
    trimH <= 0 ||
    trimX + trimW > logicalW ||
    trimY + trimH > logicalH
  ) {
    throw new RangeError('Invalid atlas bake cell geometry.');
  }

  const scaleX = outW / logicalW;
  const scaleY = outH / logicalH;
  const destX = cellX + trimX * scaleX;
  const destY = trimY * scaleY;
  const destW = trimW * scaleX;
  const destH = trimH * scaleY;

  if (!frame.rotated) {
    ctx.drawImage(
      frame.source,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      destX,
      destY,
      destW,
      destH,
    );
    return;
  }

  // TexturePacker stores these pixels 90° clockwise. Draw through the
  // inverse transform so the baked strip contains the original orientation.
  ctx.save();
  ctx.translate(destX, destY + destH);
  ctx.rotate(-Math.PI / 2);
  ctx.drawImage(
    frame.source,
    frame.x,
    frame.y,
    frame.width,
    frame.height,
    0,
    0,
    destH,
    destW,
  );
  ctx.restore();
}
