import { FlxBasic } from '../core/flx-basic';
import { FlxG } from '../core/flx-g';
import {
  FlxNumTween,
  type FlxTween,
  type FlxTweenOptions,
  FlxVarTween,
} from './flx-tween';
import type { FlxObject } from '../objects/flx-object';
import type { FlxSprite } from '../objects/flx-sprite';
import type { PointLike } from '../math/flx-point';
import {
  FlxAngleTween,
  FlxColorTween,
  type FlxColorTweenTarget,
  FlxFlickerTween,
  type FlxFlickerTweenOptions,
  FlxShakeTween,
  type FlxTweenAxes,
  type FlxTweenColorValue,
} from './flx-tween-misc';
import {
  FlxCircularMotion,
  FlxCubicMotion,
  FlxLinearMotion,
  FlxLinearPath,
  FlxQuadMotion,
  FlxQuadPath,
} from './flx-tween-motion';

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

  angle(
    sprite: FlxObject | null,
    fromAngle: number,
    toAngle: number,
    duration = 1,
    options: FlxTweenOptions = {},
  ): FlxAngleTween {
    return this.add(
      new FlxAngleTween(options, this).tween(
        fromAngle,
        toAngle,
        duration,
        sprite,
      ),
    );
  }

  color(
    sprite: FlxColorTweenTarget | null,
    duration: number,
    fromColor: FlxTweenColorValue,
    toColor: FlxTweenColorValue,
    options: FlxTweenOptions = {},
  ): FlxColorTween {
    return this.add(
      new FlxColorTween(options, this).tween(
        duration,
        fromColor,
        toColor,
        sprite,
      ),
    );
  }

  flicker(
    basic: FlxBasic,
    duration = 1,
    period = 0.08,
    options: FlxFlickerTweenOptions = {},
  ): FlxFlickerTween {
    return this.add(
      new FlxFlickerTween(options, this).tween(basic, duration, period),
    );
  }

  isFlickering(basic: FlxBasic): boolean {
    return this.#tweens.some(
      (tween) => tween instanceof FlxFlickerTween && tween.basic === basic,
    );
  }

  shake(
    sprite: FlxSprite,
    intensity = 0.05,
    duration = 1,
    axes: FlxTweenAxes = 'xy',
    options: FlxTweenOptions = {},
  ): FlxShakeTween {
    return this.add(
      new FlxShakeTween(options, this).tween(sprite, intensity, duration, axes),
    );
  }

  linearMotion(
    object: FlxObject,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    durationOrSpeed = 1,
    useDuration = true,
    options: FlxTweenOptions = {},
  ): FlxLinearMotion {
    const tween = new FlxLinearMotion(options, this).setMotion(
      fromX,
      fromY,
      toX,
      toY,
      durationOrSpeed,
      useDuration,
    );
    return this.add(tween.setObject(object));
  }

  quadMotion(
    object: FlxObject,
    fromX: number,
    fromY: number,
    controlX: number,
    controlY: number,
    toX: number,
    toY: number,
    durationOrSpeed = 1,
    useDuration = true,
    options: FlxTweenOptions = {},
  ): FlxQuadMotion {
    const tween = new FlxQuadMotion(options, this).setMotion(
      fromX,
      fromY,
      controlX,
      controlY,
      toX,
      toY,
      durationOrSpeed,
      useDuration,
    );
    return this.add(tween.setObject(object));
  }

  cubicMotion(
    object: FlxObject,
    fromX: number,
    fromY: number,
    controlAX: number,
    controlAY: number,
    controlBX: number,
    controlBY: number,
    toX: number,
    toY: number,
    duration = 1,
    options: FlxTweenOptions = {},
  ): FlxCubicMotion {
    const tween = new FlxCubicMotion(options, this).setMotion(
      fromX,
      fromY,
      controlAX,
      controlAY,
      controlBX,
      controlBY,
      toX,
      toY,
      duration,
    );
    return this.add(tween.setObject(object));
  }

  circularMotion(
    object: FlxObject,
    centerX: number,
    centerY: number,
    radius: number,
    angle: number,
    clockwise: boolean,
    durationOrSpeed = 1,
    useDuration = true,
    options: FlxTweenOptions = {},
  ): FlxCircularMotion {
    const tween = new FlxCircularMotion(options, this).setMotion(
      centerX,
      centerY,
      radius,
      angle,
      clockwise,
      durationOrSpeed,
      useDuration,
    );
    return this.add(tween.setObject(object));
  }

  linearPath(
    object: FlxObject,
    points: readonly PointLike[],
    durationOrSpeed = 1,
    useDuration = true,
    options: FlxTweenOptions = {},
  ): FlxLinearPath {
    const tween = new FlxLinearPath(options, this);
    for (const point of points) tween.addPoint(point.x, point.y);
    tween.setMotion(durationOrSpeed, useDuration);
    return this.add(tween.setObject(object));
  }

  quadPath(
    object: FlxObject,
    points: readonly PointLike[],
    durationOrSpeed = 1,
    useDuration = true,
    options: FlxTweenOptions = {},
  ): FlxQuadPath {
    const tween = new FlxQuadPath(options, this);
    for (const point of points) tween.addPoint(point.x, point.y);
    tween.setMotion(durationOrSpeed, useDuration);
    return this.add(tween.setObject(object));
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
