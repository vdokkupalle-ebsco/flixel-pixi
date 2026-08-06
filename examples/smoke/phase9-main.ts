import {
  createPhaseNineApplication,
  type PhaseNineApplication,
  type PhaseNineMetrics,
} from './phase9-application';

declare global {
  interface Window {
    __FLIXEL_PIXI_PHASE9__?: {
      advance?: (steps: number) => void;
      destroyed: boolean;
      metrics?: PhaseNineMetrics;
      ready: boolean;
    };
  }
}

const host = document.querySelector<HTMLElement>(
  '[data-testid="phase9-canvas-host"]',
);
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const metricsElement = document.querySelector<HTMLElement>(
  '[data-testid="phase9-metrics"]',
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
  throw new Error('Phase 9 document is missing required elements.');
}

const state: NonNullable<Window['__FLIXEL_PIXI_PHASE9__']> = {
  destroyed: false,
  ready: false,
};
window.__FLIXEL_PIXI_PHASE9__ = state;

try {
  const app: PhaseNineApplication = await createPhaseNineApplication(host);
  state.advance = (steps) => app.advance(steps);
  state.metrics = app.metrics;
  state.ready = true;
  status.dataset.state = 'ready';
  status.textContent = 'C9 audio & save data scene ready';
  destroyButton.disabled = false;

  for (const [key, value] of Object.entries(app.metrics)) {
    metricsElement.dataset[key] = String(value);
  }

  const destroy = (): void => {
    app.destroy();
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
