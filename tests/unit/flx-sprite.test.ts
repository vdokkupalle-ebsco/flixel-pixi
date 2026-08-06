import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  FlxAnim,
  FlxContext,
  FlxG,
  FlxGraphic,
  FlxObject,
  FlxPoint,
  FlxSprite,
  FlxSpriteRenderHandle,
  makeGraphicPixels,
} from '../../src';

function spriteSheet(): FlxGraphic {
  const pixels = makeGraphicPixels(4, 2, 0);
  const colors = [0xff0000ff, 0x00ff00ff, 0x0000ffff, 0xffffffff];
  for (let index = 0; index < pixels.data.length; index += 1) {
    pixels.data[index] = colors[Math.floor(index / 2)] ?? 0;
  }
  return FlxGraphic.fromPixels(pixels, 'unit-sheet');
}

describe('FlxGraphic and FlxAnim', () => {
  it('creates upload bytes, caches frame textures, refreshes, and destroys safely', () => {
    const pixels = makeGraphicPixels(2, 1, 0x11223344);
    const graphic = FlxGraphic.fromPixels(pixels, 'pixels');
    const bytes = graphic.texture.source.resource;
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(Array.from(bytes as Uint8Array)).toEqual([
      0x11, 0x22, 0x33, 0x44, 0x11, 0x22, 0x33, 0x44,
    ]);

    const frame = graphic.frameTexture(1, 1, 1);
    expect(graphic.frameTexture(1, 1, 1)).toBe(frame);
    expect(frame.frame.x).toBe(1);
    pixels.data[0] = 0xaabbccdd;
    graphic.refresh();
    expect(Array.from((bytes as Uint8Array).slice(0, 4))).toEqual([
      0xaa, 0xbb, 0xcc, 0xdd,
    ]);
    expect(() => graphic.frameTexture(-1, 1, 1)).toThrow(RangeError);
    expect(() => graphic.frameTexture(2, 1, 1)).toThrow(RangeError);
    expect(() => graphic.frameTexture(0, 0, 1)).toThrow(RangeError);

    const unowned = new FlxGraphic(graphic.texture);
    expect(() => unowned.refresh()).toThrow('pixel-backed');
    unowned.destroy();

    graphic.destroy();
    graphic.destroy();
    expect(graphic.destroyed).toBe(true);
    expect(() => graphic.refresh()).toThrow('destroyed');
  });

  it('stores frame delay and clears frames on destroy', () => {
    const animation = new FlxAnim('walk', [0, 1], 20, false);
    const idle = new FlxAnim('idle', [0]);
    expect(animation.delay).toBe(0.05);
    expect(animation.looped).toBe(false);
    expect(idle.delay).toBe(0);
    expect(idle.looped).toBe(true);
    animation.destroy();
    idle.destroy();
    expect(animation.frames).toEqual([]);
  });
});

