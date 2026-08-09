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
      playerX?: () => number;
      gamepad?: () => { index: number; uid: number } | null;
      onFloor?: () => boolean;
      loadingStages?: () => string[];
      preloadAttempts?: () => number;
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
const loadingStages: string[] = [];
const failFirstPreload = new URLSearchParams(window.location.search).has(
  'fail-preload-once',
);
let preloadAttempts = 0;

bootGame({
  host,
  initialState: KenneyPlayState,
  width: 640,
  height: 480,
  updateFramerate: 60,
  renderFramerate: 60,
  fpsDisplay: {
    position: 'top-right',
    theme: {
      good: '#4ade80',
      warning: '#facc15',
    },
  },
  audioBackend,
  preloader: {
    title: 'Kenney Platformer',
    subtitle: 'Preparing the platforming adventure…',
    className: 'kenney-preloader',
    theme: {
      accent: '#facc15',
      background: '#172554',
    },
  },
  onLoadingSnapshot(snapshot) {
    loadingStages.push(snapshot.stage);
  },
  async preload({ report }) {
    preloadAttempts += 1;
    if (failFirstPreload && preloadAttempts === 1) {
      report(null, 'Simulating an asset failure…');
      throw new Error('Simulated startup asset failure.');
    }
    report(null, 'Loading platformer artwork…');
    await preloadKenneyAssets();
    report(1, 'Artwork ready.');
  },
})
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
      playerX() {
        const state = app.game.state;
        return state instanceof KenneyPlayState ? state.player.x : NaN;
      },
      gamepad() {
        const gamepad = app.game.input.gamepads.firstActive;
        return gamepad === null
          ? null
          : { index: gamepad.index, uid: gamepad.uid };
      },
      onFloor() {
        const state = app.game.state;
        if (!(state instanceof KenneyPlayState)) return false;
        return (
          (state.player.touching & 0x1000) !== 0 ||
          (state.player.wasTouching & 0x1000) !== 0
        );
      },
      loadingStages() {
        return [...loadingStages];
      },
      preloadAttempts() {
        return preloadAttempts;
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
