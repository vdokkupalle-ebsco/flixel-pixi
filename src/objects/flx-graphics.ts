import { Texture } from 'pixi.js';

import { FlxG } from '../core/flx-g';
import type { PointLike } from '../math/flx-point';
import type { FlxRenderHandle } from '../rendering/flx-render-handle';
import { FlxGraphicsRenderHandle } from '../rendering/flx-graphics-render-handle';
import type { FlxCameraLike } from './flx-object';
import { FlxSprite } from './flx-sprite';

/** One RGBA color stop in a local gradient. @public */
export interface FlxGradientStop {
  /** Normalized position from 0 through 1. */
  readonly offset: number;
  /** Packed `0xRRGGBBAA` color. */
  readonly color: number;
}

/** Local normalized options for a linear gradient. @public */
export interface FlxLinearGradientOptions {
  /** Normalized local start point. Defaults to `{ x: 0, y: 0 }`. */
  readonly start?: PointLike;
  /** Normalized local end point. Defaults to `{ x: 0, y: 1 }`. */
  readonly end?: PointLike;
}

/** Local normalized options for a radial gradient. @public */
export interface FlxRadialGradientOptions {
  /** Normalized local inner-circle center. Defaults to the shape center. */
  readonly center?: PointLike;
  /** Normalized inner radius. Defaults to `0`. */
  readonly innerRadius?: number;
  /** Normalized local outer-circle center. Defaults to `center`. */
  readonly outerCenter?: PointLike;
  /** Normalized outer radius. Defaults to `0.5`. */
  readonly outerRadius?: number;
}

/** Immutable renderer-neutral local gradient descriptor. @public */
export class FlxGradient {
  /** Gradient family used by camera adapters. */
  readonly type: 'linear' | 'radial';
  /** Ordered immutable RGBA stops. */
  readonly stops: readonly Readonly<FlxGradientStop>[];
  /** Linear start point. */
  readonly start: Readonly<PointLike>;
  /** Linear end point. */
  readonly end: Readonly<PointLike>;
  /** Radial inner-circle center. */
  readonly center: Readonly<PointLike>;
  /** Radial outer-circle center. */
  readonly outerCenter: Readonly<PointLike>;
  /** Radial inner radius. */
  readonly innerRadius: number;
  /** Radial outer radius. */
  readonly outerRadius: number;

  private constructor(
    type: 'linear' | 'radial',
    stops: readonly FlxGradientStop[],
    options: FlxLinearGradientOptions & FlxRadialGradientOptions,
  ) {
    this.type = type;
    this.stops = validateStops(stops);
    this.start = point(options.start ?? { x: 0, y: 0 });
    this.end = point(options.end ?? { x: 0, y: 1 });
    this.center = point(options.center ?? { x: 0.5, y: 0.5 });
    this.outerCenter = point(options.outerCenter ?? this.center);
    this.innerRadius = finiteNonNegative(
      options.innerRadius ?? 0,
      'innerRadius',
    );
    this.outerRadius = finiteNonNegative(
      options.outerRadius ?? 0.5,
      'outerRadius',
    );
    if (this.outerRadius <= this.innerRadius) {
      throw new RangeError('Gradient outerRadius must exceed innerRadius.');
    }
    Object.freeze(this);
  }

  /** Create an immutable local linear gradient. */
  static linear(
    stops: readonly FlxGradientStop[],
    options: FlxLinearGradientOptions = {},
  ): FlxGradient {
    return new FlxGradient('linear', stops, options);
  }

  /** Create an immutable local radial gradient. */
  static radial(
    stops: readonly FlxGradientStop[],
    options: FlxRadialGradientOptions = {},
  ): FlxGradient {
    return new FlxGradient('radial', stops, options);
  }
}

/** Solid RGBA color or gradient fill. @public */
export type FlxGraphicsFill = number | FlxGradient;

/** Renderer-neutral vector stroke style. @public */
export interface FlxGraphicsStroke {
  /** Packed `0xRRGGBBAA` color or local gradient. */
  readonly fill: FlxGraphicsFill;
  /** Positive logical-pixel stroke width. */
  readonly width: number;
  /** Stroke placement: `0` outside, `0.5` centered, `1` inside. */
  readonly alignment?: number;
  /** Open-line end shape. */
  readonly cap?: 'butt' | 'round' | 'square';
  /** Connected-segment corner shape. */
  readonly join?: 'bevel' | 'miter' | 'round';
}

/** Fill/stroke pair applied to one vector primitive. @public */
export interface FlxGraphicsStyle {
  /** Optional solid or gradient shape fill. */
  readonly fill?: FlxGraphicsFill;
  /** Optional shape outline. */
  readonly stroke?: FlxGraphicsStroke;
}

