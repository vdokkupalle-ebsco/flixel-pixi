// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { bakeHorizontalStrip, requireFrame } from '../../examples/games/kenney-platformer/bake';
import { parseKenneyAtlasXml } from '../../examples/games/kenney-platformer/atlas';

describe('bakeHorizontalStrip', () => {
  it('creates a strip with N cells', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f0';
      ctx.fillRect(0, 0, 128, 128);
    }

    const frame = { name: 'a.png', x: 0, y: 0, width: 128, height: 128 };
    const tex = bakeHorizontalStrip(canvas, [null, frame], 64, 64);
    expect(tex.width).toBe(128); // 2 * 64
    expect(tex.height).toBe(64);
  });

  it('requireFrame throws on missing name', () => {
    const atlas = parseKenneyAtlasXml(
      `<TextureAtlas><SubTexture name="a.png" x="0" y="0" width="1" height="1"/></TextureAtlas>`,
    );
    expect(() => requireFrame(atlas, 'missing.png')).toThrow(/missing\.png/);
  });
});
