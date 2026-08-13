import { clamp } from '../math/flx-math';
import { requireFinite } from '../math/flx-number';
import { FlxPoint, type PointLike } from '../math/flx-point';
import { FlxRect } from '../math/flx-rect';
import type { FlxObject } from '../objects/flx-object';
import { FlxBasic } from './flx-basic';
import { FLX_CAMERA_HOST_SERVICE, type FlxCameraHost } from './flx-context';
import { FlxG } from './flx-g';

/** Callback invoked after a deterministic camera effect completes. @public */
export type FlxCameraEffectCallback = () => void;

/** Camera follow presets retained from the AS3 API. @public */
export type FlxCameraFollowStyle = 0 | 1 | 2 | 3;

/** Camera shake direction presets retained from the AS3 API. @public */
export type FlxCameraShakeDirection = 0 | 1 | 2;

const DEFAULT_SCROLL_FACTOR = { x: 1, y: 1 } as const;

function requireDimension(value: number, name: string): number {
  requireFinite(value, name);
  if (value <= 0) throw new RangeError(`${name} must be greater than zero.`);
  return value;
}

/**
 * Renderer-neutral Flixel camera state.
 *
 * Pixi render targets and display objects are owned by `FlxCameraRenderer`;
 * this class owns only deterministic simulation and coordinate transforms.
 * @public
 */
export class FlxCamera extends FlxBasic {
  static readonly STYLE_LOCKON = 0;
  static readonly STYLE_PLATFORMER = 1;
  static readonly STYLE_TOPDOWN = 2;
  static readonly STYLE_TOPDOWN_TIGHT = 3;

  static readonly SHAKE_BOTH_AXES = 0;
  static readonly SHAKE_HORIZONTAL_ONLY = 1;
  static readonly SHAKE_VERTICAL_ONLY = 2;

  static defaultZoom = 1;

  x: number;
  y: number;
  width: number;
  height: number;
  target: FlxObject | null = null;
  deadzone: FlxRect | null = null;
  bounds: FlxRect | null = null;
  readonly scroll = new FlxPoint();
  /** Scroll at the start of the latest fixed update. @internal */
  readonly lastScroll = new FlxPoint();
  readonly scale = new FlxPoint(1, 1);
  bgColor = 0xff000000;
  antialiasing = false;

  #zoom = 1;
  #alpha = 1;
  #angle = 0;
  #color = 0xffffff;
  #followStyle: FlxCameraFollowStyle = FlxCamera.STYLE_LOCKON;
  #flashColor = 0;
  #flashDuration = 0;
  #flashComplete: FlxCameraEffectCallback | null = null;
  #flashAlpha = 0;
  #fadeColor = 0;
  #fadeDuration = 0;
  #fadeComplete: FlxCameraEffectCallback | null = null;
  #fadeAlpha = 0;
  #shakeIntensity = 0;
  #shakeDuration = 0;
  #shakeComplete: FlxCameraEffectCallback | null = null;
  readonly #shakeOffset = new FlxPoint();
  #shakeDirection: FlxCameraShakeDirection = FlxCamera.SHAKE_BOTH_AXES;
  #destroyed = false;

