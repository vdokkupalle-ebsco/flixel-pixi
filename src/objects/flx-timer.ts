import { FlxG } from '../core/flx-g';
import { TimerManager } from '../plugin/timer-manager';

/** Callback fired for each completed timer loop. @public */
export type FlxTimerCallback = (timer: FlxTimer) => void;

/** Deterministic timer advanced by the context's `TimerManager`. @public */
export class FlxTimer {
  time = 0;
  loops = 0;
  paused = false;
  finished = false;

  #callback: FlxTimerCallback | null = null;
  #timeCounter = 0;
  #loopsCounter = 0;
  #destroyed = false;

  static get manager(): TimerManager | null {
    return FlxG.hasContext ? FlxG.getPlugin(TimerManager) : null;
  }

  update(): void {
    if (this.paused || this.finished || this.time <= 0) return;
    this.#timeCounter += FlxG.elapsed;
    while (this.#timeCounter >= this.time && !this.paused && !this.finished) {
      this.#timeCounter -= this.time;
      this.#loopsCounter += 1;
      if (this.loops > 0 && this.#loopsCounter >= this.loops) this.stop();
      this.#callback?.(this);
    }
  }

  start(time = 1, loops = 1, callback: FlxTimerCallback | null = null): this {
    if (!Number.isFinite(time) || time < 0) {
      throw new RangeError('Timer time must be a non-negative finite number.');
    }
    if (!Number.isInteger(loops) || loops < 0) {
      throw new RangeError('Timer loops must be a non-negative integer.');
    }
    if (this.#destroyed) throw new Error('Cannot start a destroyed timer.');

    FlxTimer.manager?.add(this);
    if (this.paused) {
      this.paused = false;
      return this;
    }

    this.paused = false;
    this.finished = false;
    this.time = time;
    this.loops = loops;
    this.#callback = callback;
    this.#timeCounter = 0;
    this.#loopsCounter = 0;
    return this;
  }

  stop(): void {
    this.finished = true;
    FlxTimer.manager?.remove(this);
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.stop();
    this.#callback = null;
    this.#destroyed = true;
  }

  get timeLeft(): number {
    return this.time - this.#timeCounter;
  }

  get loopsLeft(): number {
    return this.loops - this.#loopsCounter;
  }

  get progress(): number {
    return this.time > 0 ? this.#timeCounter / this.time : 0;
  }
}
