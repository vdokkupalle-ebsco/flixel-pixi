import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  FlxContext,
  FlxGraphic,
  FlxG,
  FlxNineSliceButton,
  FlxNineSliceButtonRenderHandle,
  FlxNineSliceRenderHandle,
  FlxNineSliceSprite,
  makeGraphicPixels,
} from '../../src';

function panelGraphic(): FlxGraphic {
  const size = 32;
  const pixels = makeGraphicPixels(size, size, 0);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const corner = x < 8 || x >= size - 8 || y < 8 || y >= size - 8;
      pixels.data[y * size + x] = corner ? 0xff8844ff : 0x442211ff;
    }
  }
  return FlxGraphic.fromPixels(pixels, 'nine-slice-panel');
}

describe('FlxNineSliceSprite', () => {
  beforeEach(() => {
    FlxG.installContext(new FlxContext(320, 180, 0.5));
  });

  afterEach(() => {
    FlxG.clearContext();
  });

  it('projects border insets and resizes through the render handle', () => {
    const graphic = panelGraphic();
    const sprite = new FlxNineSliceSprite(12, 16, 120, 60);
    sprite.loadNineSliceGraphic(
      graphic,
      false,
      false,
      32,
      32,
      { bottom: 8, left: 8, right: 8, top: 8 },
      120,
      60,
    );
    const handle = sprite.createRenderHandle() as FlxNineSliceRenderHandle;

    expect(handle).toBeInstanceOf(FlxNineSliceRenderHandle);
    expect(handle.slice.width).toBe(120);
    expect(handle.slice.height).toBe(60);
    expect(handle.slice.leftWidth).toBe(8);
    expect(handle.slice.topHeight).toBe(8);
    expect(handle.slice.rightWidth).toBe(8);
    expect(handle.slice.bottomHeight).toBe(8);
    expect(sprite.scale.x).toBe(1);
    expect(sprite.scale.y).toBe(1);

    sprite.resize(80, 40);
    expect(handle.slice.width).toBe(80);
    expect(handle.slice.height).toBe(40);
    expect(sprite.width).toBe(80);
  });

  it('rejects loadGraphic and oversized border insets', () => {
    const graphic = panelGraphic();
    const sprite = new FlxNineSliceSprite();
    expect(() => sprite.loadGraphic(graphic)).toThrow('loadNineSliceGraphic');
    expect(() =>
      sprite.loadNineSliceGraphic(
        graphic,
        false,
        false,
        32,
        32,
        { bottom: 20, left: 20, right: 20, top: 20 },
        32,
        32,
      ),
    ).toThrow('source texture width');
    expect(() =>
      sprite.loadNineSliceGraphic(
        graphic,
        false,
        false,
        32,
        32,
        { bottom: 8, left: Number.NaN, right: 8, top: 8 },
        64,
        64,
      ),
    ).toThrow('positive');
  });
});

describe('FlxNineSliceButton', () => {
  beforeEach(() => {
    FlxG.installContext(new FlxContext(320, 180, 0.5));
  });

  afterEach(() => {
    FlxG.clearContext();
  });

  it('uses a nine-slice background handle and animated frame textures', () => {
    const strip = makeGraphicPixels(64, 16, 0);
    for (let i = 0; i < strip.data.length; i += 1) {
      strip.data[i] = i % 2 === 0 ? 0x3366ccff : 0xcc6633ff;
    }
    const graphic = FlxGraphic.fromPixels(strip, 'nine-slice-button-strip');
    const button = new FlxNineSliceButton(8, 12, 'OK', () => undefined);
    button.loadNineSliceGraphic(
      graphic,
      true,
      false,
      32,
      16,
      { bottom: 4, left: 6, right: 6, top: 4 },
      96,
      32,
    );
    const handle =
      button.createRenderHandle() as FlxNineSliceButtonRenderHandle;

    expect(handle).toBeInstanceOf(FlxNineSliceButtonRenderHandle);
    expect(handle.slice.width).toBe(96);
    expect(handle.slice.height).toBe(32);
    expect(handle.slice.leftWidth).toBe(6);

    button.frame = 1;
    button.drawFrame(true);
    expect(handle.slice.texture).toBe(button.renderTexture);
  });
});
