import { FlxG } from '../core/flx-g';
import type { FlxActionVirtualButtonSource } from '../input/flx-actions';
import {
  normalizeVirtualInputId,
  type FlxVirtualInput,
  type FlxVirtualButtonState,
} from '../input/flx-virtual-input';
import { FlxVirtualButtonRenderHandle } from '../rendering/flx-virtual-button-render-handle';
import { FlxButton } from './flx-button';

/** Options for one texture-free virtual action or direction button. @public */
export interface FlxVirtualButtonOptions {
  readonly accessibleLabel?: string;
  readonly disabledColor?: number;
  readonly highlightColor?: number;
  readonly normalColor?: number;
  readonly pressedColor?: number;
  readonly size?: number;
}

/** Deterministic touch/pointer button that can be bound through {@link FlxActions}. @public */
export class FlxVirtualButton
  extends FlxButton
  implements FlxVirtualButtonState
{
  readonly virtualInputId: string;
  normalColor: number;
  highlightColor: number;
  pressedColor: number;
  disabledColor: number;

  #pressed = false;
  #justPressed = false;
  #justReleased = false;
  #activationPulse = false;
  #destroyed = false;
  readonly #virtualInputs: FlxVirtualInput;

  constructor(
    id: string,
    x: number,
    y: number,
    label: string,
    options: FlxVirtualButtonOptions = {},
  ) {
    const virtualInputId = normalizeVirtualInputId(id);
    const virtualInputs = FlxG.virtualInputs;
    if (virtualInputs.getButton(virtualInputId) !== null) {
      throw new Error(
        `Virtual input id "${virtualInputId}" is already registered.`,
      );
    }
    const size = options.size ?? 52;
    if (!Number.isFinite(size) || size <= 0) {
      throw new RangeError(
        'Virtual button size must be a positive finite number.',
      );
    }
    super(x, y, label);
    this.onUp = () => {
      this.#activationPulse = true;
    };
    this.virtualInputId = virtualInputId;
    this.#virtualInputs = virtualInputs;
    this.normalColor = options.normalColor ?? 0x253654cc;
    this.highlightColor = options.highlightColor ?? 0x3b82f6ee;
    this.pressedColor = options.pressedColor ?? 0x1d4ed8ff;
    this.disabledColor = options.disabledColor ?? 0x33415566;
    this.width = size;
    this.height = size;
    this.frameWidth = size;
    this.frameHeight = size;
    this.origin.make(size * 0.5, size * 0.5);
    this.accessibleLabel = options.accessibleLabel ?? label;
    this.allowSwiping = false;
    for (const offset of this.labelOffsets) {
      offset.make(0, (size - 20) * 0.5 - 2);
    }
    if (this.label !== null) {
      this.label.width = size;
      this.label.frameWidth = size;
      this.label.size = Math.max(12, Math.round(size * 0.32));
    }
    this.#virtualInputs.registerButton(this.virtualInputId, this);
  }

  get pressed(): boolean {
    return this.#pressed;
  }

  get justPressed(): boolean {
    return this.#justPressed;
  }

  get justReleased(): boolean {
    return this.#justReleased;
  }

  /** Serializable action source for this control. */
  get source(): FlxActionVirtualButtonSource {
    return { device: 'virtual-button', id: this.virtualInputId };
  }

  /** @internal */
  updateVirtualInput(): void {
    this.#activationPulse = false;
    if (this.active && this.exists) super.update();
    const next =
      this.active &&
      this.enabled &&
      this.exists &&
      this.visible &&
      (this.status === FlxButton.PRESSED || this.#activationPulse);
    this.#justPressed = next && !this.#pressed;
    this.#justReleased = !next && this.#pressed;
    this.#pressed = next;
  }

  override update(): void {
    // Input advances centrally after live or replayed pointer state is ready.
  }

  override createRenderHandle(): FlxVirtualButtonRenderHandle {
    return this.trackRenderHandle((onDestroy) => {
      return new FlxVirtualButtonRenderHandle(this, onDestroy);
    });
  }

  override destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#virtualInputs.unregisterButton(this.virtualInputId, this);
    this.#pressed = false;
    this.#justPressed = false;
    this.#justReleased = false;
    super.destroy();
  }
}
