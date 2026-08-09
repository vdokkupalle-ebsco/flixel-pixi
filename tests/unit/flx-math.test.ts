import { afterEach, describe, expect, it } from 'vitest';

import {
  FlxContext,
  FlxG,
  FlxPoint,
  FlxRandom,
  FlxRect,
  FlxU,
  nextFlixelSeed,
} from '../../src';

afterEach(() => {
  FlxG.clearContext();
});

describe('Headless core math and deterministic utilities', () => {
  it('copies and reuses structural point values', () => {
    const point = new FlxPoint(1, 2);
    const target = { x: 0, y: 0 };

    expect(point.make(3, 4)).toBe(point);
    expect(point.copyTo(target)).toBe(target);
    expect(target).toEqual({ x: 3, y: 4 });
    expect(point.copyFrom({ x: 5, y: 6 })).toBe(point);
    expect(point.copyFromFlash({ x: 7, y: 8 })).toBe(point);
    expect(point.copyToFlash(target)).toEqual({ x: 7, y: 8 });
  });

  it('exposes rectangle edges, copy helpers, and strict overlap', () => {
    const rectangle = new FlxRect(1, 2, 3, 4);
    expect({
      bottom: rectangle.bottom,
      left: rectangle.left,
      right: rectangle.right,
      top: rectangle.top,
    }).toEqual({ bottom: 6, left: 1, right: 4, top: 2 });

    const target = { height: 0, width: 0, x: 0, y: 0 };
    expect(rectangle.make(10, 20, 30, 40)).toBe(rectangle);
    expect(rectangle.copyTo(target)).toBe(target);
    expect(rectangle.copyFrom(target)).toBe(rectangle);
    expect(rectangle.copyFromFlash({ height: 8, width: 7, x: 5, y: 6 })).toBe(
      rectangle,
    );
    expect(rectangle.copyToFlash(target)).toEqual({
      height: 8,
      width: 7,
      x: 5,
      y: 6,
    });
    expect(rectangle.overlaps(new FlxRect(11, 7, 1, 1))).toBe(true);
    expect(rectangle.overlaps(new FlxRect(12, 7, 1, 1))).toBe(false);
    expect(rectangle.overlaps(new FlxRect(5, 14, 1, 1))).toBe(false);
  });

  it('commits the original seeded random vector', () => {
    const expected = [
      0.4999837900977506, 0.3714503954963062, 0.7479848483335156,
      0.4531258276911107, 0.07324968281819005, 0.7161674852092599,
      0.29648775388323134, 0.7739131044474957,
    ];
    const random = new FlxRandom(0.5);

    expect(expected.map(() => random.next())).toEqual(expected);
    expect(nextFlixelSeed(0.5)).toBe(expected[0]);
    expect(FlxU.srand(0.5)).toBe(expected[0]);
    expect(() => new FlxRandom(Number.NaN)).toThrow(RangeError);
  });

  it('preserves numeric and formatting helpers', () => {
    expect(FlxU.abs(3)).toBe(3);
    expect(FlxU.abs(-3)).toBe(3);
    expect(FlxU.floor(1.9)).toBe(1);
    expect(FlxU.floor(-1.2)).toBe(-2);
    expect(FlxU.floor(-1)).toBe(-1);
    expect(FlxU.ceil(1.2)).toBe(2);
    expect(FlxU.ceil(-1.2)).toBe(-1);
    expect(FlxU.round(1.5)).toBe(2);
    expect(FlxU.round(-1)).toBe(-1);
    expect(FlxU.round(-1.2)).toBe(-2);
    expect(FlxU.min(1, 2)).toBe(1);
    expect(FlxU.max(1, 2)).toBe(2);
    expect(FlxU.bound(-1, 0, 10)).toBe(0);
    expect(FlxU.bound(11, 0, 10)).toBe(10);
    expect(FlxU.bound(5, 0, 10)).toBe(5);
    expect(FlxU.formatTicks(1_000, 2_500)).toBe('1.5s');
    expect(FlxU.formatTime(65.07)).toBe('1:05');
    // AS3 and JavaScript both truncate the IEEE-754 remainder here.
    expect(FlxU.formatTime(65.07, true)).toBe('1:05.06');
    expect(FlxU.formatMoney(12_345.6)).toBe('12,345.60');
    expect(FlxU.formatMoney(-12_345.6, true, false)).toBe('-12.345,60');
    expect(FlxU.formatMoney(12, false)).toBe('12');
    expect(FlxU.formatArray([1, 'two'])).toBe('1, two');
    expect(FlxU.formatArray(null)).toBe('');
    expect(FlxU.getTicks()).toBeGreaterThanOrEqual(0);
  });

  it('selects, shuffles, measures, and rotates points', () => {
    expect(FlxU.getRandom(null)).toBeNull();
    expect(FlxU.getRandom([1, 2], 3)).toBeNull();
    expect(FlxU.getRandom([1, 2, 3], 1, 1, () => 0.9)).toBe(2);
    expect(FlxU.getRandom([1, 2, 3], 1, 99, () => 0.9)).toBe(3);
    expect(FlxU.shuffle([1, 2, 3], 1, () => 0)).toEqual([1, 2, 3]);
    expect(FlxU.getDistance(new FlxPoint(0, 0), new FlxPoint(3, 4))).toBe(5);
    expect(FlxU.getAngle(new FlxPoint(), new FlxPoint())).toBe(0);
    expect(FlxU.getAngle(new FlxPoint(), new FlxPoint(0, -1))).toBeCloseTo(
      0,
      5,
    );
    expect(FlxU.getAngle(new FlxPoint(), new FlxPoint(1, 0))).toBeCloseTo(
      90,
      5,
    );
    expect(FlxU.getAngle(new FlxPoint(), new FlxPoint(-1, 0))).toBeCloseTo(
      -90,
      5,
    );
    const rotated = FlxU.rotatePoint(1, 0, 0, 0, 90);
    expect(rotated.x).toBeCloseTo(0, 12);
    expect(rotated.y).toBeCloseTo(1, 12);
    const reused = new FlxPoint();
    expect(FlxU.rotatePoint(1, 0, 0, 0, 0, reused)).toBe(reused);
  });

  it('round-trips ARGB color helpers across hue branches', () => {
    const color = FlxU.makeColor(0x12, 0x34, 0x56, 0.5);
    expect(color).toBe(0x7f123456);
    const rgba = [0, 0, 0, 0];
    expect(FlxU.getRGBA(color, rgba)).toBe(rgba);
    expect(rgba).toEqual([0x12, 0x34, 0x56, 0x7f / 255]);
    expect(FlxU.makeColor(1, 2, 3, 128)).toBe(0x80010203);

    expect(FlxU.getHSB(0xff000000)).toEqual([0, 0, 0, 1]);
    expect(FlxU.getHSB(0xffff0000)[0]).toBe(0);
    expect(FlxU.getHSB(0xff00ff00)[0]).toBe(120);
    expect(FlxU.getHSB(0xff0000ff)[0]).toBe(240);
    expect(FlxU.makeColorFromHSB(0, 0, 0.5)).toBe(0xff7f7f7f);
    expect(FlxU.makeColorFromHSB(360, 1, 1)).toBe(0xffff0000);
    expect(FlxU.makeColorFromHSB(60, 1, 1)).toBe(0xffffff00);
    expect(FlxU.makeColorFromHSB(120, 1, 1)).toBe(0xff00ff00);
    expect(FlxU.makeColorFromHSB(180, 1, 1)).toBe(0xff00ffff);
    expect(FlxU.makeColorFromHSB(240, 1, 1)).toBe(0xff0000ff);
    expect(FlxU.makeColorFromHSB(300, 1, 1)).toBe(0xffff00ff);
  });

  it('computes velocity using explicit or context-owned elapsed time', () => {
    expect(FlxU.computeVelocity(10, 5, 0, 100, 2)).toBe(20);
    expect(FlxU.computeVelocity(10, 0, 3, 100, 2)).toBe(4);
    expect(FlxU.computeVelocity(-10, 0, 3, 100, 2)).toBe(-4);
    expect(FlxU.computeVelocity(2, 0, 3, 100, 2)).toBe(0);
    expect(FlxU.computeVelocity(100, 0, 0, 20, 1)).toBe(20);
    expect(FlxU.computeVelocity(10, 0, 0)).toBe(10);

    const context = new FlxContext(320, 240);
    context.elapsed = 0.5;
    FlxG.installContext(context);
    expect(FlxU.computeVelocity(0, 10)).toBe(5);
    expect(FlxU.getClassName(context, true)).toBe('FlxContext');
    expect(FlxU.compareClassNames(context, new FlxContext(1, 1))).toBe(true);
    expect(FlxU.compareClassNames(context, new FlxPoint())).toBe(false);
  });
});
