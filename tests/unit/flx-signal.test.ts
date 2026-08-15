import { describe, expect, it, vi } from 'vitest';

import { FlxSignal } from '../../src/core/flx-signal';

describe('FlxSignal', () => {
  it('dispatches mutation-safely and supports its full listener lifecycle', () => {
    const signal = new FlxSignal<number>();
    const second = vi.fn();
    const first = vi.fn(() => signal.remove(second));

    expect(signal.add(first)).toBe(first);
    signal.add(second);
    signal.add(second);
    signal.dispatch(7);
    expect(first).toHaveBeenCalledWith(7);
    expect(second).not.toHaveBeenCalled();
    expect(signal.remove(second)).toBe(false);

    signal.clear();
    signal.dispatch(8);
    expect(first).toHaveBeenCalledOnce();
    signal.destroy();
  });
});
