import { bootReplayDemo, type ReplayApplication } from './replay-application';

declare global {
  interface Window {
    __FLIXEL_PIXI_REPLAY__?: {
      app?: ReplayApplication;
      destroyed: boolean;
      ready: boolean;
    };
  }
}

const host = document.querySelector<HTMLElement>(
  '[data-testid="replay-canvas-host"]',
);
const status = document.querySelector<HTMLElement>('[data-testid="status"]');

window.__FLIXEL_PIXI_REPLAY__ = {
  destroyed: false,
  ready: false,
};

bootReplayDemo(host)
  .then((app) => {
    window.__FLIXEL_PIXI_REPLAY__ = {
      app,
      destroyed: false,
      ready: true,
    };
    if (status) {
      status.textContent = 'Replay lab active';
      status.setAttribute('data-state', 'ready');
    }

    const destroyButton = document.querySelector<HTMLButtonElement>(
      '[data-action="destroy"]',
    );
    destroyButton?.addEventListener('click', () => {
      app.destroy();
      if (status) {
        status.textContent = 'Destroyed';
        status.setAttribute('data-state', 'destroyed');
      }
    });
  })
  .catch((err: unknown) => {
    if (status) {
      status.textContent = `Replay Failed: ${String(err)}`;
      status.setAttribute('data-state', 'error');
    }
  });
