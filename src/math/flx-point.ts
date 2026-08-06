/** A mutable point shape accepted by Flash-compatibility copy helpers. @public */
export interface PointLike {
  x: number;
  y: number;
}

/** Stores a two-dimensional floating-point coordinate. @public */
export class FlxPoint implements PointLike {
  constructor(
    public x = 0,
    public y = 0,
  ) {}

  /** Reuses this point with new coordinates. */
  make(x = 0, y = 0): this {
    this.x = x;
    this.y = y;
    return this;
  }

  /** Copies another point into this instance. */
  copyFrom(point: PointLike): this {
    this.x = point.x;
    this.y = point.y;
    return this;
  }

  /** Copies this point into the supplied mutable target. */
  copyTo<T extends PointLike>(point: T): T {
    point.x = this.x;
    point.y = this.y;
    return point;
  }

  /** Browser replacement for copying from `flash.geom.Point`. */
  copyFromFlash(point: PointLike): this {
    return this.copyFrom(point);
  }

  /** Browser replacement for copying to `flash.geom.Point`. */
  copyToFlash<T extends PointLike>(point: T): T {
    return this.copyTo(point);
  }
}
