import { describe, expect, it } from 'vitest';

import {
  FlxGamepadButton,
  FlxGamepadManager,
  type FlxGamepadLike,
} from '../../src';

function source(
  options: Partial<FlxGamepadLike> & Pick<FlxGamepadLike, 'id' | 'index'>,
): FlxGamepadLike {
  return {
    axes: [],
    buttons: [],
    connected: true,
    mapping: 'standard',
    ...options,
  };
}

describe('FlxGamepadManager', () => {
  it('publishes buttons and dead-zoned axes on fixed-step polls', () => {
    let current: readonly (FlxGamepadLike | null)[] = [
      source({
        axes: [0.1, -0.6],
        buttons: [{ pressed: true, value: 1 }],
        id: 'Pad A',
        index: 0,
      }),
    ];
    const manager = new FlxGamepadManager(() => current);

    manager.update();
    const pad = manager.firstActive;
    expect(pad).not.toBeNull();
    expect(pad?.justPressed(FlxGamepadButton.A)).toBe(true);
    expect(pad?.getAxis(0)).toBe(0);
    expect(pad?.getAxis(1)).toBeCloseTo(-0.5294118);
    expect(pad?.axisPressed(1, -1)).toBe(true);

    manager.update();
    expect(pad?.pressed(FlxGamepadButton.A)).toBe(true);
    expect(pad?.justPressed(FlxGamepadButton.A)).toBe(false);

    current = [source({ id: 'Pad A', index: 0 })];
    manager.update();
    expect(pad?.justReleased(FlxGamepadButton.A)).toBe(true);
  });

  it('retains a logical ID for reconnects and replaces a different device', () => {
    let current: readonly (FlxGamepadLike | null)[] = [
      source({ id: 'Pad A', index: 1 }),
    ];
    const manager = new FlxGamepadManager(() => current);
    manager.update();
    const original = manager.firstActive;
    expect(original?.uid).toBe(0);

    current = [];
    manager.update();
    expect(original?.connected).toBe(false);

    current = [source({ id: 'Pad A', index: 3 })];
    manager.update();
    expect(manager.firstActive).toBe(original);
    expect(original?.index).toBe(3);

    current = [source({ id: 'Pad B', index: 3 })];
    manager.update();
    expect(original?.connected).toBe(false);
    expect(manager.firstActive?.uid).toBe(1);
    expect(manager.getByID(0)).toBe(original);
  });

  it('records and restores authoritative analog and digital state', () => {
    const sourceManager = new FlxGamepadManager(() => [
      source({
        axes: [0.75],
        buttons: [{ pressed: true, value: 0.8 }],
        id: 'Recorded Pad',
        index: 2,
      }),
    ]);
    sourceManager.update();
    const pressedRecord = sourceManager.record();
    sourceManager.update();
    const heldRecord = sourceManager.record();

    const playbackManager = new FlxGamepadManager(() => [
      source({ id: 'Live Pad', index: 2 }),
    ]);
    playbackManager.update();
    playbackManager.playback(pressedRecord);
    const restored = playbackManager.getByID(pressedRecord[0]?.uid ?? -1);
    expect(restored?.id).toBe('Recorded Pad');
    expect(restored?.justPressed(0)).toBe(true);
    expect(restored?.getButtonValue(0)).toBeCloseTo(0.8);
    expect(restored?.getAxis(0, 0)).toBeCloseTo(0.75);

    playbackManager.update();
    playbackManager.playback(heldRecord);
    expect(restored?.pressed(0)).toBe(true);
    expect(restored?.justPressed(0)).toBe(false);

    playbackManager.playback([]);
    expect(restored?.justReleased(0)).toBe(true);
    expect(restored?.connected).toBe(false);
  });
});
