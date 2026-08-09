import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  FlxBasic,
  FlxContext,
  FlxG,
  FlxObject,
  FlxSprite,
  FlxTween,
  FlxTweenManager,
} from '../../src';

let context: FlxContext;
let manager: FlxTweenManager;

beforeEach(() => {
  context = new FlxContext(160, 90);
  FlxG.installContext(context);
  manager = context.addPlugin(new FlxTweenManager());
});

afterEach(() => {
  context.destroyPlugins();
  FlxG.clearContext();
});

function update(elapsed: number): void {
  FlxG.elapsed = elapsed;
  manager.update();
}

describe('specialized tweens', () => {
  it('tweens standalone and object angles', () => {
    const object = new FlxObject();
    const tween = FlxTween.angle(object, -90, 450, 2);

    update(1);
    expect(tween.angle).toBe(180);
    expect(object.angle).toBe(180);
    expect(manager.containsTweensOf(object, ['angle'])).toBe(true);

    update(1);
    expect(tween.angle).toBe(450);
    expect(object.angle).toBe(90);

    const standalone = manager.angle(null, 10, 20, 1);
    update(0.5);
    expect(standalone.angle).toBe(15);
  });

  it('interpolates RGB and alpha channels independently', () => {
    const target = { alpha: 1, color: 0xff0000 };
    const tween = FlxTween.color(target, 1, 0xffff0000, {
      alpha: 0,
      color: 0x0000ff,
    });

    update(0.5);
    expect(tween.color).toBe(0x80800080);
    expect(target.color).toBe(0x800080);
    expect(target.alpha).toBeCloseTo(128 / 255);
    update(0.5);
    expect(target).toEqual({ alpha: 0, color: 0x0000ff });

    const standalone = manager.color(null, 1, 0x000000, 0xffffffff);
    update(0.5);
    expect(standalone.color >>> 24).toBe(0xff);
  });

  it('flickers visibility with game time and restores configured visibility', () => {
    const basic = new FlxBasic();
    const tween = FlxTween.flicker(basic, 0.2, 0.1, {
      endVisibility: true,
      ratio: 0.5,
    });

    expect(FlxTween.isFlickering(basic)).toBe(true);
    update(0.02);
    expect(basic.visible).toBe(false);
    update(0.06);
    expect(basic.visible).toBe(true);
    expect(tween.time).toBeCloseTo(0.08);
    update(0.12);
    expect(basic.visible).toBe(true);
    expect(FlxTween.isFlickering(basic)).toBe(false);

    const custom = FlxTween.flicker(new FlxBasic(), 1, 0, {
      endVisibility: false,
      tweenFunction: () => true,
    });
    expect(custom.period).toBeCloseTo(1 / 60);
    update(0.1);
    expect(custom.basic?.visible).toBe(true);
    custom.cancel();
    expect(custom.basic).toBeNull();
  });

  it('shakes selected axes and restores the original offset on completion', () => {
    const sprite = new FlxSprite().makeGraphic(20, 10);
    sprite.offset.make(3, 4);
    const tween = FlxTween.shake(sprite, 0.1, 1, 'x');

    update(0.5);
    expect(sprite.offset.x).toBeGreaterThanOrEqual(1);
    expect(sprite.offset.x).toBeLessThanOrEqual(5);
    expect(sprite.offset.y).toBe(4);
    expect(manager.containsTweensOf(sprite, ['shake'])).toBe(true);

    update(0.5);
    expect(tween.finished).toBe(true);
    expect(sprite.offset.x).toBe(3);
    expect(sprite.offset.y).toBe(4);
    sprite.destroy();

    const both = new FlxSprite().makeGraphic(10, 10);
    const objectAxes = FlxTween.shake(both, 0.1, 1, { x: false, y: true });
    update(0.1);
    expect(both.offset.x).toBe(0);
    expect(both.offset.y).not.toBe(0);
    objectAxes.cancel();
    both.destroy();
  });

  it('validates specialized options and supports targeted cancellation', () => {
    const object = new FlxObject();
    FlxTween.angle(object, 0, 90, 1);
    FlxTween.cancelTweensOf(object, ['angle']);
    expect(manager.containsTweensOf(object)).toBe(false);

    expect(() => FlxTween.angle(null, 0, Number.NaN, 1)).toThrow(RangeError);
    expect(() =>
      FlxTween.flicker(new FlxBasic(), 1, 0.1, { ratio: 2 }),
    ).toThrow(RangeError);
    expect(() =>
      FlxTween.color(null, 1, { alpha: -1, color: 0 }, 0xffffff),
    ).toThrow(RangeError);
    expect(() => FlxTween.color(null, 1, Number.NaN, 0xffffff)).toThrow(
      RangeError,
    );
    expect(() => FlxTween.shake(new FlxSprite(), -1)).toThrow(RangeError);
  });
});
