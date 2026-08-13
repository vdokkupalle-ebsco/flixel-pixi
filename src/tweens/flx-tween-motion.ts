import { requireFinite } from '../math/flx-number';
import type { PointLike } from '../math/flx-point';
import type { FlxObject } from '../objects/flx-object';
import { FlxTween } from './flx-tween';

function requireDuration(value: number): number {
  requireFinite(value, 'Motion duration');
  if (value < 0) throw new RangeError('Motion duration must be non-negative.');
  return value;
}

function durationFrom(
  distance: number,
  value: number,
  useDuration: boolean,
): number {
  if (useDuration) return requireDuration(value);
  requireFinite(value, 'Motion speed');
  if (value <= 0)
    throw new RangeError('Motion speed must be greater than zero.');
  return distance / value;
}

function pointAt(points: readonly PointLike[], index: number): PointLike {
  const point = points[index];
  if (point === undefined) throw new RangeError(`Missing path point ${index}.`);
  return point;
}

function quadraticPoint(
  from: PointLike,
  control: PointLike,
  to: PointLike,
  progress: number,
): { x: number; y: number } {
  const inverse = 1 - progress;
  return {
    x:
      from.x * inverse * inverse +
      control.x * 2 * inverse * progress +
      to.x * progress * progress,
    y:
      from.y * inverse * inverse +
      control.y * 2 * inverse * progress +
      to.y * progress * progress,
  };
}

function quadraticLength(
  from: PointLike,
  control: PointLike,
  to: PointLike,
): number {
  let length = 0;
  let previous = { x: from.x, y: from.y };
  for (let index = 1; index <= 32; index += 1) {
    const current = quadraticPoint(from, control, to, index / 32);
    length += Math.hypot(current.x - previous.x, current.y - previous.y);
    previous = current;
  }
  return length;
}

/** Base tween for moving an optional physics object through world space. @public */
export class FlxMotion extends FlxTween {
  x = 0;
  y = 0;
  object: FlxObject | null = null;
  #wasObjectImmovable = false;

  setObject(object: FlxObject): this {
    if (this.object !== null && this.object !== object) this.#restoreObject();
    this.object = object;
    this.#wasObjectImmovable = object.immovable;
    object.immovable = true;
    this.syncObject();
    return this;
  }

  override destroy(): void {
    this.#restoreObject();
    this.object = null;
    super.destroy();
  }

  /** @internal */
  override _isTweenOf(target: object, field?: string): boolean {
    return (
      this.object === target &&
      (field === undefined || field === 'x' || field === 'y')
    );
  }

  /** @internal */
  protected override onEnd(): void {
    this.#restoreObject();
  }

  /** @internal */
  protected override onRestart(): void {
    if (this.object !== null) this.object.immovable = true;
  }

  /** @internal */
  protected syncObject(): void {
    if (this.object === null) return;
    this.object.x = this.x;
    this.object.y = this.y;
  }

  #restoreObject(): void {
    if (this.object !== null) this.object.immovable = this.#wasObjectImmovable;
  }
}

/** Motion along a straight line. @public */
export class FlxLinearMotion extends FlxMotion {
  distance = 0;
  #fromX = 0;
  #fromY = 0;
  #moveX = 0;
  #moveY = 0;

  setMotion(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    durationOrSpeed = 1,
    useDuration = true,
  ): this {
    this.x = this.#fromX = requireFinite(fromX, 'From x');
    this.y = this.#fromY = requireFinite(fromY, 'From y');
    this.#moveX = requireFinite(toX, 'To x') - fromX;
    this.#moveY = requireFinite(toY, 'To y') - fromY;
    this.distance = Math.hypot(this.#moveX, this.#moveY);
    this.duration = durationFrom(this.distance, durationOrSpeed, useDuration);
    this.syncObject();
    return this.start();
  }

  /** @internal */
  protected override applyScale(scale: number): void {
    this.x = this.#fromX + this.#moveX * scale;
    this.y = this.#fromY + this.#moveY * scale;
    this.syncObject();
  }
}

/** Motion along a quadratic Bézier curve. @public */
export class FlxQuadMotion extends FlxMotion {
  distance = 0;
  #from = { x: 0, y: 0 };
  #control = { x: 0, y: 0 };
  #to = { x: 0, y: 0 };

