import { bootGame, type GameApplication } from '../_kit/boot-game';
import { SwipeDemoState, type SwipeDemoSnapshot } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_SWIPE__?: {
      app?: GameApplication;
      destroyed: boolean;
      ready: boolean;
      snapshot?: () => SwipeDemoSnapshot | null;
      spawnTestBomb?: () => { x: number; y: number } | null;
      spawnTestFruit?: () => { x: number; y: number } | null;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroyButton = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

window.__FLIXEL_PIXI_SWIPE__ = { destroyed: false, ready: false };
if (!host) throw new Error('Missing [data-testid="canvas-host"]');

bootGame({
  backgroundColor: 0x071827,
  fpsDisplay: true,
  host,
  initialState: SwipeDemoState,
  title: 'Fruit Punch',
})
  .then((app) => {
    app.app.canvas.style.touchAction = 'none';
    const state = (): SwipeDemoState | null =>
      app.game.state instanceof SwipeDemoState ? app.game.state : null;
    window.__FLIXEL_PIXI_SWIPE__ = {
      app,
      destroyed: false,
      ready: true,
      snapshot: () => state()?.snapshot() ?? null,
      spawnTestBomb: () => state()?.spawnTestBomb() ?? null,
      spawnTestFruit: () => state()?.spawnTestFruit() ?? null,
    };
    destroyButton?.removeAttribute('disabled');
    destroyButton?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_SWIPE__ = { destroyed: true, ready: false };
      if (status) {
        status.textContent = 'Destroyed';
        status.setAttribute('data-state', 'destroyed');
      }
    });
    if (status) {
      status.textContent = 'Fruit Punch ready';
      status.setAttribute('data-state', 'ready');
    }
  })
  .catch((cause: unknown) => {
    if (status) {
      status.textContent = `Failed: ${String(cause)}`;
      status.setAttribute('data-state', 'error');
    }
  });
