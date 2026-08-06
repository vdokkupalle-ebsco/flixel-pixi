import {
  bootPhase10Demo,
  type Phase10Application,
} from './phase10-application';

declare global {
  interface Window {
    __FLIXEL_PIXI_PHASE10__?: {
      app?: Phase10Application;
      destroyed: boolean;
      ready: boolean;
    };
  }
}

const status = document.querySelector<HTMLElement>('[data-testid="status"]');

window.__FLIXEL_PIXI_PHASE10__ = {
  destroyed: false,
  ready: false,
};

bootPhase10Demo()
  .then((app) => {
    window.__FLIXEL_PIXI_PHASE10__ = {
      app,
      destroyed: false,
      ready: true,
    };
    if (status) {
      status.textContent = 'Phase 10 Replay Lab Active';
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
      status.textContent = `Phase 10 Failed: ${String(err)}`;
      status.setAttribute('data-state', 'error');
    }
  });
