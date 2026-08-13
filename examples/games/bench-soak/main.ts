import { bootGame } from '../_kit/boot-game';
import { WebAudioBackend } from '../../../src';
import { SoakState } from './game';

const CYCLES = 30;
const RUN_MS = 750;
const requestedDurationMs = Number(
  new URLSearchParams(window.location.search).get('durationMs'),
);
const DURATION_MS =
  Number.isFinite(requestedDurationMs) && requestedDurationMs > 0
    ? requestedDurationMs
    : null;
const SILENT_AUDIO =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

interface ResourceCounts {
  audioContexts: number;
  audioHandles: number;
  canvases: number;
  listeners: number;
  renderHandles: number;
  renderTargetBytes: number;
  renderTargets: number;
  textureSources: number;
}

interface ResourceSample {
  active: ResourceCounts;
  released: ResourceCounts;
}

declare global {
  interface Window {
    __FLIXEL_PIXI_SOAK__?: {
      done: boolean;
      elapsedMs: number;
      cycles: number;
      errors: string[];
      registeredSamples: number[];
      resourceSamples: ResourceSample[];
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');

window.__FLIXEL_PIXI_SOAK__ = {
  done: false,
  elapsedMs: 0,
  cycles: 0,
  errors: [],
  registeredSamples: [],
  resourceSamples: [],
};

if (!host) throw new Error('Missing [data-testid="canvas-host"]');
const canvasHost = host;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function trackEventListeners(): { readonly activeCount: number } {
  const listeners: {
    capture: boolean;
    listener: EventListenerOrEventListenerObject;
    target: EventTarget;
    type: string;
  }[] = [];
  const add = EventTarget.prototype.addEventListener;
  const remove = EventTarget.prototype.removeEventListener;
  const captureOf = (options?: boolean | AddEventListenerOptions): boolean =>
    typeof options === 'boolean' ? options : (options?.capture ?? false);

  EventTarget.prototype.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    if (
      listener !== null &&
      !listeners.some(
        (entry) =>
          entry.target === this &&
          entry.type === type &&
          entry.listener === listener &&
          entry.capture === captureOf(options),
      )
    ) {
      listeners.push({
        capture: captureOf(options),
        listener,
        target: this,
        type,
      });
    }
    add.call(this, type, listener, options);
  };
  EventTarget.prototype.removeEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void {
    const index = listeners.findIndex(
      (entry) =>
        entry.target === this &&
        entry.type === type &&
        entry.listener === listener &&
        entry.capture === captureOf(options),
    );
    if (index >= 0) listeners.splice(index, 1);
    remove.call(this, type, listener, options);
  };

  return {
    get activeCount(): number {
      return listeners.length;
    },
  };
}

async function runSoak(): Promise<void> {
  const errors: string[] = [];
  const registeredSamples: number[] = [];
  const resourceSamples: ResourceSample[] = [];
  const listenerTracker = trackEventListeners();
  const startedAt = performance.now();

  for (
    let i = 0;
    DURATION_MS === null
      ? i < CYCLES
      : performance.now() - startedAt < DURATION_MS;
    i += 1
  ) {
    try {
      const audioBackend = new WebAudioBackend();
      const app = await bootGame({
        audioBackend,
        host: canvasHost,
        initialState: SoakState,
        width: 640,
        height: 480,
        title: `Soak ${i + 1}`,
        showPreloader: false,
      });
      await sleep(RUN_MS);
      audioBackend.createSound(SILENT_AUDIO, false);
      const state = app.game.state;
      if (!(state instanceof SoakState)) {
        throw new Error('Soak state was not committed.');
      }
      const activeState = state.resourceSnapshot();
      registeredSamples.push(app.renderer.registeredObjectCount);
      const active: ResourceCounts = {
        audioContexts: audioBackend.diagnosticContextActive ? 1 : 0,
        audioHandles: audioBackend.diagnosticHandleCount,
        canvases: canvasHost.querySelectorAll('canvas').length,
        listeners: listenerTracker.activeCount,
        renderHandles: activeState.liveRenderHandles,
        renderTargetBytes: app.renderer.renderTargetBytes,
        renderTargets: app.renderer.cameraCount,
        textureSources: activeState.liveTextureSources,
      };
      app.destroy();
      await sleep(0);
      const releasedState = state.resourceSnapshot();
      resourceSamples.push({
        active,
        released: {
          audioContexts: audioBackend.diagnosticContextActive ? 1 : 0,
          audioHandles: audioBackend.diagnosticHandleCount,
          canvases: canvasHost.querySelectorAll('canvas').length,
          listeners: listenerTracker.activeCount,
          renderHandles: releasedState.liveRenderHandles,
          renderTargetBytes: app.renderer.renderTargetBytes,
          renderTargets: app.renderer.cameraCount,
          textureSources: releasedState.liveTextureSources,
        },
      });
      window.__FLIXEL_PIXI_SOAK__ = {
        done: false,
        elapsedMs: performance.now() - startedAt,
        cycles: i + 1,
        errors: [...errors],
        registeredSamples: [...registeredSamples],
        resourceSamples: [...resourceSamples],
      };
      if (status) {
        status.textContent =
          DURATION_MS === null
            ? `Soak cycle ${i + 1}/${CYCLES}`
            : `Soak ${(performance.now() - startedAt) / 60_000} / ${DURATION_MS / 60_000} minutes`;
        status.setAttribute('data-state', 'loading');
      }
    } catch (err) {
      errors.push(String(err));
      window.__FLIXEL_PIXI_SOAK__ = {
        done: true,
        elapsedMs: performance.now() - startedAt,
        cycles: i,
        errors: [...errors],
        registeredSamples: [...registeredSamples],
        resourceSamples: [...resourceSamples],
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
    elapsedMs: performance.now() - startedAt,
    cycles: resourceSamples.length,
    errors,
    registeredSamples,
    resourceSamples,
  };
  if (status) {
    status.textContent = 'Soak complete';
    status.setAttribute('data-state', 'ready');
  }
}

void runSoak();
