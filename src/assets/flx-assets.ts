import {
  Assets,
  Texture,
  type AssetInitOptions,
  type LoadOptions,
  type UnresolvedAsset,
} from 'pixi.js';

import type { FlxContext } from '../core/flx-context';
import { FlxGraphic } from './flx-graphic';

let pixiInitialization: Promise<void> | null = null;

/** Context service token for a `FlxAssets` instance. @public */
export const FLX_ASSETS_SERVICE = Symbol('flixel-pixi.assets');

/** Browser asset descriptor accepted by `FlxAssets`. @public */
export interface FlxAssetDescriptor {
  alias: string | string[];
  data?: Record<string, unknown>;
  parser?: string;
  src: string | string[];
}

/** A named group of assets with state/scene lifetime. @public */
export interface FlxAssetBundle {
  assets: FlxAssetDescriptor[];
  name: string;
}

/** Declarative bundle manifest. @public */
export interface FlxAssetManifest {
  bundles: FlxAssetBundle[];
}

/** Retry, progress, and failure policy for a foreground asset load. @public */
export interface FlxAssetLoadOptions {
  onError?: (error: Error, source: string) => void;
  onProgress?: (progress: number) => void;
  retryCount?: number;
  retryDelay?: number;
  strategy?: 'throw' | 'skip' | 'retry';
}

/** Initialization options for the Pixi asset resolver. @public */
export interface FlxAssetInitOptions {
  basePath?: string;
  defaultSearchParams?: string | Record<string, unknown>;
  loadOptions?: FlxAssetLoadOptions;
  manifest?: FlxAssetManifest | string;
  skipDetections?: boolean;
}

/** Injectable subset of Pixi Assets used by the engine service. @public */
export interface FlxAssetBackend {
  add(asset: FlxAssetDescriptor | FlxAssetDescriptor[]): void;
  addBundle(name: string, assets: FlxAssetDescriptor[]): void;
  backgroundLoad(ids: string | string[]): Promise<void>;
  backgroundLoadBundle(names: string | string[]): Promise<void>;
  get<T>(id: string): T | undefined;
  init(options?: FlxAssetInitOptions): Promise<void>;
  load<T>(
    id: string | FlxAssetDescriptor,
    options?: FlxAssetLoadOptions,
  ): Promise<T>;
  loadBundle<T>(
    name: string | string[],
    onProgress?: (progress: number) => void,
  ): Promise<T>;
  unload(id: string | string[]): Promise<void>;
  unloadBundle(name: string | string[]): Promise<void>;
}

class PixiAssetBackend implements FlxAssetBackend {
  async init(options: FlxAssetInitOptions = {}): Promise<void> {
    pixiInitialization ??= Assets.init(options as AssetInitOptions);
    await pixiInitialization;
  }

  add(asset: FlxAssetDescriptor | FlxAssetDescriptor[]): void {
    Assets.add(asset as UnresolvedAsset | UnresolvedAsset[]);
  }

  addBundle(name: string, assets: FlxAssetDescriptor[]): void {
    Assets.addBundle(name, assets as UnresolvedAsset[]);
  }

  async load<T>(
    id: string | FlxAssetDescriptor,
    options?: FlxAssetLoadOptions,
  ): Promise<T> {
    const mapped = options === undefined ? undefined : mapLoadOptions(options);
    return Assets.load<T>(id as string | UnresolvedAsset, mapped);
  }

  async loadBundle<T>(
    name: string | string[],
    onProgress?: (progress: number) => void,
  ): Promise<T> {
    return Assets.loadBundle(name, onProgress) as Promise<T>;
  }

  async backgroundLoad(ids: string | string[]): Promise<void> {
    await Assets.backgroundLoad(ids);
  }

  async backgroundLoadBundle(names: string | string[]): Promise<void> {
    await Assets.backgroundLoadBundle(names);
  }

  get<T>(id: string): T | undefined {
    return Assets.get<T>(id) as T | undefined;
  }

  async unload(id: string | string[]): Promise<void> {
    await Assets.unload(id);
  }

  async unloadBundle(name: string | string[]): Promise<void> {
    await Assets.unloadBundle(name);
  }
}

function sourceName(source: string | { src?: string }): string {
  return typeof source === 'string' ? source : (source.src ?? 'unknown');
}

function mapLoadOptions(options: FlxAssetLoadOptions): LoadOptions {
  return {
    ...(options.onProgress === undefined
      ? {}
      : { onProgress: options.onProgress }),
    ...(options.onError === undefined
      ? {}
      : {
          onError: (error: Error, source: string | { src?: string }) => {
            options.onError?.(error, sourceName(source));
          },
        }),
    ...(options.retryCount === undefined
      ? {}
      : { retryCount: options.retryCount }),
    ...(options.retryDelay === undefined
      ? {}
      : { retryDelay: options.retryDelay }),
    ...(options.strategy === undefined ? {} : { strategy: options.strategy }),
  };
}

