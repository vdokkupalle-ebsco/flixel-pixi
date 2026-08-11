import { bootGame, type GameApplication } from '../_kit/boot-game';
import { FilterShowcaseState, type FilterShowcaseSnapshot } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_FILTERS__?: {
      app?: GameApplication;
      destroyed: boolean;
      ready: boolean;
      setBlurEnabled?: (enabled: boolean) => void;
      setExplicitArea?: (enabled: boolean) => void;
      setShaderStrength?: (strength: number) => void;
      snapshot?: () => FilterShowcaseSnapshot | null;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const toggle = document.querySelector<HTMLButtonElement>(
  '[data-action="blur"]',
);
const shaderToggle = document.querySelector<HTMLButtonElement>(
  '[data-action="shader"]',
);
const areaToggle = document.querySelector<HTMLButtonElement>(
  '[data-action="area"]',
);
const destroy = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);
if (!host) throw new Error('Missing canvas host.');
window.__FLIXEL_PIXI_FILTERS__ = { destroyed: false, ready: false };

bootGame({
  backgroundColor: 0x07111f,
  fpsDisplay: true,
  height: 360,
  host,
  initialState: FilterShowcaseState,
  title: 'Filter Showcase',
  width: 640,
})
  .then((app) => {
    const state = (): FilterShowcaseState | null =>
      app.game.state instanceof FilterShowcaseState ? app.game.state : null;
    window.__FLIXEL_PIXI_FILTERS__ = {
      app,
      destroyed: false,
      ready: true,
      setBlurEnabled(enabled) {
        state()?.setBlurEnabled(enabled);
      },
      setExplicitArea(enabled) {
        state()?.setExplicitArea(enabled);
      },
      setShaderStrength(strength) {
        state()?.setShaderStrength(strength);
      },
      snapshot: () => state()?.snapshot() ?? null,
    };
    toggle?.removeAttribute('disabled');
    shaderToggle?.removeAttribute('disabled');
    areaToggle?.removeAttribute('disabled');
    destroy?.removeAttribute('disabled');
    toggle?.addEventListener('click', () => {
      const current = state();
      if (!current) return;
      current.setBlurEnabled(!current.blurEnabled);
      toggle.textContent = current.blurEnabled ? 'Disable blur' : 'Enable blur';
    });
    shaderToggle?.addEventListener('click', () => {
      const current = state();
      if (!current) return;
      const strength = current.shaderStrength > 0 ? 0 : 0.7;
      current.setShaderStrength(strength);
      shaderToggle.textContent =
        strength > 0 ? 'Disable shader' : 'Enable shader';
    });
    areaToggle?.addEventListener('click', () => {
      const current = state();
      if (!current) return;
      current.setExplicitArea(!current.explicitArea);
      areaToggle.textContent = current.explicitArea
        ? 'Use automatic bounds'
        : 'Use explicit area';
    });
    destroy?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_FILTERS__ = { destroyed: true, ready: false };
      if (status) status.textContent = 'Destroyed';
    });
    if (status) {
      status.textContent = 'Filter showcase ready';
      status.dataset.state = 'ready';
    }
  })
  .catch((cause: unknown) => {
    if (status) {
      status.textContent = `Failed: ${String(cause)}`;
      status.dataset.state = 'error';
    }
  });
