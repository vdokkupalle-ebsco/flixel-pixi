import { Application } from 'pixi.js';

import {
  FlxAssets,
  type FlxAssetBundle,
  type FlxAssetInitOptions,
} from '../assets/flx-assets';
import type { FlxAudioBackend } from '../audio/flx-audio-backend';
import { FlxG } from '../core/flx-g';
import { FlxGame } from '../core/flx-game';
import type { FlxStateConstructor } from '../core/flx-state';
import {
  FlxFpsDisplay,
  type FlxFpsDisplayOptions,
} from '../debugger/flx-fps-display';
import {
  FlxPreloader,
  type FlxPreloaderOptions,
  type FlxPreloaderView,
  type FlxPreloaderViewFactory,
} from '../debugger/flx-preloader';
import {
  FlxLoadingError,
  FlxLoadingSession,
  throwIfAborted,
  type FlxLoadingSnapshot,
} from '../loading/flx-loading';
import { FlxCameraRenderer } from '../rendering/flx-camera-renderer';
import { syncWorldToRenderer } from '../rendering/flx-world-sync';
import { getRenderFrameTiming, validateFramerate } from './frame-pacing';
import { FlxAccessibilityOverlay } from './flx-accessibility-overlay';
import {
  FlxBrowserViewport,
  type FlxBrowserScaleMode,
  type FlxBrowserScaleOptions,
} from './flx-browser-viewport';
import { resolveRendererResolution } from './renderer-resolution';

/** Declarative asset configuration for browser startup. @public */
export interface BrowserGameAssetOptions {
  /** Bundles registered before the custom preload callback runs. */
  bundles?: FlxAssetBundle[];
  /** Bundles to begin loading after the first frame without blocking startup. */
  backgroundBundles?: string | string[];
  /** Pixi asset resolver initialization options. */
  init?: FlxAssetInitOptions;
  /** Bundle or bundles that must load before the game is created. */
  initialBundles?: string | string[];
  /** Optional preconfigured service, primarily for adapters and tests. */
  service?: FlxAssets;
}

/** Configuration for the default or a custom bootstrap-preloader view. @public */
export interface BrowserGamePreloaderOptions extends FlxPreloaderOptions {
  /** Replace the default DOM view while retaining loading orchestration. */
  createView?: FlxPreloaderViewFactory;
  /** Keep a failed boot pending and expose a retry action. Defaults to true. */
  retry?: boolean;
}

/** Loading helpers supplied to a game's custom startup preparation. @public */
export interface BrowserGamePreloadContext {
  readonly assets: FlxAssets;
  /** Load an additional bundle and map its progress into the boot asset stage. */
  loadBundle<T = Record<string, unknown>>(
    name: string | string[],
    message?: string,
  ): Promise<T>;
  /** Report preparation-local progress, or null for an indeterminate operation. */
  report(progress: number | null, message?: string): void;
  readonly signal: AbortSignal;
}

/** Options for {@link createBrowserGame}. @public */
export interface CreateBrowserGameOptions {
  host: HTMLElement;
  initialState: FlxStateConstructor;
  width?: number;
  height?: number;
  /** @deprecated Use `preloader.title`. */
  title?: string;
  /** @deprecated Use `preloader: false`. */
  showPreloader?: boolean;
  /** Default DOM preloader, custom view configuration, or false to disable it. */
  preloader?: false | BrowserGamePreloaderOptions;
  /** Declarative Pixi asset bundles and resolver configuration. */
  assets?: BrowserGameAssetOptions;
  /** Custom preparation that runs while the bootstrap preloader is active. */
  preload?: (context: BrowserGamePreloadContext) => Promise<void> | void;
  /** Observe the same snapshots used by DOM and in-game loading screens. */
  onLoadingSnapshot?: (snapshot: FlxLoadingSnapshot) => void;
  /** Cancels pending application-level startup and retry waits. */
  signal?: AbortSignal;
  /** Optional lightweight in-game FPS overlay. Disabled by default. */
  fpsDisplay?: boolean | FlxFpsDisplayOptions;
  /** Native keyboard and screen-reader controls for supported Flixel UI. Defaults to true. */
  accessibility?: boolean;
  /** CSS-space canvas scaling policy. Defaults to aspect-preserving `fit`. */
  scaling?: FlxBrowserScaleMode | FlxBrowserScaleOptions;
  /** Upper bound for renderer resolution as browser DPR changes. Defaults to 2. */
  maxDevicePixelRatio?: number;
  /** Pause fixed simulation updates while the page is hidden or unfocused. Defaults to true. */
  autoPause?: boolean;
  backgroundColor?: number;
  audioBackend?: FlxAudioBackend;
  zoom?: number;
  /** Fixed simulation rate in updates per second. Defaults to 60. */
  updateFramerate?: number;
  /** Optional visual frame-rate cap. By default rendering follows the display. */
  renderFramerate?: number;
  /** Smooth fixed-step motion between updates without changing game state. Defaults to true. */
  renderInterpolation?: boolean;
}

