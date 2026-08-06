import {
  createPhaseSevenApplication,
  type PhaseSevenApplication,
  type PhaseSevenMetrics,
  type PhaseSevenState,
} from './phase7-application';

declare global {
  interface Window {
    __FLIXEL_PIXI_PHASE7__?: {
      advance?: (steps: number) => PhaseSevenState;
      destroyed: boolean;
      metrics?: PhaseSevenMetrics;
      pause?: () => void;
      ready: boolean;
      reset?: () => PhaseSevenState;
      resume?: () => void;
      state?: () => PhaseSevenState;
    };
  }
}

const host = document.querySelector<HTMLElement>(
  '[data-testid="phase7-canvas-host"]',
);
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const metricsElement = document.querySelector<HTMLElement>(
  '[data-testid="phase7-metrics"]',
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
  throw new Error('Phase 7 document is missing required elements.');
}

const state: NonNullable<Window['__FLIXEL_PIXI_PHASE7__']> = {
  destroyed: false,
  ready: false,
};
window.__FLIXEL_PIXI_PHASE7__ = state;

try {
  const phaseSeven: PhaseSevenApplication =
    await createPhaseSevenApplication(host);
  state.advance = (steps) => phaseSeven.advance(steps);
  state.metrics = phaseSeven.metrics;
  state.pause = () => phaseSeven.pause();
  state.reset = () => phaseSeven.reset();
  state.resume = () => phaseSeven.resume();
  state.state = () => phaseSeven.state();
  state.ready = true;
  status.dataset.state = 'ready';
  status.textContent = 'C7 deterministic input scene ready';
  destroyButton.disabled = false;
  for (const [key, value] of Object.entries(phaseSeven.metrics)) {
    metricsElement.dataset[key] = String(value);
  }
  const destroy = (): void => {
    phaseSeven.destroy();
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
