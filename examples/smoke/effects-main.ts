import {
  createEffectsApplication,
  type EffectsApplication,
  type EffectsMetrics,
  type EffectsState,
} from './effects-application';

declare global {
  interface Window {
    __FLIXEL_PIXI_EFFECTS__?: {
      advance?: (steps: number) => EffectsState;
      destroyed: boolean;
      metrics?: EffectsMetrics;
      pause?: () => void;
      ready: boolean;
      reset?: () => EffectsState;
      resume?: () => void;
      state?: () => EffectsState;
    };
  }
}

const host = document.querySelector<HTMLElement>(
  '[data-testid="effects-canvas-host"]',
);
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const metricsElement = document.querySelector<HTMLElement>(
  '[data-testid="effects-metrics"]',
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
  throw new Error('Effects document is missing required elements.');
}

const state: NonNullable<Window['__FLIXEL_PIXI_EFFECTS__']> = {
  destroyed: false,
  ready: false,
};
window.__FLIXEL_PIXI_EFFECTS__ = state;

try {
  const effects: EffectsApplication = await createEffectsApplication(host);
  state.advance = (steps) => effects.advance(steps);
  state.metrics = effects.metrics;
  state.pause = () => effects.pause();
  state.reset = () => effects.reset();
  state.resume = () => effects.resume();
  state.state = () => effects.state();
  state.ready = true;
  status.dataset.state = 'ready';
  status.textContent = 'Effects demo ready';
  destroyButton.disabled = false;
  for (const [key, value] of Object.entries(effects.metrics)) {
    metricsElement.dataset[key] = String(value);
  }
  const destroy = (): void => {
    effects.destroy();
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
