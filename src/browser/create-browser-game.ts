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
  /** Re-sync all state members into the camera renderer (call after switchState or manual mutations). */
  syncRenderer(): void;
  destroy(): void;
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

  app.ticker.add(() => {
    if (!FlxG.paused) {
      game.advance(app.ticker.deltaMS / 1000);
    }
    // Membership sync is O(n); skip when groups have not changed.
    if (game.context.renderablesDirty) {
      syncWorldToRenderer(game, renderer);
    }
    renderer.render();
  });

  return {
    game,
    renderer,
    app,
    syncRenderer() {
      game.context.markRenderablesDirty();
      syncWorldToRenderer(game, renderer);
    },
    destroy() {
      app.ticker.stop();
      renderer.destroy();
      game.destroy();
      app.destroy(true);
      host.replaceChildren();
    },
  };
}
