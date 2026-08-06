import {
  createPhaseSixApplication,
  type PhaseSixApplication,
  type PhaseSixMetrics,
  type PhaseSixState,
} from './phase6-application';

declare global {
  interface Window {
    __FLIXEL_PIXI_PHASE6__?: {
      advance?: (steps: number) => PhaseSixState;
      destroyed: boolean;
      metrics?: PhaseSixMetrics;
      ready: boolean;
      seek?: (seconds: number) => PhaseSixState;
      state?: () => PhaseSixState;
    };
  }
}

const host = document.querySelector<HTMLElement>(
  '[data-testid="phase6-canvas-host"]',
);
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const metricsElement = document.querySelector<HTMLElement>(
  '[data-testid="phase6-metrics"]',
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
  throw new Error('Phase 6 document is missing required elements.');
}

const state: NonNullable<Window['__FLIXEL_PIXI_PHASE6__']> = {
  destroyed: false,
  ready: false,
};
window.__FLIXEL_PIXI_PHASE6__ = state;

try {
  const phaseSix: PhaseSixApplication = await createPhaseSixApplication(host);
  state.advance = (steps) => phaseSix.advance(steps);
  state.metrics = phaseSix.metrics;
  state.seek = (seconds) => phaseSix.seek(seconds);
  state.state = () => phaseSix.state();
  state.ready = true;
  status.dataset.state = 'ready';
  status.textContent = 'C6 tilemap scene ready';
  destroyButton.disabled = false;
  for (const [key, value] of Object.entries(phaseSix.metrics)) {
    metricsElement.dataset[key] = String(value);
  }
  const destroy = (): void => {
    phaseSix.destroy();
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
