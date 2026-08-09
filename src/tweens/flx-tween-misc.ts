import type { FlxBasic } from '../core/flx-basic';
import { FlxG } from '../core/flx-g';
import type { FlxObject } from '../objects/flx-object';
import type { FlxSprite } from '../objects/flx-sprite';
import { FlxTween, type FlxTweenOptions } from './flx-tween';
import type { FlxTweenManager } from './flx-tween-manager';

/** Minimal sprite-like target accepted by color tweens. @public */
export interface FlxColorTweenTarget {
  color: number;
  alpha: number;
}

/** A Pixi-compatible RGB color with an explicit normalized alpha channel. @public */
export interface FlxTweenColor {
  color: number;
  alpha: number;
}

/** Numeric RGB/ARGB color or an explicit RGB-and-alpha value. @public */
export type FlxTweenColorValue = number | Readonly<FlxTweenColor>;

/** Axes accepted by sprite shake tweens. @public */
export type FlxTweenAxes =
  'x' | 'y' | 'xy' | Readonly<{ x: boolean; y: boolean }>;

/** Flicker-specific options layered onto normal tween options. @public */
export interface FlxFlickerTweenOptions extends FlxTweenOptions {
  endVisibility?: boolean;
  ratio?: number;
  tweenFunction?: (tween: FlxFlickerTween) => boolean;
}