  constructor(x: number, y: number, width: number, height: number, zoom = 0) {
    super();
    this.x = requireFinite(x, 'Camera x');
    this.y = requireFinite(y, 'Camera y');
    this.width = requireDimension(width, 'Camera width');
    this.height = requireDimension(height, 'Camera height');
    this.zoom = zoom;
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  get zoom(): number {
    return this.#zoom;
  }

  set zoom(value: number) {
    const zoom = value === 0 ? FlxCamera.defaultZoom : value;
    requireDimension(zoom, 'Camera zoom');
    this.#zoom = zoom;
  }

  get alpha(): number {
    return this.#alpha;
  }

  set alpha(value: number) {
    this.#alpha = clamp(requireFinite(value, 'Camera alpha'), 0, 1);
  }

  get angle(): number {
    return this.#angle;
  }

  set angle(value: number) {
    this.#angle = requireFinite(value, 'Camera angle');
  }

  get color(): number {
    return this.#color;
  }

  set color(value: number) {
    this.#color = value & 0xffffff;
  }

  /** @internal */
  get flashColor(): number {
    return this.#flashColor;
  }

  /** @internal */
  get flashAlpha(): number {
    return clamp(this.#flashAlpha, 0, 1);
  }

  /** @internal */
  get fadeColor(): number {
    return this.#fadeColor;
  }

  /** @internal */
  get fadeAlpha(): number {
    return clamp(this.#fadeAlpha, 0, 1);
  }

  /** @internal */
  get shakeOffset(): Readonly<FlxPoint> {
    return this.#shakeOffset;
  }

  override update(): void {
    if (this.#destroyed || !this.exists || !this.active) return;
    this.updateWithElapsed(FlxG.elapsed);
  }

  /** Advances follow state and effects with an explicit deterministic step. */
  updateWithElapsed(elapsed: number): void {
    requireFinite(elapsed, 'Camera elapsed time');
    if (elapsed < 0) {
      throw new RangeError('Camera elapsed time must be non-negative.');
    }

    this.lastScroll.copyFrom(this.scroll);
    this.#updateFollow();
    this.#clampScrollToBounds();
    this.#updateEffects(elapsed);
  }

  follow(
    target: FlxObject | null,
    style: FlxCameraFollowStyle = FlxCamera.STYLE_LOCKON,
  ): void {
    this.target = target;
    this.#followStyle = style;
    this.#configureDeadzone(style);
  }

  focusOn(point: Readonly<PointLike>): void {
    this.scroll.make(
      point.x + (point.x > 0 ? 0.0000001 : -0.0000001) - this.width * 0.5,
      point.y + (point.y > 0 ? 0.0000001 : -0.0000001) - this.height * 0.5,
    );
    this.#clampScrollToBounds();
  }

  setBounds(x = 0, y = 0, width = 0, height = 0, updateWorld = false): void {
    requireFinite(x, 'Camera bounds x');
    requireFinite(y, 'Camera bounds y');
    if (!Number.isFinite(width) || width < 0) {
      throw new RangeError('Camera bounds width must be non-negative.');
    }
    if (!Number.isFinite(height) || height < 0) {
      throw new RangeError('Camera bounds height must be non-negative.');
    }
    this.bounds ??= new FlxRect();
    this.bounds.make(x, y, width, height);
    if (updateWorld) FlxG.worldBounds.copyFrom(this.bounds);
    this.#updateFollow();
    this.#clampScrollToBounds();
  }

  resize(width: number, height: number): void {
    this.width = requireDimension(width, 'Camera width');
    this.height = requireDimension(height, 'Camera height');
    if (this.target !== null) this.#configureDeadzone(this.#followStyle);
    this.#updateFollow();
    this.#clampScrollToBounds();
  }

  setScale(x: number, y = x): void {
    requireFinite(x, 'Camera scale x');
    requireFinite(y, 'Camera scale y');
    if (x === 0 || y === 0) {
      throw new RangeError('Camera scale components cannot be zero.');
    }
    this.scale.make(x, y);
  }

  getScale(point: FlxPoint = new FlxPoint()): FlxPoint {
    return point.copyFrom(this.scale);
  }

  flash(
    color = 0xffffffff,
    duration = 1,
    onComplete: FlxCameraEffectCallback | null = null,
    force = false,
  ): void {
    if (!force && this.#flashAlpha > 0) return;
    this.#flashColor = color >>> 0;
    this.#flashDuration = Math.max(
      requireFinite(duration, 'Flash duration'),
      Number.EPSILON,
    );
    this.#flashComplete = onComplete;
    this.#flashAlpha = 1;
  }

  fade(
    color = 0xff000000,
    duration = 1,
    onComplete: FlxCameraEffectCallback | null = null,
    force = false,
  ): void {
    if (!force && this.#fadeAlpha > 0) return;
    this.#fadeColor = color >>> 0;
    this.#fadeDuration = Math.max(
      requireFinite(duration, 'Fade duration'),
      Number.EPSILON,
    );
    this.#fadeComplete = onComplete;
    this.#fadeAlpha = Number.MIN_VALUE;
  }

  shake(
    intensity = 0.05,
    duration = 0.5,
    onComplete: FlxCameraEffectCallback | null = null,
    force = true,
    direction: FlxCameraShakeDirection = FlxCamera.SHAKE_BOTH_AXES,
  ): void {
    if (!force && (this.#shakeOffset.x !== 0 || this.#shakeOffset.y !== 0)) {
      return;
    }
    if (!Number.isFinite(intensity) || intensity < 0) {
      throw new RangeError('Shake intensity must be non-negative.');
    }
    this.#shakeIntensity = intensity;
    this.#shakeDuration = Math.max(
      requireFinite(duration, 'Shake duration'),
      0,
    );
    this.#shakeComplete = onComplete;
    this.#shakeDirection = direction;
    this.#shakeOffset.make();
  }

  stopFX(): void {
    this.#flashAlpha = 0;
    this.#fadeAlpha = 0;
    this.#shakeDuration = 0;
    this.#shakeOffset.make();
    this.#flashComplete = null;
    this.#fadeComplete = null;
    this.#shakeComplete = null;
  }

  copyFrom(camera: FlxCamera): this {
    this.bounds =
      camera.bounds === null
        ? null
        : (this.bounds ?? new FlxRect()).copyFrom(camera.bounds);
    this.target = camera.target;
    this.#followStyle = camera.#followStyle;
    this.deadzone =
      camera.deadzone === null
        ? null
        : (this.deadzone ?? new FlxRect()).copyFrom(camera.deadzone);
    return this;
  }

  worldToScreen(
    point: Readonly<PointLike>,
    output: FlxPoint = new FlxPoint(),
    scrollFactor: Readonly<PointLike> = DEFAULT_SCROLL_FACTOR,
  ): FlxPoint {
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;
    const localX =
      (point.x - this.scroll.x * scrollFactor.x - centerX) * this.#zoom;
    const localY =
      (point.y - this.scroll.y * scrollFactor.y - centerY) * this.#zoom;
    const radians = (this.#angle * Math.PI) / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    const rotatedX = localX * cosine - localY * sine;
    const rotatedY = localX * sine + localY * cosine;
    output.x =
      this.x +
      centerX * this.scale.x +
      rotatedX * this.scale.x +
      this.#shakeOffset.x;
    output.y =
      this.y +
      centerY * this.scale.y +
      rotatedY * this.scale.y +
      this.#shakeOffset.y;
    return output;
  }

  screenToWorld(
    point: Readonly<PointLike>,
    output: FlxPoint = new FlxPoint(),
  ): FlxPoint {
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;
    const scaledX =
      (point.x - this.x - this.#shakeOffset.x) / this.scale.x - centerX;
    const scaledY =
      (point.y - this.y - this.#shakeOffset.y) / this.scale.y - centerY;
    const radians = (-this.#angle * Math.PI) / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    const localX = scaledX * cosine - scaledY * sine;
    const localY = scaledX * sine + scaledY * cosine;
    output.x = localX / this.#zoom + centerX + this.scroll.x;
    output.y = localY / this.#zoom + centerY + this.scroll.y;
    return output;
  }

  containsScreenPoint(point: Readonly<PointLike>): boolean {
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;
    const x = (point.x - this.x - this.#shakeOffset.x) / this.scale.x;
    const y = (point.y - this.y - this.#shakeOffset.y) / this.scale.y;
    const radians = (-this.#angle * Math.PI) / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    const localX = (x - centerX) * cosine - (y - centerY) * sine + centerX;
    const localY = (x - centerX) * sine + (y - centerY) * cosine + centerY;
    return (
      localX >= 0 && localX < this.width && localY >= 0 && localY < this.height
    );
  }

  /**
   * Asynchronously extracts rendered RGBA pixel data for this camera from the active host renderer.
   * @public
   */
  async takeSnapshot(): Promise<{
    height: number;
    pixels: Uint8ClampedArray;
    width: number;
  }> {
    if (this.#destroyed) throw new Error('Cannot snapshot a destroyed camera.');
    const host = FlxG.context?.getService<FlxCameraHost>(
      FLX_CAMERA_HOST_SERVICE,
    );
    if (!host || typeof host.snapshotCamera !== 'function') {
      throw new Error(
        'No camera host with snapshot capability is installed in the current context.',
      );
    }
    return host.snapshotCamera(this);
  }

  override destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.stopFX();
    this.target = null;
    this.deadzone = null;
    this.bounds = null;
    this.cameras = null;
    super.destroy();
  }

  #configureDeadzone(style: FlxCameraFollowStyle): void {
    switch (style) {
      case FlxCamera.STYLE_PLATFORMER: {
        const width = this.width / 8;
        const height = this.height / 3;
        this.deadzone = new FlxRect(
          (this.width - width) / 2,
          (this.height - height) / 2 - height * 0.25,
          width,
          height,
        );
        break;
      }
      case FlxCamera.STYLE_TOPDOWN: {
        const size = Math.max(this.width, this.height) / 4;
        this.deadzone = new FlxRect(
          (this.width - size) / 2,
          (this.height - size) / 2,
          size,
          size,
        );
        break;
      }
      case FlxCamera.STYLE_TOPDOWN_TIGHT: {
        const size = Math.max(this.width, this.height) / 8;
        this.deadzone = new FlxRect(
          (this.width - size) / 2,
          (this.height - size) / 2,
          size,
          size,
        );
        break;
      }
      case FlxCamera.STYLE_LOCKON:
        this.deadzone = null;
        break;
    }
  }

  #updateFollow(): void {
    const target = this.target;
    if (target === null) return;
    const deadzone = this.deadzone;
    if (deadzone === null) {
      this.focusOn(target.getMidpoint());
      return;
    }

    const targetX = target.x + (target.x > 0 ? 0.0000001 : -0.0000001);
    const targetY = target.y + (target.y > 0 ? 0.0000001 : -0.0000001);
    let edge = targetX - deadzone.x;
    if (this.scroll.x > edge) this.scroll.x = edge;
    edge = targetX + target.width - deadzone.x - deadzone.width;
    if (this.scroll.x < edge) this.scroll.x = edge;
    edge = targetY - deadzone.y;
    if (this.scroll.y > edge) this.scroll.y = edge;
    edge = targetY + target.height - deadzone.y - deadzone.height;
    if (this.scroll.y < edge) this.scroll.y = edge;
  }

  #clampScrollToBounds(): void {
    const bounds = this.bounds;
    if (bounds === null) return;
    this.scroll.x = clamp(
      this.scroll.x,
      bounds.left,
      Math.max(bounds.left, bounds.right - this.width),
    );
    this.scroll.y = clamp(
      this.scroll.y,
      bounds.top,
      Math.max(bounds.top, bounds.bottom - this.height),
    );
  }

  #updateEffects(elapsed: number): void {
    if (this.#flashAlpha > 0) {
      this.#flashAlpha -= elapsed / this.#flashDuration;
      if (this.#flashAlpha <= 0) {
        this.#flashAlpha = 0;
        const callback = this.#flashComplete;
        this.#flashComplete = null;
        callback?.();
      }
    }

    if (this.#fadeAlpha > 0 && this.#fadeAlpha < 1) {
      this.#fadeAlpha += elapsed / this.#fadeDuration;
      if (this.#fadeAlpha >= 1) {
        this.#fadeAlpha = 1;
        const callback = this.#fadeComplete;
        this.#fadeComplete = null;
        callback?.();
      }
    }

    if (this.#shakeDuration <= 0) return;
    this.#shakeDuration -= elapsed;
    if (this.#shakeDuration <= 0) {
      this.#shakeDuration = 0;
      this.#shakeOffset.make();
      const callback = this.#shakeComplete;
      this.#shakeComplete = null;
      callback?.();
      return;
    }

    if (
      this.#shakeDirection === FlxCamera.SHAKE_BOTH_AXES ||
      this.#shakeDirection === FlxCamera.SHAKE_HORIZONTAL_ONLY
    ) {
      this.#shakeOffset.x =
        (FlxG.random() * this.#shakeIntensity * this.width * 2 -
          this.#shakeIntensity * this.width) *
        this.#zoom;
    }
    if (
      this.#shakeDirection === FlxCamera.SHAKE_BOTH_AXES ||
      this.#shakeDirection === FlxCamera.SHAKE_VERTICAL_ONLY
    ) {
      this.#shakeOffset.y =
        (FlxG.random() * this.#shakeIntensity * this.height * 2 -
          this.#shakeIntensity * this.height) *
        this.#zoom;
    }
  }
}
