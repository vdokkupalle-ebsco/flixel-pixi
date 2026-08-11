import { bootGame, type GameApplication } from '../_kit/boot-game';
import { MeshShowcaseState, type MeshShowcaseSnapshot } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_MESHES__?: {
      app?: GameApplication;
      destroyed: boolean;
      ready: boolean;
      setAnimating?: (enabled: boolean) => void;
      snapshot?: () => MeshShowcaseSnapshot | null;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const toggle = document.querySelector<HTMLButtonElement>(
  '[data-action="animate"]',
);
const destroy = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);
if (!host) throw new Error('Missing canvas host.');
window.__FLIXEL_PIXI_MESHES__ = { destroyed: false, ready: false };

bootGame({
  backgroundColor: 0x07111f,
  fpsDisplay: true,
  height: 380,
  host,
  initialState: MeshShowcaseState,
  title: 'Water and Chain Meshes',
  width: 640,
})
  .then((app) => {
    const state = (): MeshShowcaseState | null =>
      app.game.state instanceof MeshShowcaseState ? app.game.state : null;
    window.__FLIXEL_PIXI_MESHES__ = {
      app,
      destroyed: false,
      ready: true,
      setAnimating(enabled) {
        state()?.setAnimating(enabled);
      },
      snapshot: () => state()?.snapshot() ?? null,
    };
    toggle?.removeAttribute('disabled');
    destroy?.removeAttribute('disabled');
    toggle?.addEventListener('click', () => {
      const current = state();
      if (!current) return;
      current.setAnimating(!current.animating);
      toggle.textContent = current.animating
        ? 'Pause geometry'
        : 'Animate geometry';
    });
    destroy?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_MESHES__ = { destroyed: true, ready: false };
      if (status) status.textContent = 'Destroyed';
    });
    if (status) {
      status.textContent = 'Mesh showcase ready';
      status.dataset.state = 'ready';
    }
  })
  .catch((cause: unknown) => {
    if (status) {
      status.textContent = `Failed: ${String(cause)}`;
      status.dataset.state = 'error';
    }
  });
