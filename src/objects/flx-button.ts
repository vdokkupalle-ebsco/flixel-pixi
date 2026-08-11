import type { FlxCamera } from '../core/flx-camera';
import { FlxGraphic } from '../assets/flx-graphic';
import { makeGraphicPixels } from '../compat/pixel-buffer';
import { FlxG } from '../core/flx-g';
import type { FlxTouch } from '../input/flx-touch';
import { FlxPoint } from '../math/flx-point';
import { FlxButtonRenderHandle } from '../rendering/flx-button-render-handle';
import type { FlxRenderHandle } from '../rendering/flx-render-handle';
import { FlxObject } from './flx-object';
import { FlxSprite } from './flx-sprite';
import { FlxText } from './flx-text';

/** Callback invoked by a button transition. @public */
export type FlxButtonCallback = () => void;

/** Sound-like hook accepted without coupling the button to an audio backend. @public */
export interface FlxButtonSound {
  destroy?(): void;
  play(forceRestart?: boolean): unknown;
}

interface FlxButtonInput {
  readonly id: number | 'mouse';
  readonly justCancelled: boolean;
  readonly justPressed: boolean;
  readonly justReleased: boolean;
  readonly pressed: boolean;
  getWorldPosition(camera: FlxCamera, point: FlxPoint): FlxPoint;
}

function makeDefaultButtonGraphic(): FlxGraphic {
  const width = 80;
  const frameHeight = 20;
  const colors = [0x31415cff, 0x466384ff, 0x243247ff, 0x1a2230ff];
  const pixels = makeGraphicPixels(width, frameHeight * colors.length, 0);
  for (let frame = 0; frame < colors.length; frame += 1) {
    for (let y = 0; y < frameHeight; y += 1) {
      for (let x = 0; x < width; x += 1) {
        pixels.data[(frame * frameHeight + y) * width + x] = colors[
          frame
        ] as number;
      }
    }
  }
  return FlxGraphic.fromPixels(pixels, 'flx-button-default');
}

/** Deterministic Flixel button with optional toggle and native accessibility hooks. @public */
export class FlxButton extends FlxSprite {
  static readonly NORMAL = 0;
  static readonly HIGHLIGHT = 1;
  static readonly PRESSED = 2;
  static readonly DISABLED = 3;

  label: FlxText | null;
  /** Label offsets for normal, highlight, pressed, and disabled states. */
  readonly labelOffsets = [
    new FlxPoint(-1, 3),
    new FlxPoint(-1, 3),
    new FlxPoint(-1, 4),
    new FlxPoint(-1, 3),
  ];
  /** Label alpha multipliers for normal, highlight, pressed, and disabled states. */
  readonly labelAlphas = [0.8, 1, 0.5, 0.3];
  /** Primary label offset used by legacy AS3 callers. */
  readonly labelOffset = this.labelOffsets[0];
  /**
   * When true, a press started elsewhere can activate the button if the pointer
   * is released while hovering over it.
   */
  allowSwiping = true;
  onUp: FlxButtonCallback | null;
  onDown: FlxButtonCallback | null = null;
  onOver: FlxButtonCallback | null = null;
  onOut: FlxButtonCallback | null = null;
  status = FlxButton.NORMAL;
  soundOver: FlxButtonSound | null = null;
  soundOut: FlxButtonSound | null = null;
  soundDown: FlxButtonSound | null = null;
  soundUp: FlxButtonSound | null = null;
  /** Whether pointer and accessibility activation are accepted. */
  enabled = true;
  /** Native keyboard tab order used by the browser accessibility bridge. */
  tabIndex = 0;

  #on = false;
  #focused = false;
  #pendingFocus: boolean | null = null;
  #queuedAccessibilityActivation = false;
  #accessibleLabelOverride: string | null | undefined;
  #defaultGraphic: FlxGraphic | null;
  #currentInputId: number | 'mouse' | null = null;
  readonly #pointer = new FlxPoint();
  readonly #globalPointer = new FlxPoint();

  constructor(
    x = 0,
    y = 0,
    label: string | null = null,
    onClick: FlxButtonCallback | null = null,
  ) {
    super(x, y);
    this.scrollFactor.make(0, 0);
    this.#defaultGraphic = makeDefaultButtonGraphic();
    FlxSprite.prototype.loadGraphic.call(
      this,
      this.#defaultGraphic,
      true,
      false,
      80,
      20,
    );
    this.label =
      label === null
        ? null
        : new FlxText(x, y, 80, label).setFormat(
            'Arial',
            11,
            0xf7f9ff,
            'center',
          );
    this.label?.origin.make();
    if (this.label !== null) this.label.scrollFactor = this.scrollFactor;
    this.onUp = onClick;
    this.allowCollisions = FlxObject.NONE;
  }