  setMotion(
    fromX: number,
    fromY: number,
    controlX: number,
    controlY: number,
    toX: number,
    toY: number,
    durationOrSpeed = 1,
    useDuration = true,
  ): this {
    this.#from = {
      x: requireFinite(fromX, 'From x'),
      y: requireFinite(fromY, 'From y'),
    };
    this.#control = {
      x: requireFinite(controlX, 'Control x'),
      y: requireFinite(controlY, 'Control y'),
    };
    this.#to = {
      x: requireFinite(toX, 'To x'),
      y: requireFinite(toY, 'To y'),
    };
    this.x = fromX;
    this.y = fromY;
    this.distance = quadraticLength(this.#from, this.#control, this.#to);
    this.duration = durationFrom(this.distance, durationOrSpeed, useDuration);
    this.syncObject();
    return this.start();
  }

  /** @internal */
  protected override applyScale(scale: number): void {
    const point = quadraticPoint(this.#from, this.#control, this.#to, scale);
    this.x = point.x;
    this.y = point.y;
    this.syncObject();
  }
}

/** Motion along a cubic Bézier curve. @public */
export class FlxCubicMotion extends FlxMotion {
  #from = { x: 0, y: 0 };
  #controlA = { x: 0, y: 0 };
  #controlB = { x: 0, y: 0 };
  #to = { x: 0, y: 0 };

  setMotion(
    fromX: number,
    fromY: number,
    controlAX: number,
    controlAY: number,
    controlBX: number,
    controlBY: number,
    toX: number,
    toY: number,
    duration = 1,
  ): this {
    this.#from = {
      x: requireFinite(fromX, 'From x'),
      y: requireFinite(fromY, 'From y'),
    };
    this.#controlA = {
      x: requireFinite(controlAX, 'Control A x'),
      y: requireFinite(controlAY, 'Control A y'),
    };
    this.#controlB = {
      x: requireFinite(controlBX, 'Control B x'),
      y: requireFinite(controlBY, 'Control B y'),
    };
    this.#to = {
      x: requireFinite(toX, 'To x'),
      y: requireFinite(toY, 'To y'),
    };
    this.x = fromX;
    this.y = fromY;
    this.duration = requireDuration(duration);
    this.syncObject();
    return this.start();
  }

  /** @internal */
  protected override applyScale(scale: number): void {
    const inverse = 1 - scale;
    this.x =
      inverse ** 3 * this.#from.x +
      3 * inverse * inverse * scale * this.#controlA.x +
      3 * inverse * scale * scale * this.#controlB.x +
      scale ** 3 * this.#to.x;
    this.y =
      inverse ** 3 * this.#from.y +
      3 * inverse * inverse * scale * this.#controlA.y +
      3 * inverse * scale * scale * this.#controlB.y +
      scale ** 3 * this.#to.y;
    this.syncObject();
  }
}

/** Motion around one complete circle. Angles are supplied in degrees. @public */
export class FlxCircularMotion extends FlxMotion {
  angle = 0;
  circumference = 0;
  #centerX = 0;
  #centerY = 0;
  #radius = 0;
  #startAngle = 0;
  #angleRange = 0;

  setMotion(
    centerX: number,
    centerY: number,
    radius: number,
    angle: number,
    clockwise: boolean,
    durationOrSpeed = 1,
    useDuration = true,
  ): this {
    this.#centerX = requireFinite(centerX, 'Center x');
    this.#centerY = requireFinite(centerY, 'Center y');
    this.#radius = requireFinite(radius, 'Radius');
    if (this.#radius < 0) throw new RangeError('Radius must be non-negative.');
    this.angle = this.#startAngle =
      (requireFinite(angle, 'Angle') * Math.PI) / -180;
    this.#angleRange = Math.PI * 2 * (clockwise ? 1 : -1);
    this.circumference = this.#radius * Math.PI * 2;
    this.duration = durationFrom(
      this.circumference,
      durationOrSpeed,
      useDuration,
    );
    this.#applyAngle(this.angle);
    return this.start();
  }

  /** @internal */
  protected override applyScale(scale: number): void {
    this.angle = this.#startAngle + this.#angleRange * scale;
    this.#applyAngle(this.angle);
  }

  #applyAngle(angle: number): void {
    this.x = this.#centerX + Math.cos(angle) * this.#radius;
    this.y = this.#centerY + Math.sin(angle) * this.#radius;
    this.syncObject();
  }
}

/** Constant-speed motion through a polyline. @public */
export class FlxLinearPath extends FlxMotion {
  distance = 0;
  readonly points: PointLike[] = [];
  readonly #cumulativeDistances: number[] = [0];

  addPoint(x = 0, y = 0): this {
    requireFinite(x, 'Path x');
    requireFinite(y, 'Path y');
    const previous = this.points.at(-1);
    if (previous !== undefined) {
      this.distance += Math.hypot(x - previous.x, y - previous.y);
      this.#cumulativeDistances.push(this.distance);
    }
    this.points.push({ x, y });
    return this;
  }

