import { FlxText } from './flx-text';

/** Browser text-entry types supported by {@link FlxInputText}. @public */
export type FlxInputTextType =
  'email' | 'password' | 'search' | 'tel' | 'text' | 'url';

/** Optional construction settings for {@link FlxInputText}. @public */
export interface FlxInputTextOptions {
  /** Accessible name announced by assistive technology. */
  readonly accessibleLabel?: string;
  /** Authored logical field height. */
  readonly height?: number;
  /** Mobile virtual-keyboard hint such as `text`, `numeric`, or `email`. */
  readonly inputMode?: string;
  /** Maximum UTF-16 length; zero means unlimited. */
  readonly maxLength?: number;
  /** Use a native textarea and preserve line breaks. */
  readonly multiline?: boolean;
  /** Hint displayed by the native field while empty. */
  readonly placeholder?: string;
  /** Native semantic type for a single-line field. */
  readonly type?: FlxInputTextType;
}

/** Callback published after a DOM edit is consumed by a fixed update. @public */
export type FlxInputTextChangeCallback = (value: string) => void;

/** Callback published after a single-line Enter submission on a fixed update. @public */
export type FlxInputTextSubmitCallback = (value: string) => void;

interface PendingDomEdit {
  readonly selectionEnd: number;
  readonly selectionStart: number;
  readonly value: string;
}

/**
 * Flixel text field backed by a native browser input for selection, IME, and
 * mobile keyboard behavior. DOM changes become authoritative on fixed updates.
 * @public
 */
export class FlxInputText extends FlxText {
  /** Whether the native field accepts focus and editing. */
  enabled = true;
  /** Whether text can change while the field remains focusable. */
  editable = true;
  /** Native keyboard tab order. */
  tabIndex = 0;
  /** Accessible name announced for the native field. */
  accessibleLabel: string;
  /** Native input hint used when the value is empty. */
  placeholder: string;
  /** Virtual-keyboard input mode hint. */
  inputMode: string;
  /** Native single-line field type. Ignored by multiline fields. */
  type: FlxInputTextType;
  /** Native field background color. */
  backgroundColor = 0x111827;
  /** Native field border color while unfocused. */
  inputBorderColor = 0x64748b;
  /** Native field border color while focused. */
  focusedBorderColor = 0x38bdf8;
  /** Called once per fixed update that consumes a changed DOM value. */
  onTextChange: FlxInputTextChangeCallback | null = null;
  /** Called on a fixed update after Enter in a single-line field. */
  onSubmit: FlxInputTextSubmitCallback | null = null;

  /** Whether this field uses multiline textarea behavior. */
  readonly multiline: boolean;

  #maxLength = 0;
  #focused = false;
  #composing = false;
  #selectionStart = 0;
  #selectionEnd = 0;
  #pendingEdit: PendingDomEdit | null = null;
  #pendingFocus: boolean | null = null;
  #pendingComposition: boolean | null = null;
  #pendingSelection: { readonly end: number; readonly start: number } | null =
    null;
  #pendingSubmit = false;
  #domPresentationActive = false;
  #domVersion = 0;
  #focusCommandVersion = 0;
  #selectionCommandVersion = 0;

  constructor(
    x = 0,
    y = 0,
    width = 150,
    text = '',
    options: FlxInputTextOptions = {},
  ) {
    super(x, y, width, text, true, 'text');
    const height = options.height ?? 24;
    if (!Number.isFinite(height) || height <= 0) {
      throw new RangeError(
        'Input text height must be a positive finite number.',
      );
    }
    this.height = height;
    this.frameHeight = height;
    this.origin.make(width * 0.5, height * 0.5);
    this.multiline = options.multiline ?? false;
    this.accessibleLabel = options.accessibleLabel ?? 'Text input';
    this.placeholder = options.placeholder ?? '';
    this.inputMode = options.inputMode ?? 'text';
    this.type = options.type ?? 'text';
    this.maxLength = options.maxLength ?? 0;
    this.text = text;
    this.#selectionStart = this.text.length;
    this.#selectionEnd = this.text.length;
    this.scrollFactor.make(0, 0);
  }

  /** Current authoritative text value. */
  override get text(): string {
    return super.text;
  }

  override set text(value: string) {
    const normalized = this.#normalize(value);
    if (normalized === super.text) return;
    super.text = normalized;
    this.#selectionStart = Math.min(this.#selectionStart, normalized.length);
    this.#selectionEnd = Math.min(this.#selectionEnd, normalized.length);
    this.#domVersion += 1;
  }

  /** Maximum UTF-16 length; zero means unlimited. */
  get maxLength(): number {
    return this.#maxLength;
  }

  set maxLength(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new RangeError(
        'Input text maxLength must be a non-negative integer.',
      );
    }
    if (value === this.#maxLength) return;
    this.#maxLength = value;
    const normalized = this.#normalize(super.text);
    if (normalized !== super.text) super.text = normalized;
    this.#selectionStart = Math.min(this.#selectionStart, normalized.length);
    this.#selectionEnd = Math.min(this.#selectionEnd, normalized.length);
    this.#domVersion += 1;
  }

