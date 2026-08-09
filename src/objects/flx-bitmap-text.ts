import type { TextStyleAlign, TextStyleOptions } from 'pixi.js';

import { FlxBitmapFont } from '../assets/flx-bitmap-font';
import { FlxBitmapTextRenderHandle } from '../rendering/flx-bitmap-text-render-handle';
import type { FlxRenderHandle } from '../rendering/flx-render-handle';
import { FlxObject } from './flx-object';
import { FlxSprite } from './flx-sprite';

/** Bitmap-font text rendered through Pixi `BitmapText`. @public */
export class FlxBitmapText extends FlxSprite {
  fieldWidth: number;
  alignment: TextStyleAlign = 'left';
  letterSpacing = 0;
  lineSpacing = 0;

  #text = '';
  #font: FlxBitmapFont;
  #styleVersion = 0;

  constructor(
    x = 0,
    y = 0,
    text = '',
    font: FlxBitmapFont | null = null,
    fieldWidth = 0,
  ) {
    super(x, y);
    this.#font = font ?? FlxBitmapFont.getDefaultFont();
    this.fieldWidth = fieldWidth > 0 ? fieldWidth : 1;
    this.width = this.fieldWidth;
    this.frameWidth = this.fieldWidth;
    this.height = this.#font.lineHeight;
    this.frameHeight = this.height;
    this.origin.make(this.fieldWidth * 0.5, this.height * 0.5);
    this.allowCollisions = FlxObject.NONE;
    this.text = text;
  }

  get font(): FlxBitmapFont {
    return this.#font;
  }

  set font(value: FlxBitmapFont) {
    if (value.destroyed) {
      throw new Error('Cannot assign a destroyed FlxBitmapFont.');
    }
    if (value === this.#font) return;
    this.#font = value;
    this.#changed();
  }

  get text(): string {
    return this.#text;
  }

  set text(value: string) {
    if (value === this.#text) return;
    this.#text = value;
    this.#changed();
  }

  setFormat(
    _font: string | null = null,
    size = 0,
    color = 0xffffff,
    alignment: TextStyleAlign | null = null,
  ): this {
    void _font;
    void size;
    this.color = color;
    if (alignment !== null) this.alignment = alignment;
    return this;
  }

  override createRenderHandle(): FlxRenderHandle {
    return this.trackRenderHandle((onDestroy) => {
      return new FlxBitmapTextRenderHandle(this, onDestroy);
    });
  }

  override postUpdate(): void {
    super.postUpdate();
    this.syncRenderHandles();
  }

  /** @internal */
  get textStyleVersion(): number {
    return this.#styleVersion;
  }

  /** @internal */
  get textStyle(): TextStyleOptions {
    const lineHeight = this.#font.lineHeight + this.lineSpacing;
    return {
      align: this.alignment,
      fill: 0xffffff,
      fontFamily: this.#font.fontFamily,
      fontSize: this.#font.size,
      letterSpacing: this.letterSpacing,
      lineHeight,
      wordWrap: this.fieldWidth > 0,
      wordWrapWidth: this.fieldWidth,
    };
  }

  /** @internal */
  updateTextBounds(height: number): void {
    this.height = Math.max(this.#font.lineHeight, Math.ceil(height));
    this.frameHeight = this.height;
  }

  override destroy(): void {
    super.destroy();
  }

  #changed(): void {
    this.#styleVersion += 1;
    this.dirty = true;
    this.syncRenderHandles();
  }
}
