import { createBrowserGame, type BrowserGameApplication } from 'flixel-pixi';

import { PhysicsPlaygroundState } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_PHYSICS__?: {
      app?: BrowserGameApplication;
      destroyed: boolean;
      queryAt?: (x: number, y: number) => string;
      ready: boolean;
      snapshot?: () => ReturnType<PhysicsPlaygroundState['snapshot']>;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroyButton = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);
const contacts = document.querySelector<HTMLElement>('[data-stat="contacts"]');
const sensor = document.querySelector<HTMLElement>('[data-stat="sensor"]');
const lastEvent = document.querySelector<HTMLElement>('[data-stat="event"]');
const query = document.querySelector<HTMLElement>('[data-stat="query"]');

if (host === null) throw new Error('Missing physics canvas host.');
window.__FLIXEL_PIXI_PHYSICS__ = { destroyed: false, ready: false };

let statsFrame = 0;

createBrowserGame({
  host,
  initialState: PhysicsPlaygroundState,
  width: 760,
  height: 460,
  title: 'Flixel-Pixi rigid-body physics playground',
})
  .then((app) => {
    const currentState = () => {
      const state = app.game.state;
      return state instanceof PhysicsPlaygroundState ? state : undefined;
    };
    window.__FLIXEL_PIXI_PHYSICS__ = {
      app,
      destroyed: false,
      ready: true,
      queryAt(x, y) {
        return currentState()?.queryAt(x, y) ?? 'state unavailable';
      },
      snapshot() {
        return (
          currentState()?.snapshot() ?? {
            bodies: 0,
            contacts: 0,
            dynamicY: Number.NaN,
            lastEvent: 'state unavailable',
            query: 'state unavailable',
            sensorEntries: 0,
          }
        );
      },
    };
    if (status !== null) {
      status.textContent = 'Simulation live';
      status.dataset.state = 'ready';
    }
    destroyButton?.removeAttribute('disabled');

    const updateStats = () => {
      const snapshot = currentState()?.snapshot();
      if (snapshot !== undefined) {
        if (contacts !== null) contacts.textContent = String(snapshot.contacts);
        if (sensor !== null)
          sensor.textContent = String(snapshot.sensorEntries);
        if (lastEvent !== null) lastEvent.textContent = snapshot.lastEvent;
        if (query !== null) query.textContent = snapshot.query;
      }
      statsFrame = requestAnimationFrame(updateStats);
    };
    updateStats();

    destroyButton?.addEventListener('click', () => {
      cancelAnimationFrame(statsFrame);
      app.destroy();
      window.__FLIXEL_PIXI_PHYSICS__ = { destroyed: true, ready: false };
      if (status !== null) {
        status.textContent = 'Simulation destroyed';
        status.dataset.state = 'destroyed';
      }
      destroyButton.disabled = true;
    });
  })
  .catch((error: unknown) => {
    if (status !== null) {
      status.textContent = `Failed: ${String(error)}`;
      status.dataset.state = 'error';
    }
  });
