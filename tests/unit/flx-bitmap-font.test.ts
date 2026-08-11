// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BitmapFont, Cache } from 'pixi.js';

import {
  FlxBitmapFont,
  FlxBitmapText,
  FlxBitmapTextRenderHandle,
  FlxContext,
  FlxGraphic,
  FlxG,
  makeGraphicPixels,
  parseBmFontXml,
} from '../../src';

import fixtureXml from '../fixtures/pixel-8.xml?raw';

function monospaceGraphic(): FlxGraphic {
  const pixels = makeGraphicPixels(24, 8, 0);
  for (let i = 0; i < pixels.data.length; i += 1) {
    pixels.data[i] = i % 2 === 0 ? 0xffffffff : 0xccccccff;
  }
  return FlxGraphic.fromPixels(pixels, 'unit-bmfont-sheet');
}

function multiPageXml(): string {
  return fixtureXml
    .replace('pages="1"', 'pages="2"')
    .replace(
      '<page id="0" file="pixel8.png" />',
      '<page id="0" file="pixel8-0.png" /><page id="1" file="pixel8-1.png" />',
    )
    .replace('id="66" x="8" y="0"', 'id="66" x="0" y="0"')
    .replace('id="67" x="16" y="0"', 'id="67" x="0" y="0"')
    .replaceAll('page="0" />', 'page="1" />')
    .replace(
      'id="65" x="0" y="0" width="8" height="8" xoffset="0" yoffset="0" xadvance="8" page="1"',
      'id="65" x="0" y="0" width="8" height="8" xoffset="0" yoffset="0" xadvance="8" page="0"',
    );
}

describe('parseBmFontXml', () => {
  it('parses AngelCode XML into Pixi-compatible font data', () => {
    const data = parseBmFontXml(fixtureXml);
    expect(data.fontFamily).toBe('Pixel8');
    expect(data.fontSize).toBe(8);
    expect(data.chars.A).toMatchObject({ width: 8, height: 8, xAdvance: 8 });
    expect(data.pages).toHaveLength(1);
  });

  it('rejects non-finite metrics and undeclared glyph pages', () => {
    expect(() =>
      parseBmFontXml(fixtureXml.replace('size="8"', 'size="NaN"')),
    ).toThrow('size must be finite');
    expect(() =>
      parseBmFontXml(fixtureXml.replace('page="0"', 'page="1"')),
    ).toThrow('declared page id');
  });

  it('validates required metadata, pages, characters, and distance fields', () => {
    expect(() => parseBmFontXml('<font>')).toThrow('parse error');
    expect(() => parseBmFontXml('<font/>')).toThrow('<info> and <common>');
    expect(() =>
      parseBmFontXml(fixtureXml.replace('face="Pixel8"', '')),
    ).toThrow('face attribute');
    expect(() =>
      parseBmFontXml(fixtureXml.replace('lineHeight="8"', 'lineHeight="0"')),
    ).toThrow('must be positive');
    expect(() =>
      parseBmFontXml(fixtureXml.replace('file="pixel8.png"', '')),
    ).toThrow('file attribute');
    expect(() =>
      parseBmFontXml(fixtureXml.replace('id="0" file=', 'id="-1" file=')),
    ).toThrow('non-negative integer');
    expect(() =>
      parseBmFontXml(
        fixtureXml.replace(
          '<page id="0" file="pixel8.png" />',
          '<page id="0" file="a.png" /><page id="0" file="b.png" />',
        ),
      ),
    ).toThrow('duplicate page');
    expect(() =>
      parseBmFontXml(fixtureXml.replace(/<page[^>]+\/>/, '')),
    ).toThrow('at least one <page>');
    expect(() =>
      parseBmFontXml(fixtureXml.replace('id="65"', 'id="1114112"')),
    ).toThrow('valid Unicode');
    expect(() =>
      parseBmFontXml(fixtureXml.replace(/<char[^>]+\/>/g, '')),
    ).toThrow('at least one <char>');

    const withDistanceField = fixtureXml.replace(
      '</font>',
      '<distanceField fieldType="msdf" distanceRange="4" /></font>',
    );
    expect(parseBmFontXml(withDistanceField).distanceField).toEqual({
      range: 4,
      type: 'msdf',
    });
    expect(
      parseBmFontXml(
        withDistanceField.replace('fieldType="msdf"', 'fieldType="other"'),
      ).distanceField?.type,
    ).toBe('none');
    expect(() =>
      parseBmFontXml(
        withDistanceField.replace('distanceRange="4"', 'distanceRange="-1"'),
      ),
    ).toThrow('non-negative');
  });

  it('maps explicit letters and known kernings while ignoring unknown pairs', () => {
    const xml = fixtureXml
      .replace('id="65"', 'id="32" letter="space"')
      .replace(
        '</chars>',
        '</chars><kernings><kerning first="32" second="66" amount="-2"/><kerning first="999" second="66" amount="1"/></kernings>',
      );
    const data = parseBmFontXml(xml);
    expect(data.chars[' ']?.letter).toBe(' ');
    expect(data.chars.B?.kerning[' ']).toBe(-2);
  });
});

