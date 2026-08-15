import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  FLX_INPUT_SERVICE,
  FlxButton,
  FlxButtonRenderHandle,
  FlxContext,
  FlxG,
  FlxGame,
  FlxInputManager,
  FlxPoint,
  FlxState,
  FlxTouchManager,
  Keyboard,
  Mouse,
} from '../../src';

function eventWith<T extends Event>(
  type: string,
  properties: Record<string, unknown>,
  cancelable = false,
): T {
  const event = new Event(type, { cancelable });
  for (const [key, value] of Object.entries(properties)) {
    Object.defineProperty(event, key, { configurable: true, value });
  }
  return event as T;
}

class FakePointerTarget extends EventTarget {
  readonly style = { cursor: '' };
  readonly captured = new Set<number>();
  bounds = {
    bottom: 120,
    height: 100,
    left: 10,
    right: 210,
    top: 20,
    width: 200,
    x: 10,
    y: 20,
  };

  getBoundingClientRect(): DOMRect {
    return this.bounds as DOMRect;
  }

  hasPointerCapture(pointerId: number): boolean {
    return this.captured.has(pointerId);
  }

  releasePointerCapture(pointerId: number): void {
    this.captured.delete(pointerId);
  }

  setPointerCapture(pointerId: number): void {
    this.captured.add(pointerId);
  }
}

let context: FlxContext | null = null;
let input: FlxInputManager | null = null;
let game: FlxGame | null = null;

afterEach(() => {
  game?.destroy();
  game = null;
  input?.destroy();
  input = null;
  FlxG.clearContext(context ?? undefined);
  context = null;
});

describe('Deterministic keyboard input', () => {
  it('publishes each transition for exactly one simulation step', () => {
    const keys = new Keyboard();
    keys.handleKeyDown({ code: 'KeyA' });
    keys.handleKeyUp({ code: 'KeyA' });

    keys.update();
    expect({ justPressed: keys.justPressed('A'), pressed: keys.A }).toEqual({
      justPressed: true,
      pressed: true,
    });
    keys.update();
    expect({ justReleased: keys.justReleased('A'), pressed: keys.A }).toEqual({
      justReleased: true,
      pressed: false,
    });
    keys.update();
    expect(keys.justReleased('A')).toBe(false);
  });

  it('supports physical codes, aliases, any-key, record, and playback', () => {
    const keys = new Keyboard();
    keys.handleKeyDown({ code: 'ControlRight' });
    keys.handleKeyDown({ code: 'KeyZ' });
    keys.update();
    expect(keys.pressed('CTRL')).toBe(true);
    expect(keys.getKeyCode('RETURN')).toBe(13);
    expect(keys.any()).toBe(true);
    const snapshot = keys.record();
    keys.reset();
    expect(keys.any()).toBe(false);
    keys.playback(snapshot);
    expect({ control: keys.CONTROL, z: keys.Z }).toEqual({
      control: true,
      z: true,
    });
    keys.playback(null);
    expect(keys.any()).toBe(false);
  });

  it('falls back through legacy keyCode and key mappings', () => {
    const keys = new Keyboard();
    keys.handleKeyDown({ keyCode: 65 });
    keys.update();
    expect(keys.A).toBe(true);
    keys.handleKeyUp({ key: 'a' });
    keys.update();
    expect(keys.justReleased('A')).toBe(true);
    keys.handleKeyDown({ code: 'Unknown', key: 'b' });
    keys.update();
    expect(keys.B).toBe(true);
    keys.handleKeyUp({ code: 'Unknown', key: 'Unknown' });
    keys.update();
    expect(keys.getKeyCode('missing')).toBe(-1);
  });

  it('releases published keys without reviving unpublished keydowns', () => {
    const keys = new Keyboard();
    keys.handleKeyDown({ code: 'KeyA' });
    keys.releaseAll();
    keys.update();
    expect(keys.A).toBe(false);

    keys.handleKeyDown({ code: 'KeyA' });
    keys.update();
    keys.releaseAll();
    keys.update();
    expect(keys.justReleased('A')).toBe(true);
  });

  it('publishes input before every catch-up state update, even when paused', () => {
    const trace: string[] = [];
    class State extends FlxState {
      override update(): void {
        if (FlxG.keys.justPressed('A')) trace.push('down');
        if (FlxG.keys.justReleased('A')) trace.push('up');
      }
    }
    game = new FlxGame(160, 120, State);
    game.input.keys.handleKeyDown({ code: 'KeyA' });
    game.input.keys.handleKeyUp({ code: 'KeyA' });
    expect(game.advance(1 / 30).steps).toBe(2);
    expect(trace).toEqual(['down', 'up']);

    FlxG.paused = true;
    game.input.keys.handleKeyDown({ code: 'KeyB' });
    game.step();
    expect(FlxG.keys.justPressed('B')).toBe(true);

    game.input.resetInput();
    game.input.mouse.reset();
  });
});

