// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  FlxBrowserViewport,
  resolveBrowserViewportLayout,
} from '../../src/browser/flx-browser-viewport';

const base = {
  alignX: 0.5,
  alignY: 0.5,
  hostHeight: 600,
  hostWidth: 1_000,
  logicalHeight: 480,
  logicalWidth: 640,
} as const;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function sizedHost(width = 1_000, height = 600): HTMLElement {
  const host = document.createElement('div');
  Object.defineProperties(host, {
    clientHeight: { configurable: true, value: height },
    clientWidth: { configurable: true, value: width },
  });
  document.body.appendChild(host);
  return host;
}

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

  it('owns responsive canvas CSS, subscriptions, policy changes, and teardown', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    vi.stubGlobal('matchMedia', undefined);
    const host = sizedHost();
    const canvas = document.createElement('canvas');
    const viewport = new FlxBrowserViewport(host, canvas, 640, 480, 'fit');
    const snapshots: number[] = [];
    const unsubscribe = viewport.onChange((snapshot) => {
      snapshots.push(snapshot.scale);
    });

    expect(viewport.mode).toBe('fit');
    expect(viewport.fullscreen).toBe(false);
    expect(viewport.snapshot.scale).toBe(1.25);
    expect(canvas.style.width).toBe('800px');
    expect(canvas.style.height).toBe('600px');
    expect(canvas.style.left).toBe('100px');
    expect(canvas.style.imageRendering).toBe('auto');
    expect(snapshots).toEqual([1.25]);

    viewport.refresh();
    expect(snapshots).toEqual([1.25]);
    expect(viewport.setMode('fixed').scale).toBe(1);
    expect(viewport.setAlignment(0, 1).left).toBe(0);
    expect(viewport.setSafePadding(12).safePadding).toEqual({
      bottom: 12,
      left: 12,
      right: 12,
      top: 12,
    });
    expect(() => viewport.setAlignment(-1, 0)).toThrow('alignX');
    expect(() => viewport.setSafePadding({ right: -1 })).toThrow(
      'safe padding right',
    );

    unsubscribe();
    viewport.destroy();
    viewport.destroy();
    expect(() => viewport.refresh()).toThrow('destroyed');
  });

  it('responds to resize, DPR, and fullscreen lifecycle events', async () => {
    let resize: (() => void) | undefined;
    const disconnect = vi.fn();
    class Observer {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe = vi.fn();
      disconnect = disconnect;
    }
    const removeDprListener = vi.fn();
    const addDprListener = vi.fn();
    const matchMedia = vi.fn(() => ({
      addEventListener: addDprListener,
      removeEventListener: removeDprListener,
    }));
    vi.stubGlobal('ResizeObserver', Observer);
    vi.stubGlobal('matchMedia', matchMedia);

    const host = sizedHost(1_280, 960);
    const canvas = document.createElement('canvas');
    let fullscreenElement: Element | null = null;
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElement,
    });
    host.requestFullscreen = vi.fn(async () => {
      fullscreenElement = host;
    });
    document.exitFullscreen = vi.fn(async () => {
      fullscreenElement = null;
    });

    const viewport = new FlxBrowserViewport(host, canvas, 640, 480, {
      mode: 'integer',
      pixelated: false,
      safePadding: { left: 4, top: 6 },
      useSafeAreaInsets: false,
    });
    expect(canvas.style.imageRendering).toBe('auto');
    expect(matchMedia).toHaveBeenCalled();
    expect(addDprListener).toHaveBeenCalledWith('change', expect.any(Function));

    resize?.();
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('orientationchange'));
    await viewport.requestFullscreen();
    expect(viewport.fullscreen).toBe(true);
    await viewport.toggleFullscreen();
    expect(viewport.fullscreen).toBe(false);
    await viewport.toggleFullscreen();
    expect(viewport.fullscreen).toBe(true);
    document.dispatchEvent(new Event('fullscreenchange'));
    const dprHandler = addDprListener.mock.calls[0]?.[1] as
      (() => void) | undefined;
    dprHandler?.();
    await viewport.exitFullscreen();

    viewport.destroy();
    expect(disconnect).toHaveBeenCalled();
    expect(removeDprListener).toHaveBeenCalled();
  });

  it('projects effective safe-area insets and reports unsupported fullscreen', async () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const host = sizedHost(300, 200);
    Object.defineProperty(host, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        bottom: window.innerHeight + 8,
        height: 200,
        left: -4,
        right: window.innerWidth + 6,
        top: 0,
        width: 300,
        x: -4,
        y: 0,
        toJSON: () => ({}),
      }),
    });
    vi.stubGlobal(
      'getComputedStyle',
      vi.fn(() => ({
        paddingBottom: '12px',
        paddingLeft: '10px',
        paddingRight: '14px',
        paddingTop: 'invalid',
      })),
    );
    const canvas = document.createElement('canvas');
    const viewport = new FlxBrowserViewport(host, canvas, 320, 240, {
      mode: 'fill',
      pixelated: true,
    });

    expect(viewport.snapshot.safeAreaInsets).toEqual({
      bottom: 20,
      left: 14,
      right: 20,
      top: 0,
    });
    expect(canvas.style.imageRendering).toBe('pixelated');
    await expect(viewport.requestFullscreen()).rejects.toThrow('not supported');
    viewport.destroy();
    expect(() => new FlxBrowserViewport(host, canvas, 0, 240)).toThrow(
      'logical width',
    );
  });
});
