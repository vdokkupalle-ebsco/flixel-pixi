import {
  createInputApplication,
  type InputApplication,
  type InputMetrics,
  type InputState,
} from './input-application';

declare global {
  interface Window {
    __FLIXEL_PIXI_INPUT__?: {
      advance?: (steps: number) => InputState;
      destroyed: boolean;
      metrics?: InputMetrics;
      pause?: () => void;
      ready: boolean;
      reset?: () => InputState;
      resume?: () => void;
      state?: () => InputState;
    };
  }
}

const host = document.querySelector<HTMLElement>(
  '[data-testid="input-canvas-host"]',
);
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const metricsElement = document.querySelector<HTMLElement>(
  '[data-testid="input-metrics"]',
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
  throw new Error('Input document is missing required elements.');
}

const state: NonNullable<Window['__FLIXEL_PIXI_INPUT__']> = {
  destroyed: false,
  ready: false,
};
window.__FLIXEL_PIXI_INPUT__ = state;

try {
  const inputDemo: InputApplication = await createInputApplication(host);
  state.advance = (steps) => inputDemo.advance(steps);
  state.metrics = inputDemo.metrics;
  state.pause = () => inputDemo.pause();
  state.reset = () => inputDemo.reset();
  state.resume = () => inputDemo.resume();
  state.state = () => inputDemo.state();
  state.ready = true;
  status.dataset.state = 'ready';
  status.textContent = 'Input demo ready';
  destroyButton.disabled = false;
  for (const [key, value] of Object.entries(inputDemo.metrics)) {
    metricsElement.dataset[key] = String(value);
  }
  const destroy = (): void => {
    inputDemo.destroy();
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
