import {
  createTilemapsApplication,
  type TilemapsApplication,
  type TilemapsMetrics,
  type TilemapsState,
} from './tilemaps-application';

declare global {
  interface Window {
    __FLIXEL_PIXI_TILEMAPS__?: {
      advance?: (steps: number) => TilemapsState;
      destroyed: boolean;
      metrics?: TilemapsMetrics;
      ready: boolean;
      seek?: (seconds: number) => TilemapsState;
      state?: () => TilemapsState;
    };
  }
}

const host = document.querySelector<HTMLElement>(
  '[data-testid="tilemaps-canvas-host"]',
);
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const metricsElement = document.querySelector<HTMLElement>(
  '[data-testid="tilemaps-metrics"]',
);
const destroyButton = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);
if (
  host === null ||
  status === null ||
  metricsElement === null ||
  destroyButton === null
) {
  throw new Error('Tilemap document is missing required elements.');
}

const state: NonNullable<Window['__FLIXEL_PIXI_TILEMAPS__']> = {
  destroyed: false,
  ready: false,
};
window.__FLIXEL_PIXI_TILEMAPS__ = state;

try {
  const tilemaps: TilemapsApplication = await createTilemapsApplication(host);
  state.advance = (steps) => tilemaps.advance(steps);
  state.metrics = tilemaps.metrics;
  state.seek = (seconds) => tilemaps.seek(seconds);
  state.state = () => tilemaps.state();
  state.ready = true;
  status.dataset.state = 'ready';
  status.textContent = 'Tilemap demo ready';
  destroyButton.disabled = false;
  for (const [key, value] of Object.entries(tilemaps.metrics)) {
    metricsElement.dataset[key] = String(value);
  }
  const destroy = (): void => {
    tilemaps.destroy();
    state.destroyed = true;
    destroyButton.disabled = true;
    status.dataset.state = 'destroyed';
    status.textContent = 'Destroyed cleanly';
  };
  destroyButton.addEventListener('click', destroy, { once: true });
  window.addEventListener('pagehide', destroy, { once: true });
} catch (error: unknown) {
  status.dataset.state = 'error';
  status.textContent =
    error instanceof Error
      ? `Initialization failed: ${error.message}`
      : 'Initialization failed';
  console.error(error);
}
