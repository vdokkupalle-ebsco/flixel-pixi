// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { FlxGame } from '../../src/core/flx-game';
import { FlxState } from '../../src/core/flx-state';
import { FlxG } from '../../src/core/flx-g';
import {
  FlxGamepadButton,
  type FlxActionBindingsData,
  type FlxGamepadLike,
} from '../../src';

function eventWith(type: string, properties: Record<string, unknown>): Event {
  const event = new Event(type, { cancelable: true });
  for (const [key, value] of Object.entries(properties)) {
    Object.defineProperty(event, key, { configurable: true, value });
  }
  return event;
}

describe('FlxActions', () => {
  let game: FlxGame;

  afterEach(() => {
    game?.destroy();
  });

  it('maps named actions to keys and checks pressed state', () => {
    const target = new EventTarget();
    game = new FlxGame(640, 480, class extends FlxState {}, 1, 60, 60, false, {
      keyboardTarget: target as Window,
    });
    game.step();

    FlxG.actions.bind('jump', 'SPACE', 'W');
    expect(FlxG.actions.pressed('jump')).toBe(false);

    target.dispatchEvent(
      eventWith('keydown', { code: 'Space', repeat: false }),
    );
    game.input.updateInput();
    expect(FlxG.actions.pressed('jump')).toBe(true);
    expect(FlxG.actions.justPressed('jump')).toBe(true);

    // Advance frame
    game.step();
    expect(FlxG.actions.pressed('jump')).toBe(true);
    expect(FlxG.actions.justPressed('jump')).toBe(false);

    // Key up
    target.dispatchEvent(eventWith('keyup', { code: 'Space' }));
    game.input.updateInput();
    expect(FlxG.actions.justReleased('jump')).toBe(true);
    expect(FlxG.actions.pressed('jump')).toBe(false);
  });

  it('supports unbinding and resetting actions', () => {
    const target = new EventTarget();
    game = new FlxGame(640, 480, class extends FlxState {}, 1, 60, 60, false, {
      keyboardTarget: target as Window,
    });
    game.step();

    FlxG.actions.bind('shoot', 'Z');
    FlxG.actions.bind('jump', 'SPACE');

    FlxG.actions.unbind('shoot');
    target.dispatchEvent(eventWith('keydown', { code: 'KeyZ' }));
    game.input.updateInput();
    expect(FlxG.actions.pressed('shoot')).toBe(false);

    FlxG.actions.reset();
    target.dispatchEvent(eventWith('keydown', { code: 'Space' }));
    game.input.updateInput();
    expect(FlxG.actions.pressed('jump')).toBe(false);
  });

  it('combines keyboard, mouse, wheel, and gamepad digital sources', () => {
    let gamepads: readonly (FlxGamepadLike | null)[] = [];
    game = new FlxGame(640, 480, class extends FlxState {}, 1, 60, 60, false, {
      gamepadProvider: () => gamepads,
    });
    game.step();

    FlxG.actions.bindSources(
      'fire',
      { device: 'keyboard', key: 'Z' },
      { button: 0, device: 'mouse' },
      { button: FlxGamepadButton.A, device: 'gamepad-button' },
      { device: 'wheel', direction: 1 },
    );
    game.input.mouse.handlePointerDown({ button: 0, x: 10, y: 10 });
    game.input.updateInput();
    expect(FlxG.actions.justPressed('fire')).toBe(true);

    game.input.mouse.handlePointerUp({ button: 0, x: 10, y: 10 });
    game.input.updateInput();
    expect(FlxG.actions.justReleased('fire')).toBe(true);

    game.input.mouse.handleWheel(1);
    game.input.updateInput();
    expect(FlxG.actions.justPressed('fire')).toBe(true);

    gamepads = [
      {
        axes: [],
        buttons: [{ pressed: true, value: 1 }],
        connected: true,
        id: 'Action Pad',
        index: 0,
        mapping: 'standard',
      },
    ];
    game.input.updateInput();
    expect(FlxG.actions.pressed('fire')).toBe(true);
    expect(FlxG.actions.justPressed('fire')).toBe(true);
  });

  it('selects the strongest analog source and supports stable gamepad UIDs', () => {
    const target = new EventTarget();
    const gamepads: readonly (FlxGamepadLike | null)[] = [
      {
        axes: [0.575],
        buttons: Array.from({ length: 16 }, (_, index) => ({
          pressed: index === FlxGamepadButton.DPAD_LEFT,
          value: index === FlxGamepadButton.DPAD_LEFT ? 1 : 0,
        })),
        connected: true,
        id: 'Analog Pad',
        index: 0,
        mapping: 'standard',
      },
    ];
    game = new FlxGame(640, 480, class extends FlxState {}, 1, 60, 60, false, {
      gamepadProvider: () => gamepads,
      keyboardTarget: target as Window,
    });
    game.step();
    const uid = FlxG.gamepads.firstActive?.uid;
    expect(uid).toBe(0);
    if (uid === undefined) throw new Error('Expected a connected gamepad.');

    FlxG.actions.bindSources(
      'move-x',
      { device: 'keyboard-axis', negative: 'A', positive: 'D' },
      { axis: 0, device: 'gamepad-axis', gamepad: uid },
    );
    expect(FlxG.actions.value('move-x')).toBeCloseTo(0.5);
    FlxG.actions.bindSources('dpad-x', {
      device: 'gamepad-button-axis',
      negative: FlxGamepadButton.DPAD_LEFT,
      positive: FlxGamepadButton.DPAD_RIGHT,
    });
    expect(FlxG.actions.value('dpad-x')).toBe(-1);

    target.dispatchEvent(eventWith('keydown', { code: 'KeyA', repeat: false }));
    game.input.updateInput();
    expect(FlxG.actions.value('move-x')).toBe(-1);
  });

  it('rebinding removes conflicts and round-trips validated data', () => {
    game = new FlxGame(640, 480, class extends FlxState {});
    game.step();
    FlxG.actions.bind('jump', 'SPACE');
    FlxG.actions.bind('fire', 'Z');
    FlxG.actions.rebind('jump', { device: 'keyboard', key: 'Z' });

    expect(FlxG.actions.getSources('jump')).toEqual([
      { device: 'keyboard', key: 'Z' },
    ]);
    expect(FlxG.actions.getSources('fire')).toEqual([]);

    FlxG.actions.addSource('jump', { button: 0, device: 'mouse' });
    const saved = FlxG.actions.save();
    FlxG.actions.reset();
    FlxG.actions.load(JSON.stringify(saved));
    expect(FlxG.actions.save()).toEqual(saved);

    const invalid = {
      bindings: [],
      version: 99,
    } as unknown as FlxActionBindingsData;
    expect(() => FlxG.actions.load(invalid)).toThrow('Unsupported');
    expect(FlxG.actions.save()).toEqual(saved);
  });

  it('validates source variants and preserves bindings after rejected data', () => {
    game = new FlxGame(640, 480, class extends FlxState {});
    game.step();
    const actions = FlxG.actions;

    actions.bind('move', 'A', 'D');
    expect(
      actions.removeSource('missing', { device: 'keyboard', key: 'A' }),
    ).toBe(false);
    expect(actions.removeSource('move', { device: 'keyboard', key: 'W' })).toBe(
      false,
    );
    expect(actions.removeSource('move', { device: 'keyboard', key: 'A' })).toBe(
      true,
    );
    expect(actions.getSources('move')).toEqual([
      { device: 'keyboard', key: 'D' },
    ]);
    expect(actions.removeSource('move', { device: 'keyboard', key: 'D' })).toBe(
      true,
    );
    expect(actions.getSources('move')).toEqual([]);

    actions.bind('primary', 'Z');
    actions.addSource(
      'secondary',
      { device: 'keyboard', key: 'Z' },
      { exclusive: true },
    );
    expect(actions.getSources('primary')).toEqual([]);
    actions.rebind(
      'tertiary',
      { device: 'keyboard', key: 'Z' },
      { exclusive: false },
    );
    expect(actions.getSources('secondary')).toHaveLength(1);

    const before = actions.save();
    expect(() =>
      actions.load({
        bindings: [null],
        version: 1,
      } as unknown as FlxActionBindingsData),
    ).toThrow('Invalid FlxActions binding entry');
    expect(actions.save()).toEqual(before);

    expect(() => actions.bindSources('bad', null as never)).toThrow('object');
    expect(() =>
      actions.bindSources('bad', { button: -1, device: 'mouse' }),
    ).toThrow('Mouse button');
    expect(() =>
      actions.bindSources('bad', { device: 'wheel', direction: 0 } as never),
    ).toThrow('Wheel direction');
    expect(() =>
      actions.bindSources('bad', {
        axis: 0,
        deadZone: 1,
        device: 'gamepad-axis',
      }),
    ).toThrow('dead zone');
    expect(() =>
      actions.bindSources('bad', { device: 'virtual-button', id: ' ' }),
    ).toThrow('id cannot be empty');
    expect(() =>
      actions.bindSources('bad', {
        axis: 'z',
        device: 'virtual-stick-axis',
        id: 'stick',
      } as never),
    ).toThrow('must be "x" or "y"');
    expect(() =>
      actions.bindSources('bad', { device: 'unknown' } as never),
    ).toThrow('Unknown action source');
  });

  it('evaluates keyboard and virtual scalar sources deterministically', () => {
    const target = new EventTarget();
    game = new FlxGame(640, 480, class extends FlxState {}, 1, 60, 60, false, {
      keyboardTarget: target as Window,
    });
    game.step();
    const actions = FlxG.actions;
    const left = { justPressed: true, justReleased: false, pressed: true };
    const right = { justPressed: false, justReleased: false, pressed: false };
    const stick = { xAxis: 0.25, yAxis: -0.75 };
    FlxG.virtualInputs.registerButton('left', left);
    FlxG.virtualInputs.registerButton('right', right);
    FlxG.virtualInputs.registerStick('stick', stick);

    actions.bindSources('virtual-fire', {
      device: 'virtual-button',
      id: 'left',
    });
    expect(actions.pressed('virtual-fire')).toBe(true);
    expect(actions.justPressed('virtual-fire')).toBe(true);
    expect(actions.justReleased('virtual-fire')).toBe(false);

    actions.bindSources('keyboard-x', {
      device: 'keyboard-axis',
      negative: 'A',
      positive: 'D',
      scale: 0.5,
    });
    expect(actions.value('keyboard-x')).toBe(0);
    target.dispatchEvent(eventWith('keydown', { code: 'KeyD', repeat: false }));
    game.input.updateInput();
    expect(actions.value('keyboard-x')).toBe(0.5);
    target.dispatchEvent(eventWith('keydown', { code: 'KeyA', repeat: false }));
    game.input.updateInput();
    expect(actions.value('keyboard-x')).toBe(0);

    actions.bindSources('virtual-x', {
      device: 'virtual-button-axis',
      negative: 'left',
      positive: 'right',
      scale: 0.75,
    });
    expect(actions.value('virtual-x')).toBe(-0.75);
    right.pressed = true;
    expect(actions.value('virtual-x')).toBe(0);

    actions.bindSources(
      'stick-y',
      { axis: 'x', device: 'virtual-stick-axis', id: 'missing' },
      { axis: 'y', device: 'virtual-stick-axis', id: 'stick', scale: 0.5 },
    );
    expect(actions.value('stick-y')).toBe(-0.375);
    actions.bindSources('digital-only', { device: 'keyboard', key: 'A' });
    expect(actions.value('digital-only')).toBe(0);

    actions.bindSources('wheel-only', { device: 'wheel', direction: 1 });
    expect(actions.justReleased('wheel-only')).toBe(false);
  });

  it('normalizes, deduplicates, clones, and validates every source shape', () => {
    game = new FlxGame(640, 480, class extends FlxState {});
    game.step();
    const actions = FlxG.actions;
    actions.bindSources(
      ' jump ',
      { device: 'keyboard', key: ' z ' },
      { device: 'keyboard', key: 'Z' },
    );
    const sources = actions.getSources('jump');
    expect(sources).toEqual([{ device: 'keyboard', key: 'Z' }]);
    (sources[0] as { key: string }).key = 'X';
    expect(actions.getSources('jump')).toEqual([
      { device: 'keyboard', key: 'Z' },
    ]);

    expect(() => actions.bind('', 'A')).toThrow('Action name');
    expect(() => actions.load({ bindings: null, version: 1 } as never)).toThrow(
      'Unsupported',
    );
    expect(() =>
      actions.bindSources('bad', {
        button: 0,
        device: 'gamepad-button',
        gamepad: -1,
      }),
    ).toThrow('Gamepad UID');
    expect(() =>
      actions.bindSources('bad', {
        button: -1,
        device: 'gamepad-button',
      }),
    ).toThrow('Gamepad button');
    expect(() =>
      actions.bindSources('bad', {
        device: 'keyboard-axis',
        negative: '',
        positive: 'D',
      }),
    ).toThrow('Keyboard key');
    expect(() =>
      actions.bindSources('bad', {
        device: 'keyboard-axis',
        negative: 'A',
        positive: 'D',
        scale: Number.NaN,
      }),
    ).toThrow('must be finite');
    expect(() =>
      actions.bindSources('bad', {
        axis: -1,
        device: 'gamepad-axis',
      }),
    ).toThrow('Gamepad axis');
    expect(() =>
      actions.bindSources('bad', {
        axis: 0,
        deadZone: Number.NaN,
        device: 'gamepad-axis',
      }),
    ).toThrow('dead zone');
    expect(() =>
      actions.bindSources('bad', {
        device: 'gamepad-button-axis',
        negative: -1,
        positive: 1,
      }),
    ).toThrow('Negative gamepad button');
    expect(() =>
      actions.bindSources('bad', {
        device: 'gamepad-button-axis',
        negative: 0,
        positive: -1,
      }),
    ).toThrow('Positive gamepad button');
    expect(() =>
      actions.bindSources('bad', {
        device: 'virtual-button-axis',
        negative: '',
        positive: 'right',
      }),
    ).toThrow('id cannot be empty');
    expect(() =>
      actions.bindSources('bad', {
        axis: 'x',
        device: 'virtual-stick-axis',
        id: 'stick',
        scale: Number.POSITIVE_INFINITY,
      }),
    ).toThrow('must be finite');
  });

  it('targets all, one, or missing gamepads for digital and analog actions', () => {
    const gamepads: readonly FlxGamepadLike[] = [
      {
        axes: [-0.575],
        buttons: [
          { pressed: false, value: 0 },
          { pressed: true, value: 1 },
        ],
        connected: true,
        id: 'Left Pad',
        index: 0,
        mapping: 'standard',
      },
      {
        axes: [0.83],
        buttons: [
          { pressed: true, value: 1 },
          { pressed: false, value: 0 },
        ],
        connected: true,
        id: 'Right Pad',
        index: 1,
        mapping: 'standard',
      },
    ];
    game = new FlxGame(640, 480, class extends FlxState {}, 1, 60, 60, false, {
      gamepadProvider: () => gamepads,
    });
    game.step();
    const actions = FlxG.actions;

    actions.bindSources('any-fire', {
      button: 0,
      device: 'gamepad-button',
      gamepad: 'all',
    });
    expect(actions.pressed('any-fire')).toBe(true);
    actions.bindSources('missing-fire', {
      button: 0,
      device: 'gamepad-button',
      gamepad: 999,
    });
    expect(actions.pressed('missing-fire')).toBe(false);

    actions.bindSources('strongest-axis', {
      axis: 0,
      deadZone: 0.15,
      device: 'gamepad-axis',
      gamepad: 'all',
      scale: 0.5,
    });
    expect(actions.value('strongest-axis')).toBeCloseTo(0.4);
    actions.bindSources('missing-axis', {
      axis: 0,
      device: 'gamepad-axis',
      gamepad: 999,
    });
    expect(actions.value('missing-axis')).toBe(0);

    actions.bindSources('button-axis', {
      device: 'gamepad-button-axis',
      gamepad: 'all',
      negative: 0,
      positive: 1,
      scale: 0.25,
    });
    expect(actions.value('button-axis')).toBe(0.25);
  });
});