  override update(): void {
    if (this.#pendingFocus !== null) {
      this.#focused = this.#pendingFocus;
      this.#pendingFocus = null;
    }

    if (!this.enabled) {
      this.status = FlxButton.DISABLED;
      this.#currentInputId = null;
    } else {
      let overlapFound = false;
      const mouse = FlxG.mouse;
      if (mouse.visible) {
        overlapFound = this.#checkMouseOverlap() || overlapFound;
      }
      for (const touch of FlxG.touches.active) {
        if (touch.isPrimary) continue;
        overlapFound = this.#checkTouchOverlap(touch) || overlapFound;
      }

      const currentInput = this.#currentInput();

      if (
        currentInput !== null &&
        currentInput.justReleased &&
        !currentInput.justCancelled &&
        overlapFound
      ) {
        this.#onUpHandler();
      }

      if (
        this.status !== FlxButton.NORMAL &&
        this.status !== FlxButton.DISABLED &&
        (!overlapFound || currentInput?.justCancelled === true)
      ) {
        this.#onOutHandler();
      }

      if (this.#focused && this.status === FlxButton.NORMAL) {
        this.status = FlxButton.HIGHLIGHT;
      }
    }

    if (this.#queuedAccessibilityActivation) {
      this.#queuedAccessibilityActivation = false;
      this.activate();
    }

    this.frame =
      this.#on && this.status === FlxButton.HIGHLIGHT
        ? FlxButton.NORMAL
        : this.status;
    this.#syncLabel();
  }

  /** Human-visible label text, independent from the accessibility override. */
  get text(): string {
    return this.label?.text ?? '';
  }

  set text(value: string) {
    if (this.label === null) {
      this.label = new FlxText(this.x, this.y, this.width, value).setFormat(
        'Arial',
        11,
        0xf7f9ff,
        'center',
      );
      this.label.origin.make();
      this.label.scrollFactor = this.scrollFactor;
    } else {
      this.label.text = value;
    }
  }

  /** Native accessibility name. Defaults to current text; null omits the DOM control. */
  get accessibleLabel(): string | null {
    return this.#accessibleLabelOverride === undefined
      ? (this.label?.text ?? null)
      : this.#accessibleLabelOverride;
  }

  set accessibleLabel(value: string | null) {
    this.#accessibleLabelOverride = value;
  }

  get focused(): boolean {
    return this.#focused;
  }

  /** Activate the button through the same callback/sound path as pointer input. */
  activate(): boolean {
    if (!this.enabled || !this.exists || !this.visible) return false;
    this.onUp?.();
    this.soundUp?.play(true);
    return true;
  }

  /** @internal */
  queueAccessibilityActivation(): void {
    this.#queuedAccessibilityActivation = true;
  }

  /** @internal */
  queueAccessibilityFocus(focused: boolean): void {
    this.#pendingFocus = focused;
  }

  setSounds(
    soundOver: FlxButtonSound | null = null,
    soundOut: FlxButtonSound | null = null,
    soundDown: FlxButtonSound | null = null,
    soundUp: FlxButtonSound | null = null,
  ): this {
    this.soundOver = soundOver;
    this.soundOut = soundOut;
    this.soundDown = soundDown;
    this.soundUp = soundUp;
    return this;
  }

  get on(): boolean {
    return this.#on;
  }

  set on(value: boolean) {
    this.#on = value;
    this.frame =
      value && this.status === FlxButton.HIGHLIGHT
        ? FlxButton.NORMAL
        : this.status;
  }

  override createRenderHandle(): FlxRenderHandle {
    return this.trackRenderHandle((onDestroy) => {
      return new FlxButtonRenderHandle(this, onDestroy);
    });
  }

  override destroy(): void {
    this.label?.destroy();
    this.label = null;
    super.destroy();
    this.#defaultGraphic?.destroy();
    this.#defaultGraphic = null;
    this.onUp = null;
    this.onDown = null;
    this.onOver = null;
    this.onOut = null;
    this.#accessibleLabelOverride = null;
    this.#queuedAccessibilityActivation = false;
    this.#pendingFocus = null;
    this.#currentInputId = null;
    for (const sound of new Set([
      this.soundOver,
      this.soundOut,
      this.soundDown,
      this.soundUp,
    ])) {
      sound?.destroy?.();
    }
    this.soundOver = null;
    this.soundOut = null;
    this.soundDown = null;
    this.soundUp = null;
  }