  /** Focus state published at the fixed-update boundary. */
  get focused(): boolean {
    return this.#focused;
  }

  /** @internal */
  get domFocusRequested(): boolean {
    return this.#pendingFocus ?? this.#focused;
  }

  /** Whether a native IME composition is active at the fixed boundary. */
  get composing(): boolean {
    return this.#composing;
  }

  /** Fixed-step UTF-16 selection start. */
  get selectionStart(): number {
    return this.#selectionStart;
  }

  /** Fixed-step UTF-16 selection end. */
  get selectionEnd(): number {
    return this.#selectionEnd;
  }

  /** Request native focus. The state becomes visible on the next fixed update. */
  focus(): void {
    this.#pendingFocus = true;
    this.#focusCommandVersion += 1;
  }

  /** Request native blur. The state becomes visible on the next fixed update. */
  blur(): void {
    this.#pendingFocus = false;
    this.#focusCommandVersion += 1;
  }

  /** Select a UTF-16 range and project it to the native field. */
  select(start = 0, end = this.text.length): void {
    this.#selectionStart = this.#clampSelection(start);
    this.#selectionEnd = Math.max(
      this.#selectionStart,
      this.#clampSelection(end),
    );
    this.#selectionCommandVersion += 1;
  }

  /** Consume queued native edits and callbacks, then advance normal text state. */
  override update(): void {
    const edit = this.#pendingEdit;
    this.#pendingEdit = null;
    if (edit !== null) {
      const before = this.text;
      this.text = edit.value;
      this.#selectionStart = Math.min(edit.selectionStart, this.text.length);
      this.#selectionEnd = Math.min(edit.selectionEnd, this.text.length);
      if (this.#domVersion === 0 || before === this.text) this.#domVersion += 1;
      if (before !== this.text) this.onTextChange?.(this.text);
    }
    if (this.#pendingFocus !== null) {
      this.#focused = this.#pendingFocus;
      this.#pendingFocus = null;
    }
    if (this.#pendingComposition !== null) {
      this.#composing = this.#pendingComposition;
      this.#pendingComposition = null;
    }
    if (this.#pendingSelection !== null) {
      this.#selectionStart = this.#clampSelection(this.#pendingSelection.start);
      this.#selectionEnd = Math.max(
        this.#selectionStart,
        this.#clampSelection(this.#pendingSelection.end),
      );
      this.#pendingSelection = null;
    }
    if (this.#pendingSubmit) {
      this.#pendingSubmit = false;
      if (this.enabled && !this.multiline) this.onSubmit?.(this.text);
    }
    super.update();
  }

  /** Release callbacks and render resources. */
  override destroy(): void {
    this.onTextChange = null;
    this.onSubmit = null;
    this.#pendingEdit = null;
    this.#pendingFocus = null;
    this.#pendingComposition = null;
    this.#pendingSelection = null;
    this.#domPresentationActive = false;
    super.destroy();
  }

  /** @internal */
  override isCanvasTextVisible(): boolean {
    return !this.#domPresentationActive;
  }

  /** @internal */
  get domVersion(): number {
    return this.#domVersion;
  }

  /** @internal */
  get focusCommandVersion(): number {
    return this.#focusCommandVersion;
  }

  /** @internal */
  get selectionCommandVersion(): number {
    return this.#selectionCommandVersion;
  }

  /** @internal */
  setDomPresentationActive(active: boolean): void {
    if (active === this.#domPresentationActive) return;
    this.#domPresentationActive = active;
    this.syncRenderHandles();
  }

  /** @internal */
  queueDomEdit(
    value: string,
    selectionStart: number,
    selectionEnd: number,
  ): void {
    this.#pendingEdit = { selectionEnd, selectionStart, value };
  }

  /** @internal */
  queueDomFocus(focused: boolean): void {
    this.#pendingFocus = focused;
  }

  /** @internal */
  queueDomComposition(composing: boolean): void {
    this.#pendingComposition = composing;
  }

  /** @internal */
  queueDomSelection(selectionStart: number, selectionEnd: number): void {
    this.#pendingSelection = { end: selectionEnd, start: selectionStart };
  }

  /** @internal */
  queueDomSubmit(): void {
    this.#pendingSubmit = true;
  }

  /** @internal */
  override updateTextBounds(height: number): void {
    void height;
    // Input fields retain their authored height rather than text metrics.
  }

  #normalize(value: string): string {
    const singleLine = this.multiline ? value : value.replace(/[\r\n]+/gu, ' ');
    return this.#maxLength > 0
      ? singleLine.slice(0, this.#maxLength)
      : singleLine;
  }

  #clampSelection(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.min(this.text.length, Math.max(0, Math.trunc(value)));
  }
}
