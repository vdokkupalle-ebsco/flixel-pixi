import {
  createPhaseOneApplication,
  type PhaseOneMetrics,
  type PhaseOneResizeEvidence,
} from './phase1-application';

declare global {
  interface Window {
    __FLIXEL_PIXI_PHASE1__?: {
      destroyed: boolean;
      metrics?: PhaseOneMetrics;
      ready: boolean;
      resize?: (
        width: number,
        height: number,
        resolution: number,
      ) => PhaseOneResizeEvidence;
    };
  }
}

const host = document.querySelector<HTMLElement>(
  '[data-testid="phase1-canvas-host"]',
);
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroyButton = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

if (host === null || status === null || destroyButton === null) {
  throw new Error('Phase 1 document is missing required elements.');
}

const state: NonNullable<Window['__FLIXEL_PIXI_PHASE1__']> = {
  destroyed: false,
  ready: false,
};
window.__FLIXEL_PIXI_PHASE1__ = state;

try {
  const phaseOne = await createPhaseOneApplication(host);
  state.metrics = phaseOne.metrics;
  state.resize = (width, height, resolution) =>
    phaseOne.resize(width, height, resolution);
  state.ready = true;
  status.dataset.state = 'ready';
  status.textContent =
    'C1 spike running: one world, two isolated camera passes';
  destroyButton.disabled = false;

  const rendererMetric = document.querySelector<HTMLElement>(
    '[data-metric="renderer"]',
  );
  const passesMetric = document.querySelector<HTMLElement>(
    '[data-metric="passes"]',
  );
  const memoryMetric = document.querySelector<HTMLElement>(
    '[data-metric="memory"]',
  );
  const readbackMetric = document.querySelector<HTMLElement>(
    '[data-metric="readback"]',
  );
  const metricsElement = document.querySelector<HTMLElement>(
    '[data-testid="metrics"]',
  );
  if (metricsElement !== null) {
    metricsElement.dataset.cameraPasses = String(
      phaseOne.metrics.cameraPassesPerFrame,
    );
    metricsElement.dataset.directPassMilliseconds = String(
      phaseOne.metrics.directPassMilliseconds,
    );
    metricsElement.dataset.readbackMilliseconds = String(
      phaseOne.metrics.canvasReadbackMilliseconds,
    );
    metricsElement.dataset.renderTargetBytes = String(
      phaseOne.metrics.renderTargetBytes,
    );
    metricsElement.dataset.renderTexturePassMilliseconds = String(
      phaseOne.metrics.renderTexturePassMilliseconds,
    );
    metricsElement.dataset.renderer = phaseOne.metrics.renderer;
    metricsElement.dataset.sharedHandleParentCount = String(
      phaseOne.metrics.sharedHandleParentCount,
    );
    metricsElement.dataset.visualIsolation = String(
      phaseOne.metrics.visualEvidence.isolated,
    );
    metricsElement.dataset.followSharedPixels = String(
      phaseOne.metrics.visualEvidence.follow.shared,
    );
    metricsElement.dataset.followCameraOnlyPixels = String(
      phaseOne.metrics.visualEvidence.follow.cameraOnly,
    );
    metricsElement.dataset.followForbiddenPixels = String(
      phaseOne.metrics.visualEvidence.follow.forbiddenCameraOnly,
    );
    metricsElement.dataset.overviewSharedPixels = String(
      phaseOne.metrics.visualEvidence.overview.shared,
    );
    metricsElement.dataset.overviewCameraOnlyPixels = String(
      phaseOne.metrics.visualEvidence.overview.cameraOnly,
    );
    metricsElement.dataset.overviewForbiddenPixels = String(
      phaseOne.metrics.visualEvidence.overview.forbiddenCameraOnly,
    );
    metricsElement.dataset.compositeGap =
      phaseOne.metrics.visualEvidence.compositeGap.join(',');
  }
  if (rendererMetric !== null)
    rendererMetric.textContent = phaseOne.metrics.renderer;
  if (passesMetric !== null) {
    passesMetric.textContent = String(phaseOne.metrics.cameraPassesPerFrame);
  }
  if (memoryMetric !== null) {
    memoryMetric.textContent = `${Math.round(phaseOne.metrics.renderTargetBytes / 1_024)} KiB`;
  }
  if (readbackMetric !== null) {
    readbackMetric.textContent = `${phaseOne.metrics.canvasReadbackMilliseconds.toFixed(3)} ms`;
  }

  const destroy = (): void => {
    phaseOne.destroy();
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
