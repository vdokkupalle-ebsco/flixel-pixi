import { bootGame, type GameApplication } from '../_kit/boot-game';
import { GraphicsShowcaseState, type GraphicsShowcaseSnapshot } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_GRAPHICS__?: {
      app?: GameApplication;
      destroyed: boolean;
      ready: boolean;
      setNight?: (enabled: boolean) => void;
      snapshot?: () => GraphicsShowcaseSnapshot | null;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const theme = document.querySelector<HTMLButtonElement>(
  '[data-action="theme"]',
);
const destroy = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);
if (!host) throw new Error('Missing canvas host.');
window.__FLIXEL_PIXI_GRAPHICS__ = { destroyed: false, ready: false };

bootGame({
  backgroundColor: 0x07111f,
  fpsDisplay: true,
  height: 360,
  host,
  initialState: GraphicsShowcaseState,
  title: 'Vector Quest Scene',
  width: 640,
})
  .then((app) => {
    const state = (): GraphicsShowcaseState | null =>
      app.game.state instanceof GraphicsShowcaseState ? app.game.state : null;
    window.__FLIXEL_PIXI_GRAPHICS__ = {
      app,
      destroyed: false,
      ready: true,
      setNight(enabled) {
        state()?.setNight(enabled);
      },
      snapshot: () => state()?.snapshot() ?? null,
    };
    theme?.removeAttribute('disabled');
    destroy?.removeAttribute('disabled');
    theme?.addEventListener('click', () => {
      const current = state();
      if (!current) return;
      current.setNight(!current.night);
      theme.textContent = current.night ? 'Switch to day' : 'Switch to night';
    });
    destroy?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_GRAPHICS__ = { destroyed: true, ready: false };
      if (status) status.textContent = 'Destroyed';
    });
    if (status) {
      status.textContent = 'Vector quest scene ready';
      status.dataset.state = 'ready';
    }
  })
  .catch((cause: unknown) => {
    if (status) {
      status.textContent = `Failed: ${String(cause)}`;
      status.dataset.state = 'error';
    }
  });
