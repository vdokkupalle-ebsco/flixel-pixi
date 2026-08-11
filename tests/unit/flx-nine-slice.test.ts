import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  FlxAtlas,
  FlxContext,
  FlxGraphic,
  FlxG,
  FlxNineSliceButton,
  FlxNineSliceButtonRenderHandle,
  FlxNineSliceRenderHandle,
  FlxNineSliceSprite,
  makeGraphicPixels,
} from '../../src';
import {
  defaultNineSliceBorders,
  resolveNineSliceBorders,
  validateNineSliceBorders,
} from '../../src/objects/flx-nine-slice';

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

describe('nine-slice border helpers', () => {
  it('derives defaults and resolves partial overrides', () => {
    expect(defaultNineSliceBorders(2, 2)).toEqual({
      bottom: 1,
      left: 1,
      right: 1,
      top: 1,
    });
    expect(defaultNineSliceBorders(100, 100).left).toBe(10);
    expect(resolveNineSliceBorders({ left: 3, top: 4 }, 32, 32)).toEqual({
      bottom: 8,
      left: 3,
      right: 8,
      top: 4,
    });
    expect(resolveNineSliceBorders(undefined, 32, 32).left).toBe(8);
  });

  it('rejects invalid source, display, and inset dimensions', () => {
    const borders = { bottom: 4, left: 4, right: 4, top: 4 };
    expect(() =>
      validateNineSliceBorders(borders, Number.NaN, 16, 32, 32),
    ).toThrow('source and display');
    expect(() => validateNineSliceBorders(borders, 16, 16, 0, 32)).toThrow(
      'source and display',
    );
    expect(() =>
      validateNineSliceBorders({ ...borders, top: 0 }, 16, 16, 32, 32),
    ).toThrow('borders must be positive');
    expect(() => validateNineSliceBorders(borders, 16, 8, 32, 32)).toThrow(
      'source texture height',
    );
    expect(() => validateNineSliceBorders(borders, 16, 16, 8, 32)).toThrow(
      'display width',
    );
    expect(() => validateNineSliceBorders(borders, 16, 16, 32, 8)).toThrow(
      'display height',
    );
  });
});

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
    expect(() => sprite.resize(0, 32)).toThrow('width');
    expect(() => sprite.resize(32, Number.NaN)).toThrow('height');
    graphic.destroy();
    sprite.destroy();
  });

  it('loads textures and atlas frames, updates borders, and tears down handles', () => {
    const graphic = panelGraphic();
    const atlas = FlxAtlas.fromTextureAndRects(
      'nine-slice-unit-atlas',
      graphic.texture,
      [
        {
          height: 32,
          name: 'panel',
          width: 32,
          x: 0,
          y: 0,
        },
      ],
    );
    const sprite = new FlxNineSliceSprite(3, 4);
    sprite.loadNineSliceTexture(graphic.texture, 80, 40, { left: 6 });
    const handle = sprite.createRenderHandle() as FlxNineSliceRenderHandle;
    expect(sprite.leftWidth).toBe(6);
    expect(sprite.topHeight).toBe(8);
    sprite.setBorders(4, 5, 6, 7);
    expect(handle.slice.leftWidth).toBe(4);
    sprite.loadNineSliceFrame(atlas, 'panel', 64, 48);
    expect(sprite.width).toBe(64);

    sprite.alpha = 0;
    sprite.postUpdate();
    expect(handle.view.visible).toBe(false);
    handle.destroy();
    handle.sync();
    handle.destroy();
    expect(handle.destroyed).toBe(true);
    sprite.destroy();
    graphic.destroy();
  });

  it('uses intrinsic dimensions and a render handle default callback', () => {
    const graphic = panelGraphic();
    const sprite = new FlxNineSliceSprite();
    sprite.loadNineSliceGraphic(graphic, false, false, 32, 32);
    expect(sprite.width).toBe(32);
    expect(sprite.height).toBe(32);
    const handle = new FlxNineSliceRenderHandle(sprite);
    handle.destroy();
    sprite.destroy();
    graphic.destroy();
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

    button.setBorders(5, 3, 5, 3);
    expect(handle.slice.leftWidth).toBe(5);
    button.alpha = 0;
    button.postUpdate();
    expect(handle.view.visible).toBe(false);
    handle.destroy();
    handle.sync();
    handle.destroy();
    button.destroy();
    graphic.destroy();
  });

  it('supports unlabeled buttons, textures, and atlas frames', () => {
    const graphic = panelGraphic();
    const atlas = FlxAtlas.fromTextureAndRects(
      'nine-button-unit-atlas',
      graphic.texture,
      [
        {
          height: 32,
          name: 'panel',
          width: 32,
          x: 0,
          y: 0,
        },
      ],
    );
    const button = new FlxNineSliceButton(0, 0, null);
    button.loadNineSliceTexture(graphic.texture, 72, 36, {
      bottom: 5,
      left: 5,
      right: 5,
      top: 5,
    });
    const handle = button.createRenderHandle();
    expect(handle.view.children).toHaveLength(1);
    button.loadNineSliceFrame(atlas, 'panel', 80, 40);
    expect(handle.slice.width).toBe(80);
    expect(() => button.loadGraphic(graphic)).toThrow('loadNineSliceGraphic');
    expect(() => button.setBorders(20, 4, 20, 4)).toThrow(
      'source texture width',
    );
    handle.destroy();
    button.destroy();
    graphic.destroy();
  });

  it('uses intrinsic dimensions and a render handle default callback', () => {
    const graphic = panelGraphic();
    const button = new FlxNineSliceButton(0, 0, null);
    button.loadNineSliceGraphic(graphic, false, false, 32, 32);
    expect(button.width).toBe(32);
    expect(button.height).toBe(32);
    const handle = new FlxNineSliceButtonRenderHandle(button);
    handle.destroy();
    button.destroy();
    graphic.destroy();
  });
});
