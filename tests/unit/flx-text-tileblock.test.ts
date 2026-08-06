import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  FlxContext,
  FlxG,
  FlxGraphic,
  FlxText,
  FlxTileblock,
  makeGraphicPixels,
} from '../../src';

describe('FlxText', () => {
  it('maps Flixel formatting and live bounds to a Pixi Text handle', () => {
    const text = new FlxText(5, 7, 80, 'Hello world')
      .setFormat('Arial', 12, 0x33ccff, 'center', 0x101010)
      .setBorderStyle(0xff0000, 2);
    const handle = text.createRenderHandle();

    expect(handle.textNode.text).toBe('Hello world');
    expect(handle.textNode.style).toMatchObject({
      align: 'center',
      fill: 0x33ccff,
      fontFamily: 'Arial',
      fontSize: 12,
    });
    expect(text.height).toBeGreaterThan(1);
    expect(handle.textNode.x).toBeGreaterThanOrEqual(0);

    text.text = 'Two\nlines';
    text.size = 16;
    text.font = 'Courier New';
    text.color = 0xffffff;
    text.alignment = 'right';
    text.shadow = 0;
    text.alpha = 0.5;
    text.scale.make(2, 2);
    text.angle = 10;
    handle.sync();
    expect(handle.textNode.text).toBe('Two\nlines');
    expect(handle.textNode.style.fontSize).toBe(16);
    expect(handle.view.alpha).toBe(0.5);
    expect(handle.view.angle).toBe(10);
    expect(handle.view.scale).toMatchObject({ x: 2, y: 2 });
    expect(text.borderColor).toBe(0xff0000);
    expect(text.borderSize).toBe(2);

    const sameText = text.text;
    const sameSize = text.size;
    const sameFont = text.font;
    const sameColor = text.color;
    const sameAlignment = text.alignment;
    const sameShadow = text.shadow;
    text.text = sameText;
    text.size = sameSize;
    text.font = sameFont;
    text.color = sameColor;
    text.alignment = sameAlignment;
    text.shadow = sameShadow;

    expect(() => {
      text.size = 0;
    }).toThrow(RangeError);
    expect(() => text.setBorderStyle(0, -1)).toThrow(RangeError);
    handle.destroy();
    text.destroy();
  });

  it('supports the documented BitmapText mode for high-frequency labels', () => {
    const text = new FlxText(0, 0, 120, 'Score: 0', true, 'bitmap');
    const handle = text.createRenderHandle();
    text.text = 'Score: 10';
    handle.sync();
    expect(handle.textNode.constructor.name).toBe('BitmapText');
    expect(handle.textNode.text).toBe('Score: 10');
    text.destroy();
    expect(handle.destroyed).toBe(true);
  });

  it('validates width and normalizes empty fonts', () => {
    expect(() => new FlxText(0, 0, 0)).toThrow(RangeError);
    const text = new FlxText(0, 0, 10, null, false);
    text.font = '';
    expect(text.font).toBe('system');
    expect(text.embeddedFont).toBe(false);
    text.destroy();
  });
});

describe('FlxTileblock', () => {
  beforeEach(() => {
    FlxG.installContext(new FlxContext(320, 180, 0.5));
  });

  afterEach(() => {
    FlxG.clearContext();
  });

  it('rounds to tile boundaries and generates a deterministic texture', () => {
    const tiles = makeGraphicPixels(4, 2, 0xff00ffff);
    const graphic = FlxGraphic.fromPixels(tiles);
    const block = new FlxTileblock(3, 4, 5, 3).loadTiles(graphic, 2, 2);

    expect(block.width).toBe(6);
    expect(block.height).toBe(4);
    expect(block.active).toBe(false);
    expect(block.immovable).toBe(true);
    expect(block.graphic?.pixels?.data.some((value) => value !== 0)).toBe(true);

    block.destroy();
    graphic.destroy();
  });

  it('handles null, empty weighting, and invalid tile sources', () => {
    const block = new FlxTileblock(0, 0, 4, 4);
    expect(block.loadTiles(null)).toBe(block);
    expect(() => block.loadTiles(block.graphic, 2, 2, -1)).toThrow(RangeError);
    expect(() => block.loadTiles(block.graphic, 9, 9)).toThrow(RangeError);

    const textureOnly = block.renderTexture;
    const wrapper = new FlxGraphic(textureOnly);
    expect(() => block.loadTiles(wrapper, 1, 1)).toThrow('pixel-backed');
    block.destroy();
  });
});
