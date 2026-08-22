import { describe, expect, it } from 'vitest';

import { parseParticlePreset } from 'flixel-pixi';

import { starterPresets } from '../src/presets';

describe('particle editor starter presets', () => {
  it('ships distinct presets that satisfy the public schema', () => {
    const parsed = starterPresets.map((preset) => parseParticlePreset(preset));

    expect(parsed).toHaveLength(4);
    expect(new Set(parsed.map((preset) => preset.id)).size).toBe(parsed.length);
    expect(parsed.some((preset) => preset.emission.mode === 'burst')).toBe(
      true,
    );
    expect(parsed.some((preset) => preset.emission.mode === 'continuous')).toBe(
      true,
    );
  });
});
