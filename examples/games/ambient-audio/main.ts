import { WebAudioBackend, type FlxSoundOffscreenBehavior } from '../../../src';
import { bootGame, type GameApplication } from '../_kit/boot-game';
import {
  AmbientAudioState,
  preloadAmbientAudio,
  type AmbientAudioSnapshot,
} from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_AMBIENT_AUDIO__?: {
      app?: GameApplication;
      destroyed: boolean;
      ready: boolean;
      setAutoTour?: (enabled: boolean) => void;
      setOffscreen?: (behavior: FlxSoundOffscreenBehavior) => void;
      setPlayerX?: (x: number) => void;
      snapshot?: () => AmbientAudioSnapshot | null;
      toggleMute?: () => boolean;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const tourButton = document.querySelector<HTMLButtonElement>(
  '[data-action="tour"]',
);
const muteButton = document.querySelector<HTMLButtonElement>(
  '[data-action="mute"]',
);
const offscreenSelect =
  document.querySelector<HTMLSelectElement>('[data-offscreen]');
const destroyButton = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

window.__FLIXEL_PIXI_AMBIENT_AUDIO__ = { destroyed: false, ready: false };
if (!host) throw new Error('Missing [data-testid="canvas-host"]');

const audioBackend = new WebAudioBackend();
bootGame({
  audioBackend,
  host,
  initialState: AmbientAudioState,
  title: 'Ambient audio',
  width: 640,
  height: 360,
  fpsDisplay: true,
  async preload({ report }) {
    report(0, 'Preloading ambient sounds…');
    await preloadAmbientAudio((progress) => {
      report(
        progress,
        `Preloading ambient sounds… ${Math.round(progress * 100)}%`,
      );
    });
    report(1, 'Ambient sounds ready.');
  },
})
  .then((app) => {
    const state = (): AmbientAudioState | null =>
      app.game.state instanceof AmbientAudioState ? app.game.state : null;
    window.__FLIXEL_PIXI_AMBIENT_AUDIO__ = {
      app,
      destroyed: false,
      ready: true,
      setAutoTour(enabled) {
        state()?.setAutoTour(enabled);
      },
      setOffscreen(behavior) {
        state()?.setOffscreen(behavior);
      },
      setPlayerX(x) {
        state()?.setPlayerX(x);
      },
      snapshot() {
        return state()?.snapshot() ?? null;
      },
      toggleMute() {
        return state()?.toggleMute() ?? false;
      },
    };

    for (const control of [
      tourButton,
      muteButton,
      offscreenSelect,
      destroyButton,
    ]) {
      control?.removeAttribute('disabled');
    }
    tourButton?.addEventListener('click', () => {
      const current = state();
      if (!current) return;
      current.setAutoTour(!current.autoTour);
      tourButton.textContent = current.autoTour ? 'Pause tour' : 'Resume tour';
    });
    muteButton?.addEventListener('click', () => {
      const muted = state()?.toggleMute() ?? false;
      muteButton.textContent = muted ? 'Unmute ambience' : 'Mute ambience';
    });
    offscreenSelect?.addEventListener('change', () => {
      state()?.setOffscreen(offscreenSelect.value as FlxSoundOffscreenBehavior);
    });
    destroyButton?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_AMBIENT_AUDIO__ = { destroyed: true, ready: false };
      if (status) {
        status.textContent = 'Destroyed';
        status.setAttribute('data-state', 'destroyed');
      }
    });

    if (status) {
      status.textContent =
        'Ready — click once to unlock audio, then follow the auto tour';
      status.setAttribute('data-state', 'ready');
    }
  })
  .catch((error: unknown) => {
    if (status) {
      status.textContent = `Failed: ${String(error)}`;
      status.setAttribute('data-state', 'error');
    }
  });
