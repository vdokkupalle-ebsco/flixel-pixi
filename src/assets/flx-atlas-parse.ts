import type { FlxAtlasFrameRect } from './flx-atlas-frame';

// ── XML parser ────────────────────────────────────────────────────────────────

/**
 * Parse a TextureAtlas XML string (Kenney / LibGDX / Shoebox format) into an
 * ordered array of frame rects.
 *
 * Supports attributes `width`/`height` **and** `w`/`h`.
 * Throws if no SubTexture elements are found.
 *
 * @public
 */
export function parseTextureAtlasXml(xmlText: string): FlxAtlasFrameRect[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');

  // DOMParser sets the root to a parseerror element on failure
  const parseError = doc.querySelector('parsererror');
  if (parseError !== null) {
    throw new Error(`XML parse error: ${parseError.textContent ?? 'unknown'}`);
  }

  const subTextures = doc.querySelectorAll('SubTexture');
  if (subTextures.length === 0) {
    throw new Error(
      'No SubTexture elements found in TextureAtlas XML. The atlas appears to be empty.',
    );
  }

  const frames: FlxAtlasFrameRect[] = [];
  for (const el of subTextures) {
    const name = el.getAttribute('name') ?? '';
    const x = Number(el.getAttribute('x') ?? 0);
    const y = Number(el.getAttribute('y') ?? 0);
    // Support both width/height and w/h attribute variants
    const width = Number(
      el.getAttribute('width') ?? el.getAttribute('w') ?? 0,
    );
    const height = Number(
      el.getAttribute('height') ?? el.getAttribute('h') ?? 0,
    );
    frames.push({ height, name, width, x, y });
  }
  return frames;
}

// ── JSON parser ───────────────────────────────────────────────────────────────

interface JsonFrameEntry {
  frame: { x: number; y: number; w?: number; h?: number; width?: number; height?: number };
  rotated?: boolean;
}

interface JsonAtlasHash {
  frames: Record<string, JsonFrameEntry>;
}

interface JsonAtlasArray {
  frames: Array<{ filename: string } & JsonFrameEntry>;
}

/**
 * Parse a TexturePacker / Pixi JSON atlas string into an ordered array of
 * frame rects. Supports both hash (`frames: { "name": {...} }`) and array
 * (`frames: [ { filename, frame } ]`) formats.
 *
 * Throws a clear error for any rotated frame (`rotated: true`) since correct
 * UV mapping for rotated regions is not supported in v1.
 *
 * @public
 */
export function parseTextureAtlasJson(jsonText: string): FlxAtlasFrameRect[] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data: unknown = JSON.parse(jsonText);
  if (typeof data !== 'object' || data === null) {
    throw new Error('Atlas JSON must be an object.');
  }

  const raw = data as Record<string, unknown>;
  if (!('frames' in raw)) {
    throw new Error('Atlas JSON must have a "frames" property.');
  }

  const framesRaw = raw['frames'];

  // Array format: [ { filename, frame: { x, y, w, h }, rotated? } ]
  if (Array.isArray(framesRaw)) {
    return (framesRaw as Array<Record<string, unknown>>).map((entry, idx) => {
      if (entry['rotated'] === true) {
        const name = String(entry['filename'] ?? idx);
        throw new Error(
          `Atlas frame "${name}" has rotated: true, which is not supported. ` +
            'Please disable rotation in TexturePacker.',
        );
      }
      const frame = entry['frame'] as Record<string, number> | undefined;
      if (frame === undefined) throw new Error(`Frame at index ${idx} is missing "frame" rect.`);
      const x = frame['x'] ?? 0;
      const y = frame['y'] ?? 0;
      const width = frame['w'] ?? frame['width'] ?? 0;
      const height = frame['h'] ?? frame['height'] ?? 0;
      const name = String(entry['filename'] ?? idx);
      return { height, name, width, x, y };
    });
  }

  // Hash format: { "name": { frame: { x, y, w, h }, rotated? } }
  if (typeof framesRaw === 'object' && framesRaw !== null) {
    const hash = framesRaw as Record<string, unknown>;
    return Object.entries(hash).map(([name, rawEntry]) => {
      const entry = rawEntry as Record<string, unknown>;
      if (entry['rotated'] === true) {
        throw new Error(
          `Atlas frame "${name}" has rotated: true, which is not supported. ` +
            'Please disable rotation in TexturePacker.',
        );
      }
      const frame = entry['frame'] as Record<string, number> | undefined;
      if (frame === undefined) throw new Error(`Frame "${name}" is missing "frame" rect.`);
      const x = frame['x'] ?? 0;
      const y = frame['y'] ?? 0;
      const width = frame['w'] ?? frame['width'] ?? 0;
      const height = frame['h'] ?? frame['height'] ?? 0;
      return { height, name, width, x, y };
    });
  }

  throw new Error('"frames" must be an object or an array.');
}

// ── Fixed-grid parser ─────────────────────────────────────────────────────────

/**
 * Generate frame rects for a uniform fixed-size grid atlas.
 * Frames are named `"0"`, `"1"`, … in row-major (left→right, top→bottom) order.
 *
 * Throws if the image dimensions are not evenly divisible by the frame size,
 * or if any of the dimensions are not positive integers.
 *
 * @public
 */
export function parseFixedGridAtlas(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): FlxAtlasFrameRect[] {
  if (
    !Number.isInteger(imageWidth) ||
    !Number.isInteger(imageHeight) ||
    !Number.isInteger(frameWidth) ||
    !Number.isInteger(frameHeight) ||
    imageWidth <= 0 ||
    imageHeight <= 0 ||
    frameWidth <= 0 ||
    frameHeight <= 0
  ) {
    throw new RangeError(
      'Image and frame dimensions must be positive integers.',
    );
  }
  if (imageWidth % frameWidth !== 0 || imageHeight % frameHeight !== 0) {
    throw new RangeError(
      `Image size (${imageWidth}×${imageHeight}) is not evenly divisible by ` +
        `frame size (${frameWidth}×${frameHeight}).`,
    );
  }

  const columns = imageWidth / frameWidth;
  const rows = imageHeight / frameHeight;
  const frames: FlxAtlasFrameRect[] = [];
  let index = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      frames.push({
        height: frameHeight,
        name: String(index),
        width: frameWidth,
        x: col * frameWidth,
        y: row * frameHeight,
      });
      index += 1;
    }
  }
  return frames;
}
