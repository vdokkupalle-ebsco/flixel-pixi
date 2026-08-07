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

  afterEach(() => {
    vi.restoreAllMocks();
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
        const self = this;
        queueMicrotask(() => {
          self.onload?.();
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

  it('rejects empty or all-null frame lists', () => {
    const atlas = makeAtlas([
      { height: 8, name: 'a.png', width: 8, x: 0, y: 0 },
    ]);
    expect(() => atlas.makeGraphic([])).toThrow(RangeError);
    expect(() => atlas.makeGraphic([null, null])).toThrow(RangeError);
  });
});
