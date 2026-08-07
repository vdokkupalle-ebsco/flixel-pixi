// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { FlxGame } from '../../src/core/flx-game';
import { FlxState } from '../../src/core/flx-state';
import { FlxG } from '../../src/core/flx-g';

function eventWith(
  type: string,
  properties: Record<string, unknown>,
): Event {
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

    target.dispatchEvent(eventWith('keydown', { code: 'Space', repeat: false }));
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
});
