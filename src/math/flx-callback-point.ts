import { FlxPoint, type PointLike } from './flx-point';

/** Internal point that reports completed mutations to a composite owner. */
export class FlxCallbackPoint extends FlxPoint {
  readonly #changed: (point: FlxCallbackPoint) => void;
  #batching = false;

  constructor(
    x: number,
    y: number,
    changed: (point: FlxCallbackPoint) => void,
  ) {
    super(x, y);
    this.#changed = changed;
    let pointX = this.x;
    let pointY = this.y;
    Object.defineProperties(this, {
      x: {
        configurable: true,
        enumerable: true,
        get: () => pointX,
        set: (value: number) => {
          if (pointX === value) return;
          pointX = value;
          if (!this.#batching) this.#changed(this);
        },
      },
      y: {
        configurable: true,
        enumerable: true,
        get: () => pointY,
        set: (value: number) => {
          if (pointY === value) return;
          pointY = value;
          if (!this.#batching) this.#changed(this);
        },
      },
    });
  }

  override make(x = 0, y = 0): this {
    return this.#setTogether(x, y);
  }

  override copyFrom(point: PointLike): this {
    return this.#setTogether(point.x, point.y);
  }

  #setTogether(x: number, y: number): this {
    if (this.x === x && this.y === y) return this;
    this.#batching = true;
    this.x = x;
    this.y = y;
    this.#batching = false;
    this.#changed(this);
    return this;
  }
}
