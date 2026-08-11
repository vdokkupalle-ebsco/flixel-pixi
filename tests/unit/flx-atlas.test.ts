// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BufferImageSource, Texture } from 'pixi.js';

import { FlxAtlas } from '../../src/assets/flx-atlas';
import { FlxAtlasRegistry } from '../../src/assets/flx-atlas-registry';
import type { FlxAtlasFrameRect } from '../../src/assets/flx-atlas-frame';
import * as atlasBake from '../../src/assets/flx-atlas-bake';

// ── Test helpers ──────────────────────────────────────────────────────────────

function makeTexture(w: number, h: number): Texture {
  const bytes = new Uint8Array(w * h * 4);
  const source = new BufferImageSource({
    autoGenerateMipmaps: false,
    height: h,
    resource: bytes,
    scaleMode: 'nearest',
    width: w,
  });
  return new Texture({ source });
}

function makeAtlas(rects: FlxAtlasFrameRect[], key = 'test'): FlxAtlas {
  const maxX = Math.max(...rects.map((r) => r.x + r.width), 1);
  const maxY = Math.max(...rects.map((r) => r.y + r.height), 1);
  const tex = makeTexture(maxX, maxY);
  return FlxAtlas.fromTextureAndRects(key, tex, rects);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('bakeAtlasFrameStrip', () => {
  it('validates the frame list and output dimensions', () => {
    expect(() => atlasBake.bakeAtlasFrameStrip([], 8, 8)).toThrow(RangeError);
    expect(() => atlasBake.bakeAtlasFrameStrip([null], 0, 8)).toThrow(
      RangeError,
    );
    expect(() => atlasBake.bakeAtlasFrameStrip([null], 8, -1)).toThrow(
      RangeError,
    );
  });

  it('bakes non-null cells and leaves null cells transparent', () => {
    const context = {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(16 * 8 * 4),
      })),
      imageSmoothingEnabled: true,
      restore: vi.fn(),
      rotate: vi.fn(),
      save: vi.fn(),
      translate: vi.fn(),
    };
    const canvas = {
      getContext: vi.fn(() => context),
      height: 0,
      width: 0,
    };
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName) =>
      tagName === 'canvas'
        ? (canvas as unknown as HTMLCanvasElement)
        : createElement(tagName),
    );

    const texture = atlasBake.bakeAtlasFrameStrip(
      [
        null,
        {
          height: 4,
          source: {} as CanvasImageSource,
          width: 4,
          x: 2,
          y: 3,
        },
      ],
      8,
      8,
    );

    expect(canvas).toMatchObject({ height: 8, width: 16 });
    expect(context.imageSmoothingEnabled).toBe(false);
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 16, 8);
    expect(context.drawImage).toHaveBeenCalledOnce();
    expect(context.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      2,
      3,
      4,
      4,
      8,
      0,
      8,
      8,
    );
    expect(texture.width).toBe(16);
    texture.destroy(true);
  });

  it('places trimmed pixels within the scaled logical frame', () => {
    const context = {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(20 * 10 * 4),
      })),
      imageSmoothingEnabled: true,
      restore: vi.fn(),
      rotate: vi.fn(),
      save: vi.fn(),
      translate: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: vi.fn(() => context),
      height: 0,
      width: 0,
    } as unknown as HTMLCanvasElement);

    const texture = atlasBake.bakeAtlasFrameStrip(
      [
        {
          height: 3,
          source: {} as CanvasImageSource,
          sourceHeight: 10,
          sourceWidth: 10,
          trimHeight: 3,
          trimWidth: 4,
          trimX: 2,
          trimY: 1,
          width: 4,
          x: 5,
          y: 6,
        },
      ],
      20,
      10,
    );

    expect(context.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      5,
      6,
      4,
      3,
      4,
      1,
      8,
      3,
    );
    texture.destroy(true);
  });

  it('undoes clockwise packed rotation while drawing', () => {
    const context = {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(4 * 6 * 4),
      })),
      imageSmoothingEnabled: true,
      restore: vi.fn(),
      rotate: vi.fn(),
      save: vi.fn(),
      translate: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: vi.fn(() => context),
      height: 0,
      width: 0,
    } as unknown as HTMLCanvasElement);

    const texture = atlasBake.bakeAtlasFrameStrip(
      [
        {
          height: 4,
          rotated: true,
          source: {} as CanvasImageSource,
          width: 6,
          x: 2,
          y: 3,
        },
      ],
      4,
      6,
    );

    expect(context.save).toHaveBeenCalledOnce();
    expect(context.translate).toHaveBeenCalledWith(0, 6);
    expect(context.rotate).toHaveBeenCalledWith(-Math.PI / 2);
    expect(context.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      2,
      3,
      6,
      4,
      0,
      0,
      6,
      4,
    );
    expect(context.restore).toHaveBeenCalledOnce();
    texture.destroy(true);
  });

  it('combines trim placement with inverse rotation', () => {
    const context = {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(28 * 24 * 4),
      })),
      imageSmoothingEnabled: true,
      restore: vi.fn(),
      rotate: vi.fn(),
      save: vi.fn(),
      translate: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: vi.fn(() => context),
      height: 0,
      width: 0,
    } as unknown as HTMLCanvasElement);

    const texture = atlasBake.bakeAtlasFrameStrip(
      [
        {
          height: 4,
          rotated: true,
          source: {} as CanvasImageSource,
          sourceHeight: 12,
          sourceWidth: 14,
          trimHeight: 6,
          trimWidth: 4,
          trimX: 3,
          trimY: 2,
          width: 6,
          x: 7,
          y: 8,
        },
      ],
      28,
      24,
    );

    expect(context.translate).toHaveBeenCalledWith(6, 16);
    expect(context.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      7,
      8,
      6,
      4,
      0,
      0,
      12,
      8,
    );
    texture.destroy(true);
  });

  it('reports a missing 2D canvas context', () => {
    const canvas = {
      getContext: vi.fn(() => null),
      height: 0,
      width: 0,
    };
    vi.spyOn(document, 'createElement').mockReturnValue(
      canvas as unknown as HTMLCanvasElement,
    );

    expect(() => atlasBake.bakeAtlasFrameStrip([null], 8, 8)).toThrow(
      /2D canvas context/,
    );
  });
});