type FlxGraphicsCommand =
  | {
      readonly kind: 'rect';
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly radius: number;
      readonly style: Readonly<FlxGraphicsStyle>;
    }
  | {
      readonly kind: 'circle';
      readonly x: number;
      readonly y: number;
      readonly radius: number;
      readonly style: Readonly<FlxGraphicsStyle>;
    }
  | {
      readonly kind: 'ellipse';
      readonly x: number;
      readonly y: number;
      readonly radiusX: number;
      readonly radiusY: number;
      readonly style: Readonly<FlxGraphicsStyle>;
    }
  | {
      readonly kind: 'polygon' | 'line';
      readonly points: readonly number[];
      readonly close: boolean;
      readonly style: Readonly<FlxGraphicsStyle>;
    }
  | {
      readonly kind: 'star';
      readonly x: number;
      readonly y: number;
      readonly points: number;
      readonly radius: number;
      readonly innerRadius: number;
      readonly rotation: number;
      readonly style: Readonly<FlxGraphicsStyle>;
    };

/**
 * Stable renderer-neutral vector drawing object.
 *
 * Commands are tessellated per camera only when the revision changes. Use a
 * mesh for shapes whose geometry changes every frame.
 * @public
 */
export class FlxGraphics extends FlxSprite {
  readonly #commands: FlxGraphicsCommand[] = [];
  #graphicsRevision = 0;

  constructor(x = 0, y = 0, width = 1, height = 1) {
    super(x, y, Texture.EMPTY);
    positive(width, 'width');
    positive(height, 'height');
    this.width = width;
    this.height = height;
    this.origin.make(width / 2, height / 2);
  }

  /** Number of retained drawing commands. */
  get commandCount(): number {
    return this.#commands.length;
  }

  /** Monotonic version consumed by camera adapters. */
  get graphicsRevision(): number {
    return this.#graphicsRevision;
  }

  /** Remove every retained command and publish one rebuild revision. */
  clearGraphics(): this {
    if (this.#commands.length === 0) return this;
    this.#commands.length = 0;
    this.#graphicsRevision += 1;
    return this;
  }

  /** Append a filled and/or stroked rectangle. */
  rect(
    x: number,
    y: number,
    width: number,
    height: number,
    style: FlxGraphicsStyle,
  ): this {
    return this.#append({
      height: positive(height, 'height'),
      kind: 'rect',
      radius: 0,
      style: cloneStyle(style),
      width: positive(width, 'width'),
      x: finite(x, 'x'),
      y: finite(y, 'y'),
    });
  }

  /** Append a filled and/or stroked rounded rectangle. */
  roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    style: FlxGraphicsStyle,
  ): this {
    return this.#append({
      height: positive(height, 'height'),
      kind: 'rect',
      radius: finiteNonNegative(radius, 'radius'),
      style: cloneStyle(style),
      width: positive(width, 'width'),
      x: finite(x, 'x'),
      y: finite(y, 'y'),
    });
  }

  /** Append a filled and/or stroked circle. */
  circle(x: number, y: number, radius: number, style: FlxGraphicsStyle): this {
    return this.#append({
      kind: 'circle',
      radius: positive(radius, 'radius'),
      style: cloneStyle(style),
      x: finite(x, 'x'),
      y: finite(y, 'y'),
    });
  }

  /** Append a filled and/or stroked ellipse. */
  ellipse(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    style: FlxGraphicsStyle,
  ): this {
    return this.#append({
      kind: 'ellipse',
      radiusX: positive(radiusX, 'radiusX'),
      radiusY: positive(radiusY, 'radiusY'),
      style: cloneStyle(style),
      x: finite(x, 'x'),
      y: finite(y, 'y'),
    });
  }

  /** Append a closed polygon from local x/y pairs. */
  polygon(points: ArrayLike<number>, style: FlxGraphicsStyle): this {
    return this.#append({
      close: true,
      kind: 'polygon',
      points: clonePoints(points, 3),
      style: cloneStyle(style),
    });
  }

  /** Append an open stroked polyline from local x/y pairs. */
  line(points: ArrayLike<number>, stroke: FlxGraphicsStroke): this {
    return this.#append({
      close: false,
      kind: 'line',
      points: clonePoints(points, 2),
      style: cloneStyle({ stroke }),
    });
  }

  /** Append a filled and/or stroked regular star. */
  star(
    x: number,
    y: number,
    points: number,
    radius: number,
    innerRadius: number,
    style: FlxGraphicsStyle,
    rotation = 0,
  ): this {
    if (!Number.isSafeInteger(points) || points < 2) {
      throw new RangeError('A star requires at least two points.');
    }
    radius = positive(radius, 'radius');
    innerRadius = positive(innerRadius, 'innerRadius');
    if (innerRadius > radius) {
      throw new RangeError('A star innerRadius must not exceed its radius.');
    }
    return this.#append({
      innerRadius,
      kind: 'star',
      points,
      radius,
      rotation: finite(rotation, 'rotation'),
      style: cloneStyle(style),
      x: finite(x, 'x'),
      y: finite(y, 'y'),
    });
  }

  override onScreen(camera: FlxCameraLike = FlxG.camera): boolean {
    const point = this.getScreenXY(undefined, camera);
    point.x -= this.offset.x;
    point.y -= this.offset.y;
    const halfWidth = this.width * 0.5;
    const halfHeight = this.height * 0.5;
    const radians = (this.angle * Math.PI) / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    const relativeCenterX = (halfWidth - this.origin.x) * this.scale.x;
    const relativeCenterY = (halfHeight - this.origin.y) * this.scale.y;
    const centerX =
      point.x +
      this.origin.x +
      relativeCenterX * cosine -
      relativeCenterY * sine;
    const centerY =
      point.y +
      this.origin.y +
      relativeCenterX * sine +
      relativeCenterY * cosine;
    const extentX =
      Math.abs(cosine * halfWidth * this.scale.x) +
      Math.abs(sine * halfHeight * this.scale.y);
    const extentY =
      Math.abs(sine * halfWidth * this.scale.x) +
      Math.abs(cosine * halfHeight * this.scale.y);
    return (
      centerX + extentX > 0 &&
      centerX - extentX < camera.width &&
      centerY + extentY > 0 &&
      centerY - extentY < camera.height
    );
  }

  override createRenderHandle(): FlxRenderHandle {
    return this.trackRenderHandle((onDestroy) => {
      return new FlxGraphicsRenderHandle(this, onDestroy);
    });
  }

  /** @internal */
  get renderCommands(): readonly FlxGraphicsCommand[] {
    return this.#commands;
  }

  #append(command: FlxGraphicsCommand): this {
    this.#commands.push(Object.freeze(command));
    this.#graphicsRevision += 1;
    return this;
  }
}

