import {
  createSpritesTextApplication,
  type SpritesTextMetrics,
} from './sprites-text-application';

declare global {
  interface Window {
    __FLIXEL_PIXI_SPRITES_TEXT__?: {
      destroyed: boolean;
      metrics?: SpritesTextMetrics;
      ready: boolean;
    };
  }
}

const host = document.querySelector<HTMLElement>(
  '[data-testid="sprites-text-canvas-host"]',
);
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const metricsElement = document.querySelector<HTMLElement>(
  '[data-testid="sprites-text-metrics"]',
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
  throw new Error('Sprites and text document is missing required elements.');
}

const state: NonNullable<Window['__FLIXEL_PIXI_SPRITES_TEXT__']> = {
  destroyed: false,
  ready: false,
};
window.__FLIXEL_PIXI_SPRITES_TEXT__ = state;

try {
  const spritesText = await createSpritesTextApplication(host);
  state.metrics = spritesText.metrics;
  state.ready = true;
  status.dataset.state = 'ready';
  status.textContent = 'Sprites and text demo ready';
  destroyButton.disabled = false;

  metricsElement.dataset.animationCallbacks = String(
    spritesText.metrics.animationCallbacks,
  );
  metricsElement.dataset.assetCacheShared = String(
    spritesText.metrics.assetCacheShared,
  );
  metricsElement.dataset.cachedFrameTextures = String(
    spritesText.metrics.cachedFrameTextures,
  );
  metricsElement.dataset.recoveredFailedAlias = String(
    spritesText.metrics.recoveredFailedAlias,
  );
  metricsElement.dataset.renderer = spritesText.metrics.renderer;
  metricsElement.dataset.rendererResolution = String(
    spritesText.metrics.rendererResolution,
  );
  metricsElement.dataset.retainedHandles = String(
    spritesText.metrics.retainedHandles,
  );
  metricsElement.dataset.textResolution = String(
    spritesText.metrics.textResolution,
  );

  const destroy = (): void => {
    spritesText.destroy();
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
