import { afterEach, describe, expect, it } from 'vitest';

import {
  FlxBasic,
  FlxContext,
  FlxG,
  FlxGroup,
  FlxObject,
  FlxPath,
  FlxPoint,
} from '../../src';

afterEach(() => {
  FlxG.clearContext();
});

function installStep(elapsed: number): FlxContext {
  const context = new FlxContext(320, 240);
  context.elapsed = elapsed;
  FlxG.installContext(context);
  return context;
}

describe('Phase 3 FlxPath and authoritative motion', () => {
  it('edits path nodes with copy/reference and clamped index semantics', () => {
    const source = new FlxPoint(10, 20);
    const path = new FlxPath();
    expect(path.head()).toBeNull();
    expect(path.tail()).toBeNull();
    expect(path.removeAt(0)).toBeNull();

    path.add(1, 2);
    path.addAt(3, 4, 99);
    path.addPoint(source);
    path.addPointAt(source, 1, true);
    expect(path.nodes).toHaveLength(4);
    expect(path.nodes[1]).toBe(source);
    expect(path.nodes[2]).not.toBe(source);
    source.x = 50;
    expect(path.nodes[1]?.x).toBe(50);
    expect(path.nodes[2]?.x).toBe(3);

    const referenced = new FlxPoint(7, 8);
    path.addPoint(referenced, true);
    path.addPointAt(referenced, 0);
    expect(path.nodes[0]).not.toBe(referenced);
    expect(path.nodes[path.nodes.length - 1]).toBe(referenced);

    expect(path.remove(new FlxPoint())).toBeNull();
    expect(path.remove(source)).toBe(source);
    const oldTail = path.tail();
    expect(path.removeAt(99)).toBe(oldTail);
    expect(path.head()).toEqual(new FlxPoint(7, 8));
    expect(() => path.addAt(0, 0, -1)).toThrow(RangeError);
    expect(() => path.addPointAt(source, 1.5)).toThrow(RangeError);
    expect(() => path.removeAt(-1)).toThrow(RangeError);

    path.destroy();
    path.destroy();
    expect(path.nodes).toEqual([]);
  });

  it('integrates linear and angular acceleration with the AS3 half-step rule', () => {
    installStep(0.5);
    const object = new FlxObject(0, 0, 10, 20);
    object.acceleration.make(10, -4);
    object.angularAcceleration = 8;
    object.postUpdate();

    expect(object.x).toBe(1.25);
    expect(object.y).toBe(-0.5);
    expect(object.velocity).toEqual(new FlxPoint(5, -2));
    expect(object.angle).toBe(1);
    expect(object.angularVelocity).toBe(4);

    object.acceleration.make();
    object.drag.make(2, 2);
    object.angularAcceleration = 0;
    object.angularDrag = 2;
    object.postUpdate();
    expect(object.velocity).toEqual(new FlxPoint(4, -1));
    expect(object.angularVelocity).toBe(3);
  });

  it('tracks last position, contacts, flicker, and optional motion', () => {
    installStep(0.25);
    const object = new FlxObject(4, 5, 6, 8);
    object.velocity.x = 20;
    object.touching = FlxObject.FLOOR;
    object.preUpdate();
    expect(object.last).toEqual(new FlxPoint(4, 5));
    object.postUpdate();
    expect(object.x).toBe(9);
    expect(object.wasTouching).toBe(FlxObject.FLOOR);
    expect(object.touching).toBe(FlxObject.NONE);

    object.moves = false;
    object.postUpdate();
    expect(object.x).toBe(9);
    object.flicker(0.5);
    expect(object.flickering).toBe(true);
    object.preUpdate();
    object.preUpdate();
    expect(object.flickering).toBe(false);
    object.flicker(-1);
    object.preUpdate();
    expect(object.flickering).toBe(true);
    object.flicker(0);
    expect(object.flickering).toBe(false);
  });

  it('follows, rotates to, completes, and destroys paths', () => {
    installStep(0.1);
    const path = new FlxPath([new FlxPoint(5, 5), new FlxPoint(105, 5)]);
    const object = new FlxObject(0, 0, 10, 10);
    object.followPath(path, -100, FlxObject.PATH_FORWARD, true);
    object.preUpdate();
    expect(object.velocity).toEqual(new FlxPoint(100, 0));
    expect(object.pathAngle).toBe(90);
    expect(object.angle).toBe(90);
    object.postUpdate();
    expect(object.x).toBe(10);

    object.x = 100;
    object.preUpdate();
    expect(object.pathSpeed).toBe(0);
    expect(object.x).toBe(100);

    const empty = new FlxPath();
    object.followPath(empty);
    expect(object.path).toBe(path);
    object.stopFollowingPath();
    expect(object.path).toBe(path);
    object.followPath(path);
    object.stopFollowingPath(true);
    expect(object.path).toBeNull();
    expect(path.nodes).toEqual([]);

    const owned = new FlxPath([new FlxPoint()]);
    object.followPath(owned);
    object.destroy();
    object.destroy();
    expect(owned.nodes).toEqual([]);
  });

  it('supports backward, looping, yoyo, and axis-only path modes', () => {
    installStep(1);
    const points = [new FlxPoint(0, 0), new FlxPoint(10, 10)];

    const backward = new FlxObject();
    backward.followPath(new FlxPath([...points]), 20, FlxObject.PATH_BACKWARD);
    backward.preUpdate();
    expect(backward.pathSpeed).toBe(20);
    expect(backward.velocity.x).toBeLessThan(0);
    backward.x = 0;
    backward.y = 0;
    backward.preUpdate();
    expect(backward.pathSpeed).toBe(0);

    const loopBackward = new FlxObject();
    loopBackward.followPath(
      new FlxPath([...points]),
      20,
      FlxObject.PATH_LOOP_BACKWARD,
    );
    loopBackward.preUpdate();
    loopBackward.x = 0;
    loopBackward.y = 0;
    loopBackward.preUpdate();
    expect(loopBackward.pathSpeed).toBe(20);
    expect(loopBackward.velocity.x).toBeGreaterThan(0);

    const loop = new FlxObject();
    loop.followPath(new FlxPath([...points]), 20, FlxObject.PATH_LOOP_FORWARD);
    loop.preUpdate();
    loop.x = 10;
    loop.y = 10;
    loop.preUpdate();
    expect(loop.pathSpeed).toBe(20);

    const yoyo = new FlxObject();
    yoyo.followPath(new FlxPath([...points]), 20, FlxObject.PATH_YOYO);
    yoyo.x = 10;
    yoyo.y = 10;
    yoyo.preUpdate();
    yoyo.x = 0;
    yoyo.y = 0;
    yoyo.preUpdate();
    yoyo.x = 0;
    yoyo.y = 0;
    yoyo.preUpdate();
    expect(yoyo.pathSpeed).toBe(20);

    const horizontal = new FlxObject(0, 50);
    horizontal.followPath(
      new FlxPath([new FlxPoint(100, 999)]),
      10,
      FlxObject.PATH_HORIZONTAL_ONLY,
    );
    horizontal.preUpdate();
    expect(horizontal.velocity).toEqual(new FlxPoint(10, 0));
    expect(horizontal.y).toBe(50);

    const vertical = new FlxObject(50, 0);
    vertical.followPath(
      new FlxPath([new FlxPoint(999, 100)]),
      10,
      FlxObject.PATH_VERTICAL_ONLY,
    );
    vertical.preUpdate();
    expect(vertical.velocity).toEqual(new FlxPoint(0, 10));
    expect(vertical.x).toBe(50);

    const negativeHorizontal = new FlxObject();
    negativeHorizontal.followPath(
      new FlxPath([new FlxPoint(-100, 0)]),
      10,
      FlxObject.PATH_HORIZONTAL_ONLY,
    );
    negativeHorizontal.preUpdate();
    expect(negativeHorizontal.pathAngle).toBe(-90);

    const negativeVertical = new FlxObject();
    negativeVertical.followPath(
      new FlxPath([new FlxPoint(0, -100)]),
      10,
      FlxObject.PATH_VERTICAL_ONLY,
    );
    negativeVertical.preUpdate();
    expect(negativeVertical.pathAngle).toBe(0);
  });
});

