// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import {
  parseFixedGridAtlas,
  parseTextureAtlasJson,
  parseTextureAtlasXml,
} from '../../src/assets/flx-atlas-parse';

// ── XML ───────────────────────────────────────────────────────────────────────

describe('parseTextureAtlasXml', () => {
  it('reads SubTexture entries in order', () => {
    const frames = parseTextureAtlasXml(`<?xml version="1.0"?>
      <TextureAtlas imagePath="sheet.png">
        <SubTexture name="a.png" x="0" y="0" width="10" height="10"/>
        <SubTexture name="b.png" x="10" y="0" width="10" height="10"/>
      </TextureAtlas>`);
    expect(frames).toHaveLength(2);
    expect(frames[0]?.name).toBe('a.png');
    expect(frames[0]).toMatchObject({ height: 10, width: 10, x: 0, y: 0 });
    expect(frames[1]?.x).toBe(10);
  });

  it('supports w/h attribute aliases', () => {
    const frames = parseTextureAtlasXml(
      `<TextureAtlas><SubTexture name="c.png" x="5" y="5" w="32" h="32"/></TextureAtlas>`,
    );
    expect(frames[0]).toMatchObject({
      height: 32,
      name: 'c.png',
      width: 32,
      x: 5,
      y: 5,
    });
  });

  it('supports TexturePacker sprite entries and short frame names', () => {
    const frames = parseTextureAtlasXml(
      `<TextureAtlas image="tiles.png"><sprite n="platform" x="4" y="6" w="32" h="16"/></TextureAtlas>`,
    );
    expect(frames[0]).toEqual({
      height: 16,
      name: 'platform',
      width: 32,
      x: 4,
      y: 6,
    });
  });

  it('throws when empty', () => {
    expect(() => parseTextureAtlasXml('<TextureAtlas></TextureAtlas>')).toThrow(
      /SubTexture/i,
    );
  });

  it('throws on invalid XML', () => {
    expect(() => parseTextureAtlasXml('<unclosed')).toThrow();
  });
});

// ── JSON ──────────────────────────────────────────────────────────────────────

