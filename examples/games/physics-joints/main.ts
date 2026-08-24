import { createBrowserGame, type BrowserGameApplication } from 'flixel-pixi';

import { PhysicsJointsState } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_JOINTS__?: {
      app?: BrowserGameApplication;
      destroyed: boolean;
      ready: boolean;
      snapshot?: () => ReturnType<PhysicsJointsState['snapshot']>;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const resetButton = document.querySelector<HTMLButtonElement>(
  '[data-action="reset"]',
);

if (host === null) throw new Error('Missing joint showcase canvas host.');
window.__FLIXEL_PIXI_JOINTS__ = { destroyed: false, ready: false };

createBrowserGame({
  host,
  initialState: PhysicsJointsState,
  width: 900,
  height: 540,
  title: 'Flixel-Pixi portable physics joint showcase',
})
  .then((app) => {
    const currentState = () => {
      const state = app.game.state;
      return state instanceof PhysicsJointsState ? state : undefined;
    };
    window.__FLIXEL_PIXI_JOINTS__ = {
      app,
      destroyed: false,
      ready: true,
      snapshot: () =>
        currentState()?.snapshot() ?? {
          jointCount: 0,
          prismaticX: Number.NaN,
          revoluteAngle: Number.NaN,
          wheelAngle: Number.NaN,
        },
    };
    if (status !== null) {
      status.textContent = 'Five joints live';
      status.dataset.state = 'ready';
    }
    resetButton?.removeAttribute('disabled');
    resetButton?.addEventListener('click', () => window.location.reload());
  })
  .catch((error: unknown) => {
    if (status !== null) {
      status.textContent = `Failed: ${String(error)}`;
      status.dataset.state = 'error';
    }
  });
