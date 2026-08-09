import { bootGame, type GameApplication } from '../_kit/boot-game';
import { SubstateDemoState, type SubstateDemoSnapshot } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_SUBSTATES__?: {
      app?: GameApplication;
      destroyed: boolean;
      ready: boolean;
      pause?: () => void;
      resume?: () => void;
      snapshot?: () => SubstateDemoSnapshot | null;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const toggleButton = document.querySelector<HTMLButtonElement>(
  '[data-action="toggle"]',
);
const destroyButton = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

window.__FLIXEL_PIXI_SUBSTATES__ = { destroyed: false, ready: false };
if (!host) throw new Error('Missing [data-testid="canvas-host"]');

bootGame({
  backgroundColor: 0x07111f,
  fpsDisplay: true,
  host,
  initialState: SubstateDemoState,
  title: 'Substate Lifecycle',
})
  .then((app) => {
    const getState = (): SubstateDemoState | null => {
      return app.game.state instanceof SubstateDemoState
        ? app.game.state
        : null;
    };
    const updateControls = (): void => {
      if (toggleButton) {
        toggleButton.textContent = getState()?.subState ? 'Resume' : 'Pause';
      }
    };

    window.__FLIXEL_PIXI_SUBSTATES__ = {
      app,
      destroyed: false,
      ready: true,
      pause: () => getState()?.pause(),
      resume: () => getState()?.resume(),
      snapshot: () => getState()?.snapshot() ?? null,
    };

    app.onFrame(updateControls);
    toggleButton?.removeAttribute('disabled');
    destroyButton?.removeAttribute('disabled');
    toggleButton?.addEventListener('click', () => {
      const state = getState();
      if (state?.subState) state.resume();
      else state?.pause();
    });
    destroyButton?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_SUBSTATES__ = { destroyed: true, ready: false };
      if (status) {
        status.textContent = 'Destroyed';
        status.setAttribute('data-state', 'destroyed');
      }
    });

    updateControls();
    if (status) {
      status.textContent = 'Substate demo ready';
      status.setAttribute('data-state', 'ready');
    }
  })
  .catch((cause: unknown) => {
    if (status) {
      status.textContent = `Failed: ${String(cause)}`;
      status.setAttribute('data-state', 'error');
    }
  });