/** Failure enriched with the alias or URL requested by the game. @public */
export class FlxAssetLoadError extends Error {
  constructor(
    readonly assetId: string,
    options: { cause: unknown },
  ) {
    super(`Failed to load asset "${assetId}".`, options);
    this.name = 'FlxAssetLoadError';
  }
}

/** Typed, explicitly asynchronous facade over PixiJS v8 `Assets`. @public */
export class FlxAssets {
  readonly #backend: FlxAssetBackend;
  readonly #graphics = new WeakMap<Texture, FlxGraphic>();
  readonly #loadedIds = new Set<string>();
  readonly #failures = new Map<string, FlxAssetLoadError>();
  #initialized = false;

  constructor(backend: FlxAssetBackend = new PixiAssetBackend()) {
    this.#backend = backend;
  }

  static fromContext(context: FlxContext): FlxAssets | undefined {
    return context.getService<FlxAssets>(FLX_ASSETS_SERVICE);
  }

  install(context: FlxContext): this {
    context.setService(FLX_ASSETS_SERVICE, this);
    return this;
  }

  async init(options: FlxAssetInitOptions = {}): Promise<void> {
    if (this.#initialized) return;
    await this.#backend.init(options);
    this.#initialized = true;
  }

  add(descriptor: FlxAssetDescriptor | FlxAssetDescriptor[]): this {
    this.#backend.add(descriptor);
    return this;
  }

  addBundle(name: string, assets: FlxAssetDescriptor[]): this {
    if (name.length === 0) throw new RangeError('Bundle name cannot be empty.');
    this.#backend.addBundle(name, assets);
    return this;
  }

  async load<T>(
    id: string | FlxAssetDescriptor,
    options?: FlxAssetLoadOptions,
  ): Promise<T> {
    const key = typeof id === 'string' ? id : firstAlias(id.alias);
    try {
      const asset = await this.#backend.load<T>(id, options);
      this.#failures.delete(key);
      this.#loadedIds.add(key);
      return asset;
    } catch (cause) {
      this.#loadedIds.delete(key);
      const error = new FlxAssetLoadError(key, { cause });
      this.#failures.set(key, error);
      throw error;
    }
  }

  async loadBundle<T = Record<string, unknown>>(
    name: string | string[],
    onProgress?: (progress: number) => void,
  ): Promise<T> {
    try {
      return await this.#backend.loadBundle<T>(name, onProgress);
    } catch (cause) {
      const key = Array.isArray(name) ? name.join(',') : name;
      const error = new FlxAssetLoadError(key, { cause });
      this.#failures.set(key, error);
      throw error;
    }
  }

  async backgroundLoad(ids: string | string[]): Promise<void> {
    await this.#backend.backgroundLoad(ids);
  }

  async backgroundLoadBundle(names: string | string[]): Promise<void> {
    await this.#backend.backgroundLoadBundle(names);
  }

  get<T>(id: string): T | undefined {
    return this.#backend.get<T>(id);
  }

  getGraphic(id: string): FlxGraphic | undefined {
    const texture = this.get<Texture>(id);
    if (!(texture instanceof Texture)) return undefined;
    const existing = this.#graphics.get(texture);
    if (existing !== undefined) return existing;
    const graphic = new FlxGraphic(texture);
    this.#graphics.set(texture, graphic);
    return graphic;
  }

  async loadGraphic(
    id: string | FlxAssetDescriptor,
    options?: FlxAssetLoadOptions,
  ): Promise<FlxGraphic> {
    const texture = await this.load<Texture>(id, options);
    if (!(texture instanceof Texture)) {
      throw new TypeError('The loaded asset is not a Pixi Texture.');
    }
    const existing = this.#graphics.get(texture);
    if (existing !== undefined) return existing;
    const graphic = new FlxGraphic(texture);
    this.#graphics.set(texture, graphic);
    return graphic;
  }

  failureFor(id: string): FlxAssetLoadError | undefined {
    return this.#failures.get(id);
  }

  isLoaded(id: string): boolean {
    return this.#loadedIds.has(id) || this.get(id) !== undefined;
  }

  async unload(id: string | string[]): Promise<void> {
    await this.#backend.unload(id);
    for (const key of Array.isArray(id) ? id : [id]) {
      this.#loadedIds.delete(key);
      this.#failures.delete(key);
    }
  }

  async unloadBundle(name: string | string[]): Promise<void> {
    await this.#backend.unloadBundle(name);
    for (const key of Array.isArray(name) ? name : [name]) {
      this.#failures.delete(key);
    }
  }
}

function firstAlias(alias: string | string[]): string {
  return Array.isArray(alias) ? (alias[0] ?? '') : alias;
}
