import { afterEach, describe, expect, it } from 'vitest';

import {
  FlxBasic,
  FlxContext,
  FlxG,
  FlxGroup,
  FlxObject,
  FlxQuadTree,
} from '../../src';

afterEach(() => {
  FlxG.clearContext();
  FlxQuadTree.divisions = 6;
});

function movingObject(
  x: number,
  y: number,
  lastX: number,
  lastY: number,
  width = 5,
  height = 5,
): FlxObject {
  const object = new FlxObject(x, y, width, height);
  object.last.make(lastX, lastY);
  object.velocity.make(x - lastX, y - lastY);
  return object;
}

describe('AS3 collision separation oracle', () => {
  it('does not separate stationary or mutually immovable overlaps', () => {
    const first = new FlxObject(0, 0, 10, 10);
    const second = new FlxObject(5, 5, 10, 10);
    expect(FlxObject.separate(first, second)).toBe(false);
    first.immovable = true;
    second.immovable = true;
    first.x = 1;
    expect(FlxObject.separateX(first, second)).toBe(false);
    expect(FlxObject.separateY(first, second)).toBe(false);
  });

  it('separates a right-moving object and sets opposing contact flags', () => {
    const mover = movingObject(6, 0, 0, 0);
    const wall = movingObject(10, 0, 10, 0);
    wall.immovable = true;

    expect(FlxObject.separateX(mover, wall)).toBe(true);
    expect(mover.x).toBe(5);
    expect(mover.velocity.x).toBe(0);
    expect(mover.isTouching(FlxObject.RIGHT)).toBe(true);
    expect(wall.isTouching(FlxObject.LEFT)).toBe(true);
  });

  it('separates left/up motion and respects one-way collision masks', () => {
    const leftMover = movingObject(9, 0, 15, 0);
    const wall = movingObject(5, 0, 5, 0);
    wall.immovable = true;
    expect(FlxObject.separateX(leftMover, wall)).toBe(true);
    expect(leftMover.x).toBe(10);
    expect(leftMover.isTouching(FlxObject.LEFT)).toBe(true);

    const upward = movingObject(0, 9, 0, 15);
    const ceiling = movingObject(0, 5, 0, 5);
    ceiling.immovable = true;
    expect(FlxObject.separateY(upward, ceiling)).toBe(true);
    expect(upward.y).toBe(10);
    expect(upward.isTouching(FlxObject.UP)).toBe(true);

    const blocked = movingObject(6, 0, 0, 0);
    const oneWay = movingObject(10, 0, 10, 0);
    oneWay.immovable = true;
    oneWay.allowCollisions = FlxObject.RIGHT;
    expect(FlxObject.separateX(blocked, oneWay)).toBe(false);
    expect(blocked.touching).toBe(FlxObject.NONE);
  });

  it('lands on and is carried by an active moving platform', () => {
    const actor = movingObject(0, 6, 0, 0);
    const platform = movingObject(3, 10, 0, 10, 20, 5);
    platform.immovable = true;

    expect(FlxObject.separateY(actor, platform)).toBe(true);
    expect(actor.y).toBe(5);
    expect(actor.x).toBe(3);
    expect(actor.velocity.y).toBe(0);
    expect(actor.touching).toBe(FlxObject.FLOOR);
    expect(platform.touching).toBe(FlxObject.CEILING);

    const inactivePlatform = movingObject(3, 10, 0, 10, 20, 5);
    inactivePlatform.immovable = true;
    inactivePlatform.active = false;
    const otherActor = movingObject(0, 6, 0, 0);
    FlxObject.separateY(otherActor, inactivePlatform);
    expect(otherActor.x).toBe(0);
  });

  it('carries the second object when the first moving platform rises into it', () => {
    const platform = movingObject(4, 6, 0, 10, 20, 5);
    platform.immovable = true;
    const actor = movingObject(0, 4, 0, 4);

    expect(FlxObject.separateY(platform, actor)).toBe(true);
    expect(actor.x).toBe(4);
    expect(actor.y).toBe(1);
    expect(actor.touching).toBe(FlxObject.FLOOR);
  });

  it('transfers velocity between equal movable masses with elasticity', () => {
    const first = movingObject(6, 0, 0, 0);
    const second = movingObject(10, 0, 10, 0);
    first.elasticity = 1;
    second.elasticity = 1;

    expect(FlxObject.separateX(first, second)).toBe(true);
    expect(first.x).toBe(5.5);
    expect(second.x).toBe(10.5);
    expect(first.velocity.x).toBe(0);
    expect(second.velocity.x).toBe(6);

    const bothMoving = movingObject(6, 20, 0, 20);
    const slower = movingObject(10, 20, 8, 20);
    bothMoving.elasticity = 1;
    slower.elasticity = 1;
    expect(FlxObject.separateX(bothMoving, slower)).toBe(true);
    expect(Number.isFinite(bothMoving.velocity.x)).toBe(true);
  });

  it('rejects a floor collision when either directional mask disallows it', () => {
    const actor = movingObject(0, 6, 0, 0);
    const platform = movingObject(0, 10, 0, 10, 20, 5);
    platform.immovable = true;
    actor.allowCollisions = FlxObject.UP;
    expect(FlxObject.separateY(actor, platform)).toBe(false);
    actor.allowCollisions = FlxObject.ANY;
    platform.allowCollisions = FlxObject.DOWN;
    expect(FlxObject.separateY(actor, platform)).toBe(false);
  });

  it('runs X before Y and reports either successful component', () => {
    const first = movingObject(6, 6, 0, 6);
    const second = movingObject(10, 10, 10, 10);
    second.immovable = true;
    expect(FlxObject.separate(first, second)).toBe(true);
    expect(first.x).toBe(5);
    // X separation makes the rectangles edge-adjacent before Y is attempted.
    expect(first.y).toBe(6);
  });
});