describe('Pointer input and camera coordinates', () => {
  it('tracks concurrent touches and recognizes deterministic swipes', () => {
    context = new FlxContext(320, 240);
    const touches = new FlxTouchManager(context, {
      maximumSwipeDuration: 4,
      minimumSwipeDistance: 20,
    });
    touches.handlePointerDown({
      isPrimary: true,
      pointerId: 1,
      x: 10,
      y: 20,
    });
    touches.handlePointerMove({ pointerId: 1, x: 80, y: 24 });
    touches.handlePointerUp({ pointerId: 1, x: 80, y: 24 });
    touches.handlePointerDown({ pointerId: 2, x: 30, y: 40 });

    touches.update();
    expect(touches.active.map((touch) => touch.pointerId)).toEqual([1, 2]);
    expect(touches.get(1)?.justPressed).toBe(true);
    expect(touches.swipes).toHaveLength(0);

    touches.update();
    expect(touches.get(1)?.justReleased).toBe(true);
    expect(touches.swipes).toEqual([
      expect.objectContaining({ direction: 'right', pointerId: 1 }),
    ]);
    const snapshot = touches.record();
    touches.reset();
    touches.playback(snapshot);
    expect(touches.get(1)?.justReleased).toBe(true);
    expect(touches.swipes[0]?.direction).toBe('right');

    touches.handlePointerCancel({ pointerId: 2, x: 30, y: 40 });
    touches.update();
    expect(touches.get(2)?.justCancelled).toBe(true);
    expect(touches.swipes).toHaveLength(0);
  });

  it('round-trips through every camera transform', () => {
    context = new FlxContext(800, 600);
    const camera = context.camera;
    camera.x = 43;
    camera.y = 27;
    camera.scroll.make(125, 84);
    camera.zoom = 1.75;
    camera.scale.make(0.8, 1.2);
    camera.angle = 17;
    const mouse = new Mouse(context);
    const world = new FlxPoint(312, 206);
    const global = camera.worldToScreen(world);

    mouse.handlePointerMove(global);
    mouse.update();
    expect(mouse.getWorldPosition(camera)).toEqual(
      expect.objectContaining({
        x: expect.closeTo(world.x, 8),
        y: expect.closeTo(world.y, 8),
      }),
    );
    expect(mouse.x).toBeCloseTo(world.x, 8);
    expect(mouse.y).toBeCloseTo(world.y, 8);
  });

  it('separates a same-frame press/release and handles wheel/cancellation', () => {
    context = new FlxContext(320, 240);
    const mouse = new Mouse(context);
    mouse.handlePointerDown({ button: 0, x: 20, y: 30 });
    mouse.handlePointerUp({ button: 0, x: 24, y: 34 });
    mouse.handleWheel(1);
    mouse.update();
    expect({ down: mouse.justPressed(), wheel: mouse.wheel }).toEqual({
      down: true,
      wheel: 1,
    });
    const pressed = mouse.record();
    mouse.update();
    expect(mouse.justReleased()).toBe(true);
    mouse.playback(pressed);
    expect(mouse.justPressed()).toBe(true);

    mouse.handlePointerCancel({ button: 0, x: 24, y: 34 });
    mouse.update();
    expect({
      cancelled: mouse.justCancelled(),
      stuck: mouse.pressed(),
    }).toEqual({
      cancelled: true,
      stuck: false,
    });
    mouse.update();
    expect(mouse.wheel).toBe(0);
  });

  it('publishes native and hidden cursor modes', () => {
    context = new FlxContext(320, 240);
    const mouse = new Mouse(context);
    const cursors: string[] = [];
    mouse.setCursorSink((cursor) => cursors.push(cursor));
    mouse.load('/cursor.png', 2, 3);
    mouse.hide();
    mouse.show();
    mouse.unload();
    expect(cursors).toEqual([
      'default',
      'url("/cursor.png") 2 3, auto',
      'none',
      'url("/cursor.png") 2 3, auto',
      'default',
    ]);
  });

  it('adapts DOM events, capture, blur, visibility, and context menus', () => {
    context = new FlxContext(400, 200);
    const inputContext = context;
    const keyboardTarget = new EventTarget();
    const pointerTarget = new FakePointerTarget();
    const fakeDocument = new EventTarget() as EventTarget & {
      visibilityState: DocumentVisibilityState;
    };
    fakeDocument.visibilityState = 'visible';
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: fakeDocument,
    });

    try {
      input = new FlxInputManager(context, {
        keyboardTarget: keyboardTarget as Window,
        pointerTarget: pointerTarget as unknown as HTMLElement,
      });
      expect(() => new FlxInputManager(inputContext)).toThrow(
        'already installed',
      );
      keyboardTarget.dispatchEvent(
        eventWith<KeyboardEvent>('keydown', { code: 'KeyA', repeat: false }),
      );
      keyboardTarget.dispatchEvent(
        eventWith<KeyboardEvent>('keydown', { code: 'KeyB', repeat: true }),
      );
      pointerTarget.dispatchEvent(
        eventWith<PointerEvent>('pointermove', {
          clientX: 110,
          clientY: 70,
          pointerId: 7,
        }),
      );
      pointerTarget.dispatchEvent(
        eventWith<PointerEvent>('pointerdown', {
          button: 0,
          clientX: 110,
          clientY: 70,
          pointerId: 7,
        }),
      );
      pointerTarget.dispatchEvent(
        eventWith<WheelEvent>('wheel', { deltaY: -10 }),
      );
      input.updateInput();
      expect({
        a: input.keys.A,
        b: input.keys.B,
        captured: pointerTarget.captured.has(7),
        mouseDown: input.mouse.justPressed(),
        screenX: input.mouse.getGlobalPosition().x,
        screenY: input.mouse.getGlobalPosition().y,
        wheel: input.mouse.wheel,
      }).toEqual({
        a: true,
        b: false,
        captured: true,
        mouseDown: true,
        screenX: 200,
        screenY: 100,
        wheel: 1,
      });

      pointerTarget.dispatchEvent(
        eventWith<PointerEvent>('pointerup', {
          button: -1,
          clientX: 110,
          clientY: 70,
          pointerId: 7,
        }),
      );
      input.updateInput();
      expect(input.mouse.justReleased()).toBe(true);
      expect(pointerTarget.captured.has(7)).toBe(false);

      pointerTarget.dispatchEvent(
        eventWith<PointerEvent>('pointerdown', {
          button: 0,
          clientX: 110,
          clientY: 70,
          pointerId: 8,
        }),
      );
      input.updateInput();
      pointerTarget.dispatchEvent(
        eventWith<PointerEvent>('lostpointercapture', {
          button: -1,
          clientX: 110,
          clientY: 70,
          pointerId: 8,
        }),
      );
      input.updateInput();
      expect(input.mouse.justCancelled()).toBe(true);

      keyboardTarget.dispatchEvent(new Event('blur'));
      input.updateInput();
      expect(input.keys.justReleased('A')).toBe(true);
      keyboardTarget.dispatchEvent(
        eventWith<KeyboardEvent>('keydown', { code: 'KeyC', repeat: false }),
      );
      input.updateInput();
      fakeDocument.visibilityState = 'hidden';
      fakeDocument.dispatchEvent(new Event('visibilitychange'));
      input.updateInput();
      expect(input.keys.C).toBe(false);

      const menu = new Event('contextmenu', { cancelable: true });
      pointerTarget.dispatchEvent(menu);
      expect(menu.defaultPrevented).toBe(true);
      input.mouse.hide();
      expect(pointerTarget.style.cursor).toBe('none');

      pointerTarget.bounds = { ...pointerTarget.bounds, height: 0, width: 0 };
      pointerTarget.dispatchEvent(
        eventWith<PointerEvent>('pointermove', {
          clientX: 200,
          clientY: 200,
          pointerId: 10,
        }),
      );
      input.updateInput();
      expect(input.mouse.getGlobalPosition()).toMatchObject({ x: 0, y: 0 });

      input.destroy();
      input.destroy();
      expect(context.getService(FLX_INPUT_SERVICE)).toBeUndefined();
    } finally {
      delete (globalThis as { document?: Document }).document;
    }
  });

  it('tracks every touch while only the primary touch mirrors the mouse', () => {
    context = new FlxContext(400, 200);
    const pointerTarget = new FakePointerTarget();
    input = new FlxInputManager(context, {
      pointerTarget: pointerTarget as unknown as HTMLElement,
    });
    const touch = (
      type: string,
      pointerId: number,
      isPrimary: boolean,
      clientX: number,
    ): void => {
      pointerTarget.dispatchEvent(
        eventWith<PointerEvent>(type, {
          button: type === 'pointerup' ? -1 : 0,
          clientX,
          clientY: 70,
          isPrimary,
          pointerId,
          pointerType: 'touch',
          pressure: type === 'pointerup' ? 0 : 0.5,
        }),
      );
    };
    touch('pointerdown', 11, true, 60);
    touch('pointerdown', 12, false, 160);
    input.updateInput();
    expect(input.touches.active).toHaveLength(2);
    expect(input.mouse.justPressed()).toBe(true);

    touch('pointerup', 12, false, 180);
    input.updateInput();
    expect(input.touches.get(12)?.justReleased).toBe(true);
    expect(input.mouse.justReleased()).toBe(false);

    touch('pointerup', 11, true, 80);
    input.updateInput();
    expect(input.mouse.justReleased()).toBe(true);
  });

  it('supports a headless manager with no DOM targets', () => {
    context = new FlxContext(100, 50);
    input = new FlxInputManager(context);
    input.updateInput();
    input.resetInput();
    expect(input.keys.any()).toBe(false);
    input.destroy();
    expect(() => input?.updateInput()).toThrow('destroyed');
    expect(() => input?.updateVirtualInput()).toThrow('destroyed');
    expect(() => input?.resetInput()).toThrow('destroyed');
  });

  it('handles secondary touch cancellation and pointer-capture races', () => {
    context = new FlxContext(400, 200);
    const pointerTarget = new FakePointerTarget();
    const setCapture = vi
      .spyOn(pointerTarget, 'setPointerCapture')
      .mockImplementationOnce(() => {
        throw new Error('pointer ended');
      });
    input = new FlxInputManager(context, {
      pointerTarget: pointerTarget as unknown as HTMLElement,
    });

    pointerTarget.dispatchEvent(
      eventWith<PointerEvent>('pointerdown', {
        button: 0,
        clientX: 60,
        clientY: 70,
        isPrimary: false,
        pointerId: 21,
        pointerType: 'touch',
        pressure: 0.5,
      }),
    );
    pointerTarget.dispatchEvent(
      eventWith<PointerEvent>('pointermove', {
        clientX: 80,
        clientY: 70,
        isPrimary: false,
        pointerId: 21,
        pointerType: 'touch',
        pressure: 0.5,
      }),
    );
    input.updateInput();
    expect(setCapture).toHaveBeenCalledWith(21);
    expect(input.touches.get(21)?.justPressed).toBe(true);
    expect(input.mouse.justPressed()).toBe(false);

    pointerTarget.dispatchEvent(
      eventWith<PointerEvent>('pointercancel', {
        button: -1,
        clientX: 80,
        clientY: 70,
        isPrimary: false,
        pointerId: 21,
        pointerType: 'touch',
        pressure: 0,
      }),
    );
    input.updateInput();
    expect(input.touches.get(21)?.justCancelled).toBe(true);
    expect(input.mouse.justCancelled()).toBe(false);

    pointerTarget.dispatchEvent(
      eventWith<PointerEvent>('pointerup', {
        button: -1,
        clientX: 80,
        clientY: 70,
        isPrimary: false,
        pointerId: 404,
        pointerType: 'touch',
        pressure: 0,
      }),
    );
    pointerTarget.dispatchEvent(
      eventWith<PointerEvent>('lostpointercapture', {
        pointerId: 404,
      }),
    );

    vi.spyOn(pointerTarget, 'hasPointerCapture').mockImplementationOnce(() => {
      throw new Error('capture already gone');
    });
    pointerTarget.dispatchEvent(
      eventWith<PointerEvent>('pointercancel', {
        button: -1,
        clientX: 80,
        clientY: 70,
        isPrimary: true,
        pointerId: 404,
        pointerType: 'mouse',
      }),
    );
    input.updateInput();
    expect(input.mouse.pressed(0)).toBe(false);
  });
});

