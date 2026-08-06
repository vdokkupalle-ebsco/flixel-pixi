import type { FlxCamera } from '../core/flx-camera';
import type { FlxContext } from '../core/flx-context';
import { FlxPoint } from '../math/flx-point';

/** A recorded pointer snapshot compatible with deterministic replay. @public */
export interface FlxMouseRecord {
  readonly button: number;
  readonly wheel: number;
  readonly x: number;
  readonly y: number;
}

/** Minimal browser pointer event shape accepted by the deterministic queue. @public */
export interface FlxPointerEventLike {
  readonly button?: number;
  readonly pointerId?: number;
  readonly x: number;
  readonly y: number;
}

type MouseEvent =
  | { readonly kind: 'move'; readonly x: number; readonly y: number }
  | {
      readonly button: number;
      readonly cancelled: boolean;
      readonly down: boolean;
      readonly kind: 'button';
      readonly x: number;
      readonly y: number;
    }
  | { readonly delta: number; readonly kind: 'wheel' };

interface ButtonState {
  current: number;
  cancelled: boolean;
}

/** Deterministic pointer/mouse state with camera-aware coordinates. @public */
export class Mouse extends FlxPoint {
  wheel = 0;
  screenX = 0;
  screenY = 0;

  readonly #context: FlxContext;
  readonly #global = new FlxPoint();
  readonly #queue: MouseEvent[] = [];
  readonly #buttons = new Map<number, ButtonState>();
  #cursor = 'default';
  #visible = true;
  #cursorSink: ((cursor: string) => void) | null = null;
  #destroyed = false;

  constructor(context: FlxContext) {
    super();
    this.#context = context;
    for (let button = 0; button <= 4; button += 1) {
      this.#buttons.set(button, { cancelled: false, current: 0 });
    }
  }

  /** Publishes queued pointer changes for one authoritative simulation step. */
  update(): void {
    this.#assertUsable();
    this.wheel = 0;
    for (const state of this.#buttons.values()) {
      if (state.current === -1) state.current = 0;
      else if (state.current === 2) state.current = 1;
      state.cancelled = false;
    }

    const transitioned = new Set<number>();
    const deferred: MouseEvent[] = [];
    for (const event of this.#queue) {
      if (event.kind === 'wheel') {
        this.wheel += event.delta;
        continue;
      }
      if (event.kind === 'move') {
        this.#setGlobal(event.x, event.y);
        continue;
      }
      if (transitioned.has(event.button)) {
        deferred.push(event);
        continue;
      }
      this.#setGlobal(event.x, event.y);
      const state = this.#button(event.button);
      state.current = event.down
        ? state.current > 0
          ? 1
          : 2
        : state.current > 0
          ? -1
          : 0;
      state.cancelled = event.cancelled && state.current === -1;
      transitioned.add(event.button);
    }
    this.#queue.length = 0;
    this.#queue.push(...deferred);
    this.#updatePrimaryCoordinates();
  }

  handlePointerMove(event: FlxPointerEventLike): void {
    this.#queue.push({ kind: 'move', x: event.x, y: event.y });
  }

