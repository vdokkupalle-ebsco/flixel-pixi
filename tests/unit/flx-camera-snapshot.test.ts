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
    const mockPixels = new Uint8ClampedArray(320 * 180 * 4);
    mockPixels.fill(255);

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

    const camera = FlxG.camera;
    const snapshot = await camera.takeSnapshot();

    expect(snapshot.width).toBe(320);
    expect(snapshot.height).toBe(180);
    expect(snapshot.pixels).not.toBe(mockPixels);
    expect(snapshot.pixels).toEqual(mockPixels);
    expect(fakeRenderer.extract.pixels).toHaveBeenCalledOnce();

    const rendererSnapshot = await cameraRenderer.snapshotCamera(camera);
    expect(rendererSnapshot.pixels).not.toBe(mockPixels);
    expect(rendererSnapshot.pixels).toEqual(mockPixels);
    expect(rendererSnapshot.pixels).not.toBe(snapshot.pixels);
  });
});
