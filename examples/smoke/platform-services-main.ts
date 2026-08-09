import {
  createPlatformServicesApplication,
  type PlatformServicesApplication,
  type PlatformServicesMetrics,
} from './platform-services-application';

declare global {
  interface Window {
    __FLIXEL_PIXI_PLATFORM_SERVICES__?: {
      advance?: (steps: number) => void;
      destroyed: boolean;
      metrics?: PlatformServicesMetrics;
      ready: boolean;
      app?: PlatformServicesApplication;
    };
  }
}

const host = document.querySelector<HTMLElement>(
  '[data-testid="platform-services-canvas-host"]',
);
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const metricsElement = document.querySelector<HTMLElement>(
  '[data-testid="platform-services-metrics"]',
);
const destroyButton = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

// Control elements
const btnCoin = document.querySelector<HTMLButtonElement>('#btn-coin');
const btnSoundCoin =
  document.querySelector<HTMLButtonElement>('#btn-sound-coin');
const btnSoundJump =
  document.querySelector<HTMLButtonElement>('#btn-sound-jump');
const btnMusic = document.querySelector<HTMLButtonElement>('#btn-music');
const btnResetSave =
  document.querySelector<HTMLButtonElement>('#btn-reset-save');
const volSlider = document.querySelector<HTMLInputElement>('#vol-slider');
const volDisplay = document.querySelector<HTMLElement>('#vol-display');
const btnMute = document.querySelector<HTMLButtonElement>('#btn-mute');

if (
  host === null ||
  status === null ||
  metricsElement === null ||
  destroyButton === null
) {
  throw new Error('Platform services document is missing required elements.');
}

const state: NonNullable<Window['__FLIXEL_PIXI_PLATFORM_SERVICES__']> = {
  destroyed: false,
  ready: false,
};
window.__FLIXEL_PIXI_PLATFORM_SERVICES__ = state;

try {
  const app: PlatformServicesApplication =
    await createPlatformServicesApplication(host);
  state.advance = (steps) => app.advance(steps);
  state.metrics = app.metrics;
  state.app = app;
  state.ready = true;
  status.dataset.state = 'ready';
  status.textContent = 'Platform services demo ready';
  destroyButton.disabled = false;

  const updateMetricsUI = () => {
    const m = app.metrics;
    for (const [key, value] of Object.entries(m)) {
      metricsElement.dataset[key] = String(value);
    }
  };

  updateMetricsUI();

  // Wire interactive UI handlers
  btnCoin?.addEventListener('click', () => {
    app.addCoin();
    app.playCoinSound();
    updateMetricsUI();
  });

  btnSoundCoin?.addEventListener('click', () => {
    app.playCoinSound();
  });

  btnSoundJump?.addEventListener('click', () => {
    app.playJumpSound();
  });

  btnMusic?.addEventListener('click', () => {
    app.toggleMusic();
  });

  btnResetSave?.addEventListener('click', () => {
    app.resetCoins();
    updateMetricsUI();
  });

  volSlider?.addEventListener('input', (e) => {
    const val = Number((e.target as HTMLInputElement).value);
    if (volDisplay) volDisplay.textContent = `${val}%`;
    app.setVolume(val / 100);
    updateMetricsUI();
  });

  btnMute?.addEventListener('click', () => {
    const isMuted = app.toggleMute();
    if (btnMute) btnMute.textContent = isMuted ? '🔇 Mute: ON' : '🔇 Mute: OFF';
    updateMetricsUI();
  });

  const destroy = (): void => {
    app.destroy();
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
