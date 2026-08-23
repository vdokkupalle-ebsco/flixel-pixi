import { bootGame, type GameApplication } from '../_kit/boot-game';
import {
  ParticleEffectState,
  registerCampfireDocument,
  type ParticleEffectSnapshot,
} from './game';

const BUNDLE = 'particle-effect-demo';
const DOCUMENT = 'campfire-effect-document';

declare global {
  interface Window {
    __FLIXEL_PIXI_PARTICLE_EFFECT__?: {
      app?: GameApplication;
      destroyed: boolean;
      ready: boolean;
      pause?: () => void;
      reset?: () => void;
      snapshot?: () => ParticleEffectSnapshot | null;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const pauseButton = document.querySelector<HTMLButtonElement>(
  '[data-action="pause"]',
);
const resetButton = document.querySelector<HTMLButtonElement>(
  '[data-action="reset"]',
);
const destroyButton = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

window.__FLIXEL_PIXI_PARTICLE_EFFECT__ = {
  destroyed: false,
  ready: false,
};
if (!host) throw new Error('Missing [data-testid="canvas-host"]');

bootGame({
  assets: {
    bundles: [
      {
        assets: [
          {
            alias: DOCUMENT,
            parser: 'text',
            src: new URL('./campfire-effect.json', import.meta.url).href,
          },
          {
            alias: 'campfire-flame',
            src: new URL('./flame.svg', import.meta.url).href,
          },
          {
            alias: 'campfire-ember',
            src: new URL('./ember.svg', import.meta.url).href,
          },
          {
            alias: 'campfire-smoke',
            src: new URL('./smoke.svg', import.meta.url).href,
          },
        ],
        name: BUNDLE,
      },
    ],
    initialBundles: BUNDLE,
  },
  backgroundColor: 0x07111f,
  height: 360,
  host,
  initialState: ParticleEffectState,
  preload({ assets }) {
    const source = assets.get<string>(DOCUMENT);
    if (source === undefined) throw new Error('Missing campfire effect JSON.');
    registerCampfireDocument(JSON.parse(source) as unknown);
  },
  title: 'Composed Particle Effect',
})
  .then((app) => {
    const getState = (): ParticleEffectState | null =>
      app.game.state instanceof ParticleEffectState ? app.game.state : null;

    const updatePauseLabel = (): void => {
      const state = getState();
      if (pauseButton)
        pauseButton.textContent = state?.paused ? 'Resume' : 'Pause';
    };

    window.__FLIXEL_PIXI_PARTICLE_EFFECT__ = {
      app,
      destroyed: false,
      ready: true,
      pause() {
        const state = getState();
        if (state === null) return;
        state.setPaused(!state.paused);
        updatePauseLabel();
      },
      reset() {
        getState()?.resetEffect();
        updatePauseLabel();
      },
      snapshot: () => getState()?.snapshot() ?? null,
    };

    pauseButton?.removeAttribute('disabled');
    resetButton?.removeAttribute('disabled');
    destroyButton?.removeAttribute('disabled');
    pauseButton?.addEventListener('click', () => {
      window.__FLIXEL_PIXI_PARTICLE_EFFECT__?.pause?.();
    });
    resetButton?.addEventListener('click', () => {
      window.__FLIXEL_PIXI_PARTICLE_EFFECT__?.reset?.();
    });
    destroyButton?.addEventListener('click', () => {
      app.destroy();
      void app.assets.unloadBundle(BUNDLE);
      window.__FLIXEL_PIXI_PARTICLE_EFFECT__ = {
        destroyed: true,
        ready: false,
      };
      if (status) {
        status.textContent = 'Destroyed';
        status.setAttribute('data-state', 'destroyed');
      }
    });
    if (status) {
      status.textContent = 'Exported effect and texture bundle loaded';
      status.setAttribute('data-state', 'ready');
    }
  })
  .catch((cause: unknown) => {
    if (status) {
      status.textContent = `Failed: ${String(cause)}`;
      status.setAttribute('data-state', 'error');
    }
  });
