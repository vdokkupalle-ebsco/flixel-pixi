// @vitest-environment happy-dom
import { Container } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FlxCamera, FlxCameraRenderer, FlxContext, FlxG } from '../../src';

describe('FlxCamera snapshot capability', () => {
  beforeEach(() => {
    FlxG.installContext(new FlxContext(320, 180));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    FlxG.clearContext();
  });

  it('throws an error if taking a snapshot with no host renderer installed', async () => {
    const camera = new FlxCamera(0, 0, 320, 180);
    await expect(camera.takeSnapshot()).rejects.toThrow(
      'No camera host with snapshot capability is installed',
    );
  });

  it('throws an error if taking a snapshot on a destroyed camera', async () => {
    const camera = new FlxCamera(0, 0, 320, 180);
    camera.destroy();
    await expect(camera.takeSnapshot()).rejects.toThrow(
      'Cannot snapshot a destroyed camera.',
    );
  });

  it('throws an error if snapshotCamera is called with an unregistered camera', async () => {
    const mockPixels = new Uint8ClampedArray(320 * 180 * 4);
    const fakeRenderer = {
      extract: {
        pixels: vi.fn().mockResolvedValue({
          height: 180,
          pixels: mockPixels,
          width: 320,
        }),
      },
      resolution: 1,
    };
    const context = FlxG.context;
    if (context === null) throw new Error('Expected an installed context.');

    const outputStage = new Container();
    const cameraRenderer = new FlxCameraRenderer(
      fakeRenderer as never,
      outputStage,
      context,
    );
    const externalCamera = new FlxCamera(0, 0, 100, 100);

    await expect(cameraRenderer.snapshotCamera(externalCamera)).rejects.toThrow(
      'Camera is not registered with this renderer.',
    );
  });

  it('extracts pixel snapshots asynchronously via host renderer', async () => {
    const mockPixels = new Uint8ClampedArray(32 * 18 * 4);
    mockPixels.fill(255);

    const fakeRenderer = {
      extract: {
        pixels: vi.fn().mockResolvedValue({
          height: 18,
          pixels: mockPixels,
          width: 32,
        }),
      },
      resolution: 1,
    };
    const context = FlxG.context;
    if (context === null) throw new Error('Expected an installed context.');

    const outputStage = new Container();
    const cameraRenderer = new FlxCameraRenderer(
      fakeRenderer as never,
      outputStage,
      context,
    );

    const camera = FlxG.camera;
    const snapshot = await camera.takeSnapshot();

    expect(snapshot.width).toBe(32);
    expect(snapshot.height).toBe(18);
    expect(snapshot.pixels).not.toBe(mockPixels);
    expect(snapshot.pixels).toHaveLength(mockPixels.length);
    expect(snapshot.pixels[0]).toBe(255);
    expect(snapshot.pixels[Math.floor(mockPixels.length / 2)]).toBe(255);
    expect(snapshot.pixels.at(-1)).toBe(255);
    expect(fakeRenderer.extract.pixels).toHaveBeenCalledOnce();

    const rendererSnapshot = await cameraRenderer.snapshotCamera(camera);
    expect(rendererSnapshot.pixels).not.toBe(mockPixels);
    expect(rendererSnapshot.pixels).toHaveLength(mockPixels.length);
    expect(rendererSnapshot.pixels[0]).toBe(255);
    expect(rendererSnapshot.pixels.at(-1)).toBe(255);
    expect(rendererSnapshot.pixels).not.toBe(snapshot.pixels);
  });
});
