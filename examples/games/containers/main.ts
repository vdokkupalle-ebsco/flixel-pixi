import { bootGame, type GameApplication } from '../_kit/boot-game';
import { ContainerShowcaseState, type ContainerShowcaseSnapshot } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_CONTAINERS__?: {
      app?: GameApplication;
      destroyed: boolean;
      ready: boolean;
      snapshot?: () => ContainerShowcaseSnapshot | null;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroyButton = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

window.__FLIXEL_PIXI_CONTAINERS__ = { destroyed: false, ready: false };
if (!host) throw new Error('Missing [data-testid="canvas-host"]');

bootGame({
  backgroundColor: 0x07111f,
  fpsDisplay: true,
  height: 360,
  host,
  initialState: ContainerShowcaseState,
  title: 'Container Showcase',
})
  .then((app) => {
    const getState = (): ContainerShowcaseState | null =>
      app.game.state instanceof ContainerShowcaseState ? app.game.state : null;
    window.__FLIXEL_PIXI_CONTAINERS__ = {
      app,
      destroyed: false,
      ready: true,
      snapshot: () => getState()?.snapshot() ?? null,
    };
    destroyButton?.removeAttribute('disabled');
    destroyButton?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_CONTAINERS__ = {
        destroyed: true,
        ready: false,
      };
      if (status) {
        status.textContent = 'Destroyed';
        status.setAttribute('data-state', 'destroyed');
      }
    });
    if (status) {
      status.textContent = 'Container showcase ready';
      status.setAttribute('data-state', 'ready');
    }
  })
  .catch((cause: unknown) => {
    if (status) {
      status.textContent = `Failed: ${String(cause)}`;
      status.setAttribute('data-state', 'error');
    }
  });
