import {
  createBrowserGame,
  FlxG,
  type BrowserGameApplication,
} from 'flixel-pixi';

import {
  DINO_ATLAS,
  DINO_BUNDLE,
  DINO_IMAGE_ASSET,
  DINO_META_ASSET,
  GAME_HEIGHT,
  GAME_WIDTH,
} from './assets';
import { DinoRunnerState } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_DINO_RUNNER__?: {
      app?: BrowserGameApplication;
      ready: boolean;
      score?: () => number;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');

window.__FLIXEL_PIXI_DINO_RUNNER__ = { ready: false };

if (!host) throw new Error('Missing [data-testid="canvas-host"]');

createBrowserGame({
  assets: {
    bundles: [
      {
        assets: [
          {
            alias: DINO_IMAGE_ASSET,
            src: new URL('./assets/chrome-dinosaur-sprite.png', import.meta.url)
              .href,
          },
          {
            alias: DINO_META_ASSET,
            parser: 'text',
            src: new URL(
              './assets/chrome-dinosaur-sprite.json',
              import.meta.url,
            ).href,
          },
        ],
        name: DINO_BUNDLE,
      },
    ],
    initialBundles: DINO_BUNDLE,
  },
  backgroundColor: 0xf7f7f7,
  height: GAME_HEIGHT,
  host,
  initialState: DinoRunnerState,
  preload({ assets }) {
    FlxG.atlas.registerFromAssets(DINO_ATLAS, assets, {
      image: DINO_IMAGE_ASSET,
      meta: DINO_META_ASSET,
    });
  },
  width: GAME_WIDTH,
})
  .then((app) => {
    window.__FLIXEL_PIXI_DINO_RUNNER__ = {
      app,
      ready: true,
      score() {
        const state = app.game.state;
        return state instanceof DinoRunnerState ? Math.floor(state.score) : 0;
      },
    };
    if (status) {
      status.textContent = 'Ready — click the game, then jump';
      status.setAttribute('data-state', 'ready');
    }
    window.addEventListener('pagehide', () => app.destroy(), { once: true });
  })
  .catch((error: unknown) => {
    if (status) {
      status.textContent = `Failed: ${String(error)}`;
      status.setAttribute('data-state', 'error');
    }
  });
