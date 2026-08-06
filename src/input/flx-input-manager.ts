import type { FlxContext } from '../core/flx-context';
import { Keyboard } from './keyboard';
import { Mouse } from './mouse';

/** Service token for deterministic keyboard and pointer input. @public */
export const FLX_INPUT_SERVICE = Symbol('flixel-pixi.input');

/** Input service consumed by the fixed-step game loop. @public */
export interface FlxInputService {
  readonly keys: Keyboard;
  readonly mouse: Mouse;
  resetInput(): void;
  updateInput(): void;
}

/** Browser event targets used by {@link FlxInputManager}. @public */
export interface FlxInputManagerOptions {
  readonly keyboardTarget?: Window;
  readonly pointerTarget?: HTMLElement;
}

/** Owns DOM listeners and publishes their events only on simulation steps. @public */
export class FlxInputManager implements FlxInputService {
  readonly keys = new Keyboard();
  readonly mouse: Mouse;

  readonly #context: FlxContext;
  readonly #keyboardTarget: Window | null;
  readonly #pointerTarget: HTMLElement | null;
  readonly #pointerButtons = new Map<number, number>();
  #destroyed = false;

  constructor(context: FlxContext, options: FlxInputManagerOptions = {}) {
    const installed = context.getService<FlxInputService>(FLX_INPUT_SERVICE);
    if (installed !== undefined) {
      throw new Error('An input service is already installed in this context.');
    }
    this.#context = context;
    this.#keyboardTarget = options.keyboardTarget ?? null;
    this.#pointerTarget = options.pointerTarget ?? null;
    this.mouse = new Mouse(context);
    context.setService(FLX_INPUT_SERVICE, this);
    this.#attach();
  }

  updateInput(): void {
    this.#assertUsable();
    this.keys.update();
    this.mouse.update();
  }

  resetInput(): void {
    this.#assertUsable();
    this.keys.reset();
    this.mouse.reset();
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#detach();
    if (this.#context.getService(FLX_INPUT_SERVICE) === this) {
      this.#context.removeService(FLX_INPUT_SERVICE);
    }
    this.keys.destroy();
    this.mouse.destroy();
  }

  readonly #keyDown = (event: KeyboardEvent): void => {
    this.keys.handleKeyDown(event);
  };

  readonly #keyUp = (event: KeyboardEvent): void => {
    this.keys.handleKeyUp(event);
  };

  readonly #pointerMove = (event: PointerEvent): void => {
    const point = this.#logicalPoint(event);
    this.mouse.handlePointerMove({ ...point, pointerId: event.pointerId });
  };

  readonly #pointerDown = (event: PointerEvent): void => {
    const point = this.#logicalPoint(event);
    this.#pointerButtons.set(event.pointerId, event.button);
    this.mouse.handlePointerDown({
      ...point,
      button: event.button,
      pointerId: event.pointerId,
    });
    try {
      this.#pointerTarget?.setPointerCapture(event.pointerId);
    } catch {
      // The pointer may already have ended between dispatch and capture.
    }
  };

  readonly #pointerUp = (event: PointerEvent): void => {
    const point = this.#logicalPoint(event);
    this.mouse.handlePointerUp({
      ...point,
      button: this.#pointerButtons.get(event.pointerId) ?? event.button,
      pointerId: event.pointerId,
    });
    this.#pointerButtons.delete(event.pointerId);
    this.#releasePointerCapture(event.pointerId);
  };

  readonly #pointerCancel = (event: PointerEvent): void => {
    const point = this.#logicalPoint(event);
    this.mouse.handlePointerCancel({
      ...point,
      button:
        this.#pointerButtons.get(event.pointerId) ??
        (event.button >= 0 ? event.button : 0),
      pointerId: event.pointerId,
    });
    this.#pointerButtons.delete(event.pointerId);
    this.#releasePointerCapture(event.pointerId);
  };

  readonly #lostPointerCapture = (event: PointerEvent): void => {
    const button = this.#pointerButtons.get(event.pointerId);
    if (button === undefined) return;
    const point = this.#logicalPoint(event);
    this.mouse.handlePointerCancel({
      ...point,
      button,
      pointerId: event.pointerId,
    });
    this.#pointerButtons.delete(event.pointerId);
  };

  readonly #wheel = (event: WheelEvent): void => {
    this.mouse.handleWheel(Math.sign(-event.deltaY));
  };

  readonly #cancelAll = (): void => {
    this.#pointerButtons.clear();
    this.keys.releaseAll();
    this.mouse.releaseAll(true);
  };

  readonly #visibilityChange = (): void => {
    if (document.visibilityState === 'hidden') this.#cancelAll();
  };

  readonly #contextMenu = (event: MouseEvent): void => {
    event.preventDefault();
    this.#cancelAll();
  };

  #attach(): void {
    const keyboard = this.#keyboardTarget;
    const pointer = this.#pointerTarget;
    keyboard?.addEventListener('keydown', this.#keyDown);
    keyboard?.addEventListener('keyup', this.#keyUp);
    keyboard?.addEventListener('blur', this.#cancelAll);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.#visibilityChange);
    }
    pointer?.addEventListener('pointermove', this.#pointerMove);
    pointer?.addEventListener('pointerdown', this.#pointerDown);
    pointer?.addEventListener('pointerup', this.#pointerUp);
    pointer?.addEventListener('pointercancel', this.#pointerCancel);
    pointer?.addEventListener('lostpointercapture', this.#lostPointerCapture);
    pointer?.addEventListener('wheel', this.#wheel, { passive: true });
    pointer?.addEventListener('contextmenu', this.#contextMenu);
    this.mouse.setCursorSink((cursor) => {
      if (pointer !== null) pointer.style.cursor = cursor;
    });
  }

  #detach(): void {
    const keyboard = this.#keyboardTarget;
    const pointer = this.#pointerTarget;
    keyboard?.removeEventListener('keydown', this.#keyDown);
    keyboard?.removeEventListener('keyup', this.#keyUp);
    keyboard?.removeEventListener('blur', this.#cancelAll);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.#visibilityChange);
    }
    pointer?.removeEventListener('pointermove', this.#pointerMove);
    pointer?.removeEventListener('pointerdown', this.#pointerDown);
    pointer?.removeEventListener('pointerup', this.#pointerUp);
    pointer?.removeEventListener('pointercancel', this.#pointerCancel);
    pointer?.removeEventListener(
      'lostpointercapture',
      this.#lostPointerCapture,
    );
    pointer?.removeEventListener('wheel', this.#wheel);
    pointer?.removeEventListener('contextmenu', this.#contextMenu);
    this.mouse.setCursorSink(null);
  }

  #logicalPoint(event: MouseEvent): { x: number; y: number } {
    const pointer = this.#pointerTarget;
    if (pointer === null) return { x: event.clientX, y: event.clientY };
    const bounds = pointer.getBoundingClientRect();
    return {
      x:
        bounds.width === 0
          ? 0
          : ((event.clientX - bounds.left) * this.#context.width) /
            bounds.width,
      y:
        bounds.height === 0
          ? 0
          : ((event.clientY - bounds.top) * this.#context.height) /
            bounds.height,
    };
  }

  #releasePointerCapture(pointerId: number): void {
    try {
      if (this.#pointerTarget?.hasPointerCapture(pointerId) === true) {
        this.#pointerTarget.releasePointerCapture(pointerId);
      }
    } catch {
      // Releasing an already-ended pointer is harmless.
    }
  }

  #assertUsable(): void {
    if (this.#destroyed) throw new Error('FlxInputManager has been destroyed.');
  }
}
