import type { PixelBuffer } from 'flixel-pixi';

export interface TextureSelection {
  buffer: PixelBuffer;
  columns: number;
  frame: number;
  label: string;
  rows: number;
  source?: ImageBitmap;
}

export function createDefaultTexture(): TextureSelection {
  return {
    buffer: {
      data: new Uint32Array([
        0, 0, 0x66f7ffff, 0, 0, 0, 0x66f7ffff, 0xffffffff, 0x66f7ffff, 0,
        0x66f7ffff, 0xffffffff, 0xffffffff, 0xffffffff, 0x66f7ffff, 0,
        0x66f7ffff, 0xffffffff, 0x66f7ffff, 0, 0, 0, 0x66f7ffff, 0, 0,
      ]),
      height: 5,
      width: 5,
    },
    columns: 1,
    frame: 0,
    label: 'Flixel spark',
    rows: 1,
  };
}

function frameBuffer(
  image: CanvasImageSource,
  width: number,
  height: number,
  columns: number,
  rows: number,
  frame: number,
): PixelBuffer {
  const frameWidth = Math.max(1, Math.floor(width / columns));
  const frameHeight = Math.max(1, Math.floor(height / rows));
  const normalizedFrame = Math.min(frame, columns * rows - 1);
  const canvas = document.createElement('canvas');
  canvas.width = frameWidth;
  canvas.height = frameHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (context === null) throw new Error('Canvas 2D is unavailable.');
  context.drawImage(
    image,
    (normalizedFrame % columns) * frameWidth,
    Math.floor(normalizedFrame / columns) * frameHeight,
    frameWidth,
    frameHeight,
    0,
    0,
    frameWidth,
    frameHeight,
  );
  const pixels = context.getImageData(0, 0, frameWidth, frameHeight);
  return {
    data: new Uint32Array(
      pixels.data.buffer.slice(
        pixels.data.byteOffset,
        pixels.data.byteOffset + pixels.data.byteLength,
      ),
    ),
    height: frameHeight,
    width: frameWidth,
  };
}

export async function loadTextureFile(file: File): Promise<TextureSelection> {
  if (!file.type.startsWith('image/'))
    throw new TypeError('Choose a PNG, JPEG, WebP, GIF, or SVG image.');
  const source = await createImageBitmap(file);
  return {
    buffer: frameBuffer(source, source.width, source.height, 1, 1, 0),
    columns: 1,
    frame: 0,
    label: file.name,
    rows: 1,
    source,
  };
}

export function selectTextureFrame(
  selection: TextureSelection,
  columns: number,
  rows: number,
  frame: number,
): TextureSelection {
  const safeColumns = Math.max(1, Math.floor(columns));
  const safeRows = Math.max(1, Math.floor(rows));
  const safeFrame = Math.max(
    0,
    Math.min(Math.floor(frame), safeColumns * safeRows - 1),
  );
  if (selection.source === undefined)
    return { ...selection, columns: 1, frame: 0, rows: 1 };
  return {
    ...selection,
    buffer: frameBuffer(
      selection.source,
      selection.source.width,
      selection.source.height,
      safeColumns,
      safeRows,
      safeFrame,
    ),
    columns: safeColumns,
    frame: safeFrame,
    rows: safeRows,
  };
}

export function destroyTexture(selection: TextureSelection): void {
  selection.source?.close();
}
