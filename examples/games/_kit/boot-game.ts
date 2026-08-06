import { Application } from 'pixi.js';

import {
  FlxCameraRenderer,
  FlxEmitter,
  FlxG,
  FlxGame,
  FlxGroup,
  FlxPreloader,
  FlxSprite,
  FlxTilemap,
  type FlxAudioBackend,
  type FlxBasic,
  type FlxStateConstructor,
} from '../../../src';

/** Options for {@link bootGame}. */
export interface BootGameOptions {
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

/** Running sample game handle returned by {@link bootGame}. */
export interface GameApplication {
  readonly game: FlxGame;
  readonly renderer: FlxCameraRenderer;
  readonly app: Application;
  /** Re-sync all state members into the camera renderer (call after switchState). */
  syncRenderer(): void;
  destroy(): void;
}

function collectRenderables(
  root: FlxBasic,
  out: (FlxSprite | FlxTilemap | FlxEmitter)[],
): void {
  if (root instanceof FlxTilemap || root instanceof FlxEmitter) {
    out.push(root);
    return;
  }
  if (root instanceof FlxSprite) {
    out.push(root);
  }
  if (root instanceof FlxGroup) {
    for (const member of root.members) {
      if (member !== null) collectRenderables(member, out);
    }
  }
}

/** Clear and re-add every renderable member of the active state. */
export function syncStateToRenderer(
  game: FlxGame,
  renderer: FlxCameraRenderer,
): void {
  renderer.clearObjects();
  const state = game.state;
  if (state === null) return;
  const objects: (FlxSprite | FlxTilemap | FlxEmitter)[] = [];
  collectRenderables(state, objects);
  for (const object of objects) {
    renderer.add(object);
  }
}

/** Count renderables currently in the active state (for dirty sync). */
export function countStateRenderables(game: FlxGame): number {
  const state = game.state;
  if (state === null) return 0;
  const objects: (FlxSprite | FlxTilemap | FlxEmitter)[] = [];
  collectRenderables(state, objects);
  return objects.length;
}

/**
 * Boot Pixi + FlxGame + FlxCameraRenderer for a C12 sample game.
 * Imports engine types only from the package public entry.
 */
export async function bootGame(
  options: BootGameOptions,
): Promise<GameApplication> {
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
  game.step(1 / 60);
  syncStateToRenderer(game, renderer);
  renderer.render();

  preloader?.setProgress(100, 'Ready!');
  preloader?.complete();

  let lastState = game.state;
  let lastRenderableCount = countStateRenderables(game);

  app.ticker.add(() => {
    if (!FlxG.paused) {
      game.advance(app.ticker.deltaMS / 1000);
    }
    const renderableCount = countStateRenderables(game);
    // Re-sync on state switch OR when members are added/removed mid-state
    // (e.g. external Mode Lite spawning enemies after create).
    if (game.state !== lastState || renderableCount !== lastRenderableCount) {
      lastState = game.state;
      lastRenderableCount = renderableCount;
      syncStateToRenderer(game, renderer);
    }
    renderer.render();
  });

  return {
    game,
    renderer,
    app,
    syncRenderer() {
      syncStateToRenderer(game, renderer);
      lastState = game.state;
      lastRenderableCount = countStateRenderables(game);
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
