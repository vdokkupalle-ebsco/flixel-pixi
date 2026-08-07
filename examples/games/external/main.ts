import { FlxG } from '../../../src';
import { bootGame, type GameApplication } from '../_kit/boot-game';
import { ModeMenuState, ModePlayState } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_EXTERNAL__?: {
      app?: GameApplication;
      destroyed: boolean;
      ready: boolean;
      startPlay?: () => void;
      score?: () => number;
      enemyCount?: () => number;
      registeredCount?: () => number;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroyBtn = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

window.__FLIXEL_PIXI_EXTERNAL__ = { destroyed: false, ready: false };

if (!host) {
  throw new Error('Missing [data-testid="canvas-host"]');
}

bootGame({
  host,
  initialState: ModeMenuState,
  title: 'External Mode Lite',
})
  .then((app) => {
    window.__FLIXEL_PIXI_EXTERNAL__ = {
      app,
      destroyed: false,
      ready: true,
      startPlay() {
        FlxG.switchState(new ModePlayState());
        app.syncRenderer();
      },
      score() {
        const state = app.game.state;
        return state instanceof ModePlayState ? state.score : 0;
      },
      enemyCount() {
        const state = app.game.state;
        if (!(state instanceof ModePlayState)) return 0;
        return state.enemies.members.filter((e) => e !== null && e.exists).length;
      },
      registeredCount() {
        return app.renderer.registeredObjectCount;
      },
    };

    if (status) {
      status.textContent = 'External Mode Lite ready';
      status.setAttribute('data-state', 'ready');
    }
    destroyBtn?.removeAttribute('disabled');
    destroyBtn?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_EXTERNAL__ = { destroyed: true, ready: false };
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