describe('parseTextureAtlasJson', () => {
  it('parses hash frames in insertion order', () => {
    const frames = parseTextureAtlasJson(
      JSON.stringify({
        frames: {
          'idle.png': { frame: { x: 0, y: 0, w: 8, h: 8 } },
          'walk.png': { frame: { x: 8, y: 0, w: 8, h: 8 } },
        },
      }),
    );
    expect(frames.map((f) => f.name)).toEqual(['idle.png', 'walk.png']);
    expect(frames[0]).toMatchObject({ height: 8, width: 8, x: 0, y: 0 });
    expect(frames[1]?.x).toBe(8);
  });

  it('parses array frames', () => {
    const frames = parseTextureAtlasJson(
      JSON.stringify({
        frames: [{ filename: 'a.png', frame: { x: 0, y: 0, w: 4, h: 4 } }],
      }),
    );
    expect(frames[0]?.name).toBe('a.png');
    expect(frames[0]).toMatchObject({ height: 4, width: 4, x: 0, y: 0 });
  });

  it('supports width/height aliases in frame rect', () => {
    const frames = parseTextureAtlasJson(
      JSON.stringify({
        frames: {
          'tile.png': { frame: { x: 0, y: 0, width: 16, height: 16 } },
        },
      }),
    );
    expect(frames[0]).toMatchObject({ height: 16, width: 16 });
  });

  it('preserves rotated and trimmed TexturePacker metadata', () => {
    const frames = parseTextureAtlasJson(
      JSON.stringify({
        frames: {
          'hero.png': {
            frame: { h: 12, w: 8, x: 4, y: 6 },
            rotated: true,
            sourceSize: { h: 20, w: 18 },
            spriteSourceSize: { h: 12, w: 8, x: 5, y: 4 },
            trimmed: true,
          },
        },
      }),
    );
    expect(frames[0]).toEqual({
      height: 12,
      name: 'hero.png',
      rotated: true,
      sourceHeight: 20,
      sourceWidth: 18,
      trimHeight: 12,
      trimWidth: 8,
      trimX: 5,
      trimY: 4,
      width: 8,
      x: 4,
      y: 6,
    });
  });

  it('rejects duplicate array names and malformed frame geometry', () => {
    expect(() =>
      parseTextureAtlasJson(
        JSON.stringify({
          frames: [
            { filename: 'a.png', frame: { h: 4, w: 4, x: 0, y: 0 } },
            { filename: 'a.png', frame: { h: 4, w: 4, x: 4, y: 0 } },
          ],
        }),
      ),
    ).toThrow(/duplicate/i);
    expect(() =>
      parseTextureAtlasJson(
        JSON.stringify({
          frames: {
            'bad.png': { frame: { h: 4, w: 0, x: 0, y: 0 } },
          },
        }),
      ),
    ).toThrow(/positive integer/i);
  });

  it('rejects incomplete or out-of-bounds trim metadata', () => {
    expect(() =>
      parseTextureAtlasJson(
        JSON.stringify({
          frames: {
            'bad.png': {
              frame: { h: 4, w: 4, x: 0, y: 0 },
              sourceSize: { h: 8, w: 8 },
              trimmed: true,
            },
          },
        }),
      ),
    ).toThrow(/spriteSourceSize/i);
    expect(() =>
      parseTextureAtlasJson(
        JSON.stringify({
          frames: {
            'bad.png': {
              frame: { h: 4, w: 4, x: 0, y: 0 },
              sourceSize: { h: 8, w: 8 },
              spriteSourceSize: { h: 4, w: 4, x: 6, y: 0 },
              trimmed: true,
            },
          },
        }),
      ),
    ).toThrow(/fit inside/i);
  });

  it('throws when frames property is missing', () => {
    expect(() => parseTextureAtlasJson(JSON.stringify({ meta: {} }))).toThrow(
      /frames/i,
    );
  });
});

// ── Fixed Grid ────────────────────────────────────────────────────────────────

describe('parseFixedGridAtlas', () => {
  it('names frames by 0-based index, row-major', () => {
    const frames = parseFixedGridAtlas(16, 8, 8, 8);
    expect(frames).toHaveLength(2);
    expect(frames[0]).toMatchObject({
      height: 8,
      name: '0',
      width: 8,
      x: 0,
      y: 0,
    });
    expect(frames[1]).toMatchObject({
      height: 8,
      name: '1',
      width: 8,
      x: 8,
      y: 0,
    });
  });

  it('handles multiple rows correctly', () => {
    const frames = parseFixedGridAtlas(16, 16, 8, 8);
    expect(frames).toHaveLength(4);
    expect(frames[0]).toMatchObject({ name: '0', x: 0, y: 0 });
    expect(frames[1]).toMatchObject({ name: '1', x: 8, y: 0 });
    expect(frames[2]).toMatchObject({ name: '2', x: 0, y: 8 });
    expect(frames[3]).toMatchObject({ name: '3', x: 8, y: 8 });
  });

  it('throws when not evenly divisible', () => {
    expect(() => parseFixedGridAtlas(10, 8, 8, 8)).toThrow(RangeError);
    expect(() => parseFixedGridAtlas(8, 10, 8, 8)).toThrow(RangeError);
  });

  it('throws on non-positive dimensions', () => {
    expect(() => parseFixedGridAtlas(0, 8, 8, 8)).toThrow(RangeError);
    expect(() => parseFixedGridAtlas(8, 8, 0, 8)).toThrow(RangeError);
    expect(() => parseFixedGridAtlas(-8, 8, 8, 8)).toThrow(RangeError);
  });

  it('throws on non-integer dimensions', () => {
    expect(() => parseFixedGridAtlas(8.5, 8, 8, 8)).toThrow(RangeError);
  });
});
