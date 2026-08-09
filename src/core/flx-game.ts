import {
  FixedStepAccumulator,
  type FixedStepAdvanceResult,
} from './fixed-step-accumulator';
import { FlxContext, type FlxStateRuntime } from './flx-context';
import { FlxG } from './flx-g';
import { DebugPathDisplay } from '../plugin/debug-path-display';
import { TimerManager } from '../plugin/timer-manager';
import { FlxTweenManager } from '../tweens/flx-tween-manager';
import {
  FlxInputManager,
  type FlxInputManagerOptions,
} from '../input/flx-input-manager';
import { FlxAudioManager } from '../audio/flx-audio-manager';
import type { FlxAudioBackend } from '../audio/flx-audio-backend';
import { NullAudioBackend } from '../audio/null-audio-backend';
import type { FlxState, FlxStateConstructor } from './flx-state';
import { DebugChannel } from '../debugger/debug-channel';
import { FlxLog, FLX_LOG_SERVICE } from '../debugger/flx-log';
import { FlxWatch, FLX_WATCH_SERVICE } from '../debugger/flx-watch';

/** Headless game controller and atomic state boundary. @public */
export class FlxGame implements FlxStateRuntime {
  readonly context: FlxContext;
  readonly zoom: number;
  readonly flashFramerate: number;
  readonly updateFramerate: number;
  forceDebugger = false;
  useSoundHotKeys = true;
  readonly useSystemCursor: boolean;
  readonly input: FlxInputManager;
  readonly audio: FlxAudioManager;

  /** Typed event bus for debug consumers. Zero cost when no listeners. */
  readonly debugChannel: DebugChannel;
  /** Shared log service. Access via FlxG.log. */
  readonly log: FlxLog;
  /** Shared watch service. Access via FlxG.watch. */
  readonly watch: FlxWatch;

  readonly #clock: FixedStepAccumulator;
  #destroyed = false;
  #requestedState: FlxState | null = null;
  #state: FlxState | null = null;
  #frame = 0;

  constructor(
    gameSizeX: number,
    gameSizeY: number,
    initialState: FlxStateConstructor,
    zoom = 1,
    gameFramerate = 60,
    flashFramerate = 30,
    useSystemCursor = false,
    inputOptions: FlxInputManagerOptions = {},
    audioBackend: FlxAudioBackend = new NullAudioBackend(),
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
    this.context.updateFramerate = gameFramerate;
    this.context.attachRuntime(this);
    FlxG.installContext(this.context);
    this.input = new FlxInputManager(this.context, inputOptions);
    this.audio = new FlxAudioManager(this.context, audioBackend);
    this.context.addPlugin(new DebugPathDisplay());
    this.context.addPlugin(new TimerManager());
    this.context.addPlugin(new FlxTweenManager());
    this.#clock = new FixedStepAccumulator({ stepSeconds: 1 / gameFramerate });
    this.#requestedState = new initialState();
    // Debug services — always constructed but free when unused
    this.debugChannel = new DebugChannel();
    this.log = new FlxLog();
    this.watch = new FlxWatch();
    this.context.setService(FLX_LOG_SERVICE, this.log);
    this.context.setService(FLX_WATCH_SERVICE, this.watch);
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

    if (FlxG.vcr.replaying && FlxG.vcr.replay !== null) {
      // Always advance the input state machine first so transitions
      // (justPressed 2→1, justReleased -1→0) work correctly across frames.
      this.input.updateInput();
      if (FlxG.vcr.cancelKeys.some((k) => FlxG.keys.justPressed(k))) {
        FlxG.stopReplay();
      } else {
        const record = FlxG.vcr.replay.playNextFrame();
        if (record !== null) {
          // Overlay recorded key/mouse data on top of the freshly-cleared state.
          if (record.keys !== null && record.keys !== undefined) {
            this.input.keys.playback(record.keys);
          }
          if (record.mouse !== null && record.mouse !== undefined) {
            this.input.mouse.playback(record.mouse);
          }
          this.input.gamepads.playback(record.gamepads ?? []);
        }
        if (FlxG.vcr.replay.finished) {
          FlxG.stopReplay();
        }
      }
    } else {
      this.input.updateInput();
      if (FlxG.vcr.recording && FlxG.vcr.replay !== null) {
        const keyRec = this.input.keys.record();
        const mouseRec = this.input.mouse.record();
        const gamepadRec = this.input.gamepads.record();
        FlxG.vcr.replay.recordFrame(
          FlxG.vcr.replay.frameCount,
          keyRec ?? [],
          mouseRec,
          null,
          gamepadRec,
        );
      }
    }

    const t0 = performance.now();
    this.context.elapsed = stepSeconds * this.context.timeScale;
    if (!this.context.paused || FlxG.vcr.stepRequested) {
      FlxG.vcr.stepRequested = false;
      this.context.updatePlugins();
      this.#state?.tryUpdate();
      this.audio.updateSounds(this.context.elapsed);
      this.context.updateCameras();
    }
    // Emit step-complete for debug consumers (no-op when no listeners)
    if (this.debugChannel) {
      this.debugChannel.emit('step-complete', {
        frame: ++this.#frame,
        updateMs: performance.now() - t0,
      });
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
    this.audio.destroy();
    this.debugChannel.destroy();
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
    this.context.getPlugin(FlxTweenManager)?.clear();
    this.audio.destroySounds(false);
    previousState?.destroy();
    this.#state = nextState;

    try {
      nextState.create();
      this.context.markRenderablesDirty();
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
