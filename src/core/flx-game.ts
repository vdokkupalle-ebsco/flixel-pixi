import {
  FixedStepAccumulator,
  type FixedStepAdvanceResult,
} from './fixed-step-accumulator';
import { FlxContext, type FlxStateRuntime } from './flx-context';
import { FlxG } from './flx-g';
import { DebugPathDisplay } from '../plugin/debug-path-display';
import { TimerManager } from '../plugin/timer-manager';
import {
  FlxInputManager,
  type FlxInputManagerOptions,
} from '../input/flx-input-manager';
import type { FlxState, FlxStateConstructor } from './flx-state';

/** Headless Phase 2 game controller and atomic state boundary. @public */
export class FlxGame implements FlxStateRuntime {
  readonly context: FlxContext;
  readonly zoom: number;
  readonly flashFramerate: number;
  readonly updateFramerate: number;
  forceDebugger = false;
  useSoundHotKeys = true;
  readonly useSystemCursor: boolean;
  readonly input: FlxInputManager;

  readonly #clock: FixedStepAccumulator;
  #destroyed = false;
  #requestedState: FlxState | null = null;
  #state: FlxState | null = null;

  constructor(
    gameSizeX: number,
    gameSizeY: number,
    initialState: FlxStateConstructor,
    zoom = 1,
    gameFramerate = 60,
    flashFramerate = 30,
    useSystemCursor = false,
    inputOptions: FlxInputManagerOptions = {},
  ) {
    if (!Number.isFinite(zoom) || zoom <= 0) {
      throw new RangeError('zoom must be a positive finite number.');
    }
    if (!Number.isFinite(gameFramerate) || gameFramerate <= 0) {
      throw new RangeError('gameFramerate must be a positive finite number.');
    }

    this.zoom = zoom;
    this.flashFramerate = flashFramerate;
    this.updateFramerate = gameFramerate;
    this.useSystemCursor = useSystemCursor;
    this.context = new FlxContext(gameSizeX, gameSizeY);
    this.context.attachRuntime(this);
    FlxG.installContext(this.context);
    this.input = new FlxInputManager(this.context, inputOptions);
    this.context.addPlugin(new DebugPathDisplay());
    this.context.addPlugin(new TimerManager());
    this.#clock = new FixedStepAccumulator({ stepSeconds: 1 / gameFramerate });
    this.#requestedState = new initialState();
  }

  get state(): FlxState | null {
    return this.#state;
  }

  get interpolationAlpha(): number {
    return this.#clock.alpha;
  }

  requestState(state: FlxState): void {
    this.#assertUsable();
    this.#requestedState = state;
  }

  resetState(): void {
    this.#assertUsable();
    if (this.#state === null) return;
    const constructor = this.#state.constructor as FlxStateConstructor;
    this.#requestedState = new constructor();
  }

  /** Executes one authoritative simulation step. */
  step(stepSeconds = 1 / this.updateFramerate): void {
    this.#assertUsable();
    if (!Number.isFinite(stepSeconds) || stepSeconds <= 0) {
      throw new RangeError('stepSeconds must be a positive finite number.');
    }

    this.#commitStateChange();
    this.input.updateInput();
    this.context.elapsed = stepSeconds * this.context.timeScale;
    if (!this.context.paused) {
      this.context.updatePlugins();
      this.#state?.update();
      this.context.updateCameras();
    }
  }

  /** Feeds browser-clock time through the deterministic fixed-step loop. */
  advance(elapsedSeconds: number): FixedStepAdvanceResult {
    this.#assertUsable();
    return this.#clock.advance(elapsedSeconds, (stepSeconds) => {
      this.step(stepSeconds);
    });
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#state?.destroy();
    if (this.#requestedState !== null && this.#requestedState !== this.#state) {
      this.#requestedState.destroy();
    }
    this.#state = null;
    this.#requestedState = null;
    this.input.destroy();
    this.context.destroyPlugins();
    this.context.clearServices();
    this.context.detachRuntime(this);
    FlxG.clearContext(this.context);
  }

  #commitStateChange(): void {
    const nextState = this.#requestedState;
    if (nextState === null || nextState === this.#state) {
      this.#requestedState = null;
      return;
    }

    this.#requestedState = null;
    const previousState = this.#state;
    this.context.getPlugin(TimerManager)?.clear();
    previousState?.destroy();
    this.#state = nextState;

    try {
      nextState.create();
    } catch (error: unknown) {
      nextState.destroy();
      this.#state = null;
      throw error;
    }
  }

  #assertUsable(): void {
    if (this.#destroyed) throw new Error('FlxGame has been destroyed.');
  }
}
