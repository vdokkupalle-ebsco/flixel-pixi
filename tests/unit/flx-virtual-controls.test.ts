// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';

import {
  FlxContext,
  FlxG,
  FlxGame,
  FlxInputManager,
  FlxState,
  FlxVirtualButton,
  FlxVirtualButtonRenderHandle,
  FlxVirtualPad,
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