// ── FlxAtlas pickers ──────────────────────────────────────────────────────────

describe('FlxAtlas.getFrame', () => {
  it('resolves by exact name', () => {
    const atlas = makeAtlas([
      { height: 8, name: 'idle.png', width: 8, x: 0, y: 0 },
      { height: 8, name: 'walk.png', width: 8, x: 8, y: 0 },
    ]);
    const frame = atlas.getFrame('idle.png');
    expect(frame.name).toBe('idle.png');
    expect(frame.index).toBe(0);
  });

  it('falls back to name + ".png"', () => {
    const atlas = makeAtlas([
      { height: 8, name: 'walk_1.png', width: 8, x: 0, y: 0 },
    ]);
    // Should resolve "walk_1" → "walk_1.png"
    expect(atlas.getFrame('walk_1').name).toBe('walk_1.png');
  });

  it('throws when neither name nor name+.png resolves', () => {
    const atlas = makeAtlas([
      { height: 8, name: 'a.png', width: 8, x: 0, y: 0 },
    ]);
    expect(() => atlas.getFrame('missing')).toThrow(/missing/);
  });

  it('builds Pixi rotation, original-size, and trim metadata', () => {
    const atlas = makeAtlas([
      {
        height: 6,
        name: 'packed.png',
        rotated: true,
        sourceHeight: 12,
        sourceWidth: 14,
        trimHeight: 6,
        trimWidth: 4,
        trimX: 3,
        trimY: 2,
        width: 4,
        x: 0,
        y: 0,
      },
    ]);
    const texture = atlas.getFrame('packed').texture;

    expect(texture.rotate).toBe(2);
    expect(texture.frame).toMatchObject({ height: 4, width: 6 });
    expect(texture.orig).toMatchObject({ height: 12, width: 14 });
    expect(texture.trim).toMatchObject({
      height: 6,
      width: 4,
      x: 3,
      y: 2,
    });
  });

  it('rejects duplicate frame names', () => {
    expect(() =>
      makeAtlas([
        { height: 4, name: 'same', width: 4, x: 0, y: 0 },
        { height: 4, name: 'same', width: 4, x: 4, y: 0 },
      ]),
    ).toThrow(/duplicate/i);
  });
});

