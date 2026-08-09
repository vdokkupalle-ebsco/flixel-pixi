import { FlxG } from '../core/flx-g';
import type { FlxEaseFunction } from './flx-ease';
import { FlxTweenManager } from './flx-tween-manager';

/** Tween completion behavior. @public */
export type FlxTweenType =
  'oneshot' | 'persist' | 'looping' | 'pingpong' | 'backward';

/** Callback invoked with its owning tween. @public */
export type FlxTweenCallback = (tween: FlxTween) => void;

/** Common tween configuration. @public */
export interface FlxTweenOptions {
  type?: FlxTweenType;
  ease?: FlxEaseFunction;
  /** Optional discrete tween update rate. Zero uses every simulation step. */
  framerate?: number;
  onStart?: FlxTweenCallback;
  onUpdate?: FlxTweenCallback;
  onComplete?: FlxTweenCallback;
  startDelay?: number;
  loopDelay?: number;
}

type TweenTarget = Record<string, unknown>;

function requireDuration(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(
      'Tween duration must be a non-negative finite number.',
    );
  }
  return value;
}

function requireDelay(value: number, name: string): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite.`);
  }
  return Math.abs(value);
}

/** Base deterministic tween. Use the static factories for common tweens. @public */
export class FlxTween {
  static readonly ONESHOT: FlxTweenType = 'oneshot';
  static readonly PERSIST: FlxTweenType = 'persist';
  static readonly LOOPING: FlxTweenType = 'looping';
  static readonly PINGPONG: FlxTweenType = 'pingpong';
  static readonly BACKWARD: FlxTweenType = 'backward';

  readonly manager: FlxTweenManager;
  type: FlxTweenType;
  duration = 0;
  active = false;
  finished = false;
  backward = false;
  executions = 0;
  scale = 0;
  framerate: number;
  onStart: FlxTweenCallback | null;
  onUpdate: FlxTweenCallback | null;
  onComplete: FlxTweenCallback | null;
  ease: FlxEaseFunction | null;

  #startDelay: number;
  #loopDelay: number;
  #elapsed = 0;
  #running = false;
  #destroyed = false;
  #chained: FlxTween[] = [];
  #nextInChain: FlxTween | null = null;

  constructor(
    options: FlxTweenOptions = {},
    manager: FlxTweenManager = FlxTween.globalManager,
  ) {
    this.manager = manager;
    this.type = options.type ?? FlxTween.ONESHOT;
    this.backward = this.type === FlxTween.BACKWARD;
    this.framerate = options.framerate ?? 0;
    if (!Number.isFinite(this.framerate) || this.framerate < 0) {
      throw new RangeError('Tween framerate must be non-negative and finite.');
    }
    this.ease = options.ease ?? null;
    this.onStart = options.onStart ?? null;
    this.onUpdate = options.onUpdate ?? null;
    this.onComplete = options.onComplete ?? null;
    this.#startDelay = requireDelay(options.startDelay ?? 0, 'startDelay');
    this.#loopDelay = requireDelay(options.loopDelay ?? 0, 'loopDelay');
  }

  static get globalManager(): FlxTweenManager {
    const manager = FlxG.hasContext ? FlxG.getPlugin(FlxTweenManager) : null;
    if (manager === null) {
      throw new Error('FlxTween requires an active FlxTweenManager.');
    }
    return manager;
  }

  static tween<T extends object>(
    target: T,
    values: Record<string, number>,
    duration = 1,
    options: FlxTweenOptions = {},
  ): FlxVarTween<T> {
    return FlxTween.globalManager.tween(target, values, duration, options);
  }

  static num(
    fromValue: number,
    toValue: number,
    duration = 1,
    options: FlxTweenOptions = {},
    tweenFunction?: (value: number) => void,
  ): FlxNumTween {
    return FlxTween.globalManager.num(
      fromValue,
      toValue,
      duration,
      options,
      tweenFunction,
    );
  }

  static cancelTweensOf(target: object, fieldPaths?: readonly string[]): void {
    FlxTween.globalManager.cancelTweensOf(target, fieldPaths);
  }

  static completeTweensOf(
    target: object,
    fieldPaths?: readonly string[],
  ): void {
    FlxTween.globalManager.completeTweensOf(target, fieldPaths);
  }

  get startDelay(): number {
    return this.#startDelay;
  }

  set startDelay(value: number) {
    this.#startDelay = requireDelay(value, 'startDelay');
  }

  get loopDelay(): number {
    return this.#loopDelay;
  }

  set loopDelay(value: number) {
    this.#loopDelay = requireDelay(value, 'loopDelay');
  }

  get time(): number {
    return Math.max(this.#elapsed - this.#currentDelay, 0);
  }

  get percent(): number {
    return this.duration > 0 ? Math.min(this.time / this.duration, 1) : 1;
  }

  set percent(value: number) {
    if (!Number.isFinite(value))
      throw new RangeError('percent must be finite.');
    this.#elapsed = Math.max(0, value) * this.duration + this.#currentDelay;
  }

  start(): this {
    if (this.#destroyed) throw new Error('Cannot start a destroyed tween.');
    this.#elapsed = 0;
    this.active = true;
    this.finished = false;
    this.#running = false;
    this.scale = this.backward ? 1 : 0;
    this.onRestart();
    if (this.duration === 0 && this.#currentDelay === 0) {
      this.#begin();
      this.scale = this.backward ? 0 : 1;
      this.applyScale(this.scale);
      this.finished = true;
    }
    return this;
  }

  cancel(): void {
    if (this.#destroyed) return;
    this.#end();
    this.manager.remove(this, true);
  }

  cancelChain(): void {
    this.#nextInChain?.cancelChain();
    this.#chained.length = 0;
    this.cancel();
  }

  then(tween: FlxTween): this {
    if (tween === this) throw new Error('A tween cannot be chained to itself.');
    tween.manager.remove(tween, false);
    tween.active = false;
    tween.finished = true;
    this.#chained.push(tween);
    return this;
  }

  wait(delay: number): this {
    const tween = this.manager.num(0, 0, delay);
    return this.then(tween);
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.active = false;
    this.finished = true;
    this.onStart = null;
    this.onUpdate = null;
    this.onComplete = null;
    this.ease = null;
    this.#chained.length = 0;
    this.#nextInChain = null;
    this.#destroyed = true;
  }

  /** @internal */
  _update(elapsed: number): void {
    if (!this.active || this.finished) return;
    if (!Number.isFinite(elapsed) || elapsed < 0) {
      throw new RangeError(
        'Tween elapsed time must be non-negative and finite.',
      );
    }

    const previousElapsed = this.#elapsed;
    this.#elapsed += elapsed;
    const delay = this.#currentDelay;
    if (this.#elapsed < delay) return;

    this.#begin();
    const previousTick = this.#quantize(previousElapsed);
    const currentTick = this.#quantize(this.#elapsed);
    const rawProgress =
      this.duration === 0
        ? 1
        : Math.min(Math.max((currentTick - delay) / this.duration, 0), 1);
    let eased = this.ease?.(rawProgress) ?? rawProgress;
    if (this.backward) eased = 1 - eased;
    this.scale = eased;
    this.applyScale(eased);

    if (rawProgress >= 1) {
      this.scale = this.backward ? 0 : 1;
      this.applyScale(this.scale);
      this.finished = true;
    } else if (currentTick > previousTick) {
      this.onUpdate?.(this);
    }
  }

  /** @internal */
  _finish(): void {
    if (!this.finished) return;
    this.executions += 1;
    this.onComplete?.(this);

    if (this.type === FlxTween.LOOPING || this.type === FlxTween.PINGPONG) {
      if (!this.active) return;
      if (this.type === FlxTween.PINGPONG) this.backward = !this.backward;
      this.start();
      return;
    }

    this.#end();
    if (this.type === FlxTween.ONESHOT || this.type === FlxTween.BACKWARD) {
      this.manager.remove(this, true);
    }
  }

  /** @internal */
  _isTweenOf(_target: object, _field?: string): boolean {
    void _target;
    void _field;
    return false;
  }

  /** @internal */
  _complete(): void {
    if (
      !this.active ||
      this.type === FlxTween.LOOPING ||
      this.type === FlxTween.PINGPONG
    ) {
      return;
    }
    this.#elapsed = this.#currentDelay + this.duration;
    this.#begin();
    this.scale = this.backward ? 0 : 1;
    this.applyScale(this.scale);
    this.finished = true;
  }

  /** @internal */
  protected applyScale(_scale: number): void {
    void _scale;
  }

  /** @internal */
  protected onRestart(): void {
    return undefined;
  }

  #begin(): void {
    if (this.#running) return;
    this.#running = true;
    this.onStart?.(this);
  }

  #end(): void {
    this.active = false;
    this.finished = true;
    if (this.#chained.length === 0) return;
    const [next, ...remaining] = this.#chained;
    this.#chained.length = 0;
    if (!next) return;
    this.#nextInChain = next;
    for (const tween of remaining) next.then(tween);
    next.start();
    next.manager.add(next);
  }

  #quantize(value: number): number {
    return this.framerate > 0
      ? Math.round(value * this.framerate) / this.framerate
      : value;
  }

  get #currentDelay(): number {
    return this.executions > 0 ? this.#loopDelay : this.#startDelay;
  }
}

interface FlxVarTweenProperty {
  readonly owner: TweenTarget;
  readonly field: string;
  readonly fieldPath: string;
  readonly endValue: number;
  startValue: number | null;
}

/** Numeric property tween created by `FlxTween.tween`. @public */
export class FlxVarTween<T extends object = object> extends FlxTween {
  readonly target: T;
  readonly #properties: FlxVarTweenProperty[];

  constructor(
    target: T,
    values: Record<string, number>,
    duration: number,
    options: FlxTweenOptions = {},
    manager: FlxTweenManager = FlxTween.globalManager,
  ) {
    super(options, manager);
    if (target === null) throw new TypeError('Cannot tween a null target.');
    const fields = Object.keys(values);
    if (fields.length === 0) {
      throw new RangeError('A property tween requires at least one field.');
    }
    this.target = target;
    this.duration = requireDuration(duration);
    this.#properties = fields.map((fieldPath) => {
      const endValue = values[fieldPath];
      if (typeof endValue !== 'number' || !Number.isFinite(endValue)) {
        throw new TypeError(
          `Tween target value for "${fieldPath}" is not numeric.`,
        );
      }
      const path = fieldPath.split('.');
      const field = path.pop();
      if (!field || path.some((part) => part.length === 0)) {
        throw new TypeError(`Invalid tween field path "${fieldPath}".`);
      }
      let owner: unknown = target;
      for (const component of path) {
        if (
          (typeof owner !== 'object' && typeof owner !== 'function') ||
          owner === null
        ) {
          throw new TypeError(`Target does not contain "${fieldPath}".`);
        }
        owner = (owner as TweenTarget)[component];
      }
      if (
        (typeof owner !== 'object' && typeof owner !== 'function') ||
        owner === null
      ) {
        throw new TypeError(`Target does not contain "${fieldPath}".`);
      }
      return {
        endValue,
        field,
        fieldPath,
        owner: owner as TweenTarget,
        startValue: null,
      };
    });
    this.start();
  }

  override destroy(): void {
    for (const property of this.#properties) property.startValue = null;
    super.destroy();
  }

  /** @internal */
  override _isTweenOf(target: object, field?: string): boolean {
    if (target === this.target) {
      return (
        field === undefined ||
        this.#properties.some((property) => property.fieldPath === field)
      );
    }
    return this.#properties.some(
      (property) =>
        property.owner === target &&
        (field === undefined || property.field === field),
    );
  }

  /** @internal */
  protected override applyScale(scale: number): void {
    for (const property of this.#properties) {
      if (property.startValue === null) {
        const value = property.owner[property.field];
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          throw new TypeError(
            `Tween source property "${property.fieldPath}" is not numeric.`,
          );
        }
        property.startValue = value;
      }
      property.owner[property.field] =
        property.startValue + (property.endValue - property.startValue) * scale;
    }
  }

  /** @internal */
  protected override onRestart(): void {
    if (this.executions === 0) {
      for (const property of this.#properties ?? []) property.startValue = null;
    }
  }
}

/** Standalone numeric tween created by `FlxTween.num`. @public */
export class FlxNumTween extends FlxTween {
  value: number;
  readonly #startValue: number;
  readonly #endValue: number;
  #tweenFunction: ((value: number) => void) | null;

  constructor(
    fromValue: number,
    toValue: number,
    duration: number,
    options: FlxTweenOptions = {},
    tweenFunction?: (value: number) => void,
    manager: FlxTweenManager = FlxTween.globalManager,
  ) {
    super(options, manager);
    if (!Number.isFinite(fromValue) || !Number.isFinite(toValue)) {
      throw new TypeError('Numeric tween endpoints must be finite numbers.');
    }
    this.#startValue = fromValue;
    this.#endValue = toValue;
    this.value = fromValue;
    this.duration = requireDuration(duration);
    this.#tweenFunction = tweenFunction ?? null;
    this.start();
  }

  override destroy(): void {
    this.#tweenFunction = null;
    super.destroy();
  }

  /** @internal */
  protected override applyScale(scale: number): void {
    this.value = this.#startValue + (this.#endValue - this.#startValue) * scale;
    this.#tweenFunction?.(this.value);
  }
}
