// @vitest-environment happy-dom
import { Container, Sprite } from 'pixi.js';
import { afterEach, describe, expect, it } from 'vitest';

import {
  FlxBasic,
  FlxCamera,
  FlxContainer,
  FlxContext,
  FlxG,
  FlxGroup,
  FlxPoint,
  FlxSprite,
  FlxSpriteContainer,
  FlxSpriteGroup,
  FlxSpriteGroupRenderHandle,
} from '../../src';

afterEach(() => {
  FlxG.clearContext();
});

class CountedBasic extends FlxBasic {
  destroys = 0;

  override destroy(): void {
    this.destroys += 1;
    super.destroy();
  }
}

class CountedSprite extends FlxSprite {
  preUpdates = 0;
  updates = 0;
  postUpdates = 0;
  destroys = 0;
  kills = 0;
  revives = 0;

  override preUpdate(): void {
    this.preUpdates += 1;
    super.preUpdate();
  }

  override update(): void {
    this.updates += 1;
  }

  override postUpdate(): void {
    this.postUpdates += 1;
    super.postUpdate();
  }

  override kill(): void {
    this.kills += 1;
    super.kill();
  }

  override revive(): void {
    this.revives += 1;
    super.revive();
  }

  override destroy(): void {
    this.destroys += 1;
    super.destroy();
  }
}

class UtilitySprite extends FlxSprite {
  score = 0;
  calls = 0;

  ping(): void {
    this.calls += 1;
  }
}

describe('FlxContainer', () => {
  it('reparents members exclusively and clears ownership on removal', () => {
    const first = new FlxContainer<CountedBasic>();
    const second = new FlxContainer<CountedBasic>();
    const member = first.add(new CountedBasic());

    expect(member.container).toBe(first);
    second.add(member);
    expect(first.members.includes(member)).toBe(false);
    expect(second.members.includes(member)).toBe(true);
    expect(member.container).toBe(second);

    second.clear();
    expect(member.container).toBeNull();
    expect(member.destroys).toBe(0);
  });

  it('clears ownership before destroying each member exactly once', () => {
    const container = new FlxContainer<CountedBasic>();
    const member = container.add(new CountedBasic());

    container.destroy();
    container.destroy();
    expect(member.container).toBeNull();
    expect(member.destroys).toBe(1);
  });
});

