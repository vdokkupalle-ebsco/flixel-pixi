import { describe, expect, it } from 'vitest';

import { BenchSpritesState } from '../../examples/games/bench-sprites/game';

describe('BenchSpritesState render measurements', () => {
  it('reports slow completed frames instead of discarding them', () => {
    const state = new BenchSpritesState();

    state.recordRenderedFrame(1_000);
    for (let frame = 0; frame < 8; frame += 1) {
      state.recordRenderedFrame(500);
    }

    expect(state.measured).toBe(true);
    expect(state.avgFps).toBe(2);
    expect(state.medianFps).toBe(2);
    expect(state.minFps).toBe(2);
  });
});