/** Running browser game application handle returned by {@link createBrowserGame}. @public */
export interface BrowserGameApplication {
  readonly game: FlxGame;
  readonly renderer: FlxCameraRenderer;
  readonly app: Application;
  /** Asset service installed into the running game's context. */
  readonly assets: FlxAssets;
  /** Reusable loading model for optional in-game Pixi/Flixel loading screens. */
  readonly loading: FlxLoadingSession;
  /** Browser canvas sizing controller. */
  readonly viewport: FlxBrowserViewport;
  /** Number of completed browser render frames. */
  readonly frameCount: number;
  /** Fixed simulation rate in updates per second. */
  readonly updateFramerate: number;
  /** Visual frame-rate cap, or undefined when following the display. */
  readonly renderFramerate: number | undefined;
  /** Whether focus loss pauses fixed simulation updates. */
  readonly autoPause: boolean;
  /** Whether the document is visible and its window currently has focus. */
  readonly focused: boolean;
  /** Subscribe to completed browser render frames. Returns an unsubscribe callback. */
  onFrame(callback: (frame: BrowserGameFrame) => void): () => void;
  /** Re-sync all state members into the camera renderer (call after switchState or manual mutations). */
  syncRenderer(): void;
  destroy(): void;
}

/** Timing information for one completed browser render frame. @public */
export interface BrowserGameFrame {
  /** Raw wall-clock interval since the previous rendered frame. */
  readonly elapsedMS: number;
  /** Monotonic count of completed rendered frames. */
  readonly frameCount: number;
  /** Number of fixed simulation updates executed before this render. */
  readonly simulationSteps: number;
}

interface BootResources {
  app: Application;
  appInitialized: boolean;
  game: FlxGame | null;
  renderer: FlxCameraRenderer | null;
  viewport: FlxBrowserViewport | null;
}

/**
 * Boot Pixi + FlxGame + FlxCameraRenderer for a browser game.
 * Asset preparation, retry, cancellation, and first-frame readiness share one
 * loading model that can also drive later in-game loading screens.
 * @public
 */
