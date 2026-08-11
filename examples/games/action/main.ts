import { FlxG, WebAudioBackend } from '../../../src';
import { bootGame, type GameApplication } from '../_kit/boot-game';
import { ActionState } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_ACTION__?: {
      app?: GameApplication;
      destroyed: boolean;
      ready: boolean;
      cameraCount?: () => number;
      bursts?: () => number;
      burst?: () => void;
      record?: () => void;
      stopRecord?: () => void;
      playReplay?: () => void;
      playerPosition?: () => { x: number; y: number } | null;
      virtualStick?: () => {
        x: number;
        y: number;
        radius: number;
        pressed: boolean;
        xAxis: number;
        yAxis: number;
      } | null;
      gamepad?: () => {
        axis: number;
        index: number;
        pressed: boolean;
        uid: number;
      } | null;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroyBtn = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);
const burstBtn = document.querySelector<HTMLButtonElement>(
  '[data-action="burst"]',
);
const recordBtn = document.querySelector<HTMLButtonElement>(
  '[data-action="record"]',
);
const stopBtn = document.querySelector<HTMLButtonElement>(
  '[data-action="stop-record"]',
);
const playBtn = document.querySelector<HTMLButtonElement>(
  '[data-action="play"]',
);

window.__FLIXEL_PIXI_ACTION__ = { destroyed: false, ready: false };

if (!host) {
  throw new Error('Missing [data-testid="canvas-host"]');
}

const audioBackend = new WebAudioBackend();

bootGame({
  host,
  initialState: ActionState,
  title: 'Action Sample',
  audioBackend,
})
  .then((app) => {
    void audioBackend.unlockAudio();

    window.__FLIXEL_PIXI_ACTION__ = {
      app,
      destroyed: false,
      ready: true,
      cameraCount() {
        return FlxG.cameras.length;
      },
      bursts() {
        const state = app.game.state;
        return state instanceof ActionState ? state.bursts : 0;
      },
      burst() {
        const state = app.game.state;
        if (state instanceof ActionState) state.burst();
      },
      record() {
        FlxG.recordReplay(false);
      },
      stopRecord() {
        FlxG.stopRecording();
      },
      playReplay() {
        if (FlxG.vcr.replay) {
          FlxG.loadReplay(FlxG.vcr.replay, new ActionState());
          app.syncRenderer();
        }
      },
      playerPosition() {
        const state = app.game.state;
        return state instanceof ActionState
          ? { x: state.player.x, y: state.player.y }
          : null;
      },
      virtualStick() {
        const state = app.game.state;
        return state instanceof ActionState
          ? {
              radius: state.virtualStick.radius,
              pressed: state.virtualStick.pressed,
              x: state.virtualStick.x + state.virtualStick.radius,
              xAxis: state.virtualStick.xAxis,
              y: state.virtualStick.y + state.virtualStick.radius,
              yAxis: state.virtualStick.yAxis,
            }
          : null;
      },
      gamepad() {
        const pad = FlxG.gamepads.firstActive;
        return pad === null
          ? null
          : {
              axis: pad.getAxis(0),
              index: pad.index,
              pressed: pad.pressed(0),
              uid: pad.uid,
            };
      },
    };

    burstBtn?.removeAttribute('disabled');
    recordBtn?.removeAttribute('disabled');
    stopBtn?.removeAttribute('disabled');
    playBtn?.removeAttribute('disabled');
    destroyBtn?.removeAttribute('disabled');

    burstBtn?.addEventListener('click', () => {
      window.__FLIXEL_PIXI_ACTION__?.burst?.();
    });
    recordBtn?.addEventListener('click', () => {
      window.__FLIXEL_PIXI_ACTION__?.record?.();
    });
    stopBtn?.addEventListener('click', () => {
      window.__FLIXEL_PIXI_ACTION__?.stopRecord?.();
    });
    playBtn?.addEventListener('click', () => {
      window.__FLIXEL_PIXI_ACTION__?.playReplay?.();
    });
    destroyBtn?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_ACTION__ = { destroyed: true, ready: false };
      if (status) {
        status.textContent = 'Destroyed';
        status.setAttribute('data-state', 'destroyed');
      }
    });

    if (status) {
      status.textContent =
        'Action sample ready — use arrows/gamepad or the virtual analog stick';
      status.setAttribute('data-state', 'ready');
    }
  })
  .catch((err: unknown) => {
    if (status) {
      status.textContent = `Failed: ${String(err)}`;
      status.setAttribute('data-state', 'error');
    }
  });
