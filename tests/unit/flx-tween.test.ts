import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  FlxContext,
  FlxEase,
  FlxG,
  FlxGame,
  FlxState,
  FlxTween,
  FlxTweenManager,
} from '../../src';

let context: FlxContext;
let manager: FlxTweenManager;
let game: FlxGame | null = null;

beforeEach(() => {
  context = new FlxContext(160, 90);
  FlxG.installContext(context);
  manager = context.addPlugin(new FlxTweenManager());
});

afterEach(() => {
  game?.destroy();
  game = null;
  context.destroyPlugins();
  FlxG.clearContext();
});

function update(elapsed: number): void {
  FlxG.elapsed = elapsed;
  manager.update();
}

describe('FlxEase', () => {
  it('provides HaxeFlixel easing families with stable endpoints', () => {
    const eases = [
      FlxEase.linear,
      FlxEase.quadIn,
      FlxEase.quadOut,
      FlxEase.quadInOut,
      FlxEase.cubeIn,
      FlxEase.cubeOut,
      FlxEase.cubeInOut,
      FlxEase.quartIn,
      FlxEase.quartOut,
      FlxEase.quartInOut,
      FlxEase.quintIn,
      FlxEase.quintOut,
      FlxEase.quintInOut,
      FlxEase.smoothStepInOut,
      FlxEase.smootherStepInOut,
      FlxEase.sineIn,
      FlxEase.sineOut,
      FlxEase.sineInOut,
      FlxEase.bounceIn,
      FlxEase.bounceOut,
      FlxEase.bounceInOut,
      FlxEase.circIn,
      FlxEase.circOut,
      FlxEase.circInOut,
      FlxEase.backIn,
      FlxEase.backOut,
      FlxEase.backInOut,
    ];
    for (const ease of eases) {
      expect(ease(0)).toBeCloseTo(0);
      expect(ease(1)).toBeCloseTo(1);
      expect(Number.isFinite(ease(0.5))).toBe(true);
    }
    expect(FlxEase.quadIn(0.5)).toBeCloseTo(0.25);
    expect(FlxEase.quadOut(0.5)).toBeCloseTo(0.75);
    expect(FlxEase.elasticIn(0)).toBeCloseTo(-0.00048828125);
    expect(FlxEase.elasticOut(1)).toBeCloseTo(1.00048828125);
    expect(Number.isFinite(FlxEase.elasticInOut(0.5))).toBe(true);
  });
});

