import { bootGame, type GameApplication } from '../_kit/boot-game';
import { KenneyPlayState } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_KENNEY__?: {
      app?: GameApplication;
      destroyed: boolean;
      ready: boolean;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroyBtn = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

window.__FLIXEL_PIXI_KENNEY__ = { destroyed: false, ready: false };

if (!host) {
  throw new Error('Missing [data-testid="canvas-host"]');
}

bootGame({
  host,
  initialState: KenneyPlayState,
  title: 'Kenney Platformer',
  showPreloader: true,
})
  .then((app) => {
    window.__FLIXEL_PIXI_KENNEY__ = {
      app,
      destroyed: false,
      ready: true,
    };

    if (status) {
      status.textContent = 'Kenney Platformer ready';
      status.setAttribute('data-state', 'ready');
    }
    destroyBtn?.removeAttribute('disabled');
    destroyBtn?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_KENNEY__ = { destroyed: true, ready: false };
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
