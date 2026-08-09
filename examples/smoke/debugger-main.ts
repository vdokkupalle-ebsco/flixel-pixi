import {
  bootDebuggerDemo,
  type DebuggerApplication,
} from './debugger-application';

declare global {
  interface Window {
    __FLIXEL_PIXI_DEBUGGER__?: {
      app?: DebuggerApplication;
      destroyed: boolean;
      ready: boolean;
    };
  }
}

const host = document.querySelector<HTMLElement>(
  '[data-testid="debugger-canvas-host"]',
);
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const toggleBtn = document.querySelector<HTMLButtonElement>(
  '[data-action="toggle-debugger"]',
);
const addLogBtn = document.querySelector<HTMLButtonElement>(
  '[data-action="add-log"]',
);
const destroyBtn = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

window.__FLIXEL_PIXI_DEBUGGER__ = { destroyed: false, ready: false };

if (!host) {
  throw new Error('Missing [data-testid="debugger-canvas-host"]');
}

bootDebuggerDemo(host)
  .then((app) => {
    window.__FLIXEL_PIXI_DEBUGGER__ = { app, destroyed: false, ready: true };
    if (status) {
      status.textContent = 'Debugger lab active';
      status.setAttribute('data-state', 'ready');
    }

    let counter = 0;
    toggleBtn?.removeAttribute('disabled');
    toggleBtn?.addEventListener('click', () => {
      app.debugger.toggle();
    });

    addLogBtn?.removeAttribute('disabled');
    addLogBtn?.addEventListener('click', () => {
      import('../../src').then(({ FlxG }) => {
        FlxG.log.add(
          `Manual log entry #${++counter} at ${new Date().toISOString()}`,
          0xfffacc15,
        );
      });
    });

    destroyBtn?.removeAttribute('disabled');
    destroyBtn?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_DEBUGGER__ = { destroyed: true, ready: false };
      if (status) {
        status.textContent = 'Destroyed';
        status.setAttribute('data-state', 'destroyed');
      }
    });
  })
  .catch((err: unknown) => {
    if (status) {
      status.textContent = `Debugger Failed: ${String(err)}`;
      status.setAttribute('data-state', 'error');
    }
  });
