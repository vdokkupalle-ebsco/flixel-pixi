// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';

import {
  FlxActions,
  FlxContext,
  FlxG,
  FlxGame,
  FlxInputManager,
  FlxState,
  FlxVirtualButton,
  FlxVirtualButtonRenderHandle,
  FlxVirtualPad,
  FlxVirtualStick,
  FlxVirtualStickRenderHandle,
} from '../../src';

function bounds(width: number, height: number): DOMRect {
  return {
    bottom: height,
    height,
    left: 0,
    right: width,
    toJSON: () => ({}),
    top: 0,
    width,
    x: 0,
    y: 0,
  };
}

function pointer(
  type: string,
  x: number,
  y: number,
  pointerId: number,
  isPrimary: boolean,
): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    button: 0,
    buttons: type === 'pointerup' ? 0 : 1,
    clientX: x,
    clientY: y,
    isPrimary,
    pointerId,
    pointerType: 'touch',
  });
}

afterEach(() => {
  FlxG.clearContext();
  document.body.replaceChildren();
});

describe('FlxVirtualPad', () => {
  it('publishes deterministic digital and scalar action states', () => {
    let pad: FlxVirtualPad | null = null;
    class VirtualState extends FlxState {
      override create(): void {
        super.create();
        pad = new FlxVirtualPad('full', 'a-b', {
          idPrefix: 'unit-pad',
          margin: 16,
          size: 48,
        });
        pad
          .bindAxes(FlxG.actions, {
            horizontal: 'move-x',
            vertical: 'move-y',
          })
          .bindActions(FlxG.actions, { A: 'jump', B: 'dash' });
        this.add(pad);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = () => bounds(320, 240);
    document.body.appendChild(canvas);
    const game = new FlxGame(320, 240, VirtualState, 1, 60, 60, false, {
      pointerTarget: canvas,
    });
    game.step();
    if (pad === null) throw new Error('Expected the virtual pad.');
    const activePad = pad as FlxVirtualPad;
    const left = activePad.left;
    const actionA = activePad.A;
    if (left === null || actionA === null) {
      throw new Error('Expected full virtual-pad controls.');
    }

    canvas.dispatchEvent(
      pointer(
        'pointerdown',
        left.x + left.width * 0.5,
        left.y + left.height * 0.5,
        1,
        true,
      ),
    );
    game.step();
    expect(left.pressed).toBe(true);
    expect(left.justPressed).toBe(true);
    expect(FlxG.actions.value('move-x')).toBe(-1);

    game.step();
    expect(left.pressed).toBe(true);
    expect(left.justPressed).toBe(false);

    canvas.dispatchEvent(
      pointer(
        'pointerdown',
        actionA.x + actionA.width * 0.5,
        actionA.y + actionA.height * 0.5,
        2,
        false,
      ),
    );
    game.step();
    expect(FlxG.actions.justPressed('jump')).toBe(true);

    canvas.dispatchEvent(pointer('pointerup', left.x, left.y, 1, true));
    canvas.dispatchEvent(pointer('pointerup', actionA.x, actionA.y, 2, false));
    game.step();
    expect(left.justReleased).toBe(true);
    expect(FlxG.actions.value('move-x')).toBe(0);
    expect(FlxG.actions.justReleased('jump')).toBe(true);

    const saved = FlxG.actions.save();
    expect(saved.bindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'jump',
          sources: [{ device: 'virtual-button', id: 'unit-pad.A' }],
        }),
      ]),
    );
    game.destroy();
  });

  it('supports partial layouts and validates layout options', () => {
    const context = new FlxContext(320, 240);
    FlxG.installContext(context);
    const input = new FlxInputManager(context);
    const pad = new FlxVirtualPad('left-right', 'a', {
      idPrefix: 'partial-pad',
    });
    expect(pad.left).not.toBeNull();
    expect(pad.right).not.toBeNull();
    expect(pad.up).toBeNull();
    expect(pad.B).toBeNull();
    expect(pad.getButton('A')).toBe(pad.A);
    pad.destroy();
    expect(FlxG.virtualInputs.getButton('partial-pad.A')).toBeNull();
    expect(() => new FlxVirtualPad('none', 'none', { gap: -1 })).toThrow('gap');
    expect(() => new FlxVirtualPad('none', 'none', { margin: -1 })).toThrow(
      'margin',
    );
    expect(() => new FlxVirtualPad('unknown' as never, 'none')).toThrow(
      'D-pad mode',
    );
    expect(() => new FlxVirtualPad('none', 'unknown' as never)).toThrow(
      'action mode',
    );
    input.destroy();
  });
});

