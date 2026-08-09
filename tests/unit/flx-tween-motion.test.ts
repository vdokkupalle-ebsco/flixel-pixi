import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  FlxContext,
  FlxG,
  FlxLinearMotion,
  FlxLinearPath,
  FlxObject,
  FlxQuadPath,
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

describe('motion tweens', () => {
  it('moves linearly by duration and restores object immovability', () => {
    const object = new FlxObject();
    const tween = FlxTween.linearMotion(object, 0, 10, 20, 30, 2);

    expect(object.immovable).toBe(true);
    update(1);
    expect(object.x).toBe(10);
    expect(object.y).toBe(20);
    expect(tween.distance).toBeCloseTo(Math.hypot(20, 20));
    update(1);
    expect(object.x).toBe(20);
    expect(object.y).toBe(30);
    expect(object.immovable).toBe(false);
  });

  it('derives linear duration from speed', () => {
    const object = new FlxObject();
    const tween = FlxTween.linearMotion(object, 0, 0, 100, 0, 50, false);
    expect(tween.duration).toBe(2);
    update(0.5);
    expect(object.x).toBe(25);
  });

  it('evaluates quadratic and cubic Bézier motion', () => {
    const quadraticObject = new FlxObject();
    const quadratic = FlxTween.quadMotion(
      quadraticObject,
      0,
      0,
      10,
      10,
      20,
      0,
      1,
    );
    update(0.5);
    expect(quadraticObject.x).toBeCloseTo(10);
    expect(quadraticObject.y).toBeCloseTo(5);
    expect(quadratic.distance).toBeGreaterThan(20);
    quadratic.cancel();

    const cubicObject = new FlxObject();
    FlxTween.cubicMotion(cubicObject, 0, 0, 0, 10, 20, 10, 20, 0, 1);
    update(0.5);
    expect(cubicObject.x).toBeCloseTo(10);
    expect(cubicObject.y).toBeCloseTo(7.5);
  });

  it('moves clockwise around a circle with duration or speed', () => {
    const object = new FlxObject();
    const tween = FlxTween.circularMotion(object, 10, 20, 5, 0, true, 1);
    expect(object.x).toBeCloseTo(15);
    expect(object.y).toBeCloseTo(20);
    update(0.25);
    expect(object.x).toBeCloseTo(10);
    expect(object.y).toBeCloseTo(25);
    expect(tween.circumference).toBeCloseTo(Math.PI * 10);
    tween.cancel();

    const bySpeed = FlxTween.circularMotion(
      new FlxObject(),
      0,
      0,
      10,
      0,
      true,
      20,
      false,
    );
    expect(bySpeed.duration).toBeCloseTo(Math.PI);

    const counterclockwise = FlxTween.circularMotion(
      new FlxObject(),
      0,
      0,
      5,
      0,
      false,
      1,
    );
    update(0.25);
    expect(counterclockwise.y).toBeCloseTo(-5);
  });

  it('traverses unequal linear path segments at a consistent distance rate', () => {
    const object = new FlxObject();
    const tween = FlxTween.linearPath(
      object,
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 30 },
      ],
      2,
    );

    expect(tween.distance).toBe(40);
    expect(tween.getPoint(-1)).toEqual({ x: 10, y: 30 });
    update(1);
    expect(object.x).toBeCloseTo(10);
    expect(object.y).toBeCloseTo(10);

    const bySpeed = FlxTween.linearPath(
      new FlxObject(),
      [
        { x: 0, y: 0 },
        { x: 0, y: 20 },
      ],
      10,
      false,
    );
    expect(bySpeed.duration).toBe(2);
  });

  it('traverses connected quadratic path segments', () => {
    const object = new FlxObject();
    const tween = FlxTween.quadPath(
      object,
      [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 0 },
        { x: 30, y: -10 },
        { x: 40, y: 0 },
      ],
      2,
    );

    update(1);
    expect(object.x).toBeCloseTo(20);
    expect(object.y).toBeCloseTo(0);
    expect(tween.distance).toBeGreaterThan(40);

    const bySpeed = FlxTween.quadPath(
      new FlxObject(),
      [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        { x: 10, y: 0 },
      ],
      5,
      false,
    );
    expect(bySpeed.duration).toBeCloseTo(bySpeed.distance / 5);
  });

  it('supports direct paths, duplicate segments, retargeting, and restarts', () => {
    const emptyLinear = new FlxLinearPath({}, manager);
    const emptyQuad = new FlxQuadPath({}, manager);
    expect(() => emptyLinear.getPoint()).toThrow(Error);
    expect(() => emptyQuad.getPoint()).toThrow(Error);

    const duplicate = new FlxLinearPath({}, manager)
      .addPoint(0, 0)
      .addPoint(0, 0)
      .addPoint(10, 0)
      .setMotion(1);
    manager.add(duplicate);
    update(0);
    expect(duplicate.x).toBe(0);

    const first = new FlxObject();
    const second = new FlxObject();
    const persistent = new FlxLinearMotion(
      { type: FlxTween.PERSIST },
      manager,
    ).setMotion(0, 0, 10, 0, 1);
    persistent.setObject(first).setObject(second);
    manager.add(persistent);
    expect(first.immovable).toBe(false);
    update(1);
    expect(second.immovable).toBe(false);
    persistent.start();
    expect(second.immovable).toBe(true);
    persistent.cancel();
  });

  it('supports target cancellation and validates path and speed inputs', () => {
    const object = new FlxObject();
    FlxTween.linearMotion(object, 0, 0, 10, 0, 1);
    expect(manager.containsTweensOf(object, ['x'])).toBe(true);
    FlxTween.cancelTweensOf(object, ['x']);
    expect(object.immovable).toBe(false);

    expect(() => FlxTween.linearMotion(object, 0, 0, 10, 0, 0, false)).toThrow(
      RangeError,
    );
    expect(object.immovable).toBe(false);
    expect(() => FlxTween.linearPath(object, [{ x: 0, y: 0 }])).toThrow(
      RangeError,
    );
    expect(() =>
      FlxTween.linearPath(object, [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ]),
    ).toThrow(RangeError);
    expect(() =>
      FlxTween.quadPath(object, [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
      ]),
    ).toThrow(RangeError);
    expect(() =>
      FlxTween.quadPath(object, [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ]),
    ).toThrow(RangeError);
    expect(() => FlxTween.circularMotion(object, 0, 0, -1, 0, true)).toThrow(
      RangeError,
    );
  });
});
