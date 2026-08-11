import type { FlxCamera } from '../core/flx-camera';
import { FlxG } from '../core/flx-g';
import type {
  FlxActionVirtualStickAxisSource,
  FlxActions,
} from '../input/flx-actions';
import type { FlxTouch } from '../input/flx-touch';
import {
  type FlxVirtualInput,
  type FlxVirtualStickState,
  normalizeVirtualInputId,
} from '../input/flx-virtual-input';
import { FlxPoint } from '../math/flx-point';
import { FlxVirtualStickRenderHandle } from '../rendering/flx-virtual-stick-render-handle';
import { FlxObject } from './flx-object';
import { FlxSprite } from './flx-sprite';

/** Visual and response configuration for {@link FlxVirtualStick}. @public */
export interface FlxVirtualStickOptions {
  /** Radial dead zone remapped to the remaining range. Default `0.15`. */
  readonly deadZone?: number;
  /** Outer control radius in logical pixels. Default `56`. */
  readonly radius?: number;
  /** Movable thumb radius in logical pixels. Default `40%` of `radius`. */
  readonly knobRadius?: number;
  readonly baseColor?: number;
  readonly knobColor?: number;
  readonly pressedKnobColor?: number;
  readonly outlineColor?: number;
}

/** Maps the stick's normalized axes to scalar action names. @public */
export interface FlxVirtualStickAxisMap {
  readonly horizontal?: string;
  readonly vertical?: string;
}

/**
 * Texture-free HUD analog stick derived from authoritative fixed-step pointer state.
 * @public
 */
export class FlxVirtualStick extends FlxSprite implements FlxVirtualStickState {
  readonly virtualInputId: string;
  readonly radius: number;
  readonly knobRadius: number;
  readonly deadZone: number;
  baseColor: number;
  knobColor: number;
  pressedKnobColor: number;
  outlineColor: number;

  #x = 0;
  #y = 0;
  #rawX = 0;
  #rawY = 0;
  #currentInputId: number | 'mouse' | null = null;
  #camera: FlxCamera | null = null;
  #destroyed = false;
  readonly #pointer = new FlxPoint();
  readonly #globalPointer = new FlxPoint();
  readonly #virtualInputs: FlxVirtualInput;

  constructor(
    id: string,
    x: number,
    y: number,
    options: FlxVirtualStickOptions = {},
  ) {
    const virtualInputId = normalizeVirtualInputId(id);
    const virtualInputs = FlxG.virtualInputs;
    if (
      virtualInputs.getButton(virtualInputId) !== null ||
      virtualInputs.getStick(virtualInputId) !== null
    ) {
      throw new Error(
        `Virtual input id "${virtualInputId}" is already registered.`,
      );
    }
    const radius = positive(options.radius ?? 56, 'Virtual stick radius');
    const knobRadius = positive(
      options.knobRadius ?? radius * 0.4,
      'Virtual stick knob radius',
    );
    if (knobRadius >= radius) {
      throw new RangeError(
        'Virtual stick knob radius must be less than radius.',
      );
    }
    const deadZone = options.deadZone ?? 0.15;
    if (!Number.isFinite(deadZone) || deadZone < 0 || deadZone >= 1) {
      throw new RangeError('Virtual stick dead zone must be in [0, 1).');
    }

    super(x, y);
    this.virtualInputId = virtualInputId;
    this.#virtualInputs = virtualInputs;
    this.radius = radius;
    this.knobRadius = knobRadius;
    this.deadZone = deadZone;
    this.baseColor = options.baseColor ?? 0x253654aa;
    this.knobColor = options.knobColor ?? 0x3b82f6dd;
    this.pressedKnobColor = options.pressedKnobColor ?? 0x1d4ed8ff;
    this.outlineColor = options.outlineColor ?? 0xffffffcc;
    this.width = radius * 2;
    this.height = radius * 2;
    this.frameWidth = this.width;
    this.frameHeight = this.height;
    this.origin.make(radius, radius);
    this.scrollFactor.make(0, 0);
    this.moves = false;
    this.allowCollisions = FlxObject.NONE;
    this.#virtualInputs.registerStick(this.virtualInputId, this);
  }

  /** Dead-zone-adjusted horizontal value in `[-1, 1]`. */
  get xAxis(): number {
    return this.#x;
  }

  /** Dead-zone-adjusted vertical value in `[-1, 1]`. */
  get yAxis(): number {
    return this.#y;
  }

  /** Clamped pre-dead-zone horizontal displacement used by the renderer. */
  get rawX(): number {
    return this.#rawX;
  }

  /** Clamped pre-dead-zone vertical displacement used by the renderer. */
  get rawY(): number {
    return this.#rawY;
  }

  get pressed(): boolean {
    return this.#currentInputId !== null;
  }

  /** Create a serializable scalar action source for one axis. */
  source(axis: 'x' | 'y'): FlxActionVirtualStickAxisSource {
    return { axis, device: 'virtual-stick-axis', id: this.virtualInputId };
  }