describe('Phase 3 FlxObject queries and state helpers', () => {
  it('uses strict AABB and point boundaries across nested groups', () => {
    const object = new FlxObject(0, 0, 10, 10);
    const touchingEdge = new FlxObject(10, 0, 5, 5);
    const overlapping = new FlxObject(9, 9, 5, 5);
    expect(object.overlaps(touchingEdge)).toBe(false);
    expect(object.overlaps(overlapping)).toBe(true);
    expect(object.overlapsAt(20, 20, overlapping)).toBe(false);
    expect(object.overlapsAt(9, 9, overlapping)).toBe(true);
    expect(object.overlapsAt(0, 0, new FlxBasic())).toBe(false);
    expect(object.overlapsPoint(new FlxPoint(0, 5))).toBe(false);
    expect(object.overlapsPoint(new FlxPoint(5, 5))).toBe(true);
    expect(object.overlaps(new FlxBasic())).toBe(false);

    const root = new FlxGroup<FlxBasic>();
    const nested = new FlxGroup<FlxBasic>();
    nested.add(touchingEdge);
    nested.add(overlapping);
    root.add(nested);
    expect(object.overlaps(root)).toBe(true);
    expect(object.overlapsAt(100, 100, root)).toBe(false);
  });

  it('computes structural camera coordinates without reading Pixi transforms', () => {
    const object = new FlxObject(100, 80, 20, 10);
    object.scrollFactor.make(0.5, 1);
    const camera = {
      scroll: new FlxPoint(21, 11),
      width: 120,
      height: 90,
    };
    const result = new FlxPoint();
    expect(object.getScreenXY(result, camera)).toBe(result);
    expect(result.x).toBeCloseTo(90.0000001);
    expect(result.y).toBeCloseTo(69.0000001);
    expect(object.onScreen(camera)).toBe(true);
    object.x = 500;
    expect(object.onScreen(camera)).toBe(false);
    object.x = -20;
    object.y = -20;
    const negative = object.getScreenXY(undefined, camera);
    expect(negative.x).toBeLessThan(0);
    expect(negative.y).toBeLessThan(0);
  });

  it('resets, revives, filters contacts, toggles solidity, and applies health', () => {
    const object = new FlxObject(1, 2, 10, 10);
    object.kill();
    object.velocity.make(4, 5);
    object.touching = FlxObject.LEFT | FlxObject.DOWN;
    object.wasTouching = FlxObject.LEFT;
    expect(object.isTouching(FlxObject.WALL)).toBe(true);
    expect(object.justTouched(FlxObject.DOWN)).toBe(true);
    expect(object.justTouched(FlxObject.LEFT)).toBe(false);
    object.reset(20, 30);
    expect(object.alive && object.exists).toBe(true);
    expect(object.last).toEqual(new FlxPoint(20, 30));
    expect(object.velocity).toEqual(new FlxPoint());
    expect(object.getMidpoint()).toEqual(new FlxPoint(25, 35));

    object.solid = false;
    expect(object.solid).toBe(false);
    object.solid = true;
    expect(object.allowCollisions).toBe(FlxObject.ANY);
    object.health = 3;
    object.hurt(-1);
    expect(object.health).toBe(4);
    object.hurt(4);
    expect(object.alive).toBe(false);
  });
});
