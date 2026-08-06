/** A CPU-side packed RGBA pixel buffer used by generated graphics. @public */
export interface PixelBuffer {
  readonly data: Uint32Array;
  readonly height: number;
  readonly width: number;
}

function requireDimension(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer.`);
  }
}

function requireBuffer(buffer: PixelBuffer): void {
  requireDimension(buffer.width, 'width');
  requireDimension(buffer.height, 'height');

  if (buffer.data.length !== buffer.width * buffer.height) {
    throw new RangeError('Pixel data length does not match its dimensions.');
  }
}

/** Creates a packed `0xRRGGBBAA` buffer filled with one color. @public */
export function makeGraphicPixels(
  width: number,
  height: number,
  color: number,
): PixelBuffer {
  requireDimension(width, 'width');
  requireDimension(height, 'height');

  const data = new Uint32Array(width * height);
  data.fill(color >>> 0);
  return { data, height, width };
}

/** Copies a rectangular animation frame into an independent buffer. */
export function selectFramePixels(
  source: PixelBuffer,
  x: number,
  y: number,
  width: number,
  height: number,
): PixelBuffer {
  requireBuffer(source);
  requireDimension(width, 'frame width');
  requireDimension(height, 'frame height');

  if (
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    y < 0 ||
    x + width > source.width ||
    y + height > source.height
  ) {
    throw new RangeError(
      'Frame must use integer coordinates inside the source.',
    );
  }

  const frame = makeGraphicPixels(width, height, 0);

  for (let row = 0; row < height; row += 1) {
    const sourceStart = (y + row) * source.width + x;
    frame.data.set(
      source.data.subarray(sourceStart, sourceStart + width),
      row * width,
    );
  }

  return frame;
}

/**
 * Overwrites destination pixels with nontransparent source pixels. This is a
 * measured compatibility primitive, not the final public `stamp` contract.
 */
export function stampPixels(
  destination: PixelBuffer,
  source: PixelBuffer,
  destinationX: number,
  destinationY: number,
): number {
  requireBuffer(destination);
  requireBuffer(source);

  if (!Number.isInteger(destinationX) || !Number.isInteger(destinationY)) {
    throw new RangeError('Stamp coordinates must be integers.');
  }

  let written = 0;

  for (let sourceY = 0; sourceY < source.height; sourceY += 1) {
    const targetY = destinationY + sourceY;

    if (targetY < 0 || targetY >= destination.height) {
      continue;
    }

    for (let sourceX = 0; sourceX < source.width; sourceX += 1) {
      const targetX = destinationX + sourceX;

      if (targetX < 0 || targetX >= destination.width) {
        continue;
      }

      const color = source.data[sourceY * source.width + sourceX] ?? 0;

      if ((color & 0xff) === 0) {
        continue;
      }

      destination.data[targetY * destination.width + targetX] = color;
      written += 1;
    }
  }

  return written;
}

/** Replaces exact packed colors and returns the number of changed pixels. */
export function replaceColorPixels(
  buffer: PixelBuffer,
  fromColor: number,
  toColor: number,
): number {
  requireBuffer(buffer);
  const from = fromColor >>> 0;
  const to = toColor >>> 0;
  let replaced = 0;

  for (let index = 0; index < buffer.data.length; index += 1) {
    if (buffer.data[index] === from) {
      buffer.data[index] = to;
      replaced += 1;
    }
  }

  return replaced;
}

/** Tests overlap using the low byte of each packed pixel as alpha. */
export function pixelsOverlap(
  first: PixelBuffer,
  second: PixelBuffer,
  secondX = 0,
  secondY = 0,
  alphaThreshold = 1,
): boolean {
  requireBuffer(first);
  requireBuffer(second);

  if (!Number.isInteger(secondX) || !Number.isInteger(secondY)) {
    throw new RangeError('Overlap coordinates must be integers.');
  }

  if (
    !Number.isInteger(alphaThreshold) ||
    alphaThreshold < 0 ||
    alphaThreshold > 255
  ) {
    throw new RangeError(
      'alphaThreshold must be an integer from 0 through 255.',
    );
  }

  const startX = Math.max(0, secondX);
  const startY = Math.max(0, secondY);
  const endX = Math.min(first.width, secondX + second.width);
  const endY = Math.min(first.height, secondY + second.height);

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const firstAlpha = (first.data[y * first.width + x] ?? 0) & 0xff;
      const secondAlpha =
        (second.data[(y - secondY) * second.width + x - secondX] ?? 0) & 0xff;

      if (firstAlpha >= alphaThreshold && secondAlpha >= alphaThreshold) {
        return true;
      }
    }
  }

  return false;
}