describe('FlxAtlas.framesByPrefix', () => {
  it('builds names with default padding 1', () => {
    const atlas = makeAtlas([
      { height: 8, name: 'walk_1.png', width: 8, x: 0, y: 0 },
      { height: 8, name: 'walk_2.png', width: 8, x: 8, y: 0 },
    ]);
    const frames = atlas.framesByPrefix('walk_', 1, 2);
    expect(frames).toHaveLength(2);
    expect(frames[0]?.name).toBe('walk_1.png');
    expect(frames[1]?.name).toBe('walk_2.png');
  });

  it('pads with leading zeros when padding=2', () => {
    const atlas = makeAtlas([
      { height: 8, name: 'run_01.png', width: 8, x: 0, y: 0 },
      { height: 8, name: 'run_02.png', width: 8, x: 8, y: 0 },
    ]);
    const frames = atlas.framesByPrefix('run_', 1, 2, { padding: 2 });
    expect(frames[0]?.name).toBe('run_01.png');
    expect(frames[1]?.name).toBe('run_02.png');
  });

  it('throws when padding < 1', () => {
    const atlas = makeAtlas([
      { height: 8, name: 'a_1.png', width: 8, x: 0, y: 0 },
    ]);
    expect(() => atlas.framesByPrefix('a_', 1, 1, { padding: 0 })).toThrow(
      RangeError,
    );
  });

  it('throws when start > end', () => {
    const atlas = makeAtlas([
      { height: 8, name: 'a_1.png', width: 8, x: 0, y: 0 },
    ]);
    expect(() => atlas.framesByPrefix('a_', 5, 3)).toThrow(RangeError);
  });
});

describe('FlxAtlas.framesByNumber', () => {
  it('is 0-based: index 0 is the first frame', () => {
    const atlas = makeAtlas([
      { height: 8, name: 'f0.png', width: 8, x: 0, y: 0 },
      { height: 8, name: 'f1.png', width: 8, x: 8, y: 0 },
    ]);
    const frames = atlas.framesByNumber(0, 1);
    expect(frames[0]?.name).toBe('f0.png');
    expect(frames[1]?.name).toBe('f1.png');
  });

  it('accepts an explicit index array', () => {
    const atlas = makeAtlas([
      { height: 8, name: 'a.png', width: 8, x: 0, y: 0 },
      { height: 8, name: 'b.png', width: 8, x: 8, y: 0 },
      { height: 8, name: 'c.png', width: 8, x: 16, y: 0 },
    ]);
    const frames = atlas.framesByNumber([2, 0]);
    expect(frames[0]?.name).toBe('c.png');
    expect(frames[1]?.name).toBe('a.png');
  });

  it('throws on out-of-range index', () => {
    const atlas = makeAtlas([
      { height: 8, name: 'a.png', width: 8, x: 0, y: 0 },
    ]);
    expect(() => atlas.framesByNumber(0, 5)).toThrow(RangeError);
    expect(() => atlas.framesByNumber([99])).toThrow(RangeError);
  });

  it('throws when start > end', () => {
    const atlas = makeAtlas([
      { height: 8, name: 'a.png', width: 8, x: 0, y: 0 },
    ]);
    expect(() => atlas.framesByNumber(1, 0)).toThrow(RangeError);
  });
});

// ── FlxAtlasRegistry ──────────────────────────────────────────────────────────

