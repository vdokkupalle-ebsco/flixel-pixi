import { bootGame, type GameApplication } from '../_kit/boot-game';
import { TweenShowcaseState, type TweenShowcaseSnapshot } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_TWEENS__?: {
      app?: GameApplication;
      destroyed: boolean;
      ready: boolean;
      pause?: () => void;
      restart?: () => void;
      resume?: () => void;
      snapshot?: () => TweenShowcaseSnapshot | null;
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

window.__FLIXEL_PIXI_TWEENS__ = { destroyed: false, ready: false };

if (!host) throw new Error('Missing [data-testid="canvas-host"]');

bootGame({
  backgroundColor: 0x07111f,
  fpsDisplay: true,
  host,
  initialState: TweenShowcaseState,
  title: 'Tween Showcase',
})
  .then((app) => {
    const getState = (): TweenShowcaseState | null => {
      return app.game.state instanceof TweenShowcaseState
        ? app.game.state
        : null;
    };
    const setPaused = (paused: boolean): void => {
      getState()?.setTweensPaused(paused);
      if (pauseButton) pauseButton.textContent = paused ? 'Resume' : 'Pause';
    };

    window.__FLIXEL_PIXI_TWEENS__ = {
      app,
      destroyed: false,
      ready: true,
      pause: () => setPaused(true),
      restart: () => {
        getState()?.restartTweens();
        setPaused(false);
      },
      resume: () => setPaused(false),
      snapshot: () => getState()?.snapshot() ?? null,
    };

    pauseButton?.removeAttribute('disabled');
    restartButton?.removeAttribute('disabled');
    destroyButton?.removeAttribute('disabled');
    pauseButton?.addEventListener('click', () => {
      const paused = getState()?.paused ?? false;
      setPaused(!paused);
    });
    restartButton?.addEventListener('click', () => {
      window.__FLIXEL_PIXI_TWEENS__?.restart?.();
    });
    destroyButton?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_TWEENS__ = { destroyed: true, ready: false };
      if (status) {
        status.textContent = 'Destroyed';
        status.setAttribute('data-state', 'destroyed');
      }
    });

    if (status) {
      status.textContent = 'Tween showcase ready';
      status.setAttribute('data-state', 'ready');
    }
  })
  .catch((cause: unknown) => {
    if (status) {
      status.textContent = `Failed: ${String(cause)}`;
      status.setAttribute('data-state', 'error');
    }
  });