export async function createBrowserGame(
  options: CreateBrowserGameOptions,
): Promise<BrowserGameApplication> {
  const {
    host,
    initialState,
    width = 640,
    height = 480,
    backgroundColor = 0x0f172a,
    audioBackend,
    zoom = 1,
    updateFramerate = 60,
    renderFramerate,
    renderInterpolation = true,
    accessibility = true,
    maxDevicePixelRatio = 2,
    autoPause = true,
  } = options;

  validateFramerate('updateFramerate', updateFramerate);
  if (renderFramerate !== undefined) {
    validateFramerate('renderFramerate', renderFramerate);
  }
  const initialResolution = resolveRendererResolution(
    window.devicePixelRatio,
    maxDevicePixelRatio,
  );

  host.replaceChildren();
  const loading = new FlxLoadingSession(options.signal);
  const assets = options.assets?.service ?? new FlxAssets();
  const preloaderConfig = resolvePreloaderConfig(options);
  const view = createPreloaderView(host, preloaderConfig);
  let unsubscribeView: (() => void) | undefined;
  if (view)
    unsubscribeView = loading.subscribe((snapshot) => view.update(snapshot));
  const unsubscribeObserver = options.onLoadingSnapshot
    ? loading.subscribe(options.onLoadingSnapshot)
    : undefined;
  const retryEnabled =
    preloaderConfig !== false && preloaderConfig.retry !== false;
  let bundlesRegistered = false;

  while (true) {
    const resources: BootResources = {
      app: new Application(),
      appInitialized: false,
      game: null,
      renderer: null,
      viewport: null,
    };

    try {
      loading.start('renderer', 'Starting renderer…', null);
      throwIfAborted(loading.signal);
      await resources.app.init({
        autoStart: false,
        width,
        height,
        backgroundColor,
        resolution: initialResolution,
        autoDensity: true,
      });
      resources.appInitialized = true;
      throwIfAborted(loading.signal);
      host.prepend(resources.app.canvas);
      resources.viewport = new FlxBrowserViewport(
        host,
        resources.app.canvas,
        width,
        height,
        options.scaling ?? 'fit',
      );
      loading.report({
        message: 'Renderer ready.',
        progress: 0.2,
        stage: 'renderer',
      });

      await prepareAssets(options, assets, loading, bundlesRegistered, () => {
        bundlesRegistered = true;
      });

      loading.report({
        message: 'Creating game…',
        progress: null,
        stage: 'game',
      });
      resources.game = new FlxGame(
        width,
        height,
        initialState,
        zoom,
        updateFramerate,
        renderFramerate ?? 30,
        false,
        { pointerTarget: resources.app.canvas, keyboardTarget: window },
        audioBackend,
      );
      assets.install(resources.game.context);
      resources.renderer = new FlxCameraRenderer(
        resources.app.renderer,
        resources.app.stage,
        resources.game.context,
      );
      loading.report({ message: 'Game ready.', progress: 0.95, stage: 'game' });

      loading.report({
        message: 'Rendering first frame…',
        progress: 0.95,
        stage: 'first-frame',
      });
      resources.game.step(1 / updateFramerate);
      syncWorldToRenderer(resources.game, resources.renderer);
      resources.renderer.render();
      throwIfAborted(loading.signal);

      loading.complete();
      const preloaderCompletion = view?.complete() ?? Promise.resolve();
      const application = startApplication(
        host,
        resources.app,
        resources.game,
        resources.renderer,
        resources.viewport,
        assets,
        loading,
        view,
        updateFramerate,
        renderFramerate,
        resolveFpsDisplayOptions(
          options.fpsDisplay,
          host,
          updateFramerate,
          renderFramerate,
        ),
        preloaderCompletion,
        renderInterpolation,
        accessibility,
        maxDevicePixelRatio,
        autoPause,
        unsubscribeObserver,
      );
      unsubscribeView?.();
      unsubscribeView = undefined;

      const backgroundBundles = options.assets?.backgroundBundles;
      if (backgroundBundles !== undefined) {
        void assets.backgroundLoadBundle(backgroundBundles);
      }
      return application;
    } catch (cause) {
      cleanupBootResources(host, resources);
      if (loading.signal.aborted) {
        unsubscribeView?.();
        unsubscribeObserver?.();
        view?.destroy();
        loading.destroy();
        throw cause;
      }

      const error = toLoadingError(loading.snapshot.stage, cause, retryEnabled);
      if (!retryEnabled) {
        loading.fail(error);
        unsubscribeView?.();
        unsubscribeObserver?.();
        throw error;
      }

      try {
        await waitForRetry(loading, error);
      } catch (retryCause) {
        unsubscribeView?.();
        unsubscribeObserver?.();
        view?.destroy();
        loading.destroy();
        throw retryCause;
      }
    }
  }
}

async function prepareAssets(
  options: CreateBrowserGameOptions,
  assets: FlxAssets,
  loading: FlxLoadingSession,
  bundlesRegistered: boolean,
  markBundlesRegistered: () => void,
): Promise<void> {
  loading.report({
    message: 'Preparing assets…',
    progress: 0.2,
    stage: 'assets',
  });
  await assets.init(options.assets?.init);
  throwIfAborted(loading.signal);

  if (!bundlesRegistered) {
    for (const bundle of options.assets?.bundles ?? []) {
      assets.addBundle(bundle.name, bundle.assets);
    }
    markBundlesRegistered();
  }

  const initialBundles = options.assets?.initialBundles;
  const hasInitialBundles = initialBundles !== undefined;
  const hasCustomPreload = options.preload !== undefined;
  if (hasInitialBundles) {
    await assets.loadBundle(initialBundles, (progress) => {
      const local = hasCustomPreload ? progress * 0.75 : progress;
      loading.report({
        message: 'Loading startup assets…',
        progress: 0.2 + 0.6 * local,
        stage: 'assets',
      });
    });
    throwIfAborted(loading.signal);
  }

  if (options.preload) {
    const preloadStart = hasInitialBundles ? 0.75 : 0;
    await options.preload({
      assets,
      loadBundle: async <T>(name: string | string[], message?: string) => {
        return assets.loadBundle<T>(name, (progress) => {
          const local = preloadStart + (1 - preloadStart) * progress;
          loading.report({
            message: message ?? 'Loading assets…',
            progress: 0.2 + 0.6 * local,
            stage: 'assets',
          });
        });
      },
      report(progress, message) {
        loading.report({
          ...(message === undefined ? {} : { message }),
          progress:
            progress === null
              ? null
              : 0.2 + 0.6 * (preloadStart + (1 - preloadStart) * progress),
          stage: 'assets',
        });
      },
      signal: loading.signal,
    });
    throwIfAborted(loading.signal);
  }

  loading.report({ message: 'Assets ready.', progress: 0.8, stage: 'assets' });
}

