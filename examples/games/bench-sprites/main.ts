import { bootGame, type GameApplication } from '../_kit/boot-game';
import {
  ACTIVE_PRESETS,
  BenchSpritesState,
  INACTIVE_COUNT,
  getConfiguredActiveCount,
  parseActiveQuery,
} from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_BENCH__?: {
      app?: GameApplication;
      ready: boolean;
      measured: boolean;
      destroyed: boolean;
      avgFps: number;
      minFps: number;
      activeCount: number;
      inactiveCount: number;
      drawCalls: number | null;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroyBtn = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

const activeCount = parseActiveQuery(window.location.search);

window.__FLIXEL_PIXI_BENCH__ = {
  ready: false,
  measured: false,
  destroyed: false,
  avgFps: 0,
  minFps: 0,
  activeCount,
  inactiveCount: INACTIVE_COUNT,
  drawCalls: null,
};

if (!host) throw new Error('Missing [data-testid="canvas-host"]');

function setPresetButtons(): void {
  const current = getConfiguredActiveCount();
  for (const n of ACTIVE_PRESETS) {
    const btn = document.querySelector<HTMLButtonElement>(
      `[data-active-preset="${n}"]`,
    );
    if (!btn) continue;
    btn.disabled = n === current;
    btn.setAttribute('aria-pressed', n === current ? 'true' : 'false');
  }
}

function goPreset(n: number): void {
  const url = new URL(window.location.href);
  url.searchParams.set('active', String(n));
  window.location.assign(url.toString());
}

for (const n of ACTIVE_PRESETS) {
  document
    .querySelector(`[data-active-preset="${n}"]`)
    ?.addEventListener('click', () => {
      goPreset(n);
    });
}

window.addEventListener('keydown', (event) => {
  if (event.key === '1') goPreset(2000);
  if (event.key === '2') goPreset(5000);
  if (event.key === '3') goPreset(10000);
});

setPresetButtons();

bootGame({
  host,
  initialState: BenchSpritesState,
  width: 640,
  height: 480,
  title: `Sprite Bench (${activeCount})`,
  showPreloader: false,
})
  .then((app) => {
    const syncHook = () => {
      const state = app.game.state;
      const measured =
        state instanceof BenchSpritesState ? state.measured : false;
      const count =
        state instanceof BenchSpritesState
          ? state.activeCount
          : getConfiguredActiveCount();
      window.__FLIXEL_PIXI_BENCH__ = {
        app,
        ready: true,
        measured,
        destroyed: false,
        avgFps: state instanceof BenchSpritesState ? state.avgFps : 0,
        minFps: state instanceof BenchSpritesState ? state.minFps : 0,
        activeCount: count,
        inactiveCount: INACTIVE_COUNT,
        drawCalls: null,
      };
    };
    syncHook();
    app.onFrame((frame) => {
      const gameState = app.game.state;
      if (gameState instanceof BenchSpritesState) {
        gameState.recordRenderedFrame(frame.elapsedMS);
      }
      syncHook();
    });

    if (status) {
      status.textContent = `Sprite bench ready (${activeCount} active)`;
      status.setAttribute('data-state', 'ready');
    }
    destroyBtn?.removeAttribute('disabled');
    destroyBtn?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_BENCH__ = {
        ready: false,
        measured: false,
        destroyed: true,
        avgFps: 0,
        minFps: 0,
        activeCount: getConfiguredActiveCount(),
        inactiveCount: INACTIVE_COUNT,
        drawCalls: null,
      };
      if (status) {
        status.textContent = 'Destroyed';
        status.setAttribute('data-state', 'destroyed');
      }
    });
  })
  .catch((err: unknown) => {
    if (status) {
      status.textContent = `Failed: ${String(err)}`;
      status.setAttribute('data-state', 'error');
    }
  });
