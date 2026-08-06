import { afterEach, describe, expect, it } from 'vitest';

import { FlxBasic, FlxContext, FlxG, FlxGame, FlxState } from '../../src';
import type { FlxStateRuntime } from '../../src';

let game: FlxGame | null = null;

afterEach(() => {
  game?.destroy();
  game = null;
  FlxG.clearContext();
});

describe('Phase 2 context facade and atomic state switching', () => {
  it('switches states only at a safe step boundary', () => {
    const trace: string[] = [];
    class SecondState extends FlxState {
      override create(): void {
        trace.push('second:create');
      }
      override update(): void {
        trace.push('second:update');
      }
      override destroy(): void {
        trace.push('second:destroy');
        super.destroy();
      }
    }
    class FirstState extends FlxState {
      switched = false;
      override create(): void {
        trace.push('first:create');
      }
      override update(): void {
        trace.push('first:update');
        if (!this.switched) {
          this.switched = true;
          FlxG.switchState(new SecondState());
        }
      }
      override destroy(): void {
        trace.push('first:destroy');
        super.destroy();
      }
    }

    game = new FlxGame(320, 240, FirstState);
    expect(game.state).toBeNull();
    game.step();
    expect(trace).toEqual(['first:create', 'first:update']);
    expect(game.state).toBeInstanceOf(FirstState);
    game.step();
    expect(trace).toEqual([
      'first:create',
      'first:update',
      'first:destroy',
      'second:create',
      'second:update',
    ]);
    expect(FlxG.state).toBeInstanceOf(SecondState);
    game.destroy();
    game.destroy();
    expect(trace.filter((entry) => entry === 'second:destroy')).toHaveLength(1);
  });

  it('never updates a state whose create hook failed', () => {
    const trace: string[] = [];
    class SafeState extends FlxState {
      override create(): void {
        trace.push('safe:create');
      }
      override update(): void {
        trace.push('safe:update');
      }
      override destroy(): void {
        trace.push('safe:destroy');
      }
    }
    class BrokenState extends FlxState {
      override create(): void {
        trace.push('broken:create');
        throw new Error('broken create');
      }
      override update(): void {
        trace.push('broken:update');
      }
      override destroy(): void {
        trace.push('broken:destroy');
      }
    }

    game = new FlxGame(320, 240, SafeState);
    game.step();
    FlxG.switchState(new BrokenState());
    expect(() => game?.step()).toThrow('broken create');
    expect(trace).toEqual([
      'safe:create',
      'safe:update',
      'safe:destroy',
      'broken:create',
      'broken:destroy',
    ]);
    expect(game.state).toBeNull();
  });

  it('advances through the fixed clock and resets the current state', () => {
    let updates = 0;
    let destroys = 0;
    class State extends FlxState {
      override update(): void {
        updates += 1;
      }
      override destroy(): void {
        destroys += 1;
      }
    }

    game = new FlxGame(160, 120, State, 2, 60, 30, true);
    expect(game.advance(1 / 30).steps).toBe(2);
    expect(updates).toBe(2);
    expect(game.interpolationAlpha).toBe(0);
    FlxG.resetState();
    game.step();
    expect(destroys).toBe(1);
    expect(updates).toBe(3);
    FlxG.paused = true;
    game.step();
    expect(updates).toBe(3);
    expect(game.useSystemCursor).toBe(true);
    expect(game.zoom).toBe(2);
  });

  it('delegates globals, deterministic selection, and services to context', () => {
    class State extends FlxState {}
    game = new FlxGame(320, 240, State);
    expect(FlxG.width).toBe(320);
    expect(FlxG.height).toBe(240);
    expect(FlxG.getLibraryName()).toBe('flixel-pixi v0.0');
    FlxG.elapsed = 0.25;
    FlxG.timeScale = 0.5;
    FlxG.globalSeed = 0.5;
    FlxG.level = 2;
    FlxG.score = 10;
    FlxG.levels.push('level');
    FlxG.scores.push(10);
    FlxG.worldDivisions = 4;
    expect(FlxG.random()).toBe(0.4999837900977506);
    expect(FlxG.getRandom(['a', 'b'], 0, 1)).toBe('a');
    expect(FlxG.getRandom(null)).toBeNull();
    expect(FlxG.shuffle([1, 2, 3], 2)).toHaveLength(3);
    expect({
      elapsed: FlxG.elapsed,
      level: FlxG.level,
      levels: FlxG.levels,
      score: FlxG.score,
      scores: FlxG.scores,
      timeScale: FlxG.timeScale,
      worldDivisions: FlxG.worldDivisions,
    }).toEqual({
      elapsed: 0.25,
      level: 2,
      levels: ['level'],
      score: 10,
      scores: [10],
      timeScale: 0.5,
      worldDivisions: 4,
    });

    const token = Symbol('service');
    game.context.setService(token, { value: 42 });
    expect(game.context.getService<{ value: number }>(token)?.value).toBe(42);
    expect(game.context.removeService(token)).toBe(true);
    expect(game.context.getService(token)).toBeUndefined();
  });

  it('enforces context and argument invariants', () => {
    expect(() => FlxG.context).toThrow('no active FlxContext');
    expect(() => new FlxContext(0, 1)).toThrow(RangeError);
    class State extends FlxState {}
    expect(() => new FlxGame(10, 10, State, 0)).toThrow(RangeError);
    expect(() => new FlxGame(10, 10, State, 1, 0)).toThrow(RangeError);

    game = new FlxGame(10, 10, State);
    expect(() => new FlxGame(10, 10, State)).toThrow('Only one FlxContext');
    expect(() => {
      FlxG.timeScale = -1;
    }).toThrow(RangeError);
    expect(() => {
      FlxG.globalSeed = Number.NaN;
    }).toThrow(RangeError);
    expect(() => {
      FlxG.worldDivisions = 0;
    }).toThrow(RangeError);
    expect(() => game?.step(0)).toThrow(RangeError);
    game.destroy();
    expect(() => game?.step()).toThrow('destroyed');
  });

  it('owns one replaceable runtime and clears replaceable services', () => {
    const context = new FlxContext(10, 10);
    const state = new FlxState();
    let requests = 0;
    let resets = 0;
    const runtime: FlxStateRuntime = {
      state,
      requestState: () => {
        requests += 1;
      },
      resetState: () => {
        resets += 1;
      },
    };
    const otherRuntime: FlxStateRuntime = {
      state: null,
      requestState: () => undefined,
      resetState: () => undefined,
    };

    expect(context.state).toBeNull();
    context.attachRuntime(runtime);
    expect(() => context.attachRuntime(runtime)).not.toThrow();
    expect(() => context.attachRuntime(otherRuntime)).toThrow(
      'runtime is already attached',
    );
    context.detachRuntime(otherRuntime);
    expect(context.state).toBe(state);
    context.requestState(state);
    context.resetState();
    expect({ requests, resets }).toEqual({ requests: 1, resets: 1 });

    const token = Symbol('service');
    context.setService(token, 1);
    context.clearServices();
    expect(context.getService(token)).toBeUndefined();
    context.detachRuntime(runtime);
    expect(context.state).toBeNull();
    expect(() => context.requestState(state)).toThrow('No game runtime');
    expect(() => context.resetState()).toThrow('No game runtime');
  });

  it('runs C2 core without DOM, canvas, or Pixi globals', () => {
    expect('document' in globalThis).toBe(false);
    expect('HTMLCanvasElement' in globalThis).toBe(false);
    const group = new FlxState();
    group.add(new FlxBasic());
    expect(() => group.update()).not.toThrow();
  });
});
