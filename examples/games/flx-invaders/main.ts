import { createBrowserGame } from '../../../src';
import { ALIEN_ASSET, FlxInvadersState, SHIP_ASSET } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_INVADERS__?: {
      activePlayerBullets?: () => number;
      alienCount?: () => number;
      destroy?: () => void;
      destroyed: boolean;
      hitFirstAlien?: () => void;
      lose?: () => void;
      playerX?: () => number;
      ready: boolean;
      statusText?: () => string;
      win?: () => void;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroyButton = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);
const validateWinButton = document.querySelector<HTMLButtonElement>(
  '[data-action="validate-win"]',
);
const validateLossButton = document.querySelector<HTMLButtonElement>(
  '[data-action="validate-loss"]',
);
const reviewMode = new URLSearchParams(window.location.search).has('review');
if (host === null) throw new Error('Missing [data-testid="canvas-host"].');
window.__FLIXEL_PIXI_INVADERS__ = { destroyed: false, ready: false };

if (reviewMode) {
  validateWinButton?.removeAttribute('hidden');
  validateLossButton?.removeAttribute('hidden');
}

createBrowserGame({
  assets: {
    bundles: [
      {
        assets: [
          {
            alias: ALIEN_ASSET,
            src: new URL('./alien.png', import.meta.url).href,
          },
          {
            alias: SHIP_ASSET,
            src: new URL('./ship.png', import.meta.url).href,
          },
        ],
        name: 'flx-invaders',
      },
    ],
    initialBundles: 'flx-invaders',
  },
  backgroundColor: 0x000000,
  height: 240,
  host,
  initialState: FlxInvadersState,
  scaling: {
    mode: 'integer',
    pixelated: true,
  },
  title: 'Flx-Invaders compatibility validation',
  width: 320,
  zoom: 2,
})
  .then((app) => {
    const state = (): FlxInvadersState | null =>
      app.game.state instanceof FlxInvadersState ? app.game.state : null;
    window.__FLIXEL_PIXI_INVADERS__ = {
      activePlayerBullets: () =>
        state()?.playerBullets.members.filter((bullet) => bullet?.exists)
          .length ?? 0,
      alienCount: () => state()?.aliens.countLiving() ?? 0,
      destroy: () => app.destroy(),
      destroyed: false,
      hitFirstAlien() {
        const current = state();
        const alien = current?.aliens.getFirstExtant();
        const bullet = current?.playerBullets.recycle();
        if (
          alien !== null &&
          alien !== undefined &&
          bullet !== null &&
          bullet !== undefined
        ) {
          bullet.reset(alien.x, alien.y);
        }
      },
      lose: () => state()?.player.kill(),
      playerX: () => state()?.player.x ?? Number.NaN,
      ready: true,
      statusText: () => state()?.status.text ?? '',
      win: () => state()?.aliens.kill(),
    };
    status?.setAttribute('data-state', 'ready');
    if (status) status.textContent = 'Pinned Flx-Invaders source port ready';
    destroyButton?.removeAttribute('disabled');
    validateWinButton?.addEventListener('click', () => {
      window.__FLIXEL_PIXI_INVADERS__?.win?.();
    });
    validateLossButton?.addEventListener('click', () => {
      window.__FLIXEL_PIXI_INVADERS__?.lose?.();
    });
    destroyButton?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_INVADERS__ = { destroyed: true, ready: false };
      status?.setAttribute('data-state', 'destroyed');
      if (status) status.textContent = 'Destroyed';
    });
  })
  .catch((cause: unknown) => {
    status?.setAttribute('data-state', 'error');
    if (status) status.textContent = `Failed: ${String(cause)}`;
  });
