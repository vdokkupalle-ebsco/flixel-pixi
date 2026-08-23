import { describe, expect, it } from 'vitest';

import {
  cloneTextureSelection,
  createPresetTexture,
  normalizeTextureRegion,
} from '../src/texture';

describe('particle editor generated textures', () => {
  it.each([
    'editor-spark',
    'editor-fire',
    'editor-snow',
    'editor-burst',
    'editor-smoke',
    'editor-flame',
    'editor-water',
    'editor-rain',
    'editor-dust',
    'editor-confetti',
    'editor-firefly',
    'editor-electric',
  ])(
    'packs %s as transparent RGBA pixels instead of an opaque square',
    (assetId) => {
      const texture = createPresetTexture(assetId);
      const pixels = [...texture.buffer.data];

      expect(pixels[0]).toBe(0);
      expect(pixels.some((color) => (color & 0xff) > 0)).toBe(true);
      expect(
        pixels.every((color) => color === 0 || color >>> 8 === 0xff_ff_ff),
      ).toBe(true);
    },
  );

  it('draws effect-specific 32px textures with transparent edges', () => {
    const smoke = createPresetTexture('editor-smoke');
    const water = createPresetTexture('editor-water');

    expect(smoke.buffer).toMatchObject({ height: 32, width: 32 });
    expect(smoke.buffer.data[0]).toBe(0);
    expect((smoke.buffer.data[16 * 32 + 16] ?? 0) & 0xff).toBeGreaterThan(0);
    expect(smoke.buffer.data).not.toEqual(water.buffer.data);
    expect(smoke.buffer.data).not.toEqual(
      createPresetTexture('editor-dust').buffer.data,
    );
    expect(smoke.label).toContain('Soft organic puff');
    expect(water.label).toContain('Water droplet');
  });

  it('supports circle and square masks for generated drawings', () => {
    const circle = createPresetTexture('editor-firefly', 'circle');
    const square = createPresetTexture('editor-firefly', 'square');

    expect(circle.shape).toBe('circle');
    expect(square.shape).toBe('square');
    expect(circle.buffer.data).not.toEqual(square.buffer.data);
  });

  it('clones texture pixel ownership for duplicated emitters', async () => {
    const original = createPresetTexture('editor-spark');
    const duplicate = await cloneTextureSelection(original);

    expect(duplicate).not.toBe(original);
    expect(duplicate.buffer).not.toBe(original.buffer);
    expect(duplicate.buffer.data).not.toBe(original.buffer.data);
    expect(duplicate.buffer.data).toEqual(original.buffer.data);
  });

  it('normalizes a manual texture crop to whole pixels', () => {
    expect(normalizeTextureRegion(256, 128, 31.9, 24.8, 16.5, 8.2)).toEqual({
      height: 24,
      originX: 16,
      originY: 8,
      width: 31,
    });
  });

  it('rejects manual crops outside the uploaded image', () => {
    expect(() => normalizeTextureRegion(64, 64, 32, 32, 40, 0)).toThrow(
      'Texture region must fit inside the 64 × 64 source image.',
    );
    expect(() => normalizeTextureRegion(64, 64, 0, 32, 0, 0)).toThrow(
      'Texture width and height must be at least 1 pixel.',
    );
    expect(() => normalizeTextureRegion(64, 64, 32, 32, -1, 0)).toThrow(
      'Texture origin cannot be negative.',
    );
  });
});
