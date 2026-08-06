import { describe, expect, it } from 'vitest';

import {
  FlxAssetLoadError,
  FlxAssets,
  FlxContext,
  FlxGraphic,
  makeGraphicPixels,
  type FlxAssetBackend,
  type FlxAssetDescriptor,
  type FlxAssetInitOptions,
  type FlxAssetLoadOptions,
} from '../../src';

class FakeAssets implements FlxAssetBackend {
  readonly cache = new Map<string, unknown>();
  readonly descriptors: FlxAssetDescriptor[] = [];
  readonly bundles = new Map<string, FlxAssetDescriptor[]>();
  initCalls = 0;
  backgroundCalls: (string | string[])[] = [];
  backgroundBundleCalls: (string | string[])[] = [];
  failNext = new Set<string>();

  async init(_options?: FlxAssetInitOptions): Promise<void> {
    void _options;
    this.initCalls += 1;
  }

  add(asset: FlxAssetDescriptor | FlxAssetDescriptor[]): void {
    this.descriptors.push(...(Array.isArray(asset) ? asset : [asset]));
  }

  addBundle(name: string, assets: FlxAssetDescriptor[]): void {
    this.bundles.set(name, assets);
  }

  async load<T>(
    id: string | FlxAssetDescriptor,
    options?: FlxAssetLoadOptions,
  ): Promise<T> {
    const key =
      typeof id === 'string'
        ? id
        : Array.isArray(id.alias)
          ? (id.alias[0] ?? '')
          : id.alias;
    options?.onProgress?.(0.5);
    if (this.failNext.delete(key)) {
      const error = new Error(`missing ${key}`);
      options?.onError?.(error, key);
      throw error;
    }
    options?.onProgress?.(1);
    return this.cache.get(key) as T;
  }

  async loadBundle<T>(
    name: string | string[],
    onProgress?: (progress: number) => void,
  ): Promise<T> {
    onProgress?.(1);
    const names = Array.isArray(name) ? name : [name];
    const result: Record<string, unknown> = {};
    for (const bundleName of names) {
      const bundle = this.bundles.get(bundleName);
      if (bundle === undefined) throw new Error(`missing bundle ${bundleName}`);
      for (const descriptor of bundle) {
        const alias = Array.isArray(descriptor.alias)
          ? descriptor.alias[0]
          : descriptor.alias;
        if (alias !== undefined) result[alias] = this.cache.get(alias);
      }
    }
    return result as T;
  }

  async backgroundLoad(ids: string | string[]): Promise<void> {
    this.backgroundCalls.push(ids);
  }

  async backgroundLoadBundle(names: string | string[]): Promise<void> {
    this.backgroundBundleCalls.push(names);
  }

  get<T>(id: string): T | undefined {
    return this.cache.get(id) as T | undefined;
  }

  async unload(id: string | string[]): Promise<void> {
    for (const key of Array.isArray(id) ? id : [id]) this.cache.delete(key);
  }

  async unloadBundle(name: string | string[]): Promise<void> {
    for (const bundleName of Array.isArray(name) ? name : [name]) {
      for (const descriptor of this.bundles.get(bundleName) ?? []) {
        const aliases = Array.isArray(descriptor.alias)
          ? descriptor.alias
          : [descriptor.alias];
        for (const alias of aliases) this.cache.delete(alias);
      }
    }
  }
}