  #currentInput(): FlxButtonInput | null {
    if (this.#currentInputId === null) return null;
    if (this.#currentInputId === 'mouse') return this.#mouseInput();
    const touch = FlxG.touches.get(this.#currentInputId);
    return touch === null ? null : this.#touchInput(touch);
  }

  #checkMouseOverlap(): boolean {
    const mouse = FlxG.mouse;
    const cameras = this.cameras ?? FlxG.cameras;
    mouse.getGlobalPosition(this.#globalPointer);
    for (const camera of cameras) {
      if (
        !camera.exists ||
        !camera.visible ||
        !camera.containsScreenPoint(this.#globalPointer)
      ) {
        continue;
      }
      mouse.getWorldPosition(camera, this.#pointer);
      this.#applyScroll(camera, this.#pointer);
      if (this.overlapsPoint(this.#pointer)) {
        this.#updateStatus(this.#mouseInput());
        return true;
      }
    }
    return false;
  }

  #checkTouchOverlap(touch: FlxTouch): boolean {
    const cameras = this.cameras ?? FlxG.cameras;
    for (const camera of cameras) {
      if (!camera.exists || !camera.visible) continue;
      touch.getWorldPosition(camera, this.#pointer);
      this.#applyScroll(camera, this.#pointer);
      if (this.overlapsPoint(this.#pointer)) {
        this.#updateStatus(this.#touchInput(touch));
        return true;
      }
    }
    return false;
  }

  #mouseInput(): FlxButtonInput {
    const mouse = FlxG.mouse;
    return {
      id: 'mouse',
      justCancelled: mouse.justCancelled(),
      justPressed: mouse.justPressed(),
      justReleased: mouse.justReleased(),
      pressed: mouse.pressed(),
      getWorldPosition: (camera, point) =>
        mouse.getWorldPosition(camera, point),
    };
  }

  #touchInput(touch: FlxTouch): FlxButtonInput {
    return {
      id: touch.pointerId,
      justCancelled: touch.justCancelled,
      justPressed: touch.justPressed,
      justReleased: touch.justReleased,
      pressed: touch.pressed,
      getWorldPosition: (camera, point) =>
        touch.getWorldPosition(camera, point),
    };
  }

  #updateStatus(input: FlxButtonInput): void {
    if (input.justPressed) {
      this.#currentInputId = input.id;
      this.#onDownHandler();
      return;
    }
    if (this.status === FlxButton.NORMAL) {
      if (this.allowSwiping && input.pressed) {
        this.#currentInputId = input.id;
        this.#onDownHandler();
      } else {
        this.#onOverHandler();
      }
    }
  }

  #onUpHandler(): void {
    this.status = FlxButton.HIGHLIGHT;
    this.#currentInputId = null;
    this.onUp?.();
    this.soundUp?.play(true);
  }

  #onDownHandler(): void {
    this.status = FlxButton.PRESSED;
    this.onDown?.();
    this.soundDown?.play(true);
  }

  #onOverHandler(): void {
    this.status = FlxButton.HIGHLIGHT;
    this.onOver?.();
    this.soundOver?.play(true);
  }

  #onOutHandler(): void {
    this.status = FlxButton.NORMAL;
    this.#currentInputId = null;
    this.onOut?.();
    this.soundOut?.play(true);
  }

  #applyScroll(camera: FlxCamera, point: FlxPoint): void {
    point.x -= camera.scroll.x * (1 - this.scrollFactor.x);
    point.y -= camera.scroll.y * (1 - this.scrollFactor.y);
  }

  #syncLabel(): void {
    const label = this.label;
    if (label === null) return;
    const statusIndex = Math.min(this.status, this.labelOffsets.length - 1);
    const offset = this.labelOffsets[statusIndex] ?? this.labelOffsets[0];
    if (offset === undefined) return;
    const alphaIndex = Math.min(this.status, this.labelAlphas.length - 1);
    label.x = this.x + offset.x;
    label.y = this.y + offset.y;
    label.exists = this.exists;
    label.visible = this.visible;
    label.alpha = this.alpha * (this.labelAlphas[alphaIndex] ?? 1);
    label.cameras = this.cameras;
  }
}