describe('FlxSpriteContainer coordinate and transform contract', () => {
  it('converts local-on-add coordinates to world space and back on removal', () => {
    const group = new FlxSpriteContainer(100, 50);
    const member = group.add(new FlxSprite(10, 20).makeGraphic(8, 6));

    expect(Object.keys(member)).toEqual(
      expect.arrayContaining(['active', 'alive', 'exists', 'x', 'y']),
    );
    expect(Object.keys(group)).toEqual(
      expect.arrayContaining(['active', 'alive', 'exists', 'x', 'y']),
    );
    expect({ x: member.x, y: member.y }).toEqual({ x: 110, y: 70 });
    expect(group.getMemberLocalPosition(member)).toEqual(
      expect.objectContaining({ x: 10, y: 20 }),
    );
    expect(group.getWorldPosition(new FlxPoint(4, 7))).toEqual(
      expect.objectContaining({ x: 104, y: 57 }),
    );

    group.x = 130;
    group.y = 80;
    expect({ x: member.x, y: member.y }).toEqual({ x: 140, y: 100 });
    group.setMemberLocalPosition(member, -5, 12);
    expect({ x: member.x, y: member.y }).toEqual({ x: 125, y: 92 });

    expect(group.remove(member)).toBe(member);
    expect({ x: member.x, y: member.y }).toEqual({ x: -5, y: 12 });
    expect(() => group.getMemberLocalPosition(member)).toThrow('not a member');
  });

  it('reparents between sprite containers with stable local coordinates', () => {
    const first = new FlxSpriteContainer(100, 40);
    const second = new FlxSpriteContainer(220, 90);
    const member = first.add(new FlxSprite(12, 7));

    second.add(member);
    expect(first.contains(member)).toBe(false);
    expect(second.contains(member)).toBe(true);
    expect(second.getMemberLocalPosition(member)).toEqual(
      expect.objectContaining({ x: 12, y: 7 }),
    );
    expect({ x: member.x, y: member.y }).toEqual({ x: 232, y: 97 });
    expect(member.container).toBe(second.group);
    expect(second.replace(member, member)).toBe(member);
    expect({ x: member.x, y: member.y }).toEqual({ x: 232, y: 97 });

    const displaced = first.add(new FlxSprite(3, 4));
    expect(first.replace(displaced, member)).toBe(member);
    expect(second.contains(member)).toBe(false);
    expect(first.getMemberLocalPosition(member)).toEqual(
      expect.objectContaining({ x: 12, y: 7 }),
    );
  });

  it('propagates render transforms while leaving member collision extents explicit', () => {
    const camera = new FlxCamera(0, 0, 320, 240);
    const group = new FlxSpriteContainer(40, 30);
    const member = group.add(new FlxSprite(5, 7).makeGraphic(12, 10));
    member.angle = 10;

    group.origin.make(20, 25);
    group.angle = 35;
    group.scale.make(2, 3);
    group.alpha = 0.5;
    group.color = 0x44cc88;
    group.scrollFactor.make(0.5, 0.75);
    group.cameras = [camera];
    group.immovable = true;

    expect(member.angle).toBe(45);
    expect(member.scale).toEqual(expect.objectContaining({ x: 2, y: 3 }));
    expect(member.alpha).toBe(0.5);
    expect(member.color).toBe(0x44cc88);
    expect(member.scrollFactor).toEqual(
      expect.objectContaining({ x: 0.5, y: 0.75 }),
    );
    expect(member.cameras).toEqual([camera]);
    expect(member.immovable).toBe(true);
    expect(member.origin).toEqual(expect.objectContaining({ x: 15, y: 18 }));
    expect({
      x: member.x,
      y: member.y,
      width: member.width,
      height: member.height,
    }).toEqual({ x: 45, y: 37, width: 12, height: 10 });
  });

  it('updates, kills, revives, and destroys nested members exactly once', () => {
    FlxG.installContext(new FlxContext(320, 240));
    const parent = new FlxSpriteContainer(100, 100);
    const nested = new FlxSpriteContainer<CountedSprite>(20, 10);
    const member = nested.add(new CountedSprite(5, 5));
    parent.add(nested);

    parent.x = 110;
    expect({ nestedX: nested.x, memberX: member.x }).toEqual({
      nestedX: 130,
      memberX: 135,
    });

    parent.update();
    expect({
      post: member.postUpdates,
      pre: member.preUpdates,
      update: member.updates,
    }).toEqual({ post: 1, pre: 1, update: 1 });

    parent.kill();
    parent.revive();
    expect({ kills: member.kills, revives: member.revives }).toEqual({
      kills: 1,
      revives: 1,
    });

    parent.destroy();
    parent.destroy();
    expect(member.destroys).toBe(1);
  });

  it('expands overlap and collide broad phase to member world AABBs', () => {
    FlxG.installContext(new FlxContext(320, 240));
    const group = new FlxSpriteContainer(100, 80);
    const first = group.add(new FlxSprite(0, 0).makeGraphic(10, 10));
    const second = group.add(new FlxSprite(80, 0).makeGraphic(10, 10));
    const hit = new FlxSprite(104, 82).makeGraphic(4, 4);
    const gap = new FlxSprite(140, 82).makeGraphic(4, 4);
    const pairs: FlxSprite[] = [];

    expect(
      FlxG.overlap(group, hit, (member) => pairs.push(member as FlxSprite)),
    ).toBe(true);
    expect(pairs).toEqual([first]);
    expect(FlxG.overlap(group, gap)).toBe(false);
    expect(second.x).toBe(180);

    group.solid = false;
    expect({ groupSolid: group.solid, memberSolid: first.solid }).toEqual({
      groupSolid: false,
      memberSolid: false,
    });
    expect(FlxG.overlap(group, hit)).toBe(false);
    group.solid = true;
    expect(first.solid).toBe(true);
    expect(FlxG.overlap(group, hit)).toBe(true);
    group.allowCollisions = 0;
    expect({ groupSolid: group.solid, memberSolid: first.solid }).toEqual({
      groupSolid: false,
      memberSolid: true,
    });
    expect(FlxG.overlap(group, hit)).toBe(false);
  });

  it('owns a Pixi Container branch and never parents children under leaf sprites', () => {
    const group = new FlxSpriteContainer(30, 20);
    const nested = new FlxSpriteContainer(8, 4);
    group.add(nested);
    nested.add(new FlxSprite(2, 3).makeGraphic(6, 6));
    group.add(new FlxSprite(20, 10).makeGraphic(5, 5));

    const handle = group.createRenderHandle();
    expect(handle).toBeInstanceOf(FlxSpriteGroupRenderHandle);
    expect(handle.view).toBeInstanceOf(Container);
    expect(handle.view.children).toHaveLength(2);

    const visit = (node: Container): void => {
      if (node instanceof Sprite) expect(node.children).toHaveLength(0);
      for (const child of node.children) visit(child);
    };
    visit(handle.view);

    group.remove(nested);
    handle.sync();
    expect((handle as FlxSpriteGroupRenderHandle).memberHandleCount).toBe(1);
    handle.destroy();
    expect(group.renderHandleCount).toBe(0);
  });

  it('delegates group queries, sorting, sparse slots, and bounded recycling', () => {
    FlxG.installContext(new FlxContext(320, 240, 0.7));
    const group = new FlxSpriteGroup<UtilitySprite>(10, 20, 2);
    const first = new UtilitySprite(5, 6);
    const second = new UtilitySprite(30, 8);
    const rejected = new UtilitySprite(50, 10);
    first.score = 2;
    second.score = 1;

    expect(group.add(first)).toBe(first);
    expect(group.add(first)).toBe(first);
    expect(group.add(second)).toBe(second);
    expect(group.add(rejected)).toBe(rejected);
    expect(group.contains(rejected)).toBe(false);
    expect(group.length).toBe(2);
    expect(group.getFirstNull()).toBe(-1);
    expect(group.getFirstExtant()).toBe(first);
    expect(group.getFirstAlive()).toBe(first);
    expect(group.countLiving()).toBe(2);
    expect(group.countDead()).toBe(0);
    expect(group.getRandom()).not.toBeNull();

    group.sort('score', FlxGroup.ASCENDING);
    expect(group.members.slice(0, group.length)).toEqual([second, first]);
    group.sort('score', FlxGroup.DESCENDING);
    expect(group.members.slice(0, group.length)).toEqual([first, second]);
    group.callAll('ping()');
    expect([first.calls, second.calls]).toEqual([1, 1]);
    group.setAll('score', 4, false);
    expect([first.score, second.score]).toEqual([4, 4]);

    second.kill();
    expect(group.getFirstAvailable()).toBe(second);
    expect(group.getFirstAvailable(UtilitySprite)).toBe(second);
    expect(group.getFirstDead()).toBe(second);
    expect(group.countLiving()).toBe(1);
    expect(group.countDead()).toBe(1);
    expect(group.recycle()).toBe(first);
    expect(group.recycle(UtilitySprite)).toBe(second);

    expect(group.remove(rejected)).toBeNull();
    expect(group.remove(first)).toBe(first);
    expect(group.getFirstNull()).toBe(0);
    expect(group.add(rejected)).toBe(rejected);
    expect(group.members[0]).toBe(rejected);
    expect(group.remove(rejected, true)).toBe(rejected);
    expect(group.length).toBe(1);

    group.clear();
    expect(group.countLiving()).toBe(-1);
    expect(group.countDead()).toBe(-1);
    expect(group.getFirstExtant()).toBeNull();
    expect(group.getFirstAlive()).toBeNull();
    expect(group.getFirstDead()).toBeNull();
    expect(group.recycle()).toBeNull();
    expect(group.recycle(UtilitySprite)).toBeInstanceOf(UtilitySprite);
  });

  it('propagates scalar state through each alpha and lifecycle mode', () => {
    const firstCamera = new FlxCamera(0, 0, 320, 240);
    const secondCamera = new FlxCamera(0, 0, 160, 120);
    const group = new FlxSpriteContainer(10, 20);
    const member = group.add(new FlxSprite(3, 4));

    group.x = 10;
    group.y = 20;
    group.angle = 0;
    group.color = 0xffffff;
    group.alpha = 1;
    group.cameras = null;
    group.active = true;
    group.visible = true;
    group.alive = true;

    member.alpha = 0.8;
    group.alpha = 0.5;
    expect(member.alpha).toBeCloseTo(0.4);
    group.alpha = -1;
    expect(member.alpha).toBe(0);
    group.alpha = 0.75;
    expect(member.alpha).toBe(0.75);
    group.directAlpha = true;
    group.alpha = 5;
    expect(member.alpha).toBe(1);

    group.angle = 15;
    group.color = 0x123456;
    group.cameras = [firstCamera, secondCamera];
    group.active = false;
    group.visible = false;
    group.alive = false;
    expect({
      active: member.active,
      alive: member.alive,
      angle: member.angle,
      color: member.color,
      visible: member.visible,
    }).toEqual({
      active: false,
      alive: false,
      angle: 15,
      color: 0x123456,
      visible: false,
    });
    expect(member.cameras).toEqual([firstCamera, secondCamera]);

    group.exists = false;
    group.active = true;
    group.visible = true;
    expect(member.exists).toBe(false);
    expect(member.active).toBe(false);
    expect(member.visible).toBe(false);
    group.exists = true;
    group.active = false;
    group.active = true;
    group.visible = false;
    group.visible = true;
    group.alive = true;
    group.cameras = null;
    expect({
      active: member.active,
      alive: member.alive,
      exists: member.exists,
      visible: member.visible,
    }).toEqual({ active: true, alive: true, exists: true, visible: true });
    expect(member.cameras).toBeNull();
  });

  it('reports sparse bounds and expands translated overlap helpers', () => {
    const camera = new FlxCamera(0, 0, 100, 100);
    const empty = new FlxSpriteGroup(7, 9);
    expect({
      height: empty.height,
      maxX: empty.findMaxX(),
      maxY: empty.findMaxY(),
      minX: empty.findMinX(),
      minY: empty.findMinY(),
      width: empty.width,
    }).toEqual({ height: 0, maxX: 7, maxY: 9, minX: 7, minY: 9, width: 0 });
    empty.width = 99;
    empty.height = 88;
    expect({ height: empty.height, width: empty.width }).toEqual({
      height: 0,
      width: 0,
    });

    const group = new FlxSpriteGroup(10, 20);
    const first = group.add(new FlxSprite(5, 4).makeGraphic(10, 8));
    const second = group.add(new FlxSprite(30, 12).makeGraphic(6, 5));
    group.remove(first);
    expect({
      height: group.height,
      maxX: group.findMaxX(),
      maxY: group.findMaxY(),
      minX: group.findMinX(),
      minY: group.findMinY(),
      width: group.width,
    }).toEqual({ height: 5, maxX: 46, maxY: 37, minX: 40, minY: 32, width: 6 });

    const target = new FlxSprite(41, 33).makeGraphic(2, 2);
    expect(group.overlaps(target)).toBe(true);
    expect(group.overlapsAt(100, 20, target)).toBe(false);
    expect(group.overlapsAt(9, 20, target)).toBe(true);
    expect(group.overlapsPoint(new FlxPoint(42, 34))).toBe(true);
    expect(group.overlapsPoint(new FlxPoint(0, 0))).toBe(false);
    expect(group.onScreen(camera)).toBe(true);
    second.visible = false;
    expect(group.overlapsPoint(new FlxPoint(42, 34))).toBe(false);
    expect(group.onScreen(camera)).toBe(false);
    second.exists = false;
    expect(group.overlaps(target)).toBe(false);
    expect(group.overlapsAt(9, 20, target)).toBe(false);

    const local = new FlxPoint();
    const world = new FlxPoint();
    group.getMemberLocalPosition(second, local);
    expect(group.getWorldPosition(local, world)).toBe(world);
    expect(world).toEqual(
      expect.objectContaining({ x: second.x, y: second.y }),
    );
    group.remove(second);
    expect({
      height: group.height,
      maxX: group.findMaxX(),
      minX: group.findMinX(),
      width: group.width,
    }).toEqual({ height: 0, maxX: 10, minX: 10, width: 0 });

    const parent = new FlxSpriteGroup(100, 60);
    const nested = new FlxSpriteGroup(20, 10);
    parent.add(nested);
    nested.add(new FlxSprite(-15, -4).makeGraphic(10, 8));
    expect({
      maxX: parent.findMaxX(),
      maxY: parent.findMaxY(),
      minX: parent.findMinX(),
      minY: parent.findMinY(),
    }).toEqual({ maxX: 115, maxY: 74, minX: 105, minY: 66 });
  });

  it('supports replacement, multi-transforms, reset, recursion, and cycle guards', () => {
    const parent = new FlxSpriteGroup<FlxSprite>(50, 40);
    const nested = new FlxSpriteGroup<UtilitySprite>(5, 6);
    parent.add(nested);
    const first = nested.add(new UtilitySprite(2, 3));
    const second = nested.add(new UtilitySprite(10, 7));
    const missing = new UtilitySprite();

    expect(parent.contains(first)).toBe(false);
    expect(parent.contains(first, true)).toBe(true);
    expect(parent.contains(missing, true)).toBe(false);
    expect(() => parent.add(parent)).toThrow('cycle');
    expect(() => nested.add(parent as unknown as UtilitySprite)).toThrow(
      'cycle',
    );
    expect(nested.replace(missing, new UtilitySprite())).toBeNull();
    expect(nested.replace(first, second)).toBeNull();

    const replacement = new UtilitySprite(4, 8);
    expect(nested.replace(first, replacement)).toBe(replacement);
    expect({ x: replacement.x, y: replacement.y }).toEqual({ x: 59, y: 54 });
    expect(nested.contains(first)).toBe(false);

    nested.multiTransformChildren(
      [
        (sprite, value) => {
          sprite.x += value;
        },
        (sprite, value) => {
          sprite.y += value;
        },
      ],
      [3, 4],
    );
    expect({ x: replacement.x, y: replacement.y }).toEqual({ x: 62, y: 58 });
    expect(() =>
      nested.multiTransformChildren([(sprite) => sprite.kill()], []),
    ).toThrow(RangeError);

    second.exists = false;
    nested.multiTransformChildren(
      [(sprite, value) => (sprite.score = value)],
      [12],
    );
    expect(replacement.score).toBe(12);
    expect(second.score).toBe(0);

    parent.reset(80, 70);
    expect({ parentX: parent.x, replacementX: replacement.x }).toEqual({
      parentX: 80,
      replacementX: 92,
    });
    expect(second.exists).toBe(true);

    expect(nested.remove(replacement, true)).toBe(replacement);
    expect(nested.contains(replacement)).toBe(false);
    expect(() => nested.setMemberLocalPosition(replacement, 0, 0)).toThrow(
      'not a member',
    );
  });
});
