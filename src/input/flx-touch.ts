import type { FlxCamera } from '../core/flx-camera';
import type { FlxContext } from '../core/flx-context';
import { FlxPoint } from '../math/flx-point';

/** Minimal touch-pointer event accepted by the deterministic input queue. @public */
export interface FlxTouchEventLike {
  readonly isPrimary?: boolean;
  readonly pointerId: number;
  readonly pressure?: number;
  readonly x: number;
  readonly y: number;
}

/** Serializable touch state for one simulation frame. @public */
export interface FlxTouchFrameRecord {
  readonly age: number;
  readonly cancelled: boolean;
  readonly isPrimary: boolean;
  readonly pointerId: number;
  readonly pressure: number;
  readonly startX: number;
  readonly startY: number;
  readonly state: number;
  readonly x: number;
  readonly y: number;
}

/** Cardinal direction of a recognized swipe. @public */
export type FlxSwipeDirection = 'down' | 'left' | 'right' | 'up';

/** A swipe published for the simulation step in which its touch ends. @public */
export interface FlxSwipe {
  readonly direction: FlxSwipeDirection;
  readonly distance: number;
  readonly duration: number;
  readonly endX: number;
  readonly endY: number;
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
}

/** Swipe recognition thresholds measured in logical pixels and simulation steps. @public */
export interface FlxTouchOptions {
  readonly maximumSwipeDuration?: number;
  readonly minimumSwipeDistance?: number;
}

type TouchEvent =
  | {
      readonly kind: 'move';
      readonly pointerId: number;
      readonly pressure: number;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly cancelled: boolean;
      readonly down: boolean;
      readonly isPrimary: boolean;
      readonly kind: 'transition';
      readonly pointerId: number;
      readonly pressure: number;
      readonly x: number;
      readonly y: number;
    };

/** State of one browser touch pointer. @public */
export class FlxTouch extends FlxPoint {
  startX = 0;
  startY = 0;
  pressure = 0;
  age = 0;
  isPrimary = false;
  cancelled = false;
  /** @internal */
  state = 0;

  readonly pointerId: number;
  readonly #context: FlxContext;

  constructor(context: FlxContext, pointerId: number) {
    super();
    this.#context = context;
    this.pointerId = pointerId;
  }

  get pressed(): boolean {
    return this.state > 0;
  }
  get justPressed(): boolean {
    return this.state === 2;
  }
  get justReleased(): boolean {
    return this.state === -1;
  }
  get justCancelled(): boolean {
    return this.state === -1 && this.cancelled;
  }

  getWorldPosition(
    camera: FlxCamera = this.#context.camera,
    point: FlxPoint = new FlxPoint(),
  ): FlxPoint {
    return camera.screenToWorld(this, point);
  }

  /** @internal */
  begin(x: number, y: number, pressure: number, isPrimary: boolean): void {
    this.make(x, y);
    this.startX = x;
    this.startY = y;
    this.pressure = pressure;
    this.isPrimary = isPrimary;
    this.cancelled = false;
    this.age = 0;
    this.state = 2;
  }

  /** @internal */
  move(x: number, y: number, pressure: number): void {
    this.make(x, y);
    this.pressure = pressure;
  }
}

/** Deterministic multi-touch tracker with step-based swipe recognition. @public */
export class FlxTouchManager {
  readonly minimumSwipeDistance: number;
  readonly maximumSwipeDuration: number;
  readonly #context: FlxContext;
  readonly #queue: TouchEvent[] = [];
  readonly #touches = new Map<number, FlxTouch>();
  #swipes: FlxSwipe[] = [];
  #destroyed = false;

  constructor(context: FlxContext, options: FlxTouchOptions = {}) {
    this.#context = context;
    this.minimumSwipeDistance = options.minimumSwipeDistance ?? 24;
    this.maximumSwipeDuration = options.maximumSwipeDuration ?? 30;
    if (
      !Number.isFinite(this.minimumSwipeDistance) ||
      this.minimumSwipeDistance < 0
    )
      throw new RangeError(
        'minimumSwipeDistance must be a non-negative finite number.',
      );
    if (
      !Number.isInteger(this.maximumSwipeDuration) ||
      this.maximumSwipeDuration < 1
    )
      throw new RangeError('maximumSwipeDuration must be a positive integer.');
  }

