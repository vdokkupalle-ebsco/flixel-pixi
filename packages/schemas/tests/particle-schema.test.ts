import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import {
  isParticlePresetValidationError,
  parseParticlePreset,
  ParticlePresetValidationError,
  serializeParticlePreset,
  validateParticlePreset,
  type ParticlePresetV1,
} from '../src/index.js';

async function fixture(): Promise<unknown> {
  return JSON.parse(
    await readFile(
      new URL('fixtures/particle-preset-v1.json', import.meta.url),
      'utf8',
    ),
  );
}

describe('particle preset schema', () => {
  it('validates the complete version 1 fixture', async () => {
    const result = validateParticlePreset(await fixture());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('impact-sparks');
      expect(result.data.seed).toBe(1337);
      expect(result.data.appearance.texture.frames).toHaveLength(3);
    }
  });

  it('accepts continuous point and rectangle emitters', async () => {
    const base = parseParticlePreset(await fixture());
    expect(
      validateParticlePreset({
        ...base,
        appearance: { texture: { assetId: 'smoke' } },
        emission: { duration: 0, mode: 'continuous', rate: 12 },
        spawn: { shape: 'point' },
      }).success,
    ).toBe(true);
    expect(
      validateParticlePreset({
        ...base,
        appearance: { texture: { assetId: 'rain', selection: 'sequence' } },
        emission: { mode: 'continuous', rate: 40 },
        space: 'local',
        spawn: { height: 0, shape: 'rectangle', width: 320 },
      }).success,
    ).toBe(true);
  });

  it('serializes deterministically and clamps indentation', async () => {
    const preset = parseParticlePreset(await fixture());
    const reordered = {
      spawn: preset.spawn,
      space: preset.space,
      seed: preset.seed,
      schemaVersion: 1,
      name: preset.name,
      motion: preset.motion,
      lifespan: preset.lifespan,
      kind: preset.kind,
      id: preset.id,
      extensions: preset.extensions,
      emission: preset.emission,
      capacity: preset.capacity,
      appearance: preset.appearance,
    } as ParticlePresetV1;
    const serialized = serializeParticlePreset(preset);
    expect(serializeParticlePreset(reordered)).toBe(serialized);
    expect(serialized.endsWith('\n')).toBe(true);
    expect(serialized.indexOf('"appearance"')).toBeLessThan(
      serialized.indexOf('"capacity"'),
    );
    expect(serializeParticlePreset(preset, { space: 99 })).toContain(
      '\n          "appearance"',
    );
  });

  it('reports invalid top-level and burst fields with actionable paths', () => {
    const result = validateParticlePreset({
      appearance: null,
      capacity: 0,
      emission: { count: 0, mode: 'burst' },
      extensions: [],
      id: '',
      kind: 'effect',
      lifespan: { max: 0, min: 0 },
      motion: null,
      name: '',
      schemaVersion: 2,
      seed: -1,
      space: 'screen',
      spawn: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.map(({ path }) => path)).toEqual(
        expect.arrayContaining([
          '$.kind',
          '$.schemaVersion',
          '$.capacity',
          '$.emission.count',
          '$.lifespan.min',
          '$.appearance',
          '$.extensions',
        ]),
      );
    }
  });

  it('validates continuous emission and spawn constraints', async () => {
    const base = parseParticlePreset(await fixture());
    const invalid = [
      { ...base, emission: { mode: 'continuous', rate: 0 } },
      {
        ...base,
        emission: { duration: -1, mode: 'continuous', rate: 1 },
      },
      { ...base, emission: { mode: 'unknown' } },
      { ...base, spawn: { height: -1, shape: 'rectangle', width: -1 } },
      {
        ...base,
        spawn: { innerRadius: 3, radius: 2, shape: 'circle' },
      },
      { ...base, spawn: { shape: 'triangle' } },
    ];
    for (const value of invalid) {
      expect(validateParticlePreset(value).success).toBe(false);
    }
  });

  it('validates appearance curves, colors, frames, and rotation', async () => {
    const base = parseParticlePreset(await fixture());
    const result = validateParticlePreset({
      ...base,
      appearance: {
        alpha: {
          interpolation: 'spline',
          stops: [{ time: 0.5, value: 2 }, { time: 0.4, value: -1 }, null],
        },
        colors: [
          { color: -1, time: 0.5 },
          { color: 0x1_0000_0000, time: 0.4 },
          null,
        ],
        rotation: { initial: null, velocity: { max: -1, min: 1 } },
        scale: { stops: [] },
        texture: {
          assetId: '',
          frames: ['spark', 'spark', ''],
          selection: 'weighted',
        },
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.map(({ path }) => path)).toEqual(
        expect.arrayContaining([
          '$.appearance.alpha.interpolation',
          '$.appearance.alpha.stops[1].time',
          '$.appearance.alpha.stops[2]',
          '$.appearance.colors[1].color',
          '$.appearance.colors[2]',
          '$.appearance.rotation.initial',
          '$.appearance.scale.stops',
          '$.appearance.texture.frames[1]',
        ]),
      );
    }
  });

  it('validates velocity, acceleration, drag, and range ordering', async () => {
    const base = parseParticlePreset(await fixture());
    const result = validateParticlePreset({
      ...base,
      motion: {
        acceleration: null,
        drag: {
          x: { max: 1, min: -1 },
          y: { max: Number.POSITIVE_INFINITY, min: 0 },
        },
        velocity: { x: null, y: { max: -1, min: 1 } },
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.map(({ path }) => path)).toEqual(
        expect.arrayContaining([
          '$.motion.acceleration',
          '$.motion.drag.x.min',
          '$.motion.drag.y.max',
          '$.motion.velocity.x',
          '$.motion.velocity.y.max',
        ]),
      );
    }
  });

  it('rejects cyclic or non-JSON extensions', async () => {
    const base = parseParticlePreset(await fixture());
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(
      validateParticlePreset({
        ...base,
        extensions: { cyclic, missing: undefined },
      }).success,
    ).toBe(false);
  });

  it('handles non-objects, missing versions, and structured parse errors', async () => {
    expect(validateParticlePreset(null)).toMatchObject({ success: false });
    const base = (await fixture()) as Record<string, unknown>;
    delete base.kind;
    delete base.schemaVersion;
    const missing = validateParticlePreset(base);
    expect(missing).toMatchObject({ success: false });
    if (!missing.success) {
      expect(missing.issues[0]).toMatchObject({
        code: 'missing_value',
        path: '$.kind',
      });
    }

    let caught: unknown;
    try {
      parseParticlePreset({ kind: 'particle-preset', schemaVersion: 1 });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ParticlePresetValidationError);
    expect(isParticlePresetValidationError(caught)).toBe(true);
    expect(isParticlePresetValidationError(new Error('different'))).toBe(false);
  });
});
