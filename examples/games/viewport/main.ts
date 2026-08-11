import {
  type FlxBrowserScaleMode,
  type FlxBrowserViewportSnapshot,
} from '../../../src';
import { bootGame, type GameApplication } from '../_kit/boot-game';
import { ViewportDemoState, type ViewportDemoSnapshot } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_VIEWPORT__?: {
      app?: GameApplication;
      destroyed: boolean;
      latest?: FlxBrowserViewportSnapshot;
      ready: boolean;
      snapshot?: () => ViewportDemoSnapshot | null;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const diagnostics = document.querySelector<HTMLElement>(
  '[data-testid="viewport-diagnostics"]',
);
const modeSelect =
  document.querySelector<HTMLSelectElement>('[data-scale-mode]');
const alignXSelect =
  document.querySelector<HTMLSelectElement>('[data-align-x]');
const alignYSelect =
  document.querySelector<HTMLSelectElement>('[data-align-y]');
const safePadding = document.querySelector<HTMLInputElement>(
  '[data-safe-padding]',
);
const fullscreenButton = document.querySelector<HTMLButtonElement>(
  '[data-action="fullscreen"]',
);

if (!host) throw new Error('Missing [data-testid="canvas-host"]');
const canvasHost = host;
window.__FLIXEL_PIXI_VIEWPORT__ = { destroyed: false, ready: false };

void bootGame({
  backgroundColor: 0x07111f,
  height: 360,
  host: canvasHost,
  initialState: ViewportDemoState,
  scaling: { mode: 'fit', safePadding: 16 },
  title: 'Viewport layout',
  width: 640,
})
  .then((app) => mountDemo(app))
  .catch((cause: unknown) => {
    if (status) {
      status.dataset.state = 'error';
      status.textContent = `Failed: ${String(cause)}`;
    }
  });

function mountDemo(app: GameApplication): void {
  const getState = (): ViewportDemoState | null =>
    app.game.state instanceof ViewportDemoState ? app.game.state : null;
  const unsubscribe = app.viewport.onChange((snapshot) => {
    getState()?.queueViewport(snapshot);
    window.__FLIXEL_PIXI_VIEWPORT__ = {
      app,
      destroyed: false,
      latest: snapshot,
      ready: true,
      snapshot: () => getState()?.snapshot() ?? null,
    };
    if (diagnostics) {
      const visible = snapshot.visibleRect;
      const safe = snapshot.safeRect;
      diagnostics.textContent = [
        `${snapshot.mode} · ${snapshot.hostWidth}×${snapshot.hostHeight} CSS px`,
        `scale ${snapshot.scale.toFixed(3)} · DPR ${snapshot.devicePixelRatio.toFixed(2)}`,
        `visible ${formatRect(visible)} · safe ${formatRect(safe)}`,
      ].join(' | ');
      diagnostics.dataset.mode = snapshot.mode;
    }
    if (fullscreenButton) {
      fullscreenButton.textContent = snapshot.fullscreen
        ? 'Exit fullscreen'
        : 'Fullscreen';
    }
  });

  modeSelect?.addEventListener('change', () => {
    app.viewport.setMode(modeSelect.value as FlxBrowserScaleMode);
  });
  const updateAlignment = (): void => {
    app.viewport.setAlignment(
      Number(alignXSelect?.value ?? 0.5),
      Number(alignYSelect?.value ?? 0.5),
    );
  };
  alignXSelect?.addEventListener('change', updateAlignment);
  alignYSelect?.addEventListener('change', updateAlignment);
  safePadding?.addEventListener('input', () => {
    app.viewport.setSafePadding(Number(safePadding.value));
  });
  fullscreenButton?.addEventListener('click', () => {
    void app.viewport.toggleFullscreen();
  });
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    '[data-host-width][data-host-height]',
  )) {
    button.addEventListener('click', () => {
      canvasHost.style.width = button.dataset.hostWidth ?? '100%';
      canvasHost.style.height = button.dataset.hostHeight ?? '420px';
      app.viewport.refresh();
    });
  }

  document
    .querySelector<HTMLButtonElement>('[data-action="destroy"]')
    ?.addEventListener('click', () => {
      unsubscribe();
      app.destroy();
      window.__FLIXEL_PIXI_VIEWPORT__ = {
        destroyed: true,
        ready: false,
      };
      if (status) {
        status.dataset.state = 'destroyed';
        status.textContent = 'Destroyed';
      }
    });
  if (status) {
    status.dataset.state = 'ready';
    status.textContent = 'Viewport API ready — blue is visible, green is safe';
  }
}

function formatRect(rect: FlxBrowserViewportSnapshot['safeRect']): string {
  return `${rect.x.toFixed(1)},${rect.y.toFixed(1)} ${rect.width.toFixed(1)}×${rect.height.toFixed(1)}`;
}
