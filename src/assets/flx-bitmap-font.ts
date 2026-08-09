import { BitmapFont, Cache, type Texture } from 'pixi.js';

import { makeGraphicPixels } from '../compat/pixel-buffer';
import { FlxGraphic } from './flx-graphic';
import { parseBmFontXml, type FlxBmFontData } from './flx-bmfont-parse';

let defaultFont: FlxBitmapFont | null = null;

interface BitmapFontRenderedSize {
  readonly baseRenderedFontSize: number;
}

function renderedFontSize(font: BitmapFont): number {
  return (font as BitmapFont & BitmapFontRenderedSize).baseRenderedFontSize;
}

function textureFromSource(source: FlxGraphic | Texture): Texture {
  return source instanceof FlxGraphic ? source.texture : source;
}

function installPixiBitmapFont(
  data: FlxBmFontData,
  textures: Texture[],
  url?: string,
): BitmapFont {
  const font = new BitmapFont({ data, textures }, url);
  const cacheKey = `${font.fontFamily}-bitmap`;
  if (!Cache.has(cacheKey)) {
    Cache.set(cacheKey, font);
  }
  font.once('destroy', () => {
    if (Cache.get(cacheKey) === font) Cache.remove(cacheKey);
  });
  return font;
}

/**
 * Bitmap glyph font backed by a Pixi `BitmapFont` and registered for `BitmapText`.
 * @public
 */
export class FlxBitmapFont {
  readonly #pixiFont: BitmapFont;
  readonly #ownsPixiFont: boolean;
  #destroyed = false;

  constructor(pixiFont: BitmapFont, ownsPixiFont = true) {
    this.#pixiFont = pixiFont;
    this.#ownsPixiFont = ownsPixiFont;
    const cacheKey = `${pixiFont.fontFamily}-bitmap`;
    if (!Cache.has(cacheKey)) {
      Cache.set(cacheKey, pixiFont);
    }
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  get fontFamily(): string {
    return this.#pixiFont.fontFamily;
  }

  get size(): number {
    return renderedFontSize(this.#pixiFont);
  }

  get lineHeight(): number {
    const font = this.#pixiFont;
    const rendered = renderedFontSize(font);
    const measured = font.fontMetrics.fontSize;
    if (measured > 0 && measured !== rendered) {
      return Math.max(
        rendered,
        Math.ceil(font.lineHeight * (rendered / measured)),
      );
    }
    return font.lineHeight;
  }

  /** @internal */
  get pixiFont(): BitmapFont {
    return this.#pixiFont;
  }

  static fromAngelCode(
    source: FlxGraphic | Texture,
    xmlText: string,
    fontFamily?: string,
  ): FlxBitmapFont {
    const data = parseBmFontXml(xmlText);
    if (fontFamily !== undefined && fontFamily.length > 0) {
      data.fontFamily = fontFamily;
    }
    const texture = textureFromSource(source);
    const font = installPixiBitmapFont(data, [texture]);
    return new FlxBitmapFont(font, true);
  }

  static fromMonospace(
    source: FlxGraphic | Texture,
    letters = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~',
    charWidth: number,
    charHeight: number,
    options?: {
      fontFamily?: string;
      spacingX?: number;
      spacingY?: number;
    },
  ): FlxBitmapFont {
    if (!Number.isFinite(charWidth) || charWidth <= 0) {
      throw new RangeError('Monospace charWidth must be a positive finite number.');
    }
    if (!Number.isFinite(charHeight) || charHeight <= 0) {
      throw new RangeError('Monospace charHeight must be a positive finite number.');
    }
    const spacingX = options?.spacingX ?? 0;
    const spacingY = options?.spacingY ?? 0;
    const texture = textureFromSource(source);
    const cols = Math.max(
      1,
      Math.floor((texture.width + spacingX) / (charWidth + spacingX)),
    );
    const chars: FlxBmFontData['chars'] = {};
    let column = 0;
    let row = 0;
    for (const letter of letters) {
      if (letter === '\n') {
        row += 1;
        column = 0;
        continue;
      }
      const id = letter.codePointAt(0);
      if (id === undefined) continue;
      chars[letter] = {
        id,
        kerning: {},
        letter,
        page: 0,
        width: charWidth,
        height: charHeight,
        x: column * (charWidth + spacingX),
        y: row * (charHeight + spacingY),
        xAdvance: charWidth + spacingX,
        xOffset: 0,
        yOffset: 0,
      };
      column += 1;
      if (column >= cols) {
        row += 1;
        column = 0;
      }
    }
    if (Object.keys(chars).length === 0) {
      throw new RangeError('Monospace font requires at least one letter.');
    }
    const fontFamily =
      options?.fontFamily ?? `flx-monospace-${charWidth}x${charHeight}`;
    const data: FlxBmFontData = {
      baseLineOffset: 0,
      chars,
      fontFamily,
      fontSize: charHeight,
      lineHeight: charHeight + spacingY,
      pages: [{ id: 0, file: 'page0' }],
    };
    const font = installPixiBitmapFont(data, [texture]);
    return new FlxBitmapFont(font, true);
  }

  static getDefaultFont(): FlxBitmapFont {
    if (defaultFont !== null && !defaultFont.destroyed) return defaultFont;
    const graphic = FlxGraphic.fromPixels(
      makeGraphicPixels(8, 8, 0xffffffff),
      'flx-bitmap-font-default',
    );
    defaultFont = FlxBitmapFont.fromMonospace(graphic, 'A', 8, 8, {
      fontFamily: 'flx-default-bitmap',
    });
    return defaultFont;
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    const cacheKey = `${this.#pixiFont.fontFamily}-bitmap`;
    if (Cache.get(cacheKey) === this.#pixiFont) {
      Cache.remove(cacheKey);
    }
    if (this.#ownsPixiFont) {
      this.#pixiFont.destroy();
    }
    if (defaultFont === this) defaultFont = null;
  }
}
