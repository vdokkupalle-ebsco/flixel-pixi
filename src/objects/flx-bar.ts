import { FlxBarRenderHandle } from '../rendering/flx-bar-render-handle';
import { FlxObject } from './flx-object';
import { FlxSprite } from './flx-sprite';

/** Supported `FlxBar` fill directions. @public */
export type FlxBarFillDirection = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Callback invoked when a bar first reaches one of its range limits. @public */
export type FlxBarCallback = () => void;

/** Numeric value provider used by a bound bar. @public */
export type FlxBarValueProvider = () => number;

function requireFinite(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite.`);
  return value;
}

function requireDimension(value: number, name: string): number {
  requireFinite(value, name);
  if (value <= 0) throw new RangeError(`${name} must be greater than zero.`);
  return value;
}

/**
 * Deterministic value bar with renderer-owned fill geometry.
 *
 * The optional parent/property binding is read once per fixed update. Rendering
 * never regenerates textures when the value changes.
 * @public
 */
export class FlxBar extends FlxSprite {
  static readonly LEFT_TO_RIGHT = 0;
  static readonly RIGHT_TO_LEFT = 1;
  static readonly TOP_TO_BOTTOM = 2;
  static readonly BOTTOM_TO_TOP = 3;
  static readonly HORIZONTAL_INSIDE_OUT = 4;
  static readonly HORIZONTAL_OUTSIDE_IN = 5;
  static readonly VERTICAL_INSIDE_OUT = 6;
  static readonly VERTICAL_OUTSIDE_IN = 7;

  emptyCallback: FlxBarCallback | null = null;
  filledCallback: FlxBarCallback | null = null;
  killOnEmpty = false;
  #direction: FlxBarFillDirection = FlxBar.LEFT_TO_RIGHT;
  #emptyColor = 0x263248ff;
  #fillColor = 0x4ade80ff;
  #borderColor = 0xe2e8f0ff;
  #showBorder: boolean;
  #minimum = 0;
  #maximum = 100;
  #value = 0;
  #parent: object | null = null;
  #parentVariable = '';
  #provider: FlxBarValueProvider | null = null;
  #wasEmpty = true;
  #wasFull = false;

  constructor(
    x = 0,
    y = 0,
    direction: FlxBarFillDirection = FlxBar.LEFT_TO_RIGHT,
    width = 100,
    height = 10,
    parent: object | null = null,
    variable = '',
    minimum = 0,
    maximum = 100,
    showBorder = false,
  ) {
    super(x, y);
    this.direction = direction;
    this.#showBorder = showBorder;
    this.width = requireDimension(width, 'Bar width');
    this.height = requireDimension(height, 'Bar height');
    this.frameWidth = this.width;
    this.frameHeight = this.height;
    this.origin.make(this.width * 0.5, this.height * 0.5);
    this.allowCollisions = FlxObject.NONE;
    this.setRange(minimum, maximum);
    if (parent !== null || variable.length > 0) {
      this.trackParent(parent, variable);
    }
  }

  get direction(): FlxBarFillDirection {
    return this.#direction;
  }

  set direction(value: FlxBarFillDirection) {
    if (!Number.isInteger(value) || value < 0 || value > 7) {
      throw new RangeError('Bar direction must be an FlxBar fill constant.');
    }
    if (value === this.#direction) return;
    this.#direction = value;
    this.#changed();
  }

  get minimum(): number {
    return this.#minimum;
  }

  get maximum(): number {
    return this.#maximum;
  }

  get value(): number {
    return this.#value;
  }

  set value(value: number) {
    requireFinite(value, 'Bar value');
    const next = Math.max(this.#minimum, Math.min(this.#maximum, value));
    if (next === this.#value) return;
    this.#value = next;
    this.#handleLimits();
    this.#changed();
  }

  /** Current value normalized to the inclusive range, from 0 through 1. */
  get fraction(): number {
    return (this.#value - this.#minimum) / (this.#maximum - this.#minimum);
  }

  /** Current value as a percentage from 0 through 100. */
  get percent(): number {
    return this.fraction * 100;
  }

  /** Packed `0xRRGGBBAA` empty/background color. */
  get emptyColor(): number {
    return this.#emptyColor;
  }

  /** Packed `0xRRGGBBAA` fill color. */
  get fillColor(): number {
    return this.#fillColor;
  }

  /** Packed `0xRRGGBBAA` border color. */
  get borderColor(): number {
    return this.#borderColor;
  }

  get showBorder(): boolean {
    return this.#showBorder;
  }

  setRange(minimum: number, maximum: number): this {
    requireFinite(minimum, 'Bar minimum');
    requireFinite(maximum, 'Bar maximum');
    if (maximum <= minimum) {
      throw new RangeError('Bar maximum must be greater than its minimum.');
    }
    this.#minimum = minimum;
    this.#maximum = maximum;
    this.#value = Math.max(minimum, Math.min(maximum, this.#value));
    this.#wasEmpty = this.#value <= minimum;
    this.#wasFull = this.#value >= maximum;
    this.#changed();
    return this;
  }

  createFilledBar(
    emptyColor = 0x263248ff,
    fillColor = 0x4ade80ff,
    showBorder = this.#showBorder,
    borderColor = 0xe2e8f0ff,
  ): this {
    this.#emptyColor = emptyColor >>> 0;
    this.#fillColor = fillColor >>> 0;
    this.#showBorder = showBorder;
    this.#borderColor = borderColor >>> 0;
    this.#changed();
    return this;
  }

  setCallbacks(
    emptyCallback: FlxBarCallback | null = null,
    filledCallback: FlxBarCallback | null = null,
    killOnEmpty = false,
  ): this {
    this.emptyCallback = emptyCallback;
    this.filledCallback = filledCallback;
    this.killOnEmpty = killOnEmpty;
    return this;
  }

  trackParent(parent: object | null, variable: string): this {
    if (parent === null && variable.length > 0) {
      throw new TypeError('A bar property binding requires a parent object.');
    }
    this.#parent = parent;
    this.#parentVariable = variable;
    this.#provider = null;
    return this;
  }

  setValueProvider(provider: FlxBarValueProvider | null): this {
    this.#provider = provider;
    this.#parent = null;
    this.#parentVariable = '';
    return this;
  }

  override update(): void {
    const boundValue = this.#readBoundValue();
    if (boundValue !== null) this.value = boundValue;
  }

  override createRenderHandle(): FlxBarRenderHandle {
    return this.trackRenderHandle((onDestroy) => {
      return new FlxBarRenderHandle(this, onDestroy);
    });
  }

  override destroy(): void {
    this.#parent = null;
    this.#provider = null;
    this.emptyCallback = null;
    this.filledCallback = null;
    super.destroy();
  }

  #readBoundValue(): number | null {
    if (this.#provider !== null)
      return requireFinite(this.#provider(), 'Bar value');
    if (this.#parent === null || this.#parentVariable.length === 0) return null;
    const value = (this.#parent as Record<string, unknown>)[
      this.#parentVariable
    ];
    if (typeof value !== 'number') {
      throw new TypeError(
        `Bound bar property "${this.#parentVariable}" must be numeric.`,
      );
    }
    return requireFinite(value, 'Bound bar value');
  }

  #handleLimits(): void {
    const empty = this.#value <= this.#minimum;
    const full = this.#value >= this.#maximum;
    if (empty && !this.#wasEmpty) {
      this.emptyCallback?.();
      if (this.killOnEmpty) this.kill();
    }
    if (full && !this.#wasFull) this.filledCallback?.();
    this.#wasEmpty = empty;
    this.#wasFull = full;
  }

  #changed(): void {
    this.dirty = true;
    this.syncRenderHandles();
  }
}
