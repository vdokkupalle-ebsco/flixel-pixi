import { FlxBasic } from '../core/flx-basic';
import type { FlxTimer } from '../objects/flx-timer';

/** Plugin that advances deterministic game-time timers. @public */
export class TimerManager extends FlxBasic {
  readonly #timers: FlxTimer[] = [];
  #destroyed = false;

  constructor() {
    super();
    this.visible = false;
  }

  get timerCount(): number {
    return this.#timers.length;
  }

  override update(): void {
    const snapshot = [...this.#timers].reverse();
    for (const timer of snapshot) {
      if (
        this.#timers.includes(timer) &&
        !timer.paused &&
        !timer.finished &&
        timer.time > 0
      ) {
        timer.update();
      }
    }
  }

  add(timer: FlxTimer): void {
    if (!this.#timers.includes(timer)) this.#timers.push(timer);
  }

  remove(timer: FlxTimer): void {
    const index = this.#timers.indexOf(timer);
    if (index >= 0) this.#timers.splice(index, 1);
  }

  clear(): void {
    const snapshot = [...this.#timers].reverse();
    this.#timers.length = 0;
    for (const timer of snapshot) timer.destroy();
  }

  override destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.clear();
    super.destroy();
  }
}