function validateStops(
  stops: readonly FlxGradientStop[],
): readonly Readonly<FlxGradientStop>[] {
  if (stops.length < 2)
    throw new RangeError('A gradient requires two color stops.');
  let previous = -1;
  const result = stops.map((stop) => {
    const offset = finite(stop.offset, 'offset');
    if (offset < 0 || offset > 1 || offset < previous) {
      throw new RangeError(
        'Gradient offsets must be ordered from 0 through 1.',
      );
    }
    previous = offset;
    return Object.freeze({ color: rgba(stop.color), offset });
  });
  return Object.freeze(result);
}

function point(value: PointLike): Readonly<PointLike> {
  return Object.freeze({ x: finite(value.x, 'x'), y: finite(value.y, 'y') });
}

function clonePoints(
  values: ArrayLike<number>,
  minimumPoints: number,
): readonly number[] {
  const result = Array.from(values, (value) => finite(value, 'point'));
  if (result.length < minimumPoints * 2 || result.length % 2 !== 0) {
    throw new RangeError(`Expected at least ${minimumPoints} x/y point pairs.`);
  }
  return Object.freeze(result);
}

function cloneStyle(style: FlxGraphicsStyle): Readonly<FlxGraphicsStyle> {
  if (style.fill === undefined && style.stroke === undefined) {
    throw new RangeError('A graphics style requires a fill or stroke.');
  }
  const fill = style.fill === undefined ? undefined : validateFill(style.fill);
  let stroke: Readonly<FlxGraphicsStroke> | undefined;
  if (style.stroke !== undefined) {
    const alignment = finite(style.stroke.alignment ?? 0.5, 'alignment');
    if (alignment < 0 || alignment > 1) {
      throw new RangeError('Stroke alignment must be between 0 and 1.');
    }
    stroke = Object.freeze({
      alignment,
      cap: validateCap(style.stroke.cap ?? 'butt'),
      fill: validateFill(style.stroke.fill),
      join: validateJoin(style.stroke.join ?? 'miter'),
      width: positive(style.stroke.width, 'stroke width'),
    });
  }
  return Object.freeze({
    ...(fill === undefined ? {} : { fill }),
    ...(stroke === undefined ? {} : { stroke }),
  });
}

function validateCap(value: string): 'butt' | 'round' | 'square' {
  if (value !== 'butt' && value !== 'round' && value !== 'square') {
    throw new RangeError(`Unsupported stroke cap: ${value}.`);
  }
  return value;
}

function validateJoin(value: string): 'bevel' | 'miter' | 'round' {
  if (value !== 'bevel' && value !== 'miter' && value !== 'round') {
    throw new RangeError(`Unsupported stroke join: ${value}.`);
  }
  return value;
}

function validateFill(fill: FlxGraphicsFill): FlxGraphicsFill {
  if (fill instanceof FlxGradient) return fill;
  return rgba(fill);
}

function rgba(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
    throw new RangeError('Colors must be packed 0xRRGGBBAA integers.');
  }
  return value >>> 0;
}

function positive(value: number, label: string): number {
  value = finite(value, label);
  if (value <= 0) throw new RangeError(`${label} must be positive.`);
  return value;
}

function finiteNonNegative(value: number, label: string): number {
  value = finite(value, label);
  if (value < 0) throw new RangeError(`${label} must not be negative.`);
  return value;
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
  return value;
}
