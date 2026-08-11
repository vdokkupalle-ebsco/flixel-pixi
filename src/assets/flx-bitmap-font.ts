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
  const cacheKey = `${data.fontFamily}-bitmap`;
  if (Cache.has(cacheKey)) {
    throw new Error(
      `Bitmap font family "${data.fontFamily}" is already registered. Destroy or reuse the existing font first.`,
    );
  }
  const font = new BitmapFont({ data, textures }, url);
  Cache.set(cacheKey, font);
  font.once('destroy', () => {
    if (Cache.get(cacheKey) === font) Cache.remove(cacheKey);
  });
  return font;
}

function destroyFontWithoutSourceTextures(font: BitmapFont): void {
  // Pixi's BitmapFont.destroy() destroys page texture sources. Those sources are
  // supplied by the caller here and remain owned by FlxGraphic/Assets.
  font.pages.length = 0;
  font.destroy();
}

/** Texture or engine graphic supplying one AngelCode bitmap-font page. @public */
export type FlxBitmapFontPageSource = FlxGraphic | Texture;

function validatePageTextures(
  data: FlxBmFontData,
  textures: readonly Texture[],
): void {
  if (textures.length !== data.pages.length) {
    throw new Error(
      `Bitmap font declares ${data.pages.length} pages but received ${textures.length} page textures.`,
    );
  }
  const orderedPages = [...data.pages].sort((a, b) => a.id - b.id);
  for (let index = 0; index < orderedPages.length; index += 1) {
    if (orderedPages[index]?.id !== index) {
      throw new Error(
        'Bitmap font page ids must be contiguous and start at zero.',
      );
    }
  }
  for (const char of Object.values(data.chars)) {
    const texture = textures[char.page];
    if (texture === undefined) {
      throw new Error(
        `Bitmap font glyph "${char.letter}" references missing page ${char.page}.`,
      );
    }
    if (
      char.x < 0 ||
      char.y < 0 ||
      char.width < 0 ||
      char.height < 0 ||
      char.x + char.width > texture.width ||
      char.y + char.height > texture.height
    ) {
      throw new RangeError(
        `Bitmap font glyph "${char.letter}" must fit inside the source texture.`,
      );
    }
  }
}

/**
 * Bitmap glyph font backed by a Pixi `BitmapFont` and registered for `BitmapText`.
 * @public
 */
export class FlxBitmapFont {
  readonly #pixiFont: BitmapFont;
  readonly #ownsPixiFont: boolean;
  #destroyOwnedSource: (() => void) | null = null;
  #destroyed = false;

  constructor(pixiFont: BitmapFont, ownsPixiFont = true) {
    this.#pixiFont = pixiFont;
    this.#ownsPixiFont = ownsPixiFont;
    const cacheKey = `${pixiFont.fontFamily}-bitmap`;
    const cached = Cache.get<BitmapFont>(cacheKey);
    if (cached !== undefined && cached !== pixiFont) {
      throw new Error(
        `Bitmap font family "${pixiFont.fontFamily}" is already registered with a different font.`,
      );
    }
    if (cached === undefined) {
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
    source: FlxBitmapFontPageSource | readonly FlxBitmapFontPageSource[],
    xmlText: string,
    fontFamily?: string,
  ): FlxBitmapFont {
    const data = parseBmFontXml(xmlText);
    if (fontFamily !== undefined && fontFamily.length > 0) {
      data.fontFamily = fontFamily;
    }
    const pageSources: readonly FlxBitmapFontPageSource[] = Array.isArray(
      source,
    )
      ? source
      : [source as FlxBitmapFontPageSource];
    const textures = pageSources.map(textureFromSource);
    validatePageTextures(data, textures);
    const font = installPixiBitmapFont(data, textures);
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
      throw new RangeError(
        'Monospace charWidth must be a positive finite number.',
      );
    }
    if (!Number.isFinite(charHeight) || charHeight <= 0) {
      throw new RangeError(
        'Monospace charHeight must be a positive finite number.',
      );
    }
    const spacingX = options?.spacingX ?? 0;
    const spacingY = options?.spacingY ?? 0;
    if (!Number.isFinite(spacingX) || spacingX < 0) {
      throw new RangeError(
        'Monospace spacingX must be a non-negative finite number.',
      );
    }
    if (!Number.isFinite(spacingY) || spacingY < 0) {
      throw new RangeError(
        'Monospace spacingY must be a non-negative finite number.',
      );
    }
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
      const x = column * (charWidth + spacingX);
      const y = row * (charHeight + spacingY);
      if (x + charWidth > texture.width || y + charHeight > texture.height) {
        throw new RangeError(
          `Monospace glyph "${letter}" must fit inside the source texture.`,
        );
      }
      chars[letter] = {
        id,
        kerning: {},
        letter,
        page: 0,
        width: charWidth,
        height: charHeight,
        x,
        y,
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
    defaultFont.#destroyOwnedSource = () => graphic.destroy();
    return defaultFont;
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    const cacheKey = `${this.#pixiFont.fontFamily}-bitmap`;
    if (this.#ownsPixiFont && Cache.get(cacheKey) === this.#pixiFont) {
      Cache.remove(cacheKey);
    }
    if (this.#ownsPixiFont) {
      destroyFontWithoutSourceTextures(this.#pixiFont);
    }
    this.#destroyOwnedSource?.();
    this.#destroyOwnedSource = null;
    if (defaultFont === this) defaultFont = null;
  }
}