function startApplication(
  host: HTMLElement,
  app: Application,
  game: FlxGame,
  renderer: FlxCameraRenderer,
  viewport: FlxBrowserViewport,
  assets: FlxAssets,
  loading: FlxLoadingSession,
  preloader: FlxPreloaderView | null,
  updateFramerate: number,
  renderFramerate: number | undefined,
  fpsDisplayOptions: FlxFpsDisplayOptions | null,
  preloaderCompletion: Promise<void>,
  renderInterpolation: boolean,
  accessibilityEnabled: boolean,
  maxDevicePixelRatio: number,
  autoPause: boolean,
  unsubscribeObserver?: () => void,
): BrowserGameApplication {
  const frameListeners = new Set<(frame: BrowserGameFrame) => void>();
  let destroyed = false;
  let frameCount = 0;
  let previousUpdateTime = performance.now();
  let previousRenderTime = previousUpdateTime;
  let previousActualRenderTime = previousUpdateTime;
  let simulationStepsSinceRender = 0;
  let animationFrame = 0;
  let fpsDisplay: FlxFpsDisplay | null = null;
  let windowFocused = document.hasFocus();
  let focused = document.visibilityState === 'visible' && windowFocused;
  const accessibility = accessibilityEnabled
    ? new FlxAccessibilityOverlay(
        host,
        app.canvas,
        renderer,
        game.context.width,
        game.context.height,
      )
    : null;
  const unsubscribeViewport = viewport.onChange((snapshot) => {
    const resolution = resolveRendererResolution(
      snapshot.devicePixelRatio,
      maxDevicePixelRatio,
    );
    if (resolution === app.renderer.resolution) return;
    app.renderer.resize(game.context.width, game.context.height, resolution);
    renderer.resize(resolution);
    viewport.refresh();
    game.context.markRenderablesDirty();
  });

  const mountFpsDisplay = (): void => {
    if (!destroyed && fpsDisplayOptions) {
      fpsDisplay = new FlxFpsDisplay(fpsDisplayOptions);
    }
  };
  void preloaderCompletion.then(mountFpsDisplay, mountFpsDisplay);

  const refreshFocus = (): void => {
    const nextFocused = document.visibilityState === 'visible' && windowFocused;
    fpsDisplay?.reset();
    if (nextFocused === focused) return;
    focused = nextFocused;
    const now = performance.now();
    previousUpdateTime = now;
    previousRenderTime = now;
    previousActualRenderTime = now;
    simulationStepsSinceRender = 0;
  };
  const handleVisibilityChange = (): void => refreshFocus();
  const handleWindowFocus = (): void => {
    windowFocused = true;
    refreshFocus();
  };
  const handleWindowBlur = (): void => {
    windowFocused = false;
    refreshFocus();
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleWindowFocus);
  window.addEventListener('blur', handleWindowBlur);

  const frame = (now: number): void => {
    if (destroyed) return;
    const updateElapsedMS = Math.max(0, now - previousUpdateTime);
    previousUpdateTime = now;
    if (!FlxG.paused && (!autoPause || focused)) {
      simulationStepsSinceRender += game.advance(updateElapsedMS / 1000).steps;
    }

    const timing = getRenderFrameTiming(
      now,
      previousRenderTime,
      renderFramerate,
    );
    if (!timing) {
      animationFrame = requestAnimationFrame(frame);
      return;
    }
    previousRenderTime = timing.previousRenderTime;
    const actualRenderElapsedMS = Math.max(0, now - previousActualRenderTime);
    previousActualRenderTime = now;
    if (game.context.renderablesDirty) syncWorldToRenderer(game, renderer);
    renderer.render(
      game.context.cameras,
      renderInterpolation ? game.interpolationAlpha : 1,
    );
    accessibility?.sync();
    frameCount += 1;
    const event = {
      elapsedMS: actualRenderElapsedMS,
      frameCount,
      simulationSteps: simulationStepsSinceRender,
    };
    fpsDisplay?.recordFrame(actualRenderElapsedMS, event.simulationSteps);
    simulationStepsSinceRender = 0;
    for (const listener of [...frameListeners]) listener(event);
    animationFrame = requestAnimationFrame(frame);
  };
  animationFrame = requestAnimationFrame(frame);

  return {
    app,
    assets,
    game,
    loading,
    renderer,
    viewport,
    renderFramerate,
    updateFramerate,
    autoPause,
    get focused() {
      return focused;
    },
    get frameCount() {
      return frameCount;
    },
    onFrame(callback) {
      frameListeners.add(callback);
      return () => frameListeners.delete(callback);
    },
    syncRenderer() {
      game.context.markRenderablesDirty();
      syncWorldToRenderer(game, renderer);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(animationFrame);
      frameListeners.clear();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
      fpsDisplay?.destroy();
      fpsDisplay = null;
      accessibility?.destroy();
      unsubscribeViewport();
      unsubscribeObserver?.();
      preloader?.destroy();
      loading.destroy();
      renderer.destroy();
      game.destroy();
      viewport.destroy();
      app.destroy({ removeView: true, releaseGlobalResources: true });
      host.replaceChildren();
    },
  };
}

