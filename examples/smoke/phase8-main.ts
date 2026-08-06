import {
  createPhaseEightApplication,
  type PhaseEightApplication,
  type PhaseEightMetrics,
  type PhaseEightState,
} from './phase8-application';

declare global {
  interface Window {
    __FLIXEL_PIXI_PHASE8__?: {
      advance?: (steps: number) => PhaseEightState;
      destroyed: boolean;
      metrics?: PhaseEightMetrics;
      pause?: () => void;
      ready: boolean;
      reset?: () => PhaseEightState;
      resume?: () => void;
      state?: () => PhaseEightState;
    };
  }
}

const host = document.querySelector<HTMLElement>(
  '[data-testid="phase8-canvas-host"]',
);
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const metricsElement = document.querySelector<HTMLElement>(
  '[data-testid="phase8-metrics"]',
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
  throw new Error('Phase 8 document is missing required elements.');
}

const state: NonNullable<Window['__FLIXEL_PIXI_PHASE8__']> = {
  destroyed: false,
  ready: false,
};
window.__FLIXEL_PIXI_PHASE8__ = state;

try {
  const phaseEight: PhaseEightApplication =
    await createPhaseEightApplication(host);
  state.advance = (steps) => phaseEight.advance(steps);
  state.metrics = phaseEight.metrics;
  state.pause = () => phaseEight.pause();
  state.reset = () => phaseEight.reset();
  state.resume = () => phaseEight.resume();
  state.state = () => phaseEight.state();
  state.ready = true;
  status.dataset.state = 'ready';
  status.textContent = 'C8 deterministic effects scene ready';
  destroyButton.disabled = false;
  for (const [key, value] of Object.entries(phaseEight.metrics)) {
    metricsElement.dataset[key] = String(value);
  }
  const destroy = (): void => {
    phaseEight.destroy();
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
