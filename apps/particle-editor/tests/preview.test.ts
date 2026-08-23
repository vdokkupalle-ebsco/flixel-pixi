import { describe, expect, it } from 'vitest';

import { getTextureAdjustedOffset, type PreviewTexture } from '../src/preview';

function previewTexture(
  width: number,
  height: number,
  originX: number,
  originY: number,
): PreviewTexture {
  return {
    buffer: { data: new Uint32Array(width * height), height, width },
    originX,
    originY,
  };
}

describe('particle preview placement', () => {
  it('keeps the selected texture origin pinned when dimensions change', () => {
    const layerOffset = { x: 4, y: -3 };
    const smallTexture = previewTexture(32, 32, 0.5, 0.5);
    const largeTexture = previewTexture(128, 64, 0.5, 0.5);

    const smallOffset = getTextureAdjustedOffset(smallTexture, layerOffset);
    const largeOffset = getTextureAdjustedOffset(largeTexture, layerOffset);

    expect(
      smallOffset.x + smallTexture.buffer.width * smallTexture.originX,
    ).toBe(layerOffset.x);
    expect(
      smallOffset.y + smallTexture.buffer.height * smallTexture.originY,
    ).toBe(layerOffset.y);
    expect(
      largeOffset.x + largeTexture.buffer.width * largeTexture.originX,
    ).toBe(layerOffset.x);
    expect(
      largeOffset.y + largeTexture.buffer.height * largeTexture.originY,
    ).toBe(layerOffset.y);
  });

  it('preserves an unanchored top-left origin', () => {
    const texture = previewTexture(512, 512, 0, 0);

    expect(getTextureAdjustedOffset(texture, { x: 7, y: 9 })).toEqual({
      x: 7,
      y: 9,
    });
  });
});