describe('FlxVirtualButton', () => {
  it('renders texture-free status geometry and unregisters on destroy', () => {
    const context = new FlxContext(320, 240);
    FlxG.installContext(context);
    const input = new FlxInputManager(context);
    const button = new FlxVirtualButton('unit.action', 20, 30, 'A', {
      accessibleLabel: 'Jump',
      size: 64,
    });
    const handle = button.createRenderHandle();
    expect(handle).toBeInstanceOf(FlxVirtualButtonRenderHandle);
    expect(handle.background.bounds.width).toBeGreaterThan(0);
    expect(button.source).toEqual({
      device: 'virtual-button',
      id: 'unit.action',
    });
    expect(button.accessibleLabel).toBe('Jump');

    button.enabled = false;
    input.updateVirtualInput();
    handle.sync();
    expect(button.pressed).toBe(false);
    expect(button.status).toBe(3);

    button.destroy();
    expect(handle.destroyed).toBe(true);
    expect(FlxG.virtualInputs.getButton('unit.action')).toBeNull();
    input.destroy();
  });

  it('rejects invalid sizes, ids, and duplicate registrations', () => {
    const context = new FlxContext(320, 240);
    FlxG.installContext(context);
    const input = new FlxInputManager(context);
    expect(() => new FlxVirtualButton('', 0, 0, 'A')).toThrow('id');
    expect(
      () => new FlxVirtualButton('bad-size', 0, 0, 'A', { size: 0 }),
    ).toThrow('size');
    const first = new FlxVirtualButton('duplicate', 0, 0, 'A');
    expect(() => new FlxVirtualButton('duplicate', 0, 0, 'B')).toThrow(
      'already registered',
    );
    FlxG.clearContext(context);
    expect(() => first.destroy()).not.toThrow();
    FlxG.installContext(context);
    input.destroy();
  });
});

