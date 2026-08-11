import { FlxG } from '../../../src';
import { bootGame, type GameApplication } from '../_kit/boot-game';
import {
  ATLAS_BACKGROUND_ASSET,
  AtlasDemoState,
  type AtlasDemoSnapshot,
} from './game';

const BUNDLE = 'texturepacker-demo';
const IMAGE = 'texturepacker-demo-image';
const META = 'texturepacker-demo-meta';

declare global {
  interface Window {
    __FLIXEL_PIXI_ATLAS__?: {
      app?: GameApplication;
      destroyed: boolean;
      ready: boolean;
      snapshot?: () => AtlasDemoSnapshot | null;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroyButton = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

window.__FLIXEL_PIXI_ATLAS__ = { destroyed: false, ready: false };
if (!host) throw new Error('Missing [data-testid="canvas-host"]');

bootGame({
  assets: {
    bundles: [
      {
        assets: [
          {
            alias: ATLAS_BACKGROUND_ASSET,
            src: new URL('./background.png', import.meta.url).href,
          },
          {
            alias: IMAGE,
            src: new URL('./atlas.png', import.meta.url).href,
          },
          {
            alias: META,
            parser: 'text',
            src: new URL('./atlas.json', import.meta.url).href,
          },
        ],
        name: BUNDLE,
      },
    ],
    initialBundles: BUNDLE,
  },
  backgroundColor: 0x07111f,
  fpsDisplay: true,
  height: 360,
  host,
  initialState: AtlasDemoState,
  preload({ assets }) {
    FlxG.atlas.registerFromAssets(BUNDLE, assets, {
      image: IMAGE,
      meta: META,
    });
  },
  title: 'TexturePacker Atlas',
})
  .then((app) => {
    const getState = (): AtlasDemoState | null =>
      app.game.state instanceof AtlasDemoState ? app.game.state : null;

    window.__FLIXEL_PIXI_ATLAS__ = {
      app,
      destroyed: false,
      ready: true,
      snapshot: () => getState()?.snapshot() ?? null,
    };
    destroyButton?.removeAttribute('disabled');
    destroyButton?.addEventListener('click', () => {
      FlxG.atlas.remove(BUNDLE);
      app.destroy();
      void app.assets.unloadBundle(BUNDLE);
      window.__FLIXEL_PIXI_ATLAS__ = { destroyed: true, ready: false };
      if (status) {
        status.textContent = 'Destroyed';
        status.setAttribute('data-state', 'destroyed');
      }
    });
    if (status) {
      status.textContent = 'Bundle-backed TexturePacker atlas ready';
      status.setAttribute('data-state', 'ready');
    }
  })
  .catch((cause: unknown) => {
    if (status) {
      status.textContent = `Failed: ${String(cause)}`;
      status.setAttribute('data-state', 'error');
    }
  });