describe('Quadtree and FlxG overlap traversal', () => {
  it('executes dual-list callbacks only for accepted swept overlaps', () => {
    const first = movingObject(20, 10, 0, 10);
    const second = movingObject(10, 10, 10, 10);
    const notified: FlxObject[][] = [];
    const tree = new FlxQuadTree(0, 0, 100, 100);
    tree.load(
      first,
      second,
      (left, right) => notified.push([left, right]),
      () => true,
    );
    expect(tree.execute()).toBe(true);
    expect(notified).toEqual([[first, second]]);
    tree.destroy();
    tree.destroy();

    const rejected = new FlxQuadTree(0, 0, 100, 100);
    let rejectNotifications = 0;
    rejected.load(
      first,
      second,
      () => {
        rejectNotifications += 1;
      },
      () => false,
    );
    expect(rejected.execute()).toBe(false);
    expect(rejectNotifications).toBe(0);
  });

  it('compares a group with itself once per pair and recurses nested groups', () => {
    const root = new FlxGroup<FlxBasic>();
    const nested = new FlxGroup<FlxBasic>();
    const first = new FlxObject(10, 10, 10, 10);
    const second = new FlxObject(15, 15, 10, 10);
    const ignored = new FlxObject(15, 15, 10, 10);
    ignored.exists = false;
    nested.add(first);
    nested.add(second);
    nested.add(ignored);
    root.add(nested);

    const pairs: FlxObject[][] = [];
    const tree = new FlxQuadTree(0, 0, 100, 100);
    tree.load(root, null, (left, right) => pairs.push([left, right]));
    expect(tree.execute()).toBe(true);
    expect(pairs).toEqual([[first, second]]);

    second.allowCollisions = FlxObject.NONE;
    const disabled = new FlxQuadTree(0, 0, 100, 100);
    disabled.load(root);
    expect(disabled.execute()).toBe(false);
  });

  it('subdivides and executes accepted pairs in every quadrant', () => {
    const first = new FlxGroup<FlxObject>();
    const second = new FlxGroup<FlxObject>();
    const quadrants: [number, number][] = [
      [10, 10],
      [70, 10],
      [70, 70],
      [10, 70],
    ];
    for (const [x, y] of quadrants) {
      first.add(new FlxObject(x, y, 5, 5));
      second.add(new FlxObject(x + 1, y + 1, 5, 5));
    }
    const pairs: FlxObject[][] = [];
    const tree = new FlxQuadTree(0, 0, 100, 100);
    tree.load(first, second, (left, right) => pairs.push([left, right]));
    expect(tree.execute()).toBe(true);
    expect(pairs).toHaveLength(4);

    const spanning = new FlxObject(0, 0, 100, 100);
    const leaf = new FlxObject(75, 75, 2, 2);
    const inherited = new FlxQuadTree(0, 0, 100, 100);
    inherited.load(spanning, leaf);
    expect(inherited.execute()).toBe(true);
  });

  it('keeps callback state isolated during nested FlxG overlap calls', () => {
    const context = new FlxContext(100, 100);
    FlxG.installContext(context);
    const first = new FlxObject(10, 10, 10, 10);
    const second = new FlxObject(15, 10, 10, 10);
    const nestedFirst = new FlxObject(50, 50, 10, 10);
    const nestedSecond = new FlxObject(55, 50, 10, 10);
    let outerNotifications = 0;
    let innerNotifications = 0;

    expect(
      FlxG.overlap(
        first,
        second,
        () => {
          outerNotifications += 1;
        },
        () =>
          FlxG.overlap(nestedFirst, nestedSecond, () => {
            innerNotifications += 1;
          }),
      ),
    ).toBe(true);
    expect({ innerNotifications, outerNotifications }).toEqual({
      innerNotifications: 1,
      outerNotifications: 1,
    });
  });

  it('collides through FlxG and supports self-comparison', () => {
    const context = new FlxContext(100, 100);
    FlxG.installContext(context);
    const mover = movingObject(6, 0, 0, 0);
    const wall = movingObject(10, 0, 10, 0);
    wall.immovable = true;
    let notifications = 0;
    expect(
      FlxG.collide(mover, wall, () => {
        notifications += 1;
      }),
    ).toBe(true);
    expect(mover.x).toBe(5);
    expect(notifications).toBe(1);

    const group = new FlxGroup<FlxObject>();
    group.add(new FlxObject(20, 20, 10, 10));
    group.add(new FlxObject(25, 20, 10, 10));
    expect(FlxG.overlap(group, group)).toBe(true);
    expect(FlxG.overlap(new FlxBasic(), new FlxBasic())).toBe(false);
  });

  it('validates tree inputs and ignores objects outside world bounds', () => {
    expect(() => new FlxQuadTree(0, 0, 0, 1)).toThrow(RangeError);
    FlxQuadTree.divisions = 0;
    expect(() => new FlxQuadTree(0, 0, 10, 10)).toThrow(RangeError);
    FlxQuadTree.divisions = 6;
    const tree = new FlxQuadTree(0, 0, 10, 10);
    expect(() => tree.add(new FlxObject(), 2)).toThrow(RangeError);
    tree.load(new FlxObject(100, 100, 5, 5));
    expect(tree.execute()).toBe(false);

    const context = new FlxContext(10, 10);
    FlxG.installContext(context);
    expect(FlxG.overlap()).toBe(false);
  });
});
