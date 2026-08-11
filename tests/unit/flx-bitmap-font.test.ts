// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Cache } from 'pixi.js';

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
});