describe('FlxBitmapFont', () => {
  beforeEach(() => {
    FlxG.installContext(new FlxContext(320, 180, 0.5));
  });

  afterEach(() => {
    FlxG.clearContext();
  });

  it('builds monospace and AngelCode fonts and registers them for BitmapText', () => {
    const graphic = monospaceGraphic();
    const mono = FlxBitmapFont.fromMonospace(graphic, 'ABC', 8, 8, {
      fontFamily: 'UnitMono8',
    });
    const angel = FlxBitmapFont.fromAngelCode(graphic, fixtureXml);

    expect(mono.fontFamily).toBe('UnitMono8');
    expect(mono.size).toBe(8);
    expect(mono.lineHeight).toBe(8);
    expect(angel.fontFamily).toBe('Pixel8');

    const text = new FlxBitmapText(4, 6, 'ABC', mono, 40);
    const handle = text.createRenderHandle() as FlxBitmapTextRenderHandle;
    expect(handle).toBeInstanceOf(FlxBitmapTextRenderHandle);
    expect(handle.textNode.text).toBe('ABC');
    expect(handle.textNode.style.fontFamily).toBe('UnitMono8');

    text.text = 'AB';
    handle.sync();
    expect(handle.textNode.text).toBe('AB');

    mono.destroy();
    angel.destroy();
    text.destroy();
    graphic.destroy();
  });

  it('builds multi-page AngelCode fonts without taking texture ownership', () => {
    const first = FlxGraphic.fromPixels(
      makeGraphicPixels(8, 8, 0xff3344ff),
      'unit-bmfont-page-0',
    );
    const second = FlxGraphic.fromPixels(
      makeGraphicPixels(8, 8, 0x33ccffff),
      'unit-bmfont-page-1',
    );
    const font = FlxBitmapFont.fromAngelCode(
      [first, second.texture],
      multiPageXml(),
      'UnitMultiPage8',
    );
    const text = new FlxBitmapText(0, 0, 'AB', font, 32);
    const handle = text.createRenderHandle() as FlxBitmapTextRenderHandle;

    expect(font.pixiFont.pages).toHaveLength(2);
    expect(handle.textNode.text).toBe('AB');
    font.destroy();
    expect(first.texture.source.destroyed).toBe(false);
    expect(second.texture.source.destroyed).toBe(false);

    text.destroy();
    first.destroy();
    second.destroy();
  });

  it('preserves caller-owned textures and cache entries for non-owning wrappers', () => {
    const graphic = monospaceGraphic();
    const font = FlxBitmapFont.fromMonospace(graphic, 'ABC', 8, 8, {
      fontFamily: 'UnitOwned8',
    });
    const wrapper = new FlxBitmapFont(font.pixiFont, false);
    const source = graphic.texture.source;

    wrapper.destroy();
    expect(Cache.get('UnitOwned8-bitmap')).toBe(font.pixiFont);

    font.destroy();
    expect(source.destroyed).toBe(false);
    expect(graphic.destroyed).toBe(false);
    expect(Cache.has('UnitOwned8-bitmap')).toBe(false);

    graphic.destroy();
  });

  it('rejects duplicate families and glyphs outside the source texture', () => {
    const graphic = monospaceGraphic();
    const font = FlxBitmapFont.fromMonospace(graphic, 'ABC', 8, 8, {
      fontFamily: 'UnitDuplicate8',
    });

    expect(() =>
      FlxBitmapFont.fromMonospace(graphic, 'ABC', 8, 8, {
        fontFamily: 'UnitDuplicate8',
      }),
    ).toThrow('already registered');
    expect(() =>
      FlxBitmapFont.fromMonospace(graphic, 'ABCD', 8, 8, {
        fontFamily: 'UnitOverflow8',
      }),
    ).toThrow('must fit inside the source texture');

    font.destroy();
    graphic.destroy();
  });

  it('validates monospace dimensions, spacing, and non-empty character sets', () => {
    const graphic = monospaceGraphic();
    expect(() => FlxBitmapFont.fromMonospace(graphic, 'A', 0, 8)).toThrow(
      'charWidth',
    );
    expect(() =>
      FlxBitmapFont.fromMonospace(graphic, 'A', 8, Number.NaN),
    ).toThrow('charHeight');
    expect(() =>
      FlxBitmapFont.fromMonospace(graphic, 'A', 8, 8, { spacingX: -1 }),
    ).toThrow('spacingX');
    expect(() =>
      FlxBitmapFont.fromMonospace(graphic, 'A', 8, 8, {
        spacingY: Number.NaN,
      }),
    ).toThrow('spacingY');
    expect(() => FlxBitmapFont.fromMonospace(graphic, '', 8, 8)).toThrow(
      'at least one letter',
    );
    expect(() => FlxBitmapFont.fromMonospace(graphic, '\nA', 8, 8)).toThrow(
      'fit inside',
    );
    graphic.destroy();
  });

  it('validates AngelCode page layout and supports family overrides', () => {
    const graphic = monospaceGraphic();
    expect(() =>
      FlxBitmapFont.fromAngelCode(
        graphic,
        fixtureXml.replace(
          '<page id="0" file="pixel8.png" />',
          '<page id="0" file="a.png" /><page id="1" file="b.png" />',
        ),
      ),
    ).toThrow('received 1 page textures');
    expect(() =>
      FlxBitmapFont.fromAngelCode(
        [graphic, graphic],
        multiPageXml()
          .replace('id="1" file=', 'id="2" file=')
          .replaceAll('page="1"', 'page="2"'),
      ),
    ).toThrow('contiguous');
    expect(() =>
      FlxBitmapFont.fromAngelCode(
        graphic,
        fixtureXml.replace('x="0" y="0"', 'x="-1" y="0"'),
      ),
    ).toThrow('fit inside');

    const font = FlxBitmapFont.fromAngelCode(
      graphic.texture,
      fixtureXml,
      'UnitOverride8',
    );
    expect(font.fontFamily).toBe('UnitOverride8');
    font.destroy();
    font.destroy();
    graphic.destroy();
  });

  it('reuses and recreates the default font around destruction', () => {
    const first = FlxBitmapFont.getDefaultFont();
    expect(FlxBitmapFont.getDefaultFont()).toBe(first);
    first.destroy();
    const second = FlxBitmapFont.getDefaultFont();
    expect(second).not.toBe(first);
    second.destroy();
  });

  it('rejects wrapping a differently cached Pixi font', () => {
    const graphic = monospaceGraphic();
    const font = FlxBitmapFont.fromMonospace(graphic, 'A', 8, 8, {
      fontFamily: 'UnitCacheConflict8',
    });
    const other = new BitmapFont({
      data: parseBmFontXml(
        fixtureXml.replace('face="Pixel8"', 'face="UnitCacheConflict8"'),
      ),
      textures: [graphic.texture],
    });
    expect(() => new FlxBitmapFont(other)).toThrow('different font');
    other.pages.length = 0;
    other.destroy();
    font.destroy();
    graphic.destroy();
  });
});

