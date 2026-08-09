import { afterEach, describe, expect, it } from 'vitest';

import { FlxBasic, FlxCamera, FlxContext, FlxG, FlxGroup } from '../../src';

afterEach(() => {
  FlxG.clearContext();
});

class PoolObject extends FlxBasic {
  value = 0;
  destroyCount = 0;

  override destroy(): void {
    this.destroyCount += 1;
    super.destroy();
  }
}

describe('Phase 2 lifecycle and groups', () => {
  it('preserves basic lifecycle flags and headless draw accounting', () => {
    const basic = new FlxBasic();
    FlxBasic.activeCount = 0;
    FlxBasic.visibleCount = 0;
    basic.preUpdate();
    basic.update();
    basic.postUpdate();
    basic.draw();
    basic.drawDebug();
    basic.destroy();
    expect(FlxBasic.activeCount).toBe(1);
    expect(FlxBasic.visibleCount).toBe(1);
    basic.cameras = [new FlxCamera(0, 0, 10, 10), new FlxCamera(0, 0, 10, 10)];
    basic.draw();
    expect(FlxBasic.visibleCount).toBe(3);
    basic.kill();
    expect({ alive: basic.alive, exists: basic.exists }).toEqual({
      alive: false,
      exists: false,
    });
    basic.revive();
    expect(basic.alive && basic.exists).toBe(true);
    expect(basic.toString()).toBe('FlxBasic');
  });

  it('runs pre-update, update, and post-update in stable order', () => {
    const trace: string[] = [];
    class Traced extends FlxBasic {
      constructor(readonly name: string) {
        super();
      }
      override preUpdate(): void {
        trace.push(`${this.name}:pre`);
        super.preUpdate();
      }
      override update(): void {
        trace.push(`${this.name}:update`);
      }
      override postUpdate(): void {
        trace.push(`${this.name}:post`);
      }
      override draw(): void {
        trace.push(`${this.name}:draw`);
      }
    }

    const group = new FlxGroup<Traced>();
    const first = group.add(new Traced('first'));
    const inactive = group.add(new Traced('inactive'));
    inactive.active = false;
    group.update();
    expect(trace).toEqual(['first:pre', 'first:update', 'first:post']);
    trace.length = 0;
    first.visible = true;
    inactive.visible = false;
    group.draw();
    expect(trace).toEqual(['first:draw']);
  });

  it('handles additions, removals, and replacements during traversal', () => {
    const trace: string[] = [];
    const group = new FlxGroup<FlxBasic>();
    const added = new (class extends FlxBasic {
      override update(): void {
        trace.push('added');
      }
    })();
    const removed = new (class extends FlxBasic {
      override update(): void {
        trace.push('removed');
      }
    })();
    const tail = new (class extends FlxBasic {
      override update(): void {
        trace.push('tail');
      }
    })();
    const mutator = new (class extends FlxBasic {
      override update(): void {
        trace.push('mutator');
        group.remove(removed, true);
        group.add(added);
      }
    })();
    group.add(mutator);
    group.add(removed);
    group.add(tail);

    group.update();
    expect(trace).toEqual(['mutator', 'tail']);
    trace.length = 0;
    group.update();
    expect(trace).toEqual(['mutator', 'tail', 'added']);

    expect(group.replace(tail, removed)).toBe(removed);
    expect(group.replace(tail, added)).toBeNull();
    expect(group.remove(tail)).toBeNull();
  });

  it('tracks duplicate references created by replace without linear membership scans', () => {
    let updates = 0;
    class Counted extends FlxBasic {
      override update(): void {
        updates += 1;
      }
    }

    const group = new FlxGroup<Counted>();
    const first = group.add(new Counted());
    const repeated = group.add(new Counted());
    group.replace(first, repeated);
    group.update();
    expect(updates).toBe(2);

    updates = 0;
    group.remove(repeated);
    group.update();
    expect(updates).toBe(1);
  });

  it('supports recursive setters, calls, sorting, queries, and deterministic random', () => {
    const context = new FlxContext(320, 240, 0.5);
    FlxG.installContext(context);
    const root = new FlxGroup<FlxBasic>();
    const child = new FlxGroup<PoolObject>();
    const high = child.add(new PoolObject());
    high.value = 20;
    const low = child.add(new PoolObject());
    low.value = 10;
    root.add(child);

    root.setAll('visible', false);
    expect(high.visible || low.visible).toBe(false);
    root.callAll('kill()');
    expect(child.countDead()).toBe(2);
    child.sort('value', FlxGroup.ASCENDING);
    expect(child.members[0]).toBe(low);
    child.sort('value', FlxGroup.DESCENDING);
    expect(child.members[0]).toBe(high);
    expect(child.getFirstDead()).toBe(high);
    expect(child.getFirstAlive()).toBeNull();
    expect(child.getFirstExtant()).toBeNull();
    high.revive();
    expect(child.getFirstAlive()).toBe(high);
    expect(child.getFirstExtant()).toBe(high);
    expect(child.countLiving()).toBe(1);
    expect(child.getRandom()).not.toBeNull();
    expect(() => root.callAll('missing')).toThrow(TypeError);
  });

  it('keeps bounded recycling stable for ten thousand cycles', () => {
    const group = new FlxGroup<PoolObject>(8);
    const seen = new Set<PoolObject>();

    for (let index = 0; index < 10_000; index += 1) {
      const member = group.recycle(PoolObject);
      expect(member).not.toBeNull();
      if (member !== null) {
        seen.add(member);
        member.revive();
        member.kill();
      }
    }

    expect(seen.size).toBe(8);
    expect(group.length).toBe(8);
    expect(group.members).toHaveLength(8);
    expect(group.getFirstAvailable(PoolObject)).not.toBeNull();
    expect(group.getFirstNull()).toBe(-1);
    expect(group.recycle()).not.toBeNull();
  });

  it('shrinks, clears, and destroys owned members exactly once', () => {
    const group = new FlxGroup<PoolObject>();
    const first = group.add(new PoolObject());
    const second = group.add(new PoolObject());
    const third = group.add(new PoolObject());
    const fourth = group.add(new PoolObject());
    expect(group.add(first)).toBe(first);
    expect(() => {
      group.maxSize = -1;
    }).toThrow(RangeError);
    group.maxSize = 2;
    expect(third.destroyCount).toBe(1);
    expect(fourth.destroyCount).toBe(1);
    group.destroy();
    group.destroy();
    expect(first.destroyCount).toBe(1);
    expect(second.destroyCount).toBe(1);

    const cleared = new FlxGroup<PoolObject>();
    const survivor = cleared.add(new PoolObject());
    cleared.clear();
    expect(survivor.destroyCount).toBe(0);
    expect(cleared.countLiving()).toBe(-1);
    expect(cleared.countDead()).toBe(-1);
    expect(cleared.recycle()).toBeNull();
    expect(() => new FlxGroup(-1)).toThrow(RangeError);
  });
});
