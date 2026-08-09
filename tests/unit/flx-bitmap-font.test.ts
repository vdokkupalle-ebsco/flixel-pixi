// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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
});
