import { describe, expect, it, vi } from 'vitest';

import { FixedStepAccumulator } from '../../src';

describe('FixedStepAccumulator', () => {
  it.each([30, 60, 120])(
    'produces the same simulation after ten seconds at %i Hz',
    (displayRate) => {
      const clock = new FixedStepAccumulator();
      let position = 0;
      let steps = 0;

      for (let frame = 0; frame < displayRate * 10; frame += 1) {
        clock.advance(1 / displayRate, (stepSeconds) => {
          position += 37 * stepSeconds;
          steps += 1;
        });
      }

      expect(steps).toBe(600);
      expect(position).toBeCloseTo(370, 10);
      expect(clock.alpha).toBe(0);
    },
  );

  it('reports interpolation without advancing a partial simulation step', () => {
    const clock = new FixedStepAccumulator();
    const update = vi.fn();

    const result = clock.advance(1 / 120, update);

    expect(result).toEqual({ alpha: 0.5, discardedSeconds: 0, steps: 0 });
    expect(update).not.toHaveBeenCalled();
  });

  it('caps catch-up work and reports discarded time', () => {
    const clock = new FixedStepAccumulator({ maxCatchUpSteps: 3 });
    const update = vi.fn();

    const result = clock.advance(1, update);

    expect(result.steps).toBe(3);
    expect(result.alpha).toBe(0);
    expect(result.discardedSeconds).toBeCloseTo(0.95, 12);
    expect(update).toHaveBeenCalledTimes(3);
  });

  it('drops hidden-tab time and resumes with an empty accumulator', () => {
    const clock = new FixedStepAccumulator();
    const update = vi.fn();

    clock.advance(1 / 120, update);
    clock.setPaused(true);
    expect(clock.advance(5, update)).toEqual({
      alpha: 0,
      discardedSeconds: 5,
      steps: 0,
    });

    clock.setPaused(false);
    expect(clock.advance(1 / 60, update).steps).toBe(1);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('resets elapsed debt and validates options and frame durations', () => {
    const clock = new FixedStepAccumulator();
    clock.advance(1 / 120, () => undefined);
    clock.reset();
    expect(clock.alpha).toBe(0);

    expect(() => new FixedStepAccumulator({ stepSeconds: 0 })).toThrow(
      RangeError,
    );
    expect(() => new FixedStepAccumulator({ maxCatchUpSteps: 1.5 })).toThrow(
      RangeError,
    );
    expect(() => clock.advance(-1, () => undefined)).toThrow(RangeError);
  });
});
