import { WebAudioBackend } from '../../../src';
import { bootGame, type GameApplication } from '../_kit/boot-game';
import { PlatformerState } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_PLATFORMER__?: {
      app?: GameApplication;
      destroyed: boolean;
      ready: boolean;
      playerY?: () => number;
      onFloor?: () => boolean;
      score?: () => number;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroyBtn = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

window.__FLIXEL_PIXI_PLATFORMER__ = { destroyed: false, ready: false };

if (!host) {
  throw new Error('Missing [data-testid="canvas-host"]');
}

const audioBackend = new WebAudioBackend();

bootGame({
  host,
  initialState: PlatformerState,
  width: 640,
  height: 480,
  title: 'Platformer Sample',
  audioBackend,
})
  .then((app) => {
    void audioBackend.unlockAudio();

    window.__FLIXEL_PIXI_PLATFORMER__ = {
      app,
      destroyed: false,
      ready: true,
      playerY() {
        const state = app.game.state;
        if (state instanceof PlatformerState) return state.player.y;
        return NaN;
      },
      onFloor() {
        const state = app.game.state;
        if (!(state instanceof PlatformerState)) return false;
        return (
          (state.player.touching & 0x1000) !== 0 ||
          (state.player.wasTouching & 0x1000) !== 0
        );
      },
      score() {
        const state = app.game.state;
        if (state instanceof PlatformerState) return state.score;
        return 0;
      },
    };
    if (status) {
      status.textContent = 'Platformer sample ready';
      status.setAttribute('data-state', 'ready');
    }
    destroyBtn?.removeAttribute('disabled');
    destroyBtn?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_PLATFORMER__ = { destroyed: true, ready: false };
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