describe('FlxVirtualStick', () => {
  it('publishes normalized axes with a radial dead zone', () => {
    let stick: FlxVirtualStick | null = null;
    class StickState extends FlxState {
      override create(): void {
        super.create();
        stick = new FlxVirtualStick('unit-stick', 20, 100, {
          deadZone: 0.2,
          knobRadius: 20,
          radius: 50,
        });
        stick.bindAxes(FlxG.actions, {
          horizontal: 'move-x',
          vertical: 'move-y',
        });
        this.add(stick);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = () => bounds(320, 240);
    document.body.appendChild(canvas);
    const game = new FlxGame(320, 240, StickState, 1, 60, 60, false, {
      pointerTarget: canvas,
    });
    game.step();
    if (stick === null) throw new Error('Expected the virtual stick.');
    const activeStick = stick as FlxVirtualStick;
    const centerX = activeStick.x + activeStick.radius;
    const centerY = activeStick.y + activeStick.radius;

    canvas.dispatchEvent(pointer('pointerdown', centerX, centerY, 1, true));
    game.step();
    expect(activeStick.pressed).toBe(true);
    expect(FlxG.actions.value('move-x')).toBe(0);

    canvas.dispatchEvent(
      pointer('pointermove', centerX + 15, centerY, 1, true),
    );
    game.step();
    expect(FlxG.actions.value('move-x')).toBeCloseTo(0.375);
    expect(FlxG.actions.value('move-y')).toBe(0);

    canvas.dispatchEvent(
      pointer('pointermove', centerX + 100, centerY, 1, true),
    );
    game.step();
    expect(activeStick.rawX).toBe(1);
    expect(FlxG.actions.value('move-x')).toBe(1);

    canvas.dispatchEvent(pointer('pointerup', centerX + 100, centerY, 1, true));
    game.step();
    expect(activeStick.pressed).toBe(false);
    expect(activeStick.xAxis).toBe(0);
    expect(FlxG.actions.value('move-x')).toBe(0);
    expect(FlxG.actions.save().bindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'move-x',
          sources: [
            {
              axis: 'x',
              device: 'virtual-stick-axis',
              id: 'unit-stick',
              scale: 1,
            },
          ],
        }),
      ]),
    );
    game.destroy();
  });

  it('renders stable texture-free geometry and validates registration', () => {
    const context = new FlxContext(320, 240);
    FlxG.installContext(context);
    const input = new FlxInputManager(context);
    const stick = new FlxVirtualStick('render-stick', 10, 20, { radius: 48 });
    const handle = stick.createRenderHandle();
    expect(handle).toBeInstanceOf(FlxVirtualStickRenderHandle);
    expect(handle.base.bounds.width).toBeGreaterThan(0);
    expect(handle.knob.bounds.width).toBeGreaterThan(0);
    expect(stick.source('y')).toEqual({
      axis: 'y',
      device: 'virtual-stick-axis',
      id: 'render-stick',
    });
    const actions = new FlxActions();
    expect(stick.bindAxes(actions, {})).toBe(stick);
    expect(() =>
      actions.addSource('bad', {
        axis: 'z' as never,
        device: 'virtual-stick-axis',
        id: 'render-stick',
      }),
    ).toThrow('axis');
    expect(() =>
      FlxG.virtualInputs.registerStick('render-stick', stick),
    ).not.toThrow();
    expect(
      FlxG.virtualInputs.unregisterStick('render-stick', {
        xAxis: 0,
        yAxis: 0,
      }),
    ).toBe(false);
    const passive = { xAxis: 0, yAxis: 0 };
    FlxG.virtualInputs.registerStick('passive-stick', passive);
    expect(() => input.updateVirtualInput()).not.toThrow();
    expect(FlxG.virtualInputs.unregisterStick('passive-stick', passive)).toBe(
      true,
    );
    expect(() => new FlxVirtualStick('render-stick', 0, 0)).toThrow(
      'already registered',
    );
    expect(() => new FlxVirtualButton('render-stick', 0, 0, 'A')).toThrow(
      'already registered',
    );
    expect(
      () => new FlxVirtualStick('bad-radius', 0, 0, { radius: 0 }),
    ).toThrow('radius');
    expect(
      () =>
        new FlxVirtualStick('bad-knob', 0, 0, { knobRadius: 50, radius: 50 }),
    ).toThrow('knob radius');
    expect(
      () => new FlxVirtualStick('bad-dead-zone', 0, 0, { deadZone: 1 }),
    ).toThrow('dead zone');

    stick.destroy();
    stick.destroy();
    expect(handle.destroyed).toBe(true);
    expect(() => handle.sync()).not.toThrow();
    expect(() => handle.destroy()).not.toThrow();
    expect(FlxG.virtualInputs.getStick('render-stick')).toBeNull();
    input.destroy();
  });

  it('captures non-primary touches and resets hidden controls', () => {
    let stick: FlxVirtualStick | null = null;
    class TouchStickState extends FlxState {
      override create(): void {
        super.create();
        stick = new FlxVirtualStick('touch-stick', 20, 100, {
          knobRadius: 20,
          radius: 50,
        });
        this.add(stick);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = () => bounds(320, 240);
    document.body.appendChild(canvas);
    const game = new FlxGame(320, 240, TouchStickState, 1, 60, 60, false, {
      pointerTarget: canvas,
    });
    game.step();
    if (stick === null) throw new Error('Expected the touch stick.');
    const activeStick = stick as FlxVirtualStick;
    const centerX = activeStick.x + activeStick.radius;
    const centerY = activeStick.y + activeStick.radius;

    FlxG.mouse.hide();
    canvas.dispatchEvent(pointer('pointerdown', centerX, centerY, 1, true));
    game.step();
    expect(activeStick.pressed).toBe(false);
    canvas.dispatchEvent(pointer('pointerup', centerX, centerY, 1, true));
    game.step();

    FlxG.mouse.show();
    canvas.dispatchEvent(pointer('pointerdown', 319, 1, 1, true));
    game.step();
    expect(activeStick.pressed).toBe(false);
    canvas.dispatchEvent(pointer('pointerup', 319, 1, 1, true));
    game.step();

    canvas.dispatchEvent(pointer('pointerdown', centerX, centerY, 2, false));
    game.step();
    expect(activeStick.pressed).toBe(true);
    canvas.dispatchEvent(
      pointer('pointermove', centerX + 30, centerY + 30, 2, false),
    );
    game.step();
    expect(activeStick.xAxis).toBeGreaterThan(0);
    expect(activeStick.yAxis).toBeGreaterThan(0);

    activeStick.visible = false;
    game.step();
    expect(activeStick.pressed).toBe(false);
    expect(activeStick.rawX).toBe(0);
    expect(activeStick.rawY).toBe(0);
    canvas.dispatchEvent(pointer('pointerup', centerX, centerY, 2, false));
    game.step();
    game.destroy();
  });
});
