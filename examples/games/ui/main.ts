import { bootGame, type GameApplication } from '../_kit/boot-game';
import { UiDemoState, type UiDemoSnapshot } from './game';
import { preloadKenneyUiAtlas } from './kenney-ui';
import {
  MULTI_PAGE_FONT_ALIAS,
  multiPageFontDescriptor,
} from './multi-page-font';

declare global {
  interface Window {
    __FLIXEL_PIXI_UI__?: {
      app?: GameApplication;
      destroyed: boolean;
      ready: boolean;
      snapshot?: () => UiDemoSnapshot | null;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroyButton = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

window.__FLIXEL_PIXI_UI__ = { destroyed: false, ready: false };
if (!host) throw new Error('Missing [data-testid="canvas-host"]');

preloadKenneyUiAtlas()
  .then(() =>
    bootGame({
      assets: {
        bundles: [
          { assets: [multiPageFontDescriptor], name: MULTI_PAGE_FONT_ALIAS },
        ],
        initialBundles: MULTI_PAGE_FONT_ALIAS,
      },
      backgroundColor: 0x2c3e50,
      fpsDisplay: { mode: 'compact' },
      height: 320,
      host,
      initialState: UiDemoState,
      title: 'UI Authoring',
      width: 640,
    }),
  )
  .then((app) => {
    const getState = (): UiDemoState | null =>
      app.game.state instanceof UiDemoState ? app.game.state : null;
    window.__FLIXEL_PIXI_UI__ = {
      app,
      destroyed: false,
      ready: true,
      snapshot: () => getState()?.snapshot() ?? null,
    };
    destroyButton?.removeAttribute('disabled');
    destroyButton?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_UI__ = { destroyed: true, ready: false };
      if (status) {
        status.textContent = 'Destroyed';
        status.setAttribute('data-state', 'destroyed');
      }
    });
    if (status) {
      status.textContent =
        'UI demo ready — native controls and a two-page asset font';
      status.setAttribute('data-state', 'ready');
    }
  })
  .catch((cause: unknown) => {
    if (status) {
      status.textContent = `Failed: ${String(cause)}`;
      status.setAttribute('data-state', 'error');
    }
  });
