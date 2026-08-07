import { WebAudioBackend } from '../../../src';
import { bootGame, type GameApplication } from '../_kit/boot-game';
import { KenneyPlayState, preloadKenneyAssets } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_KENNEY__?: {
      app?: GameApplication;
      destroyed: boolean;
      ready: boolean;
      lives?: () => number;
      coins?: () => number;
      status?: () => 'play' | 'won' | 'lost';
      playerY?: () => number;
      onFloor?: () => boolean;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroyBtn = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

window.__FLIXEL_PIXI_KENNEY__ = { destroyed: false, ready: false };

if (!host) {
  throw new Error('Missing [data-testid="canvas-host"]');
}

const audioBackend = new WebAudioBackend();

preloadKenneyAssets()
  .then(() =>
    bootGame({
      host,
      initialState: KenneyPlayState,
      width: 640,
      height: 480,
      title: 'Kenney Platformer',
      showPreloader: true,
      audioBackend,
    }),
  )
  .then((app) => {
    void audioBackend.unlockAudio();

    window.__FLIXEL_PIXI_KENNEY__ = {
      app,
      destroyed: false,
      ready: true,
      lives() {
        const state = app.game.state;
        return state instanceof KenneyPlayState ? state.lives : 0;
      },
      coins() {
        const state = app.game.state;
        return state instanceof KenneyPlayState ? state.coinsCollected : 0;
      },
      status() {
        const state = app.game.state;
        return state instanceof KenneyPlayState ? state.status : 'play';
      },
      playerY() {
        const state = app.game.state;
        return state instanceof KenneyPlayState ? state.player.y : NaN;
      },
      onFloor() {
        const state = app.game.state;
        if (!(state instanceof KenneyPlayState)) return false;
        return (
          (state.player.touching & 0x1000) !== 0 ||
          (state.player.wasTouching & 0x1000) !== 0
        );
      },
    };

    if (status) {
      status.textContent = 'Kenney Platformer ready';
      status.setAttribute('data-state', 'ready');
    }
    destroyBtn?.removeAttribute('disabled');
    destroyBtn?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_KENNEY__ = { destroyed: true, ready: false };
      if (status) {
        status.textContent = 'Destroyed';
        status.setAttribute('data-state', 'destroyed');
      }
    });
  })
  .catch((err: unknown) => {
    console.error(err);
    if (status) {
      status.textContent = `Failed: ${String(err)}`;
      status.setAttribute('data-state', 'error');
    }
  });
