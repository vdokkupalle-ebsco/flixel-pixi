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
});