describe('FlxButton', () => {
  it('runs hover/down/up hooks, sound hooks, and toggle visuals', () => {
    context = new FlxContext(320, 240);
    FlxG.installContext(context);
    input = new FlxInputManager(context);
    const trace: string[] = [];
    const hoverSound = { play: vi.fn() };
    const outSound = { play: vi.fn() };
    const downSound = { play: vi.fn() };
    const clickSound = { play: vi.fn() };
    const button = new FlxButton(40, 30, 'Toggle', () => {
      button.on = !button.on;
      trace.push('up');
    });
    button.onOver = () => trace.push('over');
    button.onDown = () => trace.push('down');
    button.onOut = () => trace.push('out');
    button.setSounds(hoverSound, outSound, downSound, clickSound);

    input.mouse.handlePointerMove({ x: 50, y: 40 });
    input.updateInput();
    button.update();
    expect(button.status).toBe(FlxButton.HIGHLIGHT);
    input.mouse.handlePointerDown({ x: 50, y: 40 });
    input.updateInput();
    button.update();
    expect(button.status).toBe(FlxButton.PRESSED);
    input.mouse.handlePointerUp({ x: 50, y: 40 });
    input.updateInput();
    button.update();
    expect({
      frame: button.frame,
      on: button.on,
      status: button.status,
    }).toEqual({
      frame: FlxButton.NORMAL,
      on: true,
      status: FlxButton.HIGHLIGHT,
    });
    input.mouse.handlePointerMove({ x: 10, y: 10 });
    input.updateInput();
    button.update();
    expect(trace).toEqual(['over', 'down', 'up', 'out']);
    expect(
      [hoverSound.play, outSound.play, downSound.play, clickSound.play].every(
        (play) => play.mock.calls.length === 1,
      ),
    ).toBe(true);
    button.destroy();
  });

  it('suppresses activation after cancellation and composes its label view', () => {
    context = new FlxContext(320, 240);
    FlxG.installContext(context);
    input = new FlxInputManager(context);
    const onUp = vi.fn();
    const button = new FlxButton(40, 30, 'Safe', onUp);
    const handle = button.createRenderHandle();
    expect(handle).toBeInstanceOf(FlxButtonRenderHandle);
    expect(handle.view.children).toHaveLength(2);

    input.mouse.handlePointerMove({ x: 50, y: 40 });
    input.mouse.handlePointerDown({ x: 50, y: 40 });
    input.updateInput();
    button.update();
    input.mouse.handlePointerCancel({ x: 50, y: 40 });
    input.updateInput();
    button.update();
    expect(onUp).not.toHaveBeenCalled();
    expect(button.on).toBe(false);
    button.destroy();
    expect(handle.destroyed).toBe(true);
  });
});
