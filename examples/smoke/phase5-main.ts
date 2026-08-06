import {
  createPhaseFiveApplication,
  type PhaseFiveAnimationState,
  type PhaseFiveApplication,
  type PhaseFiveCameraName,
  type PhaseFiveMetrics,
  type PhaseFiveResizeEvidence,
} from './phase5-application';

declare global {
  interface Window {
    __FLIXEL_PIXI_PHASE5__?: {
      advanceAnimation?: (steps: number) => PhaseFiveAnimationState;
      animationState?: () => PhaseFiveAnimationState;
      destroyed: boolean;
      metrics?: PhaseFiveMetrics;
      pauseAnimation?: () => void;
      pointerToWorld?: (
        camera: PhaseFiveCameraName,
        x: number,
        y: number,
      ) => { x: number; y: number };
      ready: boolean;
      resize?: (
        width: number,
        height: number,
        resolution: number,
      ) => PhaseFiveResizeEvidence;
      resumeAnimation?: () => void;
      seekAnimation?: (seconds: number) => PhaseFiveAnimationState;
    };
  }
}

const host = document.querySelector<HTMLElement>(
  '[data-testid="phase5-canvas-host"]',
);
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const metricsElement = document.querySelector<HTMLElement>(
  '[data-testid="phase5-metrics"]',
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
  throw new Error('Phase 5 document is missing required elements.');
}

const state: NonNullable<Window['__FLIXEL_PIXI_PHASE5__']> = {
  destroyed: false,
  ready: false,
};
window.__FLIXEL_PIXI_PHASE5__ = state;

try {
  const phaseFive: PhaseFiveApplication =
    await createPhaseFiveApplication(host);
  state.advanceAnimation = (steps) => phaseFive.advanceAnimation(steps);
  state.animationState = () => phaseFive.animationState();
  state.metrics = phaseFive.metrics;
  state.pauseAnimation = () => phaseFive.pauseAnimation();
  state.pointerToWorld = (camera, x, y) =>
    phaseFive.pointerToWorld(camera, x, y);
  state.resize = (width, height, resolution) =>
    phaseFive.resize(width, height, resolution);
  state.resumeAnimation = () => phaseFive.resumeAnimation();
  state.seekAnimation = (seconds) => phaseFive.seekAnimation(seconds);
  state.ready = true;
  status.dataset.state = 'ready';
  status.textContent = 'C5 multi-camera scene ready';
  destroyButton.disabled = false;

  for (const [key, value] of Object.entries(phaseFive.metrics)) {
    metricsElement.dataset[key] = String(value);
  }

  const destroy = (): void => {
    phaseFive.destroy();
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