function resolveFpsDisplayOptions(
  config: boolean | FlxFpsDisplayOptions | undefined,
  host: HTMLElement,
  updateFramerate: number,
  renderFramerate: number | undefined,
): FlxFpsDisplayOptions | null {
  if (!config) return null;
  const options = config === true ? {} : config;
  return {
    ...options,
    container: options.container ?? host,
    placement: options.placement ?? 'host',
    targetFramerate:
      options.targetFramerate ?? renderFramerate ?? updateFramerate,
  };
}

function resolvePreloaderConfig(
  options: CreateBrowserGameOptions,
): false | BrowserGamePreloaderOptions {
  if (options.preloader === false) return false;
  if (options.preloader === undefined && options.showPreloader === false) {
    return false;
  }
  return {
    minimumVisibleMs: 250,
    placement: 'host',
    showDelayMs: 150,
    title: options.title ?? 'Loading…',
    ...(options.preloader ?? {}),
  };
}

function createPreloaderView(
  host: HTMLElement,
  config: false | BrowserGamePreloaderOptions,
): FlxPreloaderView | null {
  if (config === false) return null;
  const container = config.container ?? host;
  const options: FlxPreloaderOptions = { ...config, container };
  return config.createView
    ? config.createView({ container, options })
    : new FlxPreloader(options);
}

function cleanupBootResources(
  host: HTMLElement,
  resources: BootResources,
): void {
  resources.viewport?.destroy();
  resources.renderer?.destroy();
  resources.game?.destroy();
  if (resources.appInitialized) {
    resources.app.destroy({ removeView: true });
  }
  for (const canvas of host.querySelectorAll('canvas')) canvas.remove();
}

function toLoadingError(
  stage: FlxLoadingSnapshot['stage'],
  cause: unknown,
  retryable: boolean,
): FlxLoadingError {
  if (cause instanceof FlxLoadingError) return cause;
  const detail = cause instanceof Error ? cause.message : String(cause);
  return new FlxLoadingError(
    stage,
    `Could not complete ${stage}: ${detail}`,
    retryable,
    { cause },
  );
}

function waitForRetry(
  loading: FlxLoadingSession,
  error: FlxLoadingError,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = (): void => {
      loading.signal.removeEventListener('abort', onAbort);
      reject(
        new DOMException('The loading operation was aborted.', 'AbortError'),
      );
    };
    loading.signal.addEventListener('abort', onAbort, { once: true });
    loading.fail(error, () => {
      loading.signal.removeEventListener('abort', onAbort);
      resolve();
    });
  });
}
