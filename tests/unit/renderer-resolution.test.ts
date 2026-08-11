import { describe, expect, it } from 'vitest';

import { resolveRendererResolution } from '../../src/browser/renderer-resolution';

describe('browser renderer resolution', () => {
  it('tracks browser DPR below the configured cap', () => {
    expect(resolveRendererResolution(1, 2)).toBe(1);
    expect(resolveRendererResolution(1.5, 2)).toBe(1.5);
  });

  it('caps expensive high-density displays', () => {
    expect(resolveRendererResolution(3, 2)).toBe(2);
    expect(resolveRendererResolution(2, 1.25)).toBe(1.25);
  });

  it('rejects invalid ratios and caps', () => {
    expect(() => resolveRendererResolution(0, 2)).toThrow('Device pixel ratio');
    expect(() => resolveRendererResolution(2, Number.NaN)).toThrow(
      'Maximum device pixel ratio',
    );
  });
});
