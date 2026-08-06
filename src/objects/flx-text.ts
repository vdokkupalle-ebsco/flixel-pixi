import type { TextStyleAlign, TextStyleOptions } from 'pixi.js';

import { FlxTextRenderHandle } from '../rendering/flx-text-render-handle';
import { FlxSprite } from './flx-sprite';

/** Pixi text implementation chosen for a `FlxText` render handle. @public */
export type FlxTextRenderMode = 'bitmap' | 'text';

/** Flixel-compatible text state rendered by Pixi `Text` or `BitmapText`. @public */
export class FlxText extends FlxSprite {
  readonly embeddedFont: boolean;
  readonly renderMode: FlxTextRenderMode;

  #text: string;
  #size = 8;
  #textColor = 0xffffff;
  #font = 'system';
  #alignment: TextStyleAlign = 'left';
  #shadow = 0;
  #borderColor = 0;
  #borderSize = 0;
  #styleVersion = 0;

  constructor(
    x: number,
    y: number,
    width: number,
    text: string | null = null,
    embeddedFont = true,
    renderMode: FlxTextRenderMode = 'text',
  ) {
    super(x, y);
    if (!Number.isFinite(width) || width <= 0) {
      throw new RangeError('Text width must be a positive finite number.');
    }
    this.width = width;
    this.frameWidth = width;
    this.#text = text ?? '';
    this.embeddedFont = embeddedFont;
    this.renderMode = renderMode;
    this.height = this.#text.length === 0 ? 1 : 12;
    this.frameHeight = this.height;
    this.origin.make(width * 0.5, this.height * 0.5);
    this.allowCollisions = FlxText.NONE;
  }

  setFormat(
    font: string | null = null,
    size = 8,
    color = 0xffffff,
    alignment: TextStyleAlign | null = null,
    shadowColor = 0,
  ): this {
    this.#font = font === null || font.length === 0 ? 'system' : font;
    this.#size = size;
    this.#textColor = color & 0xffffff;
    this.#alignment = alignment ?? 'left';
    this.#shadow = shadowColor >>> 0;
    this.#changed();
    return this;
  }

  setBorderStyle(color = 0, size = 0): this {
    if (!Number.isFinite(size) || size < 0) {
      throw new RangeError('Border size must be a non-negative finite number.');
    }
    this.#borderColor = color & 0xffffff;
    this.#borderSize = size;
    this.#changed();
    return this;
  }

  get text(): string {
    return this.#text;
  }

  set text(value: string) {
    if (value === this.#text) return;
    this.#text = value;
    this.#changed();
  }

  get size(): number {
    return this.#size;
  }

  set size(value: number) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError('Text size must be a positive finite number.');
    }
    if (value === this.#size) return;
    this.#size = value;
    this.#changed();
  }

  override get color(): number {
    return this.#textColor;
  }

  override set color(value: number) {
    const color = value & 0xffffff;
    if (color === this.#textColor) return;
    this.#textColor = color;
    this.#changed();
  }

  get font(): string {
    return this.#font;
  }

  set font(value: string) {
    const font = value.length === 0 ? 'system' : value;
    if (font === this.#font) return;
    this.#font = font;
    this.#changed();
  }

  get alignment(): TextStyleAlign {
    return this.#alignment;
  }

  set alignment(value: TextStyleAlign) {
    if (value === this.#alignment) return;
    this.#alignment = value;
    this.#changed();
  }

  get shadow(): number {
    return this.#shadow;
  }

  set shadow(value: number) {
    const color = value >>> 0;
    if (color === this.#shadow) return;
    this.#shadow = color;
    this.#changed();
  }

  get borderColor(): number {
    return this.#borderColor;
  }

  get borderSize(): number {
    return this.#borderSize;
  }

  override createRenderHandle(): FlxTextRenderHandle {
    return this.trackRenderHandle((onDestroy) => {
      return new FlxTextRenderHandle(this, onDestroy);
    });
  }

  /** @internal */
  get textStyleVersion(): number {
    return this.#styleVersion;
  }

  /** @internal */
  get textStyle(): TextStyleOptions {
    return {
      align: this.#alignment,
      ...(this.#shadow === 0
        ? {}
        : {
            dropShadow: {
              alpha: 1,
              angle: Math.PI / 4,
              blur: 0,
              color: this.#shadow & 0xffffff,
              distance: 1,
            },
          }),
      fill: this.#textColor,
      fontFamily: this.#font,
      fontSize: this.#size,
      padding: 2,
      ...(this.#borderSize === 0
        ? {}
        : {
            stroke: {
              color: this.#borderColor,
              width: this.#borderSize,
            },
          }),
      whiteSpace: 'pre-line',
      wordWrap: true,
      wordWrapWidth: this.width,
    };
  }

  /** @internal */
  updateTextBounds(height: number): void {
    this.height = Math.max(1, Math.ceil(height));
    this.frameHeight = this.height;
  }

  #changed(): void {
    this.#styleVersion += 1;
    this.dirty = true;
    this.syncRenderHandles();
  }
}
