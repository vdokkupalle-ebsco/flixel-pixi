import {
  createRenderingApplication,
  type RenderingMetrics,
  type RenderingResizeEvidence,
} from './rendering-application';

declare global {
  interface Window {
    __FLIXEL_PIXI_RENDERING__?: {
      destroyed: boolean;
      metrics?: RenderingMetrics;
      ready: boolean;
      resize?: (
        width: number,
        height: number,
        resolution: number,
      ) => RenderingResizeEvidence;
    };
  }
}

const host = document.querySelector<HTMLElement>(
  '[data-testid="rendering-canvas-host"]',
);
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroyButton = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

if (host === null || status === null || destroyButton === null) {
  throw new Error('Rendering document is missing required elements.');
}

const state: NonNullable<Window['__FLIXEL_PIXI_RENDERING__']> = {
  destroyed: false,
  ready: false,
};
window.__FLIXEL_PIXI_RENDERING__ = state;

try {
  const rendering = await createRenderingApplication(host);
  state.metrics = rendering.metrics;
  state.resize = (width, height, resolution) =>
    rendering.resize(width, height, resolution);
  state.ready = true;
  status.dataset.state = 'ready';
  status.textContent =
    'Rendering demo ready: one world, two isolated camera passes';
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
      rendering.metrics.cameraPassesPerFrame,
    );
    metricsElement.dataset.directPassMilliseconds = String(
      rendering.metrics.directPassMilliseconds,
    );
    metricsElement.dataset.readbackMilliseconds = String(
      rendering.metrics.canvasReadbackMilliseconds,
    );
    metricsElement.dataset.renderTargetBytes = String(
      rendering.metrics.renderTargetBytes,
    );
    metricsElement.dataset.renderTexturePassMilliseconds = String(
      rendering.metrics.renderTexturePassMilliseconds,
    );
    metricsElement.dataset.renderer = rendering.metrics.renderer;
    metricsElement.dataset.sharedHandleParentCount = String(
      rendering.metrics.sharedHandleParentCount,
    );
    metricsElement.dataset.visualIsolation = String(
      rendering.metrics.visualEvidence.isolated,
    );
    metricsElement.dataset.followSharedPixels = String(
      rendering.metrics.visualEvidence.follow.shared,
    );
    metricsElement.dataset.followCameraOnlyPixels = String(
      rendering.metrics.visualEvidence.follow.cameraOnly,
    );
    metricsElement.dataset.followForbiddenPixels = String(
      rendering.metrics.visualEvidence.follow.forbiddenCameraOnly,
    );
    metricsElement.dataset.overviewSharedPixels = String(
      rendering.metrics.visualEvidence.overview.shared,
    );
    metricsElement.dataset.overviewCameraOnlyPixels = String(
      rendering.metrics.visualEvidence.overview.cameraOnly,
    );
    metricsElement.dataset.overviewForbiddenPixels = String(
      rendering.metrics.visualEvidence.overview.forbiddenCameraOnly,
    );
    metricsElement.dataset.compositeGap =
      rendering.metrics.visualEvidence.compositeGap.join(',');
  }
  if (rendererMetric !== null)
    rendererMetric.textContent = rendering.metrics.renderer;
  if (passesMetric !== null) {
    passesMetric.textContent = String(rendering.metrics.cameraPassesPerFrame);
  }
  if (memoryMetric !== null) {
    memoryMetric.textContent = `${Math.round(rendering.metrics.renderTargetBytes / 1_024)} KiB`;
  }
  if (readbackMetric !== null) {
    readbackMetric.textContent = `${rendering.metrics.canvasReadbackMilliseconds.toFixed(3)} ms`;
  }

  const destroy = (): void => {
    rendering.destroy();
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
