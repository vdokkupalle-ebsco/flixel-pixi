import {
  createCamerasApplication,
  type CamerasAnimationState,
  type CamerasApplication,
  type CamerasCameraName,
  type CamerasMetrics,
  type CamerasResizeEvidence,
} from './cameras-application';

declare global {
  interface Window {
    __FLIXEL_PIXI_CAMERAS__?: {
      advanceAnimation?: (steps: number) => CamerasAnimationState;
      animationState?: () => CamerasAnimationState;
      destroyed: boolean;
      metrics?: CamerasMetrics;
      pauseAnimation?: () => void;
      pointerToWorld?: (
        camera: CamerasCameraName,
        x: number,
        y: number,
      ) => { x: number; y: number };
      ready: boolean;
      resize?: (
        width: number,
        height: number,
        resolution: number,
      ) => CamerasResizeEvidence;
      resumeAnimation?: () => void;
      seekAnimation?: (seconds: number) => CamerasAnimationState;
    };
  }
}

const host = document.querySelector<HTMLElement>(
  '[data-testid="cameras-canvas-host"]',
);
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const metricsElement = document.querySelector<HTMLElement>(
  '[data-testid="cameras-metrics"]',
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
  throw new Error('Camera document is missing required elements.');
}

const state: NonNullable<Window['__FLIXEL_PIXI_CAMERAS__']> = {
  destroyed: false,
  ready: false,
};
window.__FLIXEL_PIXI_CAMERAS__ = state;

try {
  const cameras: CamerasApplication = await createCamerasApplication(host);
  state.advanceAnimation = (steps) => cameras.advanceAnimation(steps);
  state.animationState = () => cameras.animationState();
  state.metrics = cameras.metrics;
  state.pauseAnimation = () => cameras.pauseAnimation();
  state.pointerToWorld = (camera, x, y) => cameras.pointerToWorld(camera, x, y);
  state.resize = (width, height, resolution) =>
    cameras.resize(width, height, resolution);
  state.resumeAnimation = () => cameras.resumeAnimation();
  state.seekAnimation = (seconds) => cameras.seekAnimation(seconds);
  state.ready = true;
  status.dataset.state = 'ready';
  status.textContent = 'Multi-camera demo ready';
  destroyButton.disabled = false;

  for (const [key, value] of Object.entries(cameras.metrics)) {
    metricsElement.dataset[key] = String(value);
  }

  const destroy = (): void => {
    cameras.destroy();
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
