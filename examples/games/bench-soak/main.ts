import { bootGame } from '../_kit/boot-game';
import { SoakState } from './game';

const CYCLES = 30;
const RUN_MS = 750;

declare global {
  interface Window {
    __FLIXEL_PIXI_SOAK__?: {
      done: boolean;
      cycles: number;
      errors: string[];
      registeredSamples: number[];
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');

window.__FLIXEL_PIXI_SOAK__ = {
  done: false,
  cycles: 0,
  errors: [],
  registeredSamples: [],
};

if (!host) throw new Error('Missing [data-testid="canvas-host"]');
const canvasHost = host;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSoak(): Promise<void> {
  const errors: string[] = [];
  const registeredSamples: number[] = [];

  for (let i = 0; i < CYCLES; i += 1) {
    try {
      const app = await bootGame({
        host: canvasHost,
        initialState: SoakState,
        width: 640,
        height: 480,
        title: `Soak ${i + 1}`,
        showPreloader: false,
      });
      await sleep(RUN_MS);
      registeredSamples.push(app.renderer.registeredObjectCount);
      app.destroy();
      window.__FLIXEL_PIXI_SOAK__ = {
        done: false,
        cycles: i + 1,
        errors: [...errors],
        registeredSamples: [...registeredSamples],
      };
      if (status) {
        status.textContent = `Soak cycle ${i + 1}/${CYCLES}`;
        status.setAttribute('data-state', 'loading');
      }
    } catch (err) {
      errors.push(String(err));
      window.__FLIXEL_PIXI_SOAK__ = {
        done: true,
        cycles: i,
        errors: [...errors],
        registeredSamples: [...registeredSamples],
      };
      if (status) {
        status.textContent = `Soak failed: ${String(err)}`;
        status.setAttribute('data-state', 'error');
      }
      return;
    }
  }

  window.__FLIXEL_PIXI_SOAK__ = {
    done: true,
    cycles: CYCLES,
    errors,
    registeredSamples,
  };
  if (status) {
    status.textContent = 'Soak complete';
    status.setAttribute('data-state', 'ready');
  }
}

void runSoak();
