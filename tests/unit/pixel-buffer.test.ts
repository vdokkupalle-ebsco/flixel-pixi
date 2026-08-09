import { describe, expect, it } from 'vitest';

import {
  makeGraphicPixels,
  pixelsOverlap,
  replaceColorPixels,
  selectFramePixels,
  stampPixels,
} from '../../src/compat/pixel-buffer';

describe('Pixel compatibility primitives', () => {
  it('creates solid graphics and selects independent animation frames', () => {
    const sheet = makeGraphicPixels(4, 2, 0x112233ff);
    sheet.data[2] = 0xaabbccff;
    sheet.data[3] = 0xddeeffff;

    const frame = selectFramePixels(sheet, 2, 0, 2, 1);

    expect([...frame.data]).toEqual([0xaabbccff, 0xddeeffff]);
    frame.data[0] = 0;
    expect(sheet.data[2]).toBe(0xaabbccff);
  });

  it('stamps nontransparent pixels with clipping', () => {
    const destination = makeGraphicPixels(3, 2, 0x000000ff);
    const source = makeGraphicPixels(2, 2, 0xff0000ff);
    source.data[0] = 0;

    expect(stampPixels(destination, source, 2, 0)).toBe(1);
    expect([...destination.data]).toEqual([
      0x000000ff, 0x000000ff, 0x000000ff, 0x000000ff, 0x000000ff, 0xff0000ff,
    ]);
  });

  it('replaces exact colors and counts changes', () => {
    const graphic = makeGraphicPixels(2, 2, 0x010203ff);
    graphic.data[1] = 0x040506ff;

    expect(replaceColorPixels(graphic, 0x010203ff, 0xaabbccff)).toBe(3);
    expect([...graphic.data]).toEqual([
      0xaabbccff, 0x040506ff, 0xaabbccff, 0xaabbccff,
    ]);
  });

  it('detects alpha overlap with offsets and thresholds', () => {
    const first = makeGraphicPixels(3, 3, 0);
    const second = makeGraphicPixels(2, 2, 0);
    first.data[4] = 0xffffff80;
    second.data[0] = 0xffffffff;

    expect(pixelsOverlap(first, second, 1, 1, 128)).toBe(true);
    expect(pixelsOverlap(first, second, 1, 1, 129)).toBe(false);
    expect(pixelsOverlap(first, second, 4, 4)).toBe(false);
  });

  it('rejects malformed dimensions, regions, and thresholds', () => {
    expect(() => makeGraphicPixels(0, 1, 0)).toThrow(RangeError);
    const graphic = makeGraphicPixels(2, 2, 0);
    expect(() => selectFramePixels(graphic, 1, 1, 2, 2)).toThrow(RangeError);
    expect(() => stampPixels(graphic, graphic, 0.5, 0)).toThrow(RangeError);
    expect(() => pixelsOverlap(graphic, graphic, 0, 0, 256)).toThrow(
      RangeError,
    );
    expect(() =>
      pixelsOverlap({ data: new Uint32Array(1), height: 2, width: 2 }, graphic),
    ).toThrow(RangeError);
  });
});
