import { describe, expect, it, vi } from 'vitest';

import {
  FlxAssets,
  FlxLoadingError,
  FlxLoadingSession,
  throwIfAborted,
  type FlxAssetBackend,
  type FlxAssetDescriptor,
  type FlxAssetInitOptions,
  type FlxAssetLoadOptions,
  type FlxLoadingSnapshot,
} from '../../src';

class LoadingAssetsBackend implements FlxAssetBackend {
  async init(_options?: FlxAssetInitOptions): Promise<void> {
    void _options;
  }

  add(_asset: FlxAssetDescriptor | FlxAssetDescriptor[]): void {
    void _asset;
  }

  addBundle(_name: string, _assets: FlxAssetDescriptor[]): void {
    void _name;
    void _assets;
  }

  async load<T>(
    _id: string | FlxAssetDescriptor,
    _options?: FlxAssetLoadOptions,
  ): Promise<T> {
    void _id;
    void _options;
    return {} as T;
  }

  async loadBundle<T>(
    _name: string | string[],
    onProgress?: (progress: number) => void,
  ): Promise<T> {
    void _name;
    onProgress?.(0.25);
    onProgress?.(1);
    return { loaded: true } as T;
  }

  async backgroundLoad(_ids: string | string[]): Promise<void> {
    void _ids;
  }

  async backgroundLoadBundle(_names: string | string[]): Promise<void> {
    void _names;
  }

  get<T>(_id: string): T | undefined {
    void _id;
    return undefined;
  }

  async unload(_id: string | string[]): Promise<void> {
    void _id;
  }

  async unloadBundle(_name: string | string[]): Promise<void> {
    void _name;
  }
}

describe('FlxLoadingSession', () => {
  it('emits immediately and keeps measured progress monotonic', () => {
    const loading = new FlxLoadingSession();
    const snapshots: FlxLoadingSnapshot[] = [];
    const unsubscribe = loading.subscribe((snapshot) =>
      snapshots.push(snapshot),
    );

    loading.start('assets', 'Loading assets', 0.1);
    loading.report({ progress: 0.8 });
    loading.report({ progress: 0.3, message: 'Still loading' });
    loading.report({ progress: null, message: 'Preparing data' });
    loading.report({ progress: 0.9 });
    loading.complete();

    expect(snapshots[0]?.state).toBe('idle');
    expect(snapshots[3]?.progress).toBe(0.8);
    expect(snapshots.at(-2)?.progress).toBe(0.9);
    expect(snapshots.at(-1)).toMatchObject({
      progress: 1,
      stage: 'complete',
      state: 'ready',
    });
    unsubscribe();
    loading.destroy();
  });

  it('maps custom tasks and bundle loads into an overall progress range', async () => {
    const assets = new FlxAssets(new LoadingAssetsBackend());
    const loading = new FlxLoadingSession();
    loading.start('custom', 'Starting', 0);

    const taskResult = await loading.task(
      {
        endProgress: 0.4,
        message: 'Generating map',
        startProgress: 0.2,
      },
      ({ report, signal }) => {
        expect(signal.aborted).toBe(false);
        report(0.5, 'Halfway');
        return 42;
      },
    );
    expect(taskResult).toBe(42);
    expect(loading.snapshot.progress).toBe(0.4);

    const bundle = await loading.loadBundle<{ loaded: boolean }>(
      assets,
      'level-2',
      {
        endProgress: 1,
        message: 'Loading level 2',
        startProgress: 0.4,
      },
    );
    expect(bundle.loaded).toBe(true);
    expect(loading.snapshot).toMatchObject({ progress: 1, stage: 'assets' });
    loading.destroy();
  });

  it('publishes a retry action and resets cleanly for another run', () => {
    const loading = new FlxLoadingSession();
    const retry = vi.fn();
    loading.start('renderer', 'Starting', null);
    loading.fail(
      new FlxLoadingError('renderer', 'Renderer failed', true),
      retry,
    );

    expect(loading.snapshot).toMatchObject({
      message: 'Renderer failed',
      stage: 'renderer',
      state: 'error',
    });
    loading.snapshot.retry?.();
    expect(retry).toHaveBeenCalledOnce();

    loading.start('renderer', 'Retrying', 0);
    expect(loading.snapshot).toMatchObject({ progress: 0, state: 'loading' });
    loading.destroy();
  });

  it('propagates parent cancellation and rejects later work', () => {
    const controller = new AbortController();
    const loading = new FlxLoadingSession(controller.signal);
    controller.abort();

    expect(loading.snapshot.state).toBe('cancelled');
    expect(() => loading.report({ progress: 0.5 })).toThrowError('aborted');
    expect(() => throwIfAborted(loading.signal)).toThrowError('aborted');
    loading.destroy();
  });

  it('starts cancelled when its parent signal is already aborted', () => {
    const controller = new AbortController();
    controller.abort();
    const loading = new FlxLoadingSession(controller.signal);
    expect(loading.snapshot.state).toBe('cancelled');
    loading.fail(new FlxLoadingError('assets', 'ignored'));
    loading.cancel();
    expect(loading.snapshot.state).toBe('cancelled');
    loading.destroy();
  });
});
