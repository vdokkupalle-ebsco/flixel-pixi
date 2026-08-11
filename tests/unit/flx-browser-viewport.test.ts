import { describe, expect, it } from 'vitest';

import { resolveBrowserViewportLayout } from '../../src/browser/flx-browser-viewport';

const base = {
  alignX: 0.5,
  alignY: 0.5,
  hostHeight: 600,
  hostWidth: 1_000,
  logicalHeight: 480,
  logicalWidth: 640,
} as const;

describe('browser viewport layout', () => {
  it('fits the full logical game with centered letterboxing', () => {
    expect(
      resolveBrowserViewportLayout({ ...base, mode: 'fit' }),
    ).toMatchObject({
      displayHeight: 600,
      displayWidth: 800,
      left: 100,
      mode: 'fit',
      scale: 1.25,
      top: 0,
    });
  });

  it('fills the host and centers the cropped axis', () => {
    expect(
      resolveBrowserViewportLayout({ ...base, mode: 'fill' }),
    ).toMatchObject({
      displayHeight: 750,
      displayWidth: 1_000,
      left: 0,
      mode: 'fill',
      scale: 1.5625,
      top: -75,
    });
  });

  it('keeps fixed mode at one CSS pixel per logical pixel', () => {
    expect(
      resolveBrowserViewportLayout({
        ...base,
        alignX: 0,
        alignY: 1,
        mode: 'fixed',
      }),
    ).toMatchObject({
      displayHeight: 480,
      displayWidth: 640,
      left: 0,
      mode: 'fixed',
      scale: 1,
      top: 120,
    });
  });

  it('uses whole-number enlargement for pixel-art mode', () => {
    expect(
      resolveBrowserViewportLayout({
        ...base,
        hostHeight: 1_100,
        hostWidth: 1_500,
        mode: 'integer',
      }),
    ).toMatchObject({
      displayHeight: 960,
      displayWidth: 1_280,
      left: 110,
      scale: 2,
      top: 70,
    });
  });

  it('does not fractionally shrink integer mode below its logical size', () => {
    const snapshot = resolveBrowserViewportLayout({
      ...base,
      hostHeight: 240,
      hostWidth: 320,
      mode: 'integer',
    });
    expect(snapshot.scale).toBe(1);
    expect(snapshot.visibleRect).toMatchObject({
      height: 240,
      width: 320,
      x: 160,
      y: 120,
    });
  });

  it('reports the uncropped logical rectangle in fill mode', () => {
    expect(
      resolveBrowserViewportLayout({ ...base, mode: 'fill' }).visibleRect,
    ).toMatchObject({
      bottom: 432,
      height: 384,
      top: 48,
      width: 640,
      x: 0,
    });
  });

  it('subtracts device insets and logical HUD padding from the safe rectangle', () => {
    const snapshot = resolveBrowserViewportLayout({
      ...base,
      mode: 'fill',
      safeAreaInsets: { bottom: 20, left: 0, right: 0, top: 30 },
      safePadding: { bottom: 12, left: 16, right: 24, top: 8 },
    });
    expect(snapshot.safeRect.x).toBeCloseTo(16);
    expect(snapshot.safeRect.y).toBeCloseTo(75.2);
    expect(snapshot.safeRect.right).toBeCloseTo(616);
    expect(snapshot.safeRect.bottom).toBeCloseTo(407.2);
  });

  it('never returns a negative safe rectangle when padding consumes the area', () => {
    const snapshot = resolveBrowserViewportLayout({
      ...base,
      mode: 'fit',
      safePadding: { bottom: 500, left: 500, right: 500, top: 500 },
    });
    expect(snapshot.safeRect.width).toBe(0);
    expect(snapshot.safeRect.height).toBe(0);
  });

  it('rejects invalid dimensions and alignment', () => {
    expect(() =>
      resolveBrowserViewportLayout({
        ...base,
        alignX: 2,
        mode: 'fit',
      }),
    ).toThrow('alignX');
    expect(() =>
      resolveBrowserViewportLayout({
        ...base,
        hostWidth: -1,
        mode: 'fit',
      }),
    ).toThrow('host width');
  });
});
