import { FlxBasic } from '../core/flx-basic';
import { FlxG } from '../core/flx-g';
import {
  FlxNumTween,
  type FlxTween,
  type FlxTweenOptions,
  FlxVarTween,
} from './flx-tween';

/** Owns and advances deterministic game-time tweens. @public */
export class FlxTweenManager extends FlxBasic {
  readonly #tweens: FlxTween[] = [];
  #destroyed = false;

  constructor() {
    super();
    this.visible = false;
  }

  get tweenCount(): number {
    return this.#tweens.length;
  }

  override update(): void {
    const finished: FlxTween[] = [];
    for (const tween of [...this.#tweens]) {
      if (!this.#tweens.includes(tween) || !tween.active) continue;
      tween._update(FlxG.elapsed);
      if (tween.finished) finished.push(tween);
    }
    for (const tween of finished) {
      if (this.#tweens.includes(tween)) tween._finish();
    }
  }

  tween<T extends object>(
    target: T,
    values: Record<string, number>,
    duration = 1,
    options: FlxTweenOptions = {},
  ): FlxVarTween<T> {
    return this.add(new FlxVarTween(target, values, duration, options, this));
  }

  num(
    fromValue: number,
    toValue: number,
    duration = 1,
    options: FlxTweenOptions = {},
    tweenFunction?: (value: number) => void,
  ): FlxNumTween {
    return this.add(
      new FlxNumTween(
        fromValue,
        toValue,
        duration,
        options,
        tweenFunction,
        this,
      ),
    );
  }

  /** @internal */
  add<T extends FlxTween>(tween: T, start = false): T {
    if (!this.#tweens.includes(tween)) this.#tweens.push(tween);
    if (start) tween.start();
    return tween;
  }

  /** @internal */
  remove<T extends FlxTween>(tween: T, destroy = true): T {
    const index = this.#tweens.indexOf(tween);
    if (index >= 0) this.#tweens.splice(index, 1);
    tween.active = false;
    if (destroy) tween.destroy();
    return tween;
  }

  clear(): void {
    const snapshot = [...this.#tweens];
    this.#tweens.length = 0;
    for (const tween of snapshot) tween.destroy();
  }

  cancelTweensOf(target: object, fieldPaths?: readonly string[]): void {
    this.#forEachTweenOf(target, fieldPaths, (tween) => tween.cancel());
  }

  completeTweensOf(target: object, fieldPaths?: readonly string[]): void {
    this.#forEachTweenOf(target, fieldPaths, (tween) => tween._complete());
  }

  containsTweensOf(target: object, fieldPaths?: readonly string[]): boolean {
    let result = false;
    this.#forEachTweenOf(target, fieldPaths, () => {
      result = true;
    });
    return result;
  }

  override destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.clear();
    super.destroy();
  }

  #forEachTweenOf(
    target: object,
    fieldPaths: readonly string[] | undefined,
    callback: (tween: FlxTween) => void,
  ): void {
    if (target === null) throw new TypeError('Tween target cannot be null.');
    const snapshot = [...this.#tweens].reverse();
    for (const tween of snapshot) {
      if (!this.#tweens.includes(tween)) continue;
      if (!fieldPaths || fieldPaths.length === 0) {
        if (tween._isTweenOf(target)) callback(tween);
        continue;
      }
      if (fieldPaths.some((field) => tween._isTweenOf(target, field))) {
        callback(tween);
      }
    }
  }
}
