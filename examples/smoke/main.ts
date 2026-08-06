import { createSmokeApplication } from './smoke-application';

declare global {
  interface Window {
    __FLIXEL_PIXI_SMOKE__?: {
      destroyed: boolean;
      ready: boolean;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroyButton = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

if (host === null || status === null || destroyButton === null) {
  throw new Error('Smoke-test document is missing required elements.');
}

const state = { destroyed: false, ready: false };
window.__FLIXEL_PIXI_SMOKE__ = state;

try {
  const smokeApplication = await createSmokeApplication(host);
  state.ready = true;
  status.dataset.state = 'ready';
  status.textContent = `Ready: ${smokeApplication.app.renderer.name}`;
  destroyButton.disabled = false;

  const destroy = (): void => {
    smokeApplication.destroy();
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