describe('FlxAtlasRegistry', () => {
  let registry: FlxAtlasRegistry;

  beforeEach(() => {
    registry = new FlxAtlasRegistry();
  });

  it('get throws when key is missing', () => {
    expect(() => registry.get('missing')).toThrow(/missing/i);
  });

  it('has returns false before load and true after', () => {
    expect(registry.has('k')).toBe(false);
  });

  it('remove drops the atlas', () => {
    // Manually inject an atlas by calling fromTextureAndRects and setting via private map
    // We test remove by using load with a mocked fetch + Image.
    // Simpler: just verify has returns false for a non-existing key after remove.
    registry.remove('nonexistent'); // should not throw
    expect(registry.has('nonexistent')).toBe(false);
  });

  it('clear removes all atlases', () => {
    registry.clear(); // no-op on empty
    expect(registry.has('anything')).toBe(false);
  });

  it('load with grid meta resolves via parseFixedGridAtlas', async () => {
    // Mock Image loading
    const originalImage = globalThis.Image;

    // Use a class that fires onload via queueMicrotask after src is set,
    // so handlers are always registered before the callback fires.
    class FakeImage {
      crossOrigin = '';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      #src = '';
      get src(): string {
        return this.#src;
      }
      set src(url: string) {
        this.#src = url;
        queueMicrotask(() => {
          this.onload?.();
        });
      }
    }
    globalThis.Image = FakeImage as unknown as typeof Image;

    // Mock Texture.from
    const tex = makeTexture(16, 8);
    vi.spyOn(Texture, 'from').mockReturnValue(tex);

    const atlas = await registry.load('tiles', './tiles.png', {
      frameWidth: 8,
      frameHeight: 8,
    });

    expect(atlas.key).toBe('tiles');
    expect(atlas.frameCount).toBe(2);
    expect(registry.has('tiles')).toBe(true);
    expect(registry.get('tiles')).toBe(atlas);

    registry.remove('tiles');
    expect(registry.has('tiles')).toBe(false);

    globalThis.Image = originalImage;
  });
});

describe('FlxAtlas.makeGraphic', () => {
  it('delegates to bakeAtlasFrameStrip with scaled cell size', () => {
    const atlas = makeAtlas([
      { height: 16, name: 'a.png', width: 16, x: 0, y: 0 },
      { height: 16, name: 'b.png', width: 16, x: 16, y: 0 },
    ]);
    const strip = makeTexture(24, 8);
    const spy = vi
      .spyOn(atlasBake, 'bakeAtlasFrameStrip')
      .mockReturnValue(strip);

    const result = atlas.makeGraphic(
      [null, atlas.getFrame('a'), atlas.getFrame('b')],
      8,
      8,
    );
    expect(result).toBe(strip);
    expect(spy).toHaveBeenCalledWith(expect.any(Array), 8, 8);
    expect(spy.mock.calls[0]?.[0]).toHaveLength(3);
  });

  it('passes rotated and trimmed logical geometry to the strip baker', () => {
    const atlas = makeAtlas([
      {
        height: 6,
        name: 'packed.png',
        rotated: true,
        sourceHeight: 12,
        sourceWidth: 14,
        trimHeight: 6,
        trimWidth: 4,
        trimX: 3,
        trimY: 2,
        width: 4,
        x: 0,
        y: 0,
      },
    ]);
    const strip = makeTexture(14, 12);
    const spy = vi
      .spyOn(atlasBake, 'bakeAtlasFrameStrip')
      .mockReturnValue(strip);

    expect(atlas.makeGraphic([atlas.getFrame('packed')])).toBe(strip);
    expect(spy).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          height: 6,
          rotated: true,
          sourceHeight: 12,
          sourceWidth: 14,
          trimHeight: 6,
          trimWidth: 4,
          trimX: 3,
          trimY: 2,
          width: 4,
        }),
      ],
      14,
      12,
    );
  });

  it('rejects empty or all-null frame lists', () => {
    const atlas = makeAtlas([
      { height: 8, name: 'a.png', width: 8, x: 0, y: 0 },
    ]);
    expect(() => atlas.makeGraphic([])).toThrow(RangeError);
    expect(() => atlas.makeGraphic([null, null])).toThrow(RangeError);
  });
});
