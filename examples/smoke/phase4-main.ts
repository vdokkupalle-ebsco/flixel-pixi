import {
  createPhaseFourApplication,
  type PhaseFourMetrics,
} from './phase4-application';

declare global {
  interface Window {
    __FLIXEL_PIXI_PHASE4__?: {
      destroyed: boolean;
      metrics?: PhaseFourMetrics;
      ready: boolean;
    };
  }
}

const host = document.querySelector<HTMLElement>(
  '[data-testid="phase4-canvas-host"]',
);
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const metricsElement = document.querySelector<HTMLElement>(
  '[data-testid="phase4-metrics"]',
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
  throw new Error('Phase 4 document is missing required elements.');
}

const state: NonNullable<Window['__FLIXEL_PIXI_PHASE4__']> = {
  destroyed: false,
  ready: false,
};
window.__FLIXEL_PIXI_PHASE4__ = state;

try {
  const phaseFour = await createPhaseFourApplication(host);
  state.metrics = phaseFour.metrics;
  state.ready = true;
  status.dataset.state = 'ready';
  status.textContent = 'C4 sprite compatibility scene ready';
  destroyButton.disabled = false;

  metricsElement.dataset.animationCallbacks = String(
    phaseFour.metrics.animationCallbacks,
  );
  metricsElement.dataset.assetCacheShared = String(
    phaseFour.metrics.assetCacheShared,
  );
  metricsElement.dataset.cachedFrameTextures = String(
    phaseFour.metrics.cachedFrameTextures,
  );
  metricsElement.dataset.recoveredFailedAlias = String(
    phaseFour.metrics.recoveredFailedAlias,
  );
  metricsElement.dataset.renderer = phaseFour.metrics.renderer;
  metricsElement.dataset.rendererResolution = String(
    phaseFour.metrics.rendererResolution,
  );
  metricsElement.dataset.retainedHandles = String(
    phaseFour.metrics.retainedHandles,
  );
  metricsElement.dataset.textResolution = String(
    phaseFour.metrics.textResolution,
  );

  const destroy = (): void => {
    phaseFour.destroy();
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