  getPoint(index = 0): PointLike {
    if (this.points.length === 0)
      throw new Error('No path points have been added.');
    const normalized =
      ((index % this.points.length) + this.points.length) % this.points.length;
    return pointAt(this.points, normalized);
  }

  setMotion(durationOrSpeed = 1, useDuration = true): this {
    if (this.points.length < 2) {
      throw new RangeError('A linear path requires at least two points.');
    }
    if (this.distance === 0)
      throw new RangeError('A linear path must have non-zero length.');
    this.duration = durationFrom(this.distance, durationOrSpeed, useDuration);
    const first = pointAt(this.points, 0);
    this.x = first.x;
    this.y = first.y;
    this.syncObject();
    return this.start();
  }

  /** @internal */
  protected override applyScale(scale: number): void {
    const targetDistance = Math.min(Math.max(scale, 0), 1) * this.distance;
    let segment = this.#cumulativeDistances.findIndex(
      (distance, index) => index > 0 && targetDistance <= distance,
    );
    if (segment < 1) segment = this.points.length - 1;
    const from = pointAt(this.points, segment - 1);
    const to = pointAt(this.points, segment);
    const startDistance = this.#cumulativeDistances[segment - 1] ?? 0;
    const endDistance = this.#cumulativeDistances[segment] ?? this.distance;
    const local =
      endDistance === startDistance
        ? 1
        : (targetDistance - startDistance) / (endDistance - startDistance);
    this.x = from.x + (to.x - from.x) * local;
    this.y = from.y + (to.y - from.y) * local;
    this.syncObject();
  }
}

/** Constant-speed traversal of connected quadratic Bézier segments. @public */
export class FlxQuadPath extends FlxMotion {
  distance = 0;
  readonly points: PointLike[] = [];
  readonly #cumulativeDistances: number[] = [0];

  addPoint(x = 0, y = 0): this {
    requireFinite(x, 'Path x');
    requireFinite(y, 'Path y');
    this.points.push({ x, y });
    return this;
  }

  getPoint(index = 0): PointLike {
    if (this.points.length === 0)
      throw new Error('No path points have been added.');
    const normalized =
      ((index % this.points.length) + this.points.length) % this.points.length;
    return pointAt(this.points, normalized);
  }

  setMotion(durationOrSpeed = 1, useDuration = true): this {
    if (this.points.length < 3 || (this.points.length - 1) % 2 !== 0) {
      throw new RangeError(
        'A quadratic path requires an odd number of at least three points.',
      );
    }
    this.#rebuildDistances();
    if (this.distance === 0) {
      throw new RangeError('A quadratic path must have non-zero length.');
    }
    this.duration = durationFrom(this.distance, durationOrSpeed, useDuration);
    const first = pointAt(this.points, 0);
    this.x = first.x;
    this.y = first.y;
    this.syncObject();
    return this.start();
  }

  /** @internal */
  protected override applyScale(scale: number): void {
    const targetDistance = Math.min(Math.max(scale, 0), 1) * this.distance;
    let segment = this.#cumulativeDistances.findIndex(
      (distance, index) => index > 0 && targetDistance <= distance,
    );
    if (segment < 1) segment = this.#cumulativeDistances.length - 1;
    const startDistance = this.#cumulativeDistances[segment - 1] ?? 0;
    const endDistance = this.#cumulativeDistances[segment] ?? this.distance;
    const local =
      endDistance === startDistance
        ? 1
        : (targetDistance - startDistance) / (endDistance - startDistance);
    const pointIndex = (segment - 1) * 2;
    const point = quadraticPoint(
      pointAt(this.points, pointIndex),
      pointAt(this.points, pointIndex + 1),
      pointAt(this.points, pointIndex + 2),
      local,
    );
    this.x = point.x;
    this.y = point.y;
    this.syncObject();
  }

  #rebuildDistances(): void {
    this.distance = 0;
    this.#cumulativeDistances.length = 1;
    this.#cumulativeDistances[0] = 0;
    const segmentCount = (this.points.length - 1) / 2;
    for (let segment = 0; segment < segmentCount; segment += 1) {
      const pointIndex = segment * 2;
      this.distance += quadraticLength(
        pointAt(this.points, pointIndex),
        pointAt(this.points, pointIndex + 1),
        pointAt(this.points, pointIndex + 2),
      );
      this.#cumulativeDistances.push(this.distance);
    }
  }
}