describe('FlxBitmapText', () => {
  beforeEach(() => {
    FlxG.installContext(new FlxContext(320, 180, 0.5));
  });

  afterEach(() => {
    FlxG.clearContext();
  });

  it('maps alignment, spacing, and tint to BitmapText style', () => {
    const graphic = monospaceGraphic();
    const font = FlxBitmapFont.fromMonospace(graphic, 'ABC', 8, 8, {
      fontFamily: 'UnitAlign8',
    });
    const text = new FlxBitmapText(10, 12, 'AB', font, 32);
    text.setFormat(null, 0, 0x33ccff, 'center');
    text.letterSpacing = 2;
    text.lineSpacing = 1;
    const handle = text.createRenderHandle() as FlxBitmapTextRenderHandle;
    handle.sync();

    expect(handle.textNode.style.fill).toBe(0xffffff);
    expect(handle.textNode.tint).toBe(0x33ccff);
    expect(handle.textNode.style.align).toBe('center');
    expect(handle.textNode.style.letterSpacing).toBe(2);
    expect(text.color).toBe(0x33ccff);

    font.destroy();
    text.destroy();
    graphic.destroy();
  });

  it('resyncs mutable layout properties after handle creation', () => {
    const graphic = monospaceGraphic();
    const font = FlxBitmapFont.fromMonospace(graphic, 'ABC', 8, 8, {
      fontFamily: 'UnitMutable8',
    });
    const text = new FlxBitmapText(10, 12, 'AB', font, 32);
    const handle = text.createRenderHandle() as FlxBitmapTextRenderHandle;

    text.alignment = 'right';
    text.letterSpacing = 3;
    text.lineSpacing = 2;
    text.fieldWidth = 48;

    expect(handle.textNode.style.align).toBe('right');
    expect(handle.textNode.style.letterSpacing).toBe(3);
    expect(handle.textNode.style.lineHeight).toBe(10);
    expect(handle.textNode.style.wordWrapWidth).toBe(48);
    expect(text.width).toBe(48);
    expect(text.origin.x).toBe(24);
    expect(() => {
      text.fieldWidth = Number.NaN;
    }).toThrow('positive finite');
    expect(() => new FlxBitmapText(0, 0, '', font, Number.NaN)).toThrow(
      'zero or a positive finite',
    );

    font.destroy();
    text.destroy();
    graphic.destroy();
  });

  it('validates mutable properties and preserves custom origins', () => {
    const graphic = monospaceGraphic();
    const font = FlxBitmapFont.fromMonospace(graphic, 'ABC', 8, 8, {
      fontFamily: 'UnitValidation8',
    });
    const text = new FlxBitmapText(0, 0, 'A', font, 24);
    const handle = text.createRenderHandle() as FlxBitmapTextRenderHandle;

    text.origin.x = 3;
    text.fieldWidth = 32;
    expect(text.origin.x).toBe(3);
    text.fieldWidth = 32;
    text.alignment = 'center';
    text.alignment = 'center';
    text.text = 'ABC';
    text.text = 'ABC';
    text.letterSpacing = 1;
    text.letterSpacing = 1;
    text.lineSpacing = -2;
    text.lineSpacing = -2;
    text.font = font;
    handle.sync();
    expect(handle.textNode.position.x).toBeGreaterThanOrEqual(0);

    text.alignment = 'right';
    handle.sync();
    expect(handle.textNode.position.x).toBeGreaterThanOrEqual(0);
    text.visible = false;
    handle.sync();
    expect(handle.view.visible).toBe(false);
    expect(() => {
      text.letterSpacing = Number.NaN;
    }).toThrow('finite');
    expect(() => {
      text.lineSpacing = -8;
    }).toThrow('line height');

    handle.destroy();
    handle.sync();
    handle.destroy();
    expect(handle.destroyed).toBe(true);
    font.destroy();
    expect(() => {
      text.font = font;
    }).toThrow('destroyed');
    expect(() => new FlxBitmapText(0, 0, '', font)).toThrow('destroyed');
    text.destroy();
    graphic.destroy();
  });

  it('uses constructor defaults and accepts a compatible replacement font', () => {
    const defaultText = new FlxBitmapText();
    expect(defaultText.fieldWidth).toBe(1);
    defaultText.setFormat();
    defaultText.destroy();
    FlxBitmapFont.getDefaultFont().destroy();

    const graphic = monospaceGraphic();
    const first = FlxBitmapFont.fromMonospace(graphic, 'ABC', 8, 8, {
      fontFamily: 'UnitReplaceA8',
    });
    const second = FlxBitmapFont.fromMonospace(graphic.texture, 'ABC', 8, 8, {
      fontFamily: 'UnitReplaceB8',
    });
    const text = new FlxBitmapText(0, 0, 'A', first, 24);
    text.font = second;
    expect(text.font).toBe(second);
    text.destroy();
    first.destroy();
    second.destroy();
    graphic.destroy();
  });
});
