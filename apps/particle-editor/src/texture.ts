import type { PixelBuffer } from 'flixel-pixi';

export type ParticleDrawingShape = 'circle' | 'square';

export interface TextureSelection {
  assetId?: string;
  buffer: PixelBuffer;
  columns: number;
  frame: number;
  kind: 'generated' | 'uploaded';
  label: string;
  rows: number;
  shape: ParticleDrawingShape;
  source?: ImageBitmap;
}

type TextureStyle =
  | 'confetti'
  | 'droplet'
  | 'dust'
  | 'electric'
  | 'flame'
  | 'glow'
  | 'puff'
  | 'snow'
  | 'spark'
  | 'streak';

const textureStyles: Record<string, TextureStyle> = {
  'editor-burst': 'spark',
  'editor-confetti': 'confetti',
  'editor-dust': 'puff',
  'editor-electric': 'electric',
  'editor-fire': 'flame',
  'editor-firefly': 'glow',
  'editor-flame': 'flame',
  'editor-rain': 'streak',
  'editor-smoke': 'dust',
  'editor-snow': 'snow',
  'editor-spark': 'spark',
  'editor-water': 'droplet',
};

const textureLabels: Record<TextureStyle, string> = {
  confetti: 'Confetti shard',
  droplet: 'Water droplet',
  dust: 'Soft organic puff',
  electric: 'Electric shard',
  flame: 'Flame tongue',
  glow: 'Soft glow',
  puff: 'Dust cloud puff',
  snow: 'Snow crystal',
  spark: 'Four-point spark',
  streak: 'Rain streak',
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function gaussian(distance: number, sharpness: number): number {
  return Math.exp(-(distance * distance) * sharpness);
}

function shapeMask(x: number, y: number, shape: ParticleDrawingShape): number {
  const distance =
    shape === 'circle' ? Math.hypot(x, y) : Math.max(Math.abs(x), Math.abs(y));
  return clamp01((1 - distance) * 12);
}

function textureIntensity(style: TextureStyle, x: number, y: number): number {
  switch (style) {
    case 'spark': {
      const core = gaussian(Math.hypot(x, y), 28);
      const vertical = gaussian(Math.abs(x), 150) * gaussian(Math.abs(y), 3);
      const horizontal = gaussian(Math.abs(y), 150) * gaussian(Math.abs(x), 3);
      return clamp01(Math.max(core, vertical, horizontal));
    }
    case 'flame': {
      const shiftedY = y + 0.18;
      const width = 0.18 + (shiftedY + 0.8) * 0.28;
      const body = clamp01(1 - Math.abs(x) / Math.max(0.08, width));
      const height = clamp01(1 - Math.abs(shiftedY) / 0.88);
      const flicker = 0.88 + Math.sin((x * 17 + y * 9) * Math.PI) * 0.12;
      return clamp01(body * height * 1.7 * flicker);
    }
    case 'droplet': {
      const oval = gaussian(Math.hypot(x / 0.58, (y - 0.12) / 0.78), 2.8);
      const tip = gaussian(Math.hypot(x / 0.2, (y + 0.65) / 0.28), 3.5);
      const highlight = gaussian(
        Math.hypot((x + 0.2) / 0.14, (y + 0.02) / 0.2),
        5,
      );
      return clamp01(Math.max(oval, tip) + highlight * 0.5);
    }
    case 'streak': {
      const line = gaussian(Math.abs(x + y * 0.16), 180);
      return clamp01(line * gaussian(y, 1.5) * 1.35);
    }
    case 'dust': {
      const first = gaussian(Math.hypot(x + 0.28, y + 0.08), 5);
      const second = gaussian(Math.hypot(x - 0.24, y + 0.2), 4.2);
      const third = gaussian(Math.hypot(x + 0.04, y - 0.3), 3.8);
      return clamp01((first + second + third) * 0.62);
    }
    case 'puff': {
      const left = gaussian(Math.hypot(x + 0.42, y + 0.02), 8);
      const right = gaussian(Math.hypot(x - 0.4, y + 0.06), 8.5);
      const crown = gaussian(Math.hypot(x + 0.02, y + 0.38), 7);
      const center = gaussian(Math.hypot(x, y - 0.08), 4.2);
      const grain = 0.88 + Math.sin(x * 31 + y * 17) * 0.12;
      return clamp01((left + right + crown + center) * 0.56 * grain);
    }
    case 'confetti': {
      const center = Math.sin(y * 4.5) * 0.12;
      const width = 0.2 + Math.cos(y * 5.2) * 0.045;
      const paper = Math.min(
        (width - Math.abs(x - center)) * 24,
        (0.78 - Math.abs(y)) * 18,
      );
      const fold = 0.72 + gaussian(Math.abs(y + 0.04), 85) * 0.28;
      return clamp01(paper * fold);
    }
    case 'glow':
      return clamp01(gaussian(Math.hypot(x, y), 4.8) * 1.25);
    case 'electric': {
      const boltX = Math.sin((y + 1) * 10) * 0.13;
      const bolt = gaussian(Math.abs(x - boltX), 190) * gaussian(y, 1.4);
      return clamp01(Math.max(bolt, gaussian(Math.hypot(x, y), 18)));
    }
    case 'snow': {
      const diagonalA = gaussian(Math.abs(x - y), 115);
      const diagonalB = gaussian(Math.abs(x + y), 115);
      const cross = Math.max(
        gaussian(Math.abs(x), 130),
        gaussian(Math.abs(y), 130),
      );
      return clamp01(
        Math.max(diagonalA, diagonalB, cross) * gaussian(Math.hypot(x, y), 1.2),
      );
    }
  }
}

function rgbaWhite(alpha: number): number {
  const byte = Math.round(clamp01(alpha) * 255);
  return byte === 0 ? 0 : (0xffff_ff00 | byte) >>> 0;
}

function generatedBuffer(
  style: TextureStyle,
  shape: ParticleDrawingShape,
): PixelBuffer {
  const size = 32;
  const data = new Uint32Array(size * size);
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const x = ((px + 0.5) / size) * 2 - 1;
      const y = ((py + 0.5) / size) * 2 - 1;
      const intensity = textureIntensity(style, x, y) * shapeMask(x, y, shape);
      data[py * size + px] = rgbaWhite(intensity);
    }
  }
  return { data, height: size, width: size };
}

export function createPresetTexture(
  assetId: string,
  shape: ParticleDrawingShape = 'circle',
): TextureSelection {
  const style = textureStyles[assetId] ?? 'glow';
  return {
    assetId,
    buffer: generatedBuffer(style, shape),
    columns: 1,
    frame: 0,
    kind: 'generated',
    label: `${textureLabels[style]} · ${shape}`,
    rows: 1,
    shape,
  };
}

export function createDefaultTexture(): TextureSelection {
  return createPresetTexture('editor-spark');
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
    kind: 'uploaded',
    label: file.name,
    rows: 1,
    shape: 'circle',
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

export async function texturePngBlob(buffer: PixelBuffer): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = buffer.width;
  canvas.height = buffer.height;
  const context = canvas.getContext('2d');
  if (context === null) throw new Error('Canvas 2D is unavailable.');
  const bytes = new Uint8ClampedArray(buffer.data.byteLength);
  bytes.set(
    new Uint8Array(
      buffer.data.buffer,
      buffer.data.byteOffset,
      buffer.data.byteLength,
    ),
  );
  context.putImageData(new ImageData(bytes, buffer.width, buffer.height), 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (blob === null)
    throw new Error('The particle texture could not be encoded.');
  return blob;
}
