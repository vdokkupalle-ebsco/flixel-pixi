import { Application } from 'pixi.js';

import type { FlxAudioBackend } from '../audio/flx-audio-backend';
import { FlxG } from '../core/flx-g';
import { FlxGame } from '../core/flx-game';
import type { FlxStateConstructor } from '../core/flx-state';
import { FlxPreloader } from '../debugger/flx-preloader';
import { FlxCameraRenderer } from '../rendering/flx-camera-renderer';
import { syncWorldToRenderer } from '../rendering/flx-world-sync';

/** Options for {@link createBrowserGame}. @public */
export interface CreateBrowserGameOptions {
  host: HTMLElement;
  initialState: FlxStateConstructor;
  width?: number;
  height?: number;
  title?: string;
  showPreloader?: boolean;
  backgroundColor?: number;
  audioBackend?: FlxAudioBackend;
  zoom?: number;
}

/** Running browser game application handle returned by {@link createBrowserGame}. @public */
export interface BrowserGameApplication {
  readonly game: FlxGame;
  readonly renderer: FlxCameraRenderer;
  readonly app: Application;
  /** Number of completed browser render frames. */
  readonly frameCount: number;
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

/**
 * Boot Pixi + FlxGame + FlxCameraRenderer for a browser game.
 * Performs per-frame incremental world sync automatically.
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
    title = 'Loading…',
    showPreloader = true,
    backgroundColor = 0x0f172a,
    audioBackend,
    zoom = 1,
  } = options;

  let preloader: FlxPreloader | null = null;
  if (showPreloader) {
    preloader = new FlxPreloader({ title });
    preloader.setProgress(20, 'Starting renderer…');
  }

  const app = new Application();
  await app.init({
    autoStart: false,
    width,
    height,
    backgroundColor,
    resolution: Math.min(window.devicePixelRatio, 2),
    autoDensity: true,
  });
  app.canvas.style.cssText =
    'width:100%;height:100%;display:block;object-fit:contain';
  host.replaceChildren(app.canvas);

  preloader?.setProgress(60, 'Creating game…');

  const game = new FlxGame(
    width,
    height,
    initialState,
    zoom,
    60,
    30,
    false,
    { pointerTarget: app.canvas, keyboardTarget: window },
    audioBackend,
  );

  const renderer = new FlxCameraRenderer(app.renderer, app.stage, game.context);

  preloader?.setProgress(90, 'Initial sync…');

  game.step(1 / 60);
  syncWorldToRenderer(game, renderer);
  renderer.render();

  preloader?.setProgress(100, 'Ready!');
  preloader?.complete();

  const frameListeners = new Set<(frame: BrowserGameFrame) => void>();
  let destroyed = false;
  let frameCount = 0;
  let previousFrameTime = performance.now();
  let animationFrame = 0;

  const frame = (now: number): void => {
    if (destroyed) return;
    const elapsedMS = Math.max(0, now - previousFrameTime);
    previousFrameTime = now;
    let simulationSteps = 0;
    if (!FlxG.paused) {
      simulationSteps = game.advance(elapsedMS / 1000).steps;
    }
    // Membership sync is O(n); skip when groups have not changed.
    if (game.context.renderablesDirty) {
      syncWorldToRenderer(game, renderer);
    }
    renderer.render();
    frameCount += 1;
    const event = { elapsedMS, frameCount, simulationSteps };
    for (const listener of [...frameListeners]) listener(event);
    animationFrame = requestAnimationFrame(frame);
  };
  animationFrame = requestAnimationFrame(frame);

  return {
    game,
    renderer,
    app,
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
      renderer.destroy();
      game.destroy();
      app.destroy({ removeView: true, releaseGlobalResources: true });
      host.replaceChildren();
    },
  };
}
