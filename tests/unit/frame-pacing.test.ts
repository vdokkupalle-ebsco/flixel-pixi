import { describe, expect, it } from 'vitest';

import {
  getRenderFrameTiming,
  validateFramerate,
} from '../../src/browser/frame-pacing';

describe('browser frame pacing', () => {
  it('renders every browser callback when no cap is configured', () => {
    expect(getRenderFrameTiming(16, 0)).toEqual({
      pacingElapsedMS: 16,
      previousRenderTime: 16,
    });
  });

  it('skips early callbacks and accepts the requested interval', () => {
    expect(getRenderFrameTiming(16, 0, 30)).toBeNull();
    expect(getRenderFrameTiming(33.3, 0, 30)).toEqual({
      pacingElapsedMS: 33.3,
      previousRenderTime: expect.closeTo(33.3, 5),
    });
  });

  it('preserves the cadence after a late frame instead of accumulating drift', () => {
    const timing = getRenderFrameTiming(50, 0, 30);
    expect(timing?.pacingElapsedMS).toBe(50);
    expect(timing?.previousRenderTime).toBeCloseTo(1000 / 30, 5);
  });

  it('clamps a backwards timestamp to a zero elapsed interval', () => {
    expect(getRenderFrameTiming(5, 10)).toEqual({
      pacingElapsedMS: 0,
      previousRenderTime: 5,
    });
  });

  it('rejects invalid user-supplied frame rates', () => {
    expect(() => validateFramerate('updateFramerate', 60)).not.toThrow();
    expect(() => validateFramerate('renderFramerate', 0)).toThrow(
      'renderFramerate must be a positive finite number.',
    );
    expect(() => validateFramerate('updateFramerate', Number.NaN)).toThrow(
      RangeError,
    );
  });
});
