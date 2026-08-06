import { bootGame, type GameApplication } from '../_kit/boot-game';
import {
  ACTIVE_COUNT,
  BenchSpritesState,
  INACTIVE_COUNT,
} from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_BENCH__?: {
      app?: GameApplication;
      ready: boolean;
      measured: boolean;
      destroyed: boolean;
      avgFps: number;
      minFps: number;
      activeCount: number;
      inactiveCount: number;
      drawCalls: number | null;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroyBtn = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

window.__FLIXEL_PIXI_BENCH__ = {
  ready: false,
  measured: false,
  destroyed: false,
  avgFps: 0,
  minFps: 0,
  activeCount: ACTIVE_COUNT,
  inactiveCount: INACTIVE_COUNT,
  drawCalls: null,
};

if (!host) throw new Error('Missing [data-testid="canvas-host"]');

bootGame({
  host,
  initialState: BenchSpritesState,
  width: 640,
  height: 480,
  title: 'Sprite Bench',
  showPreloader: false,
})
  .then((app) => {
    const syncHook = () => {
      const state = app.game.state;
      const measured =
        state instanceof BenchSpritesState ? state.measured : false;
      window.__FLIXEL_PIXI_BENCH__ = {
        app,
        ready: true,
        measured,
        destroyed: false,
        avgFps: state instanceof BenchSpritesState ? state.avgFps : 0,
        minFps: state instanceof BenchSpritesState ? state.minFps : 0,
        activeCount: ACTIVE_COUNT,
        inactiveCount: INACTIVE_COUNT,
        drawCalls: null,
      };
    };
    syncHook();
    app.app.ticker.add(syncHook);

    if (status) {
      status.textContent = 'Sprite bench ready';
      status.setAttribute('data-state', 'ready');
    }
    destroyBtn?.removeAttribute('disabled');
    destroyBtn?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_BENCH__ = {
        ready: false,
        measured: false,
        destroyed: true,
        avgFps: 0,
        minFps: 0,
        activeCount: ACTIVE_COUNT,
        inactiveCount: INACTIVE_COUNT,
        drawCalls: null,
      };
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
