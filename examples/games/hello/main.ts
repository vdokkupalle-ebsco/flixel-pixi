import { FlxG } from '../../../src';
import { bootGame, type GameApplication } from '../_kit/boot-game';
import { PlayState, TitleState } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_HELLO__?: {
      app?: GameApplication;
      destroyed: boolean;
      ready: boolean;
      /** Test hook: force switch into PlayState. */
      startPlay?: () => void;
      /** Test hook: nudge player right without keyboard. */
      moveRight?: () => void;
      playerX?: () => number;
      playerY?: () => number;
      rendererBackend?: GameApplication['rendererBackend'];
      rendererFallback?: GameApplication['rendererFallback'];
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroyBtn = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);
const preferWebGPU =
  new URLSearchParams(window.location.search).get('renderer') === 'webgpu';

window.__FLIXEL_PIXI_HELLO__ = { destroyed: false, ready: false };

if (!host) {
  throw new Error('Missing [data-testid="canvas-host"]');
}

bootGame({
  host,
  initialState: TitleState,
  ...(preferWebGPU ? { renderer: { preference: 'webgpu' } } : {}),
  title: 'Hello Sample',
  showPreloader: true,
})
  .then((app) => {
    window.__FLIXEL_PIXI_HELLO__ = {
      app,
      destroyed: false,
      ready: true,
      rendererBackend: app.rendererBackend,
      rendererFallback: app.rendererFallback,
      startPlay() {
        FlxG.switchState(new PlayState());
        app.syncRenderer();
      },
      moveRight() {
        const state = app.game.state;
        if (state instanceof PlayState) {
          state.player.x += 10;
        }
      },
      playerX() {
        const state = app.game.state;
        if (state instanceof PlayState) return state.player.x;
        return NaN;
      },
      playerY() {
        const state = app.game.state;
        if (state instanceof PlayState) return state.player.y;
        return NaN;
      },
    };

    if (status) {
      status.textContent = 'Hello sample ready';
      status.setAttribute('data-state', 'ready');
    }
    destroyBtn?.removeAttribute('disabled');
    destroyBtn?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_HELLO__ = { destroyed: true, ready: false };
      if (status) {
        status.textContent = 'Destroyed';
        status.setAttribute('data-state', 'destroyed');
      }
    });
  })
  .catch((err: unknown) => {
    if (status) {
      status.textContent = `Failed: ${String(err)}`;
      status.setAttribute('data-state', 'error');
    }
  });
