/** A mutable rectangle shape accepted by Flash-compatibility helpers. @public */
export interface RectangleLike {
  height: number;
  width: number;
  x: number;
  y: number;
}

/** Stores a mutable axis-aligned rectangle. @public */
export class FlxRect implements RectangleLike {
  constructor(
    public x = 0,
    public y = 0,
    public width = 0,
    public height = 0,
  ) {}

  get left(): number {
    return this.x;
  }

  get right(): number {
    return this.x + this.width;
  }

  get top(): number {
    return this.y;
  }

  get bottom(): number {
    return this.y + this.height;
  }

  /** Reuses this rectangle with new bounds. */
  make(x = 0, y = 0, width = 0, height = 0): this {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    return this;
  }

  /** Copies another rectangle into this instance. */
  copyFrom(rectangle: RectangleLike): this {
    this.x = rectangle.x;
    this.y = rectangle.y;
    this.width = rectangle.width;
    this.height = rectangle.height;
    return this;
  }

  /** Copies this rectangle into the supplied mutable target. */
  copyTo<T extends RectangleLike>(rectangle: T): T {
    rectangle.x = this.x;
    rectangle.y = this.y;
    rectangle.width = this.width;
    rectangle.height = this.height;
    return rectangle;
  }

  /** Browser replacement for copying from `flash.geom.Rectangle`. */
  copyFromFlash(rectangle: RectangleLike): this {
    return this.copyFrom(rectangle);
  }

  /** Browser replacement for copying to `flash.geom.Rectangle`. */
  copyToFlash<T extends RectangleLike>(rectangle: T): T {
    return this.copyTo(rectangle);
  }

  /** Tests strict-area overlap; touching edges do not overlap. */
  overlaps(rectangle: RectangleLike): boolean {
    return (
      rectangle.x + rectangle.width > this.x &&
      rectangle.x < this.right &&
      rectangle.y + rectangle.height > this.y &&
      rectangle.y < this.bottom
    );
  }
}