function requireFinite(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite.`);
  return value;
}

function requireDuration(value: number): number {
  requireFinite(value, 'Tween duration');
  if (value < 0) throw new RangeError('Tween duration must be non-negative.');
  return value;
}

function packColor(value: FlxTweenColorValue): number {
  if (typeof value !== 'number') {
    requireFinite(value.color, 'Tween color');
    requireFinite(value.alpha, 'Tween alpha');
    if (value.alpha < 0 || value.alpha > 1) {
      throw new RangeError('Tween alpha must be between 0 and 1.');
    }
    return (
      ((Math.round(value.alpha * 255) << 24) | (value.color & 0xffffff)) >>> 0
    );
  }
  requireFinite(value, 'Tween color');
  const packed = value >>> 0;
  return packed <= 0xffffff ? (packed | 0xff000000) >>> 0 : packed;
}

function interpolateColor(
  fromColor: number,
  toColor: number,
  scale: number,
): number {
  const channel = (shift: number): number => {
    const from = (fromColor >>> shift) & 0xff;
    const to = (toColor >>> shift) & 0xff;
    return Math.round(from + (to - from) * scale);
  };
  return (
    ((channel(24) << 24) |
      (channel(16) << 16) |
      (channel(8) << 8) |
      channel(0)) >>>
    0
  );
}

/** Tweens a numeric angle and optionally writes it to an object. @public */
export class FlxAngleTween extends FlxTween {
  angle = 0;
  sprite: FlxObject | null = null;
  #startAngle = 0;
  #angleRange = 0;

  tween(
    fromAngle: number,
    toAngle: number,
    duration: number,
    sprite: FlxObject | null = null,
  ): this {
    this.#startAngle = this.angle = requireFinite(fromAngle, 'From angle');
    this.#angleRange = requireFinite(toAngle, 'To angle') - fromAngle;
    this.duration = requireDuration(duration);
    this.sprite = sprite;
    if (sprite !== null) sprite.angle = this.angle % 360;
    return this.start();
  }

  override destroy(): void {
    this.sprite = null;
    super.destroy();
  }

  /** @internal */
  override _isTweenOf(target: object, field?: string): boolean {
    return this.sprite === target && (field === undefined || field === 'angle');
  }

  /** @internal */
  protected override applyScale(scale: number): void {
    this.angle = this.#startAngle + this.#angleRange * scale;
    if (this.sprite !== null) this.sprite.angle = this.angle % 360;
  }
}

/** Interpolates packed ARGB colors and optionally updates a sprite-like target. @public */
export class FlxColorTween extends FlxTween {
  color = 0xffffffff;
  sprite: FlxColorTweenTarget | null = null;
  #startColor = 0xffffffff;
  #endColor = 0xffffffff;

  tween(
    duration: number,
    fromColor: FlxTweenColorValue,
    toColor: FlxTweenColorValue,
    sprite: FlxColorTweenTarget | null = null,
  ): this {
    this.duration = requireDuration(duration);
    this.color = this.#startColor = packColor(fromColor);
    this.#endColor = packColor(toColor);
    this.sprite = sprite;
    this.#applyToSprite();
    return this.start();
  }

  override destroy(): void {
    this.sprite = null;
    super.destroy();
  }

  /** @internal */
  override _isTweenOf(target: object, field?: string): boolean {
    return this.sprite === target && (field === undefined || field === 'color');
  }

  /** @internal */
  protected override applyScale(scale: number): void {
    this.color = interpolateColor(this.#startColor, this.#endColor, scale);
    this.#applyToSprite();
  }

  #applyToSprite(): void {
    if (this.sprite === null) return;
    this.sprite.color = this.color & 0xffffff;
    this.sprite.alpha = ((this.color >>> 24) & 0xff) / 255;
  }
}

/** Flickers a lifecycle object's visibility using deterministic game time. @public */
export class FlxFlickerTween extends FlxTween {
  basic: FlxBasic | null = null;
  tweenFunction: (tween: FlxFlickerTween) => boolean;
  endVisibility: boolean;
  period = 0.08;
  ratio: number;

  constructor(options: FlxFlickerTweenOptions = {}, manager?: FlxTweenManager) {
    super(options, manager);
    this.endVisibility = options.endVisibility ?? true;
    this.ratio = options.ratio ?? 0.5;
    if (!Number.isFinite(this.ratio) || this.ratio < 0 || this.ratio > 1) {
      throw new RangeError('Flicker ratio must be between 0 and 1.');
    }
    this.tweenFunction =
      options.tweenFunction ?? FlxFlickerTween.defaultTweenFunction;
  }

  static defaultTweenFunction(tween: FlxFlickerTween): boolean {
    return (tween.time / tween.period) % 1 > tween.ratio;
  }

  tween(basic: FlxBasic, duration: number, period: number): this {
    this.basic = basic;
    this.duration = requireDuration(duration);
    this.period = requireFinite(period, 'Flicker period');
    if (this.period <= 0) {
      this.period = 1 / 60;
    }
    return this.start();
  }

  override destroy(): void {
    this.basic = null;
    super.destroy();
  }

  /** @internal */
  override _isTweenOf(target: object, field?: string): boolean {
    return (
      this.basic === target &&
      (field === undefined || field === 'visible' || field === 'flicker')
    );
  }

  /** @internal */
  protected override applyScale(_scale: number): void {
    void _scale;
    if (this.basic !== null) this.basic.visible = this.tweenFunction(this);
  }

  /** @internal */
  protected override onEnd(): void {
    if (this.basic !== null) this.basic.visible = this.endVisibility;
  }
}

/** Applies deterministic random offset shake to a sprite. @public */
export class FlxShakeTween extends FlxTween {
  sprite: FlxSprite | null = null;
  intensity = 0.05;
  axes: FlxTweenAxes = 'xy';
  #initialX = 0;
  #initialY = 0;

  tween(
    sprite: FlxSprite,
    intensity = 0.05,
    duration = 1,
    axes: FlxTweenAxes = 'xy',
  ): this {
    this.sprite = sprite;
    this.intensity = requireFinite(intensity, 'Shake intensity');
    if (this.intensity < 0) {
      throw new RangeError('Shake intensity must be non-negative.');
    }
    this.duration = requireDuration(duration);
    this.axes = axes;
    this.#initialX = sprite.offset.x;
    this.#initialY = sprite.offset.y;
    return this.start();
  }

  override destroy(): void {
    this.#restoreOffset();
    this.sprite = null;
    super.destroy();
  }

  /** @internal */
  override _isTweenOf(target: object, field?: string): boolean {
    return this.sprite === target && (field === undefined || field === 'shake');
  }

  /** @internal */
  protected override applyScale(_scale: number): void {
    void _scale;
    const sprite = this.sprite;
    if (sprite === null) return;
    const resolved =
      typeof this.axes === 'string'
        ? {
            x: this.axes === 'x' || this.axes === 'xy',
            y: this.axes === 'y' || this.axes === 'xy',
          }
        : this.axes;
    if (resolved.x) {
      sprite.offset.x =
        this.#initialX +
        (FlxG.random() * 2 - 1) * this.intensity * sprite.width;
    }
    if (resolved.y) {
      sprite.offset.y =
        this.#initialY +
        (FlxG.random() * 2 - 1) * this.intensity * sprite.height;
    }
  }

  #restoreOffset(): void {
    if (this.sprite === null) return;
    this.sprite.offset.make(this.#initialX, this.#initialY);
  }
}
