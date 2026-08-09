import { FlxGraphic } from '../assets/flx-graphic';
import { makeGraphicPixels } from '../compat/pixel-buffer';
import { FlxG } from '../core/flx-g';
import { FlxPoint } from '../math/flx-point';
import { FlxButtonRenderHandle } from '../rendering/flx-button-render-handle';
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

function makeDefaultButtonGraphic(): FlxGraphic {
  const width = 80;
  const frameHeight = 20;
  const colors = [0x31415cff, 0x466384ff, 0x243247ff];
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

/** Three-state, deterministic Flixel button with optional toggle behavior. @public */
export class FlxButton extends FlxSprite {
  static readonly NORMAL = 0;
  static readonly HIGHLIGHT = 1;
  static readonly PRESSED = 2;

  label: FlxText | null;
  readonly labelOffset = new FlxPoint();
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
  #pointerArmed = false;
  #highlighted = false;
  #focused = false;
  #pendingFocus: boolean | null = null;
  #queuedAccessibilityActivation = false;
  #accessibleLabelOverride: string | null | undefined;
  #defaultGraphic: FlxGraphic | null;
  readonly #pointer = new FlxPoint();
  readonly #globalPointer = new FlxPoint();

  constructor(
    x = 0,
    y = 0,
    label: string | null = null,
    onClick: FlxButtonCallback | null = null,
  ) {
    super(x, y);
    this.#defaultGraphic = makeDefaultButtonGraphic();
    this.loadGraphic(this.#defaultGraphic, true, false, 80, 20);
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
    this.labelOffset.make(-1, 3);
    this.onUp = onClick;
    this.allowCollisions = FlxObject.NONE;
  }

  override update(): void {
    if (this.#pendingFocus !== null) {
      this.#focused = this.#pendingFocus;
      this.#pendingFocus = null;
    }
    const mouse = FlxG.mouse;
    const cameras = this.cameras ?? FlxG.cameras;
    let hovered = false;
    mouse.getGlobalPosition(this.#globalPointer);
    for (const camera of this.enabled && mouse.visible ? cameras : []) {
      if (
        !camera.exists ||
        !camera.visible ||
        !camera.containsScreenPoint(this.#globalPointer)
      ) {
        continue;
      }
      mouse.getWorldPosition(camera, this.#pointer);
      this.#pointer.x -= camera.scroll.x * (1 - this.scrollFactor.x);
      this.#pointer.y -= camera.scroll.y * (1 - this.scrollFactor.y);
      if (this.overlapsPoint(this.#pointer)) {
        hovered = true;
        break;
      }
    }

    const highlighted = this.enabled && (hovered || this.#focused);
    if (highlighted && !this.#highlighted) {
      this.onOver?.();
      this.soundOver?.play(true);
    } else if (!highlighted && this.#highlighted) {
      this.onOut?.();
      this.soundOut?.play(true);
    }
    this.#highlighted = highlighted;

    if (this.enabled && hovered && mouse.justPressed()) {
      this.#pointerArmed = true;
      this.onDown?.();
      this.soundDown?.play(true);
    }

    if (mouse.justReleased()) {
      const activate = this.#pointerArmed && hovered && !mouse.justCancelled();
      this.#pointerArmed = false;
      if (activate) this.activate();
    }

    if (this.#queuedAccessibilityActivation) {
      this.#queuedAccessibilityActivation = false;
      this.activate();
    }

    this.status = !this.enabled
      ? FlxButton.NORMAL
      : this.#pointerArmed && mouse.pressed()
        ? FlxButton.PRESSED
        : highlighted
          ? FlxButton.HIGHLIGHT
          : FlxButton.NORMAL;
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

  override createRenderHandle(): FlxButtonRenderHandle {
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

  #syncLabel(): void {
    const label = this.label;
    if (label === null) return;
    label.x = this.x + this.labelOffset.x;
    label.y =
      this.y + this.labelOffset.y + (this.status === FlxButton.PRESSED ? 1 : 0);
    label.exists = this.exists;
    label.visible = this.visible;
    label.alpha =
      this.alpha *
      (!this.enabled
        ? 0.35
        : this.status === FlxButton.PRESSED
          ? 0.5
          : this.status === FlxButton.NORMAL
            ? 0.8
            : 1);
    label.cameras = this.cameras;
  }
}