  get active(): readonly FlxTouch[] {
    return [...this.#touches.values()].filter((touch) => touch.pressed);
  }
  get swipes(): readonly FlxSwipe[] {
    return this.#swipes;
  }
  get firstActive(): FlxTouch | null {
    return this.active[0] ?? null;
  }
  get(pointerId: number): FlxTouch | null {
    return this.#touches.get(pointerId) ?? null;
  }

  update(): void {
    this.#assertUsable();
    this.#swipes = [];
    for (const [pointerId, touch] of this.#touches) {
      if (touch.state === -1) this.#touches.delete(pointerId);
      else if (touch.state === 2) {
        touch.state = 1;
        touch.age += 1;
      } else if (touch.state === 1) touch.age += 1;
      touch.cancelled = false;
    }
    const transitioned = new Set<number>();
    const deferred: TouchEvent[] = [];
    for (const event of this.#queue) {
      if (event.kind === 'move') {
        this.#touches
          .get(event.pointerId)
          ?.move(event.x, event.y, event.pressure);
        continue;
      }
      if (transitioned.has(event.pointerId)) {
        deferred.push(event);
        continue;
      }
      if (event.down) {
        const touch =
          this.#touches.get(event.pointerId) ??
          new FlxTouch(this.#context, event.pointerId);
        touch.begin(event.x, event.y, event.pressure, event.isPrimary);
        this.#touches.set(event.pointerId, touch);
      } else {
        const touch = this.#touches.get(event.pointerId);
        if (touch?.pressed) {
          touch.move(event.x, event.y, 0);
          touch.state = -1;
          touch.cancelled = event.cancelled;
          if (!event.cancelled) this.#recognizeSwipe(touch);
        }
      }
      transitioned.add(event.pointerId);
    }
    this.#queue.length = 0;
    this.#queue.push(...deferred);
  }

  handlePointerDown(event: FlxTouchEventLike): void {
    this.#transition(event, true, false);
  }
  handlePointerUp(event: FlxTouchEventLike): void {
    this.#transition(event, false, false);
  }
  handlePointerCancel(event: FlxTouchEventLike): void {
    this.#transition(event, false, true);
  }
  handlePointerMove(event: FlxTouchEventLike): void {
    this.#queue.push({
      kind: 'move',
      pointerId: event.pointerId,
      pressure: event.pressure ?? 0,
      x: event.x,
      y: event.y,
    });
  }

  releaseAll(): void {
    this.#queue.length = 0;
    for (const touch of this.#touches.values())
      if (touch.pressed) this.handlePointerCancel(touch);
  }

  record(): FlxTouchFrameRecord[] {
    return [...this.#touches.values()].map((touch) => ({
      age: touch.age,
      cancelled: touch.cancelled,
      isPrimary: touch.isPrimary,
      pointerId: touch.pointerId,
      pressure: touch.pressure,
      startX: touch.startX,
      startY: touch.startY,
      state: touch.state,
      x: touch.x,
      y: touch.y,
    }));
  }

  playback(records: readonly FlxTouchFrameRecord[]): void {
    this.reset();
    for (const record of records) {
      const touch = new FlxTouch(this.#context, record.pointerId);
      touch.begin(
        record.startX,
        record.startY,
        record.pressure,
        record.isPrimary,
      );
      touch.move(record.x, record.y, record.pressure);
      touch.age = record.age;
      touch.cancelled = record.cancelled;
      touch.state = record.state;
      this.#touches.set(record.pointerId, touch);
      if (touch.justReleased && !touch.cancelled) this.#recognizeSwipe(touch);
    }
  }

  reset(): void {
    this.#queue.length = 0;
    this.#touches.clear();
    this.#swipes = [];
  }
  destroy(): void {
    if (this.#destroyed) return;
    this.reset();
    this.#destroyed = true;
  }

  #transition(
    event: FlxTouchEventLike,
    down: boolean,
    cancelled: boolean,
  ): void {
    this.#queue.push({
      cancelled,
      down,
      isPrimary: event.isPrimary ?? false,
      kind: 'transition',
      pointerId: event.pointerId,
      pressure: event.pressure ?? (down ? 1 : 0),
      x: event.x,
      y: event.y,
    });
  }

  #recognizeSwipe(touch: FlxTouch): void {
    const dx = touch.x - touch.startX;
    const dy = touch.y - touch.startY;
    const distance = Math.hypot(dx, dy);
    if (
      distance < this.minimumSwipeDistance ||
      touch.age > this.maximumSwipeDuration
    )
      return;
    const direction: FlxSwipeDirection =
      Math.abs(dx) >= Math.abs(dy)
        ? dx < 0
          ? 'left'
          : 'right'
        : dy < 0
          ? 'up'
          : 'down';
    this.#swipes.push({
      direction,
      distance,
      duration: touch.age,
      endX: touch.x,
      endY: touch.y,
      pointerId: touch.pointerId,
      startX: touch.startX,
      startY: touch.startY,
    });
  }

  #assertUsable(): void {
    if (this.#destroyed) throw new Error('FlxTouchManager has been destroyed.');
  }
}