describe('FlxTween', () => {
  it('tweens top-level and nested numeric properties on fixed steps', () => {
    const target = { alpha: 1, position: { x: 10 } };
    const tween = FlxTween.tween(target, { alpha: 0, 'position.x': 30 }, 1, {
      ease: FlxEase.quadIn,
    });

    update(0.5);
    expect(target.alpha).toBeCloseTo(0.75);
    expect(target.position.x).toBeCloseTo(15);
    expect(tween.percent).toBeCloseTo(0.5);
    expect(tween.scale).toBeCloseTo(0.25);

    update(0.5);
    expect(target).toEqual({ alpha: 0, position: { x: 30 } });
    expect(tween.finished).toBe(true);
    expect(manager.tweenCount).toBe(0);
  });

  it('captures property start values after the start delay', () => {
    const target = { x: 0 };
    FlxTween.tween(target, { x: 20 }, 1, { startDelay: 0.5 });
    update(0.25);
    target.x = 10;
    update(0.25);
    expect(target.x).toBe(10);
    update(0.5);
    expect(target.x).toBe(15);
  });

  it('orders callbacks and supports standalone numeric tweens', () => {
    const events: string[] = [];
    const values: number[] = [];
    const tween = FlxTween.num(
      2,
      6,
      1,
      {
        onStart: () => events.push('start'),
        onUpdate: () => events.push('update'),
        onComplete: () => events.push('complete'),
      },
      (value) => values.push(value),
    );
    update(0.5);
    update(0.5);

    expect(events).toEqual(['start', 'update', 'complete']);
    expect(values).toEqual([4, 6, 6]);
    expect(tween.value).toBe(6);
  });

  it('supports persistent, backward, looping, and ping-pong modes', () => {
    const persistent = FlxTween.num(0, 10, 1, { type: FlxTween.PERSIST });
    update(1);
    expect(persistent.finished).toBe(true);
    expect(persistent.active).toBe(false);
    expect(manager.tweenCount).toBe(1);
    persistent.start();

    const backward = FlxTween.num(0, 10, 1, { type: FlxTween.BACKWARD });
    update(0.5);
    expect(backward.value).toBeCloseTo(5);
    update(0.5);
    expect(backward.value).toBe(0);

    const looping = FlxTween.num(0, 10, 1, { type: FlxTween.LOOPING });
    update(1);
    expect(looping.executions).toBe(1);
    expect(looping.active).toBe(true);
    update(0.25);
    expect(looping.value).toBeCloseTo(2.5);

    const pingPong = FlxTween.num(0, 10, 1, { type: FlxTween.PINGPONG });
    update(1);
    expect(pingPong.backward).toBe(true);
    update(0.25);
    expect(pingPong.value).toBeCloseTo(7.5);
  });

  it('supports loop delays and discrete tween framerates', () => {
    const target = { x: 0 };
    const tween = FlxTween.tween(target, { x: 10 }, 1, {
      framerate: 2,
      loopDelay: 0.5,
      type: FlxTween.LOOPING,
    });
    update(0.24);
    expect(target.x).toBe(0);
    update(0.26);
    expect(target.x).toBe(5);
    update(0.5);
    expect(tween.executions).toBe(1);
    update(0.25);
    expect(target.x).toBe(10);
    update(0.25);
    expect(target.x).toBe(0);
  });

  it('chains tweens, waits, and distinguishes cancel from cancelChain', () => {
    const target = { x: 0 };
    const first = FlxTween.tween(target, { x: 10 }, 1);
    const second = FlxTween.tween(target, { x: 20 }, 1);
    first.wait(0.5).then(second);
    expect(manager.tweenCount).toBe(1);
    update(1);
    expect(target.x).toBe(10);
    update(0.5);
    update(0.5);
    expect(target.x).toBeCloseTo(15);
    update(0.5);
    expect(target.x).toBe(20);

    const cancelledTarget = { x: 0 };
    const cancelledFirst = FlxTween.tween(cancelledTarget, { x: 10 }, 1);
    const cancelledSecond = FlxTween.tween(cancelledTarget, { x: 20 }, 1);
    cancelledFirst.then(cancelledSecond);
    cancelledFirst.cancelChain();
    update(2);
    expect(cancelledTarget.x).toBe(0);

    const yieldingTarget = { x: 0 };
    const yieldingFirst = FlxTween.tween(yieldingTarget, { x: 10 }, 1);
    const yieldingSecond = FlxTween.tween(yieldingTarget, { x: 20 }, 1);
    yieldingFirst.then(yieldingSecond);
    yieldingFirst.cancel();
    update(1);
    expect(yieldingTarget.x).toBe(20);
  });

  it('cancels and completes selected target fields', () => {
    const target = { x: 0, y: 0 };
    const xy = FlxTween.tween(target, { x: 10, y: 20 }, 1);
    const other = FlxTween.tween(target, { y: 30 }, 1);
    expect(manager.containsTweensOf(target, ['x'])).toBe(true);
    FlxTween.cancelTweensOf(target, ['x']);
    expect(xy.finished).toBe(true);
    expect(manager.tweenCount).toBe(1);
    FlxTween.completeTweensOf(target, ['y']);
    expect(target.y).toBe(30);
    expect(other.finished).toBe(true);
    update(0);
    expect(manager.tweenCount).toBe(0);
  });

  it('validates targets, values, duration, delays, and framerate', () => {
    expect(() => FlxTween.tween({ x: 0 }, {}, 1)).toThrow(RangeError);
    expect(() => FlxTween.tween({ x: 0 }, { x: Number.NaN }, 1)).toThrow(
      TypeError,
    );
    expect(() => FlxTween.tween({ x: 'no' }, { x: 1 }, 1)).not.toThrow();
    const invalidSource = FlxTween.tween({ x: 'no' }, { x: 1 }, 1);
    expect(() => update(0.1)).toThrow(TypeError);
    invalidSource.cancel();
    expect(() => FlxTween.num(0, 1, -1)).toThrow(RangeError);
    expect(() => FlxTween.num(0, 1, 1, { framerate: -1 })).toThrow(RangeError);
    expect(() => FlxTween.num(0, 1, 1, { startDelay: Number.NaN })).toThrow(
      RangeError,
    );
  });

  it('clears state-owned tweens and pauses them with the game context', () => {
    FlxG.clearContext(context);
    const target = { x: 0 };
    const tween: { current: FlxTween | null } = { current: null };
    class SecondState extends FlxState {}
    class FirstState extends FlxState {
      override create(): void {
        tween.current = FlxTween.tween(target, { x: 10 }, 1);
      }
    }
    game = new FlxGame(160, 90, FirstState);
    game.step(0.25);
    expect(target.x).toBeCloseTo(2.5);
    FlxG.paused = true;
    game.step(0.5);
    expect(target.x).toBeCloseTo(2.5);
    FlxG.paused = false;
    FlxG.switchState(new SecondState());
    game.step(0.25);
    expect(tween.current?.finished).toBe(true);
    expect(FlxTween.globalManager.tweenCount).toBe(0);
  });
});
