import { bootGame, type GameApplication } from '../_kit/boot-game';
import { AnimationShowcaseState, type AnimationShowcaseSnapshot } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_ANIMATION__?: {
      app?: GameApplication;
      destroyed: boolean;
      ready: boolean;
      pause?: () => void;
      restart?: () => void;
      resume?: () => void;
      snapshot?: () => AnimationShowcaseSnapshot | null;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const pauseButton = document.querySelector<HTMLButtonElement>(
  '[data-action="pause"]',
);
const restartButton = document.querySelector<HTMLButtonElement>(
  '[data-action="restart"]',
);
const destroyButton = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

window.__FLIXEL_PIXI_ANIMATION__ = { destroyed: false, ready: false };
if (!host) throw new Error('Missing [data-testid="canvas-host"]');

bootGame({
  backgroundColor: 0x07111f,
  fpsDisplay: true,
  height: 360,
  host,
  initialState: AnimationShowcaseState,
  title: 'Animation Showcase',
})
  .then((app) => {
    const getState = (): AnimationShowcaseState | null =>
      app.game.state instanceof AnimationShowcaseState ? app.game.state : null;
    const setPaused = (paused: boolean): void => {
      getState()?.setPaused(paused);
      if (pauseButton) pauseButton.textContent = paused ? 'Resume' : 'Pause';
    };

    window.__FLIXEL_PIXI_ANIMATION__ = {
      app,
      destroyed: false,
      pause: () => setPaused(true),
      ready: true,
      restart: () => getState()?.restart(),
      resume: () => setPaused(false),
      snapshot: () => getState()?.snapshot() ?? null,
    };

    pauseButton?.removeAttribute('disabled');
    restartButton?.removeAttribute('disabled');
    destroyButton?.removeAttribute('disabled');
    pauseButton?.addEventListener('click', () =>
      setPaused(!(getState()?.paused ?? false)),
    );
    restartButton?.addEventListener('click', () => getState()?.restart());
    destroyButton?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_ANIMATION__ = { destroyed: true, ready: false };
      if (status) {
        status.textContent = 'Destroyed';
        status.setAttribute('data-state', 'destroyed');
      }
    });
    if (status) {
      status.textContent = 'Animation showcase ready';
      status.setAttribute('data-state', 'ready');
    }
  })
  .catch((cause: unknown) => {
    if (status) {
      status.textContent = `Failed: ${String(cause)}`;
      status.setAttribute('data-state', 'error');
    }
  });