  handlePointerDown(event: FlxPointerEventLike): void {
    this.#queue.push({
      button: event.button ?? 0,
      cancelled: false,
      down: true,
      kind: 'button',
      x: event.x,
      y: event.y,
    });
  }

  handleMouseDown(event: FlxPointerEventLike): void {
    this.handlePointerDown(event);
  }

  handlePointerUp(event: FlxPointerEventLike): void {
    this.#queue.push({
      button: event.button ?? 0,
      cancelled: false,
      down: false,
      kind: 'button',
      x: event.x,
      y: event.y,
    });
  }

  handleMouseUp(event: FlxPointerEventLike): void {
    this.handlePointerUp(event);
  }

  handlePointerCancel(event: FlxPointerEventLike): void {
    this.#queue.push({
      button: event.button ?? 0,
      cancelled: true,
      down: false,
      kind: 'button',
      x: event.x,
      y: event.y,
    });
  }

  handleWheel(delta: number): void {
    if (Number.isFinite(delta) && delta !== 0) {
      this.#queue.push({ delta, kind: 'wheel' });
    }
  }

  handleMouseWheel(delta: number): void {
    this.handleWheel(delta);
  }

  pressed(button = 0): boolean {
    return (this.#buttons.get(button)?.current ?? 0) > 0;
  }

  justPressed(button = 0): boolean {
    return this.#buttons.get(button)?.current === 2;
  }

  justReleased(button = 0): boolean {
    return this.#buttons.get(button)?.current === -1;
  }

  justCancelled(button = 0): boolean {
    const state = this.#buttons.get(button);
    return state?.current === -1 && state.cancelled;
  }

  getWorldPosition(
    camera: FlxCamera = this.#context.camera,
    point: FlxPoint = new FlxPoint(),
  ): FlxPoint {
    return camera.screenToWorld(this.#global, point);
  }

  /** Copies logical canvas coordinates before camera transforms. */
  getGlobalPosition(point: FlxPoint = new FlxPoint()): FlxPoint {
    return point.copyFrom(this.#global);
  }

  /** Returns camera-local coordinates before zoom/rotation/viewport transforms. */
  getScreenPosition(
    camera: FlxCamera = this.#context.camera,
    point: FlxPoint = new FlxPoint(),
  ): FlxPoint {
    this.getWorldPosition(camera, point);
    point.x -= camera.scroll.x;
    point.y -= camera.scroll.y;
    return point;
  }

  record(): FlxMouseRecord {
    return {
      button: this.#button(0).current,
      wheel: this.wheel,
      x: this.#global.x,
      y: this.#global.y,
    };
  }

  playback(record: FlxMouseRecord): void {
    this.#assertUsable();
    this.#queue.length = 0;
    for (const state of this.#buttons.values()) {
      state.current = 0;
      state.cancelled = false;
    }
    this.#button(0).current = record.button;
    this.wheel = record.wheel;
    this.#setGlobal(record.x, record.y);
    this.#updatePrimaryCoordinates();
  }

  /** Queues releases for published buttons and discards unpublished input. */
  releaseAll(cancelled = true): void {
    this.#queue.length = 0;
    for (const [button, state] of this.#buttons) {
      if (state.current <= 0) continue;
      this.#queue.push({
        button,
        cancelled,
        down: false,
        kind: 'button',
        x: this.#global.x,
        y: this.#global.y,
      });
    }
  }

  reset(): void {
    this.#assertUsable();
    this.#queue.length = 0;
    this.wheel = 0;
    for (const state of this.#buttons.values()) {
      state.current = 0;
      state.cancelled = false;
    }
  }

  show(): void {
    this.#visible = true;
    this.#publishCursor();
  }

  hide(): void {
    this.#visible = false;
    this.#publishCursor();
  }

  load(cursorUrl: string, xOffset = 0, yOffset = 0): void {
    if (cursorUrl.length === 0)
      throw new RangeError('Cursor URL cannot be empty.');
    this.#cursor = `url("${cursorUrl.replaceAll('"', '\\"')}") ${Math.trunc(xOffset)} ${Math.trunc(yOffset)}, auto`;
    this.#publishCursor();
  }

  unload(): void {
    this.#cursor = 'default';
    this.#publishCursor();
  }

  get visible(): boolean {
    return this.#visible;
  }

  get cursor(): string {
    return this.#visible ? this.#cursor : 'none';
  }

  /** @internal */
  setCursorSink(sink: ((cursor: string) => void) | null): void {
    this.#cursorSink = sink;
    this.#publishCursor();
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#queue.length = 0;
    this.#buttons.clear();
    this.#cursorSink = null;
  }

  #setGlobal(x: number, y: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    this.#global.make(x, y);
  }

  #updatePrimaryCoordinates(): void {
    this.getWorldPosition(this.#context.camera, this);
    const screen = this.getScreenPosition(this.#context.camera);
    this.screenX = screen.x;
    this.screenY = screen.y;
  }

  #button(button: number): ButtonState {
    let state = this.#buttons.get(button);
    if (state === undefined) {
      state = { cancelled: false, current: 0 };
      this.#buttons.set(button, state);
    }
    return state;
  }

  #publishCursor(): void {
    this.#cursorSink?.(this.cursor);
  }

  #assertUsable(): void {
    if (this.#destroyed) throw new Error('Mouse has been destroyed.');
  }
}
