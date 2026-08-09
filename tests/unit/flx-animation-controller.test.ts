import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  FlxAnim,
  FlxContext,
  FlxG,
  FlxGraphic,
  FlxSprite,
  FlxSpriteRenderHandle,
  makeGraphicPixels,
} from '../../src';

function animatedSprite(): FlxSprite {
  const graphic = FlxGraphic.fromPixels(
    makeGraphicPixels(4, 1, 0xffffffff),
    'controller-sheet',
  );
  return new FlxSprite().loadGraphic(graphic, true, false, 1, 1);
}

describe('FlxAnimationController', () => {
  beforeEach(() => {
    FlxG.installContext(new FlxContext(320, 180));
  });

  afterEach(() => {
    FlxG.clearContext();
  });

  it('manages, appends, renames, lists, and removes animations', () => {
    const sprite = animatedSprite();
    const controller = sprite.animation;

    controller.add('walk', [0, 1], 12, true);
    expect(controller.exists('walk')).toBe(true);
    expect(controller.getNameList()).toEqual(['walk']);
    controller.append('walk', [2]);
    expect(controller.getAnimationList()[0]?.frames).toEqual([0, 1, 2]);
    expect(controller.rename('walk', 'run')).toBe(true);
    expect(controller.name).toBeNull();
    expect(controller.exists('run')).toBe(true);
    expect(controller.rename('missing', 'idle')).toBe(false);
    expect(() => controller.rename('run', '')).toThrow(RangeError);

    controller.add('idle', [3]);
    expect(() => controller.rename('run', 'idle')).toThrow('already exists');
    expect(controller.remove('run')).toBe(true);
    expect(controller.remove('run')).toBe(false);
    expect(() => controller.append('missing', [0])).toThrow('No animation');
    sprite.destroy();
  });

  it('plays in reverse from an offset and applies animation flip flags', () => {
    const sprite = animatedSprite();
    const controller = sprite.animation;
    const handle = sprite.createRenderHandle();
    expect(handle).toBeInstanceOf(FlxSpriteRenderHandle);
    if (!(handle instanceof FlxSpriteRenderHandle)) {
      throw new Error('Expected FlxSpriteRenderHandle.');
    }

    controller.add('reverse', [0, 1, 2, 3], 10, false, true, true);
    controller.play('reverse', false, true, 1);
    expect(controller.frameIndex).toBe(2);
    expect(controller.curAnim).toMatchObject({
      curFrame: 2,
      reversed: true,
    });

    handle.sync();
    expect(handle.sprite.scale).toMatchObject({ x: -1, y: -1 });
    expect(handle.sprite.position).toMatchObject({ x: 1, y: 1 });

    FlxG.elapsed = 0.11;
    sprite.postUpdate();
    expect(controller.frameIndex).toBe(1);
    controller.frameIndex = 3;
    expect(controller.frameName).toBe('3');
    controller.frameName = '0';
    expect(controller.frameIndex).toBe(0);
    sprite.destroy();
  });

  it('dispatches frame, loop, and finish events deterministically', () => {
    const sprite = animatedSprite();
    const controller = sprite.animation;
    const frames: number[] = [];
    const loops: string[] = [];
    const finishes: string[] = [];
    controller.onFrameChange.add((event) => frames.push(event.frameIndex));
    controller.onLoop.add((name) => loops.push(name));
    controller.onFinish.add((name) => finishes.push(name));

    controller.add('loop', [0, 1, 2], 10, true);
    const loop = controller.getAnimationList()[0];
    if (loop === undefined) throw new Error('Expected loop animation.');
    loop.loopPoint = 1;
    controller.play('loop');
    FlxG.elapsed = 0.31;
    sprite.postUpdate();
    expect(loops).toEqual(['loop']);
    expect(frames.at(-1)).toBe(1);

    controller.add('once', [2, 3], 10, false);
    controller.play('once', true);
    FlxG.elapsed = 0.21;
    sprite.postUpdate();
    expect(finishes).toEqual(['once']);
    expect(controller.finished).toBe(true);
    expect(controller.paused).toBe(true);
    sprite.destroy();
  });

  it('supports named registration, time scales, pause, finish, and random frame', () => {
    const sprite = animatedSprite();
    const controller = sprite.animation;
    controller.addByNames('pair', ['0', '1'], 10, false);
    controller.addByIndices('tail', '', [2, 3], '', 10, false);
    controller.addByPrefix('all', '', 10, true);
    expect(
      controller.getAnimationList().map((animation) => animation.frames),
    ).toEqual([
      [0, 1],
      [2, 3],
      [0, 1, 2, 3],
    ]);
    expect(() => controller.addByPrefix('none', 'missing')).toThrow(
      'No frames',
    );
    expect(() => controller.addByNames('bad', ['missing'])).toThrow('No frame');

    controller.play('pair');
    controller.timeScale = 0;
    FlxG.elapsed = 1;
    sprite.postUpdate();
    expect(controller.frameIndex).toBe(0);
    controller.timeScale = 1;
    if (controller.curAnim === null) throw new Error('Expected animation.');
    controller.curAnim.timeScale = 0.5;
    FlxG.elapsed = 0.21;
    sprite.postUpdate();
    expect(controller.frameIndex).toBe(1);

    controller.paused = true;
    expect(controller.paused).toBe(true);
    controller.paused = false;
    controller.finish();
    expect(controller.frameIndex).toBe(1);
    controller.randomFrame();
    expect(controller.frameIndex).toBeGreaterThanOrEqual(0);
    expect(controller.frameIndex).toBeLessThan(controller.numFrames);
    controller.stop();
    sprite.destroy();
  });

  it('supports property-driven playback and completion controls', () => {
    const sprite = animatedSprite();
    const controller = sprite.animation;
    controller.add('walk', [0, 1], 10, false);
    const walk = controller.getAnimationList()[0];
    if (walk === undefined) throw new Error('Expected walk animation.');

    controller.curAnim = walk;
    expect(controller.name).toBe('walk');
    controller.name = null;
    expect(controller.paused).toBe(true);
    controller.name = 'walk';
    controller.frameName = null;
    expect(controller.frameIndex).toBe(0);
    controller.finished = true;
    expect(controller.finished).toBe(true);
    controller.finished = false;
    expect(controller.paused).toBe(false);
    controller.curAnim = null;
    expect(controller.paused).toBe(true);
    sprite.destroy();
  });

  it('exposes mutable animation timing metadata safely', () => {
    const animation = new FlxAnim('walk', [0, 1], 20, false, 2, true, true);
    expect(animation.delay).toBe(0.05);
    expect(animation.frameDuration).toBe(0.05);
    expect(animation.numFrames).toBe(2);
    expect(animation).toMatchObject({
      defaultSpeed: 2,
      flipX: true,
      flipY: true,
    });

    animation.frameDuration = 0.2;
    expect(animation.frameRate).toBe(5);
    animation.frameDuration = 0;
    expect(animation.frameRate).toBe(0);
    expect(animation.delay).toBe(0);
    expect(() => {
      animation.frameDuration = -1;
    }).toThrow(RangeError);
    expect(() => {
      animation.frameDuration = Number.NaN;
    }).toThrow(RangeError);
    animation.destroy();
    expect(animation.numFrames).toBe(0);
  });
});
