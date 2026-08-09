import { Graphics } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  DebugPathDisplay,
  FlxBasic,
  FlxContext,
  FlxG,
  FlxGame,
  FlxPath,
  FlxPoint,
  FlxState,
  FlxTimer,
  TimerManager,
} from '../../src';

let context: FlxContext;
let game: FlxGame | null = null;

beforeEach(() => {
  context = new FlxContext(160, 90, 0.5);
  FlxG.installContext(context);
});

afterEach(() => {
  game?.destroy();
  game = null;
  context.destroyPlugins();
  FlxG.clearContext();
});

describe('Timers and plugins', () => {
  it('fires catch-up loops deterministically and stops before the final callback', () => {
    const manager = context.addPlugin(new TimerManager());
    const callbackStates: boolean[] = [];
    const timer = new FlxTimer().start(0.1, 3, (current) => {
      callbackStates.push(current.finished);
    });

    FlxG.elapsed = 0.35;
    context.updatePlugins();

    expect(callbackStates).toEqual([false, false, true]);
    expect(timer.finished).toBe(true);
    expect(timer.loopsLeft).toBe(0);
    expect(timer.timeLeft).toBeCloseTo(0.05);
    expect(manager.timerCount).toBe(0);
  });

  it('supports timer pause, resume, cancel, reset, and infinite loops', () => {
    const manager = context.addPlugin(new TimerManager());
    let calls = 0;
    const timer = new FlxTimer().start(0.2, 0, (current) => {
      calls += 1;
      if (calls === 2) current.stop();
    });
    timer.paused = true;
    FlxG.elapsed = 0.5;
    manager.update();
    expect(timer.progress).toBe(0);
    timer.start(9, 9);
    expect(timer.time).toBe(0.2);
    manager.update();
    expect(calls).toBe(2);
    expect(timer.finished).toBe(true);

    timer.start(1, 1);
    expect(timer.finished).toBe(false);
    timer.stop();
    expect(manager.timerCount).toBe(0);
    timer.destroy();
    timer.destroy();
    expect(() => timer.start()).toThrow(/destroyed/);

    const inert = new FlxTimer().start(0, 1);
    manager.update();
    expect(inert.finished).toBe(false);
    expect(inert.progress).toBe(0);
    manager.clear();
    expect(inert.finished).toBe(true);
  });

  it('validates timer configuration', () => {
    const timer = new FlxTimer();
    expect(() => timer.start(-1)).toThrow(RangeError);
    expect(() => timer.start(Number.NaN)).toThrow(RangeError);
    expect(() => timer.start(1, -1)).toThrow(RangeError);
    expect(() => timer.start(1, 1.5)).toThrow(RangeError);
  });

  it('clears state-owned timers at the next atomic state switch', () => {
    FlxG.clearContext(context);
    const timer: { current: FlxTimer | null } = { current: null };
    let callbacks = 0;
    class SecondState extends FlxState {}
    class FirstState extends FlxState {
      override create(): void {
        timer.current = new FlxTimer().start(10, 1, () => {
          callbacks += 1;
        });
      }
    }
    game = new FlxGame(160, 90, FirstState);
    game.step();
    expect(timer.current?.finished).toBe(false);
    FlxG.switchState(new SecondState());
    game.step();
    expect(timer.current?.finished).toBe(true);
    expect(callbacks).toBe(0);
    expect(FlxTimer.manager?.timerCount).toBe(0);
  });

  it('does not advance timers while the game context is paused', () => {
    FlxG.clearContext(context);
    let calls = 0;
    class State extends FlxState {
      override create(): void {
        new FlxTimer().start(0.1, 1, () => {
          calls += 1;
        });
      }
    }
    game = new FlxGame(160, 90, State);
    game.step(0.05);
    FlxG.paused = true;
    game.step(1);
    expect(calls).toBe(0);
    FlxG.paused = false;
    game.step(0.05);
    expect(calls).toBe(1);
  });

  it('removes plugins during callbacks without skipping unrelated plugins', () => {
    const trace: string[] = [];
    class Plugin extends FlxBasic {
      constructor(
        readonly name: string,
        readonly onUpdate: (() => void) | null = null,
      ) {
        super();
      }
      override update(): void {
        trace.push(`${this.name}:update`);
        this.onUpdate?.();
      }
      override draw(): void {
        trace.push(`${this.name}:draw`);
      }
    }
    class OtherPlugin extends FlxBasic {
      override update(): void {
        trace.push('other:update');
      }
    }
    class SecondPlugin extends FlxBasic {
      override update(): void {
        trace.push('second:update');
      }
      override draw(): void {
        trace.push('second:draw');
      }
    }

    const first = context.addPlugin(
      new Plugin('first', () => {
        FlxG.removePlugin(first);
        context.addPlugin(new OtherPlugin());
      }),
    );
    const second = context.addPlugin(new SecondPlugin());
    expect(context.addPlugin(new Plugin('duplicate'))).not.toBe(
      context.plugins[0],
    );
    context.updatePlugins();
    expect(trace).toEqual(['first:update', 'second:update']);
    context.updatePlugins();
    expect(trace).toEqual([
      'first:update',
      'second:update',
      'second:update',
      'other:update',
    ]);
    context.drawPlugins();
    expect(trace.at(-1)).toBe('second:draw');
    expect(FlxG.getPlugin(SecondPlugin)).toBe(second);
    expect(FlxG.plugins).toHaveLength(2);
    expect(FlxG.removePluginType(Plugin)).toBe(false);
    context.addPlugin(new Plugin('last'));
    expect(FlxG.removePluginType(Plugin)).toBe(true);
    expect(FlxG.removePluginType(SecondPlugin)).toBe(true);
  });

  it('registers and clears debug paths through the plugin', () => {
    const display = context.addPlugin(new DebugPathDisplay());
    const path = new FlxPath([new FlxPoint(1, 2), new FlxPoint(8, 4)]);
    expect(FlxPath.manager).toBe(display);
    expect(display.pathCount).toBe(1);
    FlxG.visualDebug = true;
    expect(FlxG.visualDebug).toBe(true);
    const graphics = new Graphics();
    display.drawTo(graphics, context.camera);
    expect(graphics.context.instructions.length).toBeGreaterThan(0);
    path.ignoreDrawDebug = true;
    display.drawTo(graphics.clear(), context.camera);
    expect(graphics.context.instructions).toHaveLength(0);
    path.ignoreDrawDebug = false;
    const empty = new FlxPath();
    display.drawTo(graphics.clear(), context.camera);
    expect(graphics.context.instructions.length).toBeGreaterThan(0);
    empty.add(4, 5);
    display.drawTo(graphics.clear(), context.camera);
    expect(graphics.context.instructions.length).toBeGreaterThan(0);
    empty.destroy();
    display.remove(path);
    expect(display.pathCount).toBe(0);
    display.add(path);
    display.clear();
    expect(path.nodes).toHaveLength(0);
    expect(display.pathCount).toBe(0);
    graphics.destroy();
  });
});