describe('FlxSprite', () => {
  beforeEach(() => {
    FlxG.installContext(new FlxContext(320, 180, 0.5));
  });

  afterEach(() => {
    FlxG.clearContext();
  });

  it('loads a frame grid and advances, pauses, resumes, and restarts animations', () => {
    const graphic = spriteSheet();
    const sprite = new FlxSprite(10, 20).loadGraphic(graphic, true, true, 2, 1);
    const callbacks: [string | null, number, number][] = [];
    sprite.addAnimation('walk', [0, 1, 2], 10, false);
    sprite.addAnimationCallback((...args) => callbacks.push(args));
    sprite.play('walk');

    expect(sprite.frames).toBe(4);
    expect(sprite.origin).toMatchObject({ x: 1, y: 0.5 });
    expect(callbacks.at(-1)).toEqual(['walk', 0, 0]);
    FlxG.elapsed = 0.11;
    sprite.postUpdate();
    expect(sprite.frame).toBe(1);
    sprite.pauseAnimation();
    sprite.postUpdate();
    expect(sprite.frame).toBe(1);
    sprite.resumeAnimation();
    sprite.postUpdate();
    expect(sprite.frame).toBe(2);
    sprite.postUpdate();
    expect(sprite.finished).toBe(true);
    expect(sprite.frame).toBe(2);

    sprite.restartAnimation();
    expect(sprite.frame).toBe(0);
    expect(sprite.animationName).toBe('walk');
    expect(sprite.animationFrame).toBe(0);
    expect(sprite.animationPaused).toBe(false);
    expect(() => sprite.play('missing')).toThrow('No animation');
    expect(() => sprite.addAnimation('', [0])).toThrow(RangeError);
    expect(() => sprite.addAnimation('empty', [])).toThrow(RangeError);
    expect(() => sprite.addAnimation('bad', [99])).toThrow(RangeError);

    sprite.addAnimation('loop', [0, 1], 10, true);
    sprite.play('loop');
    sprite.play('loop');
    FlxG.elapsed = 0.21;
    sprite.postUpdate();
    expect(sprite.finished).toBe(true);
    expect(sprite.frame).toBe(0);

    sprite.frame = 1;
    sprite.drawFrame();
    sprite.drawFrame();
    expect(callbacks.at(-1)).toEqual([null, 0, 1]);

    sprite.destroy();
    graphic.destroy();
  });

  it('synchronizes transforms, facing, tint, alpha, visibility, and frames', () => {
    const graphic = spriteSheet();
    const sprite = new FlxSprite(30, 40).loadGraphic(graphic, true, true, 2, 1);
    const handle = sprite.createRenderHandle();
    expect(handle).toBeInstanceOf(FlxSpriteRenderHandle);
    if (!(handle instanceof FlxSpriteRenderHandle)) {
      throw new Error('Expected sprite handle.');
    }

    sprite.offset.make(2, 3);
    sprite.origin.make(1, 0.5);
    sprite.scale.make(2, 3);
    sprite.angle = 45;
    sprite.alpha = 2;
    sprite.color = 0x1234567;
    sprite.blend = 'add';
    sprite.facing = FlxObject.LEFT;
    sprite.frame = 2;
    sprite.draw();

    expect(handle.view.position).toMatchObject({ x: 28, y: 37 });
    expect(handle.view.origin).toMatchObject({ x: 1, y: 0.5 });
    expect(handle.view.scale).toMatchObject({ x: 2, y: 3 });
    expect(handle.view.angle).toBe(45);
    expect(handle.view.alpha).toBe(1);
    expect(handle.view.tint).toBe(0x234567);
    expect(handle.view.blendMode).toBe('add');
    expect(handle.sprite.scale.x).toBe(-1);
    expect(handle.sprite.x).toBe(2);
    expect(handle.sprite.texture.frame.y).toBe(1);

    sprite.alpha = -1;
    sprite.visible = false;
    handle.sync();
    expect(handle.view.visible).toBe(false);
    expect(handle.view.alpha).toBe(0);

    sprite.alpha = 0.25;
    sprite.color = 0xffffff;
    sprite.facing = FlxObject.RIGHT;
    sprite.exists = false;
    handle.sync();
    expect(handle.sprite.scale.x).toBe(1);
    expect(handle.view.visible).toBe(false);

    handle.destroy();
    handle.destroy();
    expect(handle.destroyed).toBe(true);
    sprite.destroy();
    graphic.destroy();
  });

  it('supports direct frames, random frames, offsets, generated graphics, and culling', () => {
    const graphic = spriteSheet();
    const sprite = new FlxSprite().loadGraphic(graphic, true, false, 2, 1);
    sprite.frame = 3;
    sprite.drawFrame(true);
    expect(sprite.renderTexture.frame).toMatchObject({ x: 2, y: 1 });
    expect(() => {
      sprite.frame = 4;
    }).toThrow(RangeError);

    FlxG.globalSeed = 0.5;
    sprite.randomFrame();
    expect(sprite.frame).toBeGreaterThanOrEqual(0);
    expect(sprite.frame).toBeLessThan(sprite.frames);
    sprite.width = 1;
    sprite.height = 0.5;
    sprite.centerOffsets(true);
    expect(sprite.offset).toMatchObject({ x: 0.5, y: 0.25 });
    sprite.setOriginToCorner();
    expect(sprite.origin).toMatchObject({ x: 0, y: 0 });

    const camera = { height: 20, scroll: new FlxPoint(), width: 20 };
    sprite.x = -1;
    sprite.y = 0;
    expect(sprite.onScreen(camera)).toBe(true);
    sprite.angle = 30;
    sprite.scale.make(2, 2);
    expect(sprite.onScreen(camera)).toBe(true);
    sprite.x = -100;
    expect(sprite.onScreen(camera)).toBe(false);

    sprite.makeGraphic(3, 2, 0xabcdef80);
    expect(sprite.graphic?.pixels?.data[0]).toBe(0xabcdef80);
    sprite.destroy();
    graphic.destroy();
  });

  it('validates graphic dimensions and leaves shared graphics alive', () => {
    const graphic = spriteSheet();
    const sprite = new FlxSprite();
    expect(() => sprite.loadGraphic(graphic, true, false, 9, 1)).toThrow(
      RangeError,
    );
    sprite.loadGraphic(graphic, true, false, 2, 1);
    sprite.destroy();
    expect(graphic.destroyed).toBe(false);
    graphic.destroy();
  });
});
