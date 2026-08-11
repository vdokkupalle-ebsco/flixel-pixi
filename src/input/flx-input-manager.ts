import type { FlxContext } from '../core/flx-context';
import { Keyboard } from './keyboard';
import { Mouse } from './mouse';
import { FlxGamepadManager, type FlxGamepadProvider } from './flx-gamepad';
import { FlxTouchManager, type FlxTouchOptions } from './flx-touch';
import { getDomViewport } from './flx-dom-viewport';

/** Service token for deterministic keyboard and pointer input. @public */
export const FLX_INPUT_SERVICE = Symbol('flixel-pixi.input');

/** Input service consumed by the fixed-step game loop. @public */
export interface FlxInputService {
  readonly keys: Keyboard;
  readonly mouse: Mouse;
  readonly gamepads: FlxGamepadManager;
  readonly touches: FlxTouchManager;
  resetInput(): void;
  updateInput(): void;
}

/** Browser event targets used by {@link FlxInputManager}. @public */
export interface FlxInputManagerOptions {
  readonly keyboardTarget?: Window;
  readonly pointerTarget?: HTMLElement;
  readonly gamepadProvider?: FlxGamepadProvider;
  readonly touch?: FlxTouchOptions;
}

interface ActivePointer {
  readonly button: number;
  readonly legacyMouse: boolean;
  readonly touch: boolean;
}

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (typeof Element === 'undefined' || !(target instanceof Element)) {
    return false;
  }
  return (
    target.matches('input, textarea, select') ||
    target.closest('[contenteditable="true"]') !== null
  );
}

/** Owns DOM listeners and publishes their events only on simulation steps. @public */
export class FlxInputManager implements FlxInputService {
  readonly keys = new Keyboard();
  readonly mouse: Mouse;
  readonly gamepads: FlxGamepadManager;
  readonly touches: FlxTouchManager;

  readonly #context: FlxContext;
  readonly #keyboardTarget: Window | null;
  readonly #pointerTarget: HTMLElement | null;
  readonly #activePointers = new Map<number, ActivePointer>();
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
    this.gamepads = new FlxGamepadManager(options.gamepadProvider);
    this.touches = new FlxTouchManager(context, options.touch);
    context.setService(FLX_INPUT_SERVICE, this);
    this.#attach();
  }

  updateInput(): void {
    this.#assertUsable();
    this.keys.update();
    this.mouse.update();
    this.gamepads.update();
    this.touches.update();
  }

  resetInput(): void {
    this.#assertUsable();
    this.keys.reset();
    this.mouse.reset();
    this.gamepads.reset();
    this.touches.reset();
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
    this.gamepads.destroy();
    this.touches.destroy();
  }

  readonly #keyDown = (event: KeyboardEvent): void => {
    if (isTextEntryTarget(event.target)) return;
    this.keys.handleKeyDown(event);
  };

  readonly #keyUp = (event: KeyboardEvent): void => {
    this.keys.handleKeyUp(event);
  };

  readonly #pointerMove = (event: PointerEvent): void => {
    const point = this.#logicalPoint(event);
    if (event.pointerType === 'touch') {
      this.touches.handlePointerMove({
        ...point,
        isPrimary: event.isPrimary,
        pointerId: event.pointerId,
        pressure: event.pressure,
      });
    }
    if (event.pointerType !== 'touch' || event.isPrimary)
      this.mouse.handlePointerMove({ ...point, pointerId: event.pointerId });
  };

  readonly #pointerDown = (event: PointerEvent): void => {
    const point = this.#logicalPoint(event);
    const touch = event.pointerType === 'touch';
    const legacyMouse = !touch || event.isPrimary;
    this.#activePointers.set(event.pointerId, {
      button: event.button,
      legacyMouse,
      touch,
    });
    if (touch)
      this.touches.handlePointerDown({
        ...point,
        isPrimary: event.isPrimary,
        pointerId: event.pointerId,
        pressure: event.pressure,
      });
    if (legacyMouse)
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
    const active = this.#activePointers.get(event.pointerId);
    if (active?.touch)
      this.touches.handlePointerUp({
        ...point,
        isPrimary: event.isPrimary,
        pointerId: event.pointerId,
        pressure: event.pressure,
      });
    if (active?.legacyMouse ?? event.pointerType !== 'touch')
      this.mouse.handlePointerUp({
        ...point,
        button: active?.button ?? event.button,
        pointerId: event.pointerId,
      });
    this.#activePointers.delete(event.pointerId);
    this.#releasePointerCapture(event.pointerId);
  };

  readonly #pointerCancel = (event: PointerEvent): void => {
    const point = this.#logicalPoint(event);
    const active = this.#activePointers.get(event.pointerId);
    if (active?.touch)
      this.touches.handlePointerCancel({
        ...point,
        isPrimary: event.isPrimary,
        pointerId: event.pointerId,
        pressure: event.pressure,
      });
    if (active?.legacyMouse ?? event.pointerType !== 'touch')
      this.mouse.handlePointerCancel({
        ...point,
        button: active?.button ?? (event.button >= 0 ? event.button : 0),
        pointerId: event.pointerId,
      });
    this.#activePointers.delete(event.pointerId);
    this.#releasePointerCapture(event.pointerId);
  };

  readonly #lostPointerCapture = (event: PointerEvent): void => {
    const active = this.#activePointers.get(event.pointerId);
    if (active === undefined) return;
    const point = this.#logicalPoint(event);
    if (active.touch)
      this.touches.handlePointerCancel({
        ...point,
        isPrimary: event.isPrimary,
        pointerId: event.pointerId,
        pressure: event.pressure,
      });
    if (active.legacyMouse)
      this.mouse.handlePointerCancel({
        ...point,
        button: active.button,
        pointerId: event.pointerId,
      });
    this.#activePointers.delete(event.pointerId);
  };

  readonly #wheel = (event: WheelEvent): void => {
    this.mouse.handleWheel(Math.sign(-event.deltaY));
  };

  readonly #cancelAll = (): void => {
    this.#activePointers.clear();
    this.keys.releaseAll();
    this.mouse.releaseAll(true);
    this.gamepads.reset();
    this.touches.releaseAll();
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
    const viewport = getDomViewport(
      pointer,
      this.#context.width,
      this.#context.height,
    );
    return {
      x:
        viewport.scaleX === 0
          ? 0
          : (event.clientX - viewport.left) / viewport.scaleX,
      y:
        viewport.scaleY === 0
          ? 0
          : (event.clientY - viewport.top) / viewport.scaleY,
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
