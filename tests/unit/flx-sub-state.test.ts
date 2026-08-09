import { afterEach, describe, expect, it } from 'vitest';

import { FlxBasic, FlxGame, FlxState, FlxSubState } from '../../src';

let game: FlxGame | null = null;

afterEach(() => {
  game?.destroy();
  game = null;
});

describe('FlxSubState', () => {
  it('opens at a safe boundary and pauses its parent by default', () => {
    const trace: string[] = [];
    let overlay: Overlay | null = null;

    class Overlay extends FlxSubState {
      override create(): void {
        trace.push('overlay:create');
      }

      override update(): void {
        trace.push('overlay:update');
      }
    }

    class PlayState extends FlxState {
      override create(): void {
        overlay = new Overlay();
        overlay.openCallback = () => trace.push('overlay:open');
        this.subStateOpened.add(() => trace.push('signal:open'));
      }

      override update(): void {
        trace.push('parent:update');
        if (overlay !== null) this.openSubState(overlay);
        overlay = null;
      }
    }

    game = new FlxGame(320, 240, PlayState);
    game.step();
    expect(trace).toEqual([
      'parent:update',
      'overlay:create',
      'overlay:open',
      'signal:open',
      'overlay:update',
    ]);

    game.step();
    expect(trace.at(-1)).toBe('overlay:update');
    expect(trace.filter((entry) => entry === 'parent:update')).toHaveLength(1);
  });

  it('closes through the child and honors callbacks and destruction policy', () => {
    const trace: string[] = [];
    let overlay: Overlay | null = null;

    class Overlay extends FlxSubState {
      override update(): void {
        trace.push('overlay:update');
        this.close();
      }

      override destroy(): void {
        trace.push('overlay:destroy');
        super.destroy();
      }
    }

    class PlayState extends FlxState {
      override create(): void {
        overlay = new Overlay();
        overlay.closeCallback = () => trace.push('overlay:close');
        this.subStateClosed.add(() => trace.push('signal:close'));
        this.openSubState(overlay);
      }

      override update(): void {
        trace.push('parent:update');
      }
    }

    game = new FlxGame(320, 240, PlayState);
    game.step();
    game.step();
    expect(trace).toContain('overlay:update');
    expect(trace.slice(-3)).toEqual([
      'overlay:close',
      'signal:close',
      'overlay:destroy',
    ]);
    expect(game.state?.subState).toBeNull();

    game.step();
    expect(trace.at(-1)).toBe('parent:update');
  });

  it('supports parent persistence, nested substates, and create-once reuse', () => {
    const trace: string[] = [];
    const nested = new FlxSubState();
    const overlay = new (class extends FlxSubState {
      override create(): void {
        trace.push('create');
        this.openSubState(nested);
      }

      override update(): void {
        trace.push('overlay');
      }
    })();

    class PlayState extends FlxState {
      override create(): void {
        this.persistentUpdate = true;
        this.destroySubStates = false;
        this.openSubState(overlay);
      }

      override update(): void {
        trace.push('parent');
      }
    }

    game = new FlxGame(320, 240, PlayState);
    game.step();
    expect(trace).toEqual(['parent', 'create', 'overlay']);
    expect(overlay.subState).toBe(nested);

    game.state?.closeSubState();
    game.step();
    game.state?.openSubState(overlay);
    game.step();
    expect(trace.filter((entry) => entry === 'create')).toHaveLength(1);
    expect(trace.filter((entry) => entry === 'parent')).toHaveLength(3);
  });

  it('draws the parent conditionally and always draws the top state', () => {
    const trace: string[] = [];
    class Traced extends FlxBasic {
      constructor(readonly name: string) {
        super();
      }

      override draw(): void {
        trace.push(this.name);
      }
    }

    const state = new FlxState();
    const overlay = new FlxSubState();
    state.add(new Traced('parent'));
    overlay.add(new Traced('overlay'));
    state.openSubState(overlay);
    state.resetSubState();

    state.draw();
    expect(trace).toEqual(['parent', 'overlay']);
    trace.length = 0;
    state.persistentDraw = false;
    state.draw();
    expect(trace).toEqual(['overlay']);
    state.destroy();
  });
});