  /** Add both available axes to an existing keyboard/gamepad action map. */
  bindAxes(actions: FlxActions, map: FlxVirtualStickAxisMap): this {
    if (map.horizontal !== undefined) {
      actions.addSource(map.horizontal, this.source('x'));
    }
    if (map.vertical !== undefined) {
      actions.addSource(map.vertical, this.source('y'));
    }
    return this;
  }

  /** @internal */
  updateVirtualInput(): void {
    if (!this.active || !this.exists || !this.visible) {
      this.#reset();
      return;
    }
    if (this.#currentInputId !== null) {
      this.#updateCapturedInput();
      return;
    }
    if (this.#tryCaptureMouse()) return;
    for (const touch of FlxG.touches.active) {
      if (
        !touch.isPrimary &&
        touch.justPressed &&
        this.#tryCaptureTouch(touch)
      ) {
        return;
      }
    }
  }

  override update(): void {
    // Input advances centrally after live or replayed pointer state is ready.
  }

  override createRenderHandle(): FlxVirtualStickRenderHandle {
    return this.trackRenderHandle((onDestroy) => {
      return new FlxVirtualStickRenderHandle(this, onDestroy);
    });
  }

  override destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#virtualInputs.unregisterStick(this.virtualInputId, this);
    this.#reset();
    super.destroy();
  }

  #tryCaptureMouse(): boolean {
    const mouse = FlxG.mouse;
    if (!mouse.visible || !mouse.justPressed()) return false;
    mouse.getGlobalPosition(this.#globalPointer);
    for (const camera of this.cameras ?? FlxG.cameras) {
      if (
        !camera.exists ||
        !camera.visible ||
        !camera.containsScreenPoint(this.#globalPointer)
      ) {
        continue;
      }
      mouse.getWorldPosition(camera, this.#pointer);
      this.#applyScroll(camera, this.#pointer);
      if (!this.#contains(this.#pointer)) continue;
      this.#currentInputId = 'mouse';
      this.#camera = camera;
      this.#setFromPoint(this.#pointer);
      return true;
    }
    return false;
  }

  #tryCaptureTouch(touch: FlxTouch): boolean {
    for (const camera of this.cameras ?? FlxG.cameras) {
      if (
        !camera.exists ||
        !camera.visible ||
        !camera.containsScreenPoint(touch)
      ) {
        continue;
      }
      touch.getWorldPosition(camera, this.#pointer);
      this.#applyScroll(camera, this.#pointer);
      if (!this.#contains(this.#pointer)) continue;
      this.#currentInputId = touch.pointerId;
      this.#camera = camera;
      this.#setFromPoint(this.#pointer);
      return true;
    }
    return false;
  }

  #updateCapturedInput(): void {
    const camera = this.#camera;
    if (camera === null) {
      this.#reset();
      return;
    }
    if (this.#currentInputId === 'mouse') {
      const mouse = FlxG.mouse;
      if (!mouse.pressed()) {
        this.#reset();
        return;
      }
      mouse.getWorldPosition(camera, this.#pointer);
    } else {
      const touch = FlxG.touches.get(this.#currentInputId ?? -1);
      if (touch === null || !touch.pressed) {
        this.#reset();
        return;
      }
      touch.getWorldPosition(camera, this.#pointer);
    }
    this.#applyScroll(camera, this.#pointer);
    this.#setFromPoint(this.#pointer);
  }

  #contains(point: Readonly<FlxPoint>): boolean {
    return (
      Math.hypot(
        point.x - this.x - this.radius,
        point.y - this.y - this.radius,
      ) <= this.radius
    );
  }

  #setFromPoint(point: Readonly<FlxPoint>): void {
    const travel = this.radius - this.knobRadius;
    const dx = point.x - this.x - this.radius;
    const dy = point.y - this.y - this.radius;
    const distance = Math.hypot(dx, dy);
    const scale = distance > travel ? travel / distance : 1;
    this.#rawX = (dx * scale) / travel;
    this.#rawY = (dy * scale) / travel;
    const magnitude = Math.hypot(this.#rawX, this.#rawY);
    if (magnitude <= this.deadZone) {
      this.#x = 0;
      this.#y = 0;
      return;
    }
    const adjusted = (magnitude - this.deadZone) / (1 - this.deadZone);
    this.#x = (this.#rawX / magnitude) * adjusted;
    this.#y = (this.#rawY / magnitude) * adjusted;
  }

  #applyScroll(camera: FlxCamera, point: FlxPoint): void {
    point.x -= camera.scroll.x * (1 - this.scrollFactor.x);
    point.y -= camera.scroll.y * (1 - this.scrollFactor.y);
  }

  #reset(): void {
    this.#currentInputId = null;
    this.#camera = null;
    this.#x = 0;
    this.#y = 0;
    this.#rawX = 0;
    this.#rawY = 0;
  }
}

function positive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number.`);
  }
  return value;
}