describe('FlxAssets', () => {
  it('initializes once, registers descriptors and installs as a context service', async () => {
    const backend = new FakeAssets();
    const assets = new FlxAssets(backend);
    const context = new FlxContext(320, 180);

    await assets.init({ basePath: '/assets/' });
    await assets.init();
    assets
      .add({ alias: ['hero', 'player'], src: 'hero.png' })
      .addBundle('level', [{ alias: 'map', src: 'map.json' }])
      .install(context);

    expect(backend.initCalls).toBe(1);
    expect(backend.descriptors).toHaveLength(1);
    expect(backend.bundles.get('level')).toHaveLength(1);
    expect(FlxAssets.fromContext(context)).toBe(assets);
    expect(() => assets.addBundle('', [])).toThrow(RangeError);
  });

  it('shares cache identity and records a recoverable failure', async () => {
    const backend = new FakeAssets();
    const assets = new FlxAssets(backend);
    const value = { id: 1 };
    backend.cache.set('config', value);

    expect(await assets.load('config')).toBe(value);
    expect(await assets.load('config')).toBe(value);
    expect(assets.isLoaded('config')).toBe(true);

    const errors: string[] = [];
    backend.failNext.add('config');
    await expect(
      assets.load('config', {
        onError: (_error, source) => errors.push(source),
        retryCount: 2,
        retryDelay: 0,
        strategy: 'retry',
      }),
    ).rejects.toBeInstanceOf(FlxAssetLoadError);
    expect(errors).toEqual(['config']);
    expect(assets.failureFor('config')?.assetId).toBe('config');

    expect(await assets.load('config')).toBe(value);
    expect(assets.failureFor('config')).toBeUndefined();

    backend.cache.set('descriptor', 42);
    expect(
      await assets.load({
        alias: ['descriptor', 'alternate'],
        parser: 'json',
        src: 'descriptor.json',
      }),
    ).toBe(42);
  });

  it('loads graphics and manages foreground/background bundle lifetimes', async () => {
    const backend = new FakeAssets();
    const assets = new FlxAssets(backend);
    const source = FlxGraphic.fromPixels(makeGraphicPixels(2, 2, 0xff0000ff));
    backend.cache.set('hero', source.texture);
    assets.addBundle('level', [{ alias: 'hero', src: 'hero.png' }]);

    const progress: number[] = [];
    const graphic = await assets.loadGraphic('hero', {
      onProgress: (value) => progress.push(value),
    });
    expect(graphic.texture).toBe(source.texture);
    expect(assets.getGraphic('hero')).toBe(graphic);
    expect(progress).toEqual([0.5, 1]);
    expect(await assets.loadBundle('level')).toEqual({ hero: source.texture });

    await assets.backgroundLoad(['hero']);
    await assets.backgroundLoadBundle('level');
    expect(backend.backgroundCalls).toEqual([['hero']]);
    expect(backend.backgroundBundleCalls).toEqual(['level']);

    await assets.unloadBundle('level');
    expect(assets.get('hero')).toBeUndefined();
    backend.cache.set('hero', source.texture);
    await assets.unload('hero');
    expect(assets.isLoaded('hero')).toBe(false);
    await assets.unload(['hero']);
    await assets.unloadBundle(['level']);
    source.destroy();
  });

  it('rejects non-texture graphics and wraps missing bundles', async () => {
    const backend = new FakeAssets();
    const assets = new FlxAssets(backend);
    backend.cache.set('json', { ok: true });

    await expect(assets.loadGraphic('json')).rejects.toThrow(TypeError);
    expect(assets.getGraphic('json')).toBeUndefined();
    await expect(assets.loadBundle('missing')).rejects.toMatchObject({
      assetId: 'missing',
    });
    await expect(assets.loadBundle(['missing', 'other'])).rejects.toMatchObject(
      {
        assetId: 'missing,other',
      },
    );
  });

  it('adapts Pixi Assets options, cache, bundles, and unload', async () => {
    const assets = new FlxAssets();
    await assets.init({ skipDetections: true });
    await new FlxAssets().init();
    const descriptor = {
      alias: 'pixi-json',
      parser: 'json',
      src: 'data:application/json,%7B%22answer%22%3A42%7D',
    };
    assets.add(descriptor).addBundle('pixi-bundle', [descriptor]);
    const progress: number[] = [];
    const failures: string[] = [];

    await expect(
      assets.load<{ answer: number }>('pixi-json', {
        onError: (_error, source) => failures.push(source),
        onProgress: (value) => progress.push(value),
        retryCount: 1,
        retryDelay: 0,
        strategy: 'retry',
      }),
    ).resolves.toEqual({ answer: 42 });
    expect(assets.get<{ answer: number }>('pixi-json')?.answer).toBe(42);
    expect(progress.at(-1)).toBe(1);
    expect(failures).toEqual([]);
    await expect(assets.load<{ answer: number }>('pixi-json')).resolves.toEqual(
      {
        answer: 42,
      },
    );

    assets.add([descriptor]);
    await assets.loadBundle(['pixi-bundle']);
    await assets.backgroundLoad(['pixi-json']);
    await assets.backgroundLoadBundle(['pixi-bundle']);
    await assets.unloadBundle(['pixi-bundle']);
  });
});
