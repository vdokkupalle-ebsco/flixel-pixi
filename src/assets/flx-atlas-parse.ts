import type { FlxAtlasFrameRect } from './flx-atlas-frame';

// ── XML parser ────────────────────────────────────────────────────────────────

/**
 * Parse a TextureAtlas XML string (Kenney / LibGDX / Shoebox format) into an
 * ordered array of frame rects.
 *
 * Supports Sparrow/Kenney `SubTexture` entries and TexturePacker-style
 * `sprite` entries. Frame names may use `name` or `n`, and dimensions may use
 * `width`/`height` or `w`/`h`.
 * Throws if no supported frame elements are found.
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

  const frameElements = [...doc.getElementsByTagName('*')].filter((element) => {
    const name = element.localName.toLowerCase();
    return name === 'subtexture' || name === 'sprite';
  });
  if (frameElements.length === 0) {
    throw new Error(
      'No SubTexture or sprite elements found in TextureAtlas XML. The atlas appears to be empty or uses an unsupported format.',
    );
  }

  const frames: FlxAtlasFrameRect[] = [];
  for (const el of frameElements) {
    const name = el.getAttribute('name') ?? el.getAttribute('n') ?? '';
    const x = Number(el.getAttribute('x') ?? 0);
    const y = Number(el.getAttribute('y') ?? 0);
    // Support both width/height and w/h attribute variants
    const width = Number(el.getAttribute('width') ?? el.getAttribute('w') ?? 0);
    const height = Number(
      el.getAttribute('height') ?? el.getAttribute('h') ?? 0,
    );
    frames.push({ height, name, width, x, y });
  }
  return frames;
}

// ── JSON parser ───────────────────────────────────────────────────────────────

/**
 * Parse a TexturePacker / Pixi JSON atlas string into an ordered array of
 * frame rects. Supports both hash (`frames: { "name": {...} }`) and array
 * (`frames: [ { filename, frame } ]`) formats.
 *
 * Preserves TexturePacker rotation and trim metadata so Pixi can reconstruct
 * each frame's logical size and placement.
 *
 * @public
 */
export function parseTextureAtlasJson(jsonText: string): FlxAtlasFrameRect[] {
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
    const names = new Set<string>();
    return framesRaw.map((value, idx) => {
      const entry = atlasRecord(value, `Frame at index ${idx}`);
      const name = String(entry['filename'] ?? idx);
      if (names.has(name)) {
        throw new Error(`Atlas JSON contains duplicate frame "${name}".`);
      }
      names.add(name);
      return parseJsonFrame(name, entry);
    });
  }

  // Hash format: { "name": { frame: { x, y, w, h }, rotated? } }
  if (typeof framesRaw === 'object' && framesRaw !== null) {
    const hash = framesRaw as Record<string, unknown>;
    return Object.entries(hash).map(([name, rawEntry]) => {
      return parseJsonFrame(name, atlasRecord(rawEntry, `Frame "${name}"`));
    });
  }

  throw new Error('"frames" must be an object or an array.');
}

function atlasRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function atlasNumber(
  value: unknown,
  label: string,
  allowZero: boolean,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    (allowZero ? value < 0 : value <= 0)
  ) {
    throw new RangeError(
      `${label} must be ${allowZero ? 'a non-negative' : 'a positive'} integer.`,
    );
  }
  return value;
}

function frameDimension(
  frame: Record<string, unknown>,
  shortName: 'w' | 'h',
  longName: 'width' | 'height',
  label: string,
): number {
  return atlasNumber(frame[shortName] ?? frame[longName], label, false);
}

function parseJsonFrame(
  name: string,
  entry: Record<string, unknown>,
): FlxAtlasFrameRect {
  if (name.length === 0) throw new Error('Atlas frame name must not be empty.');
  const frame = atlasRecord(entry['frame'], `Frame "${name}" rect`);
  const x = atlasNumber(frame['x'], `Frame "${name}" x`, true);
  const y = atlasNumber(frame['y'], `Frame "${name}" y`, true);
  const width = frameDimension(frame, 'w', 'width', `Frame "${name}" width`);
  const height = frameDimension(frame, 'h', 'height', `Frame "${name}" height`);
  for (const flag of ['rotated', 'trimmed'] as const) {
    if (entry[flag] !== undefined && typeof entry[flag] !== 'boolean') {
      throw new TypeError(`Frame "${name}" ${flag} must be boolean.`);
    }
  }
  const rotated = entry['rotated'] === true;
  const hasTrimMetadata =
    entry['trimmed'] !== false &&
    (entry['trimmed'] === true ||
      entry['sourceSize'] !== undefined ||
      entry['spriteSourceSize'] !== undefined);
  if (!hasTrimMetadata) {
    return { height, name, rotated, width, x, y };
  }

  const source = atlasRecord(entry['sourceSize'], `Frame "${name}" sourceSize`);
  const trim = atlasRecord(
    entry['spriteSourceSize'],
    `Frame "${name}" spriteSourceSize`,
  );
  const sourceWidth = frameDimension(
    source,
    'w',
    'width',
    `Frame "${name}" source width`,
  );
  const sourceHeight = frameDimension(
    source,
    'h',
    'height',
    `Frame "${name}" source height`,
  );
  const trimX = atlasNumber(trim['x'], `Frame "${name}" trim x`, true);
  const trimY = atlasNumber(trim['y'], `Frame "${name}" trim y`, true);
  const trimWidth = frameDimension(
    trim,
    'w',
    'width',
    `Frame "${name}" trim width`,
  );
  const trimHeight = frameDimension(
    trim,
    'h',
    'height',
    `Frame "${name}" trim height`,
  );
  if (trimX + trimWidth > sourceWidth || trimY + trimHeight > sourceHeight) {
    throw new RangeError(
      `Frame "${name}" trimmed region must fit inside sourceSize.`,
    );
  }
  return {
    height,
    name,
    rotated,
    sourceHeight,
    sourceWidth,
    trimHeight,
    trimWidth,
    trimX,
    trimY,
    width,
    x,
    y,
  };
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
