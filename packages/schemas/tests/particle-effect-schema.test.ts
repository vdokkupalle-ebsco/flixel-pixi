import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import {
  isParticleEffectValidationError,
  MAX_PARTICLE_EFFECT_EMITTERS,
  parseParticleEffect,
  serializeParticleEffect,
  validateParticleEffect,
  type ParticleEffectDocumentV1,
  type ParticlePresetV1,
} from '../src/index.js';

async function preset(): Promise<ParticlePresetV1> {
  return JSON.parse(
    await readFile(
      new URL('fixtures/particle-preset-v1.json', import.meta.url),
      'utf8',
    ),
  ) as ParticlePresetV1;
}

async function effect(): Promise<ParticleEffectDocumentV1> {
  const particlePreset = await preset();
  return {
    emitters: [
      {
        enabled: true,
        layerId: 'sparks',
        name: 'Sparks',
        offset: { x: 4, y: -8 },
        preset: particlePreset,
        textureShape: 'circle',
      },
      {
        enabled: false,
        layerId: 'smoke',
        name: 'Smoke',
        offset: { x: 0, y: -12 },
        preset: { ...particlePreset, id: 'smoke' },
        textureShape: 'square',
      },
    ],
    id: 'impact',
    kind: 'flixel-pixi-particle-effect',
    name: 'Impact',
    version: 1,
  };
}

describe('particle effect schema', () => {
  it('round-trips an ordered multi-emitter document deterministically', async () => {
    const document = await effect();
    const serialized = serializeParticleEffect(document);

    expect(parseParticleEffect(JSON.parse(serialized) as unknown)).toEqual(
      document,
    );
    expect(serializeParticleEffect(document)).toBe(serialized);
    expect(serialized.endsWith('\n')).toBe(true);
  });

  it('reports duplicate layers, invalid offsets, and nested preset paths', async () => {
    const document = await effect();
    const result = validateParticleEffect({
      ...document,
      emitters: [
        document.emitters[0],
        {
          ...document.emitters[1],
          layerId: 'sparks',
          offset: { x: Number.NaN, y: 0 },
          preset: { kind: 'invalid' },
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.map(({ path }) => path)).toEqual(
        expect.arrayContaining([
          '$.emitters[1].layerId',
          '$.emitters[1].offset.x',
          '$.emitters[1].preset.kind',
        ]),
      );
    }
  });

  it('throws a structured parse error for unsupported documents', () => {
    try {
      parseParticleEffect({ kind: 'particle-preset', version: 2 });
      throw new Error('Expected parsing to fail.');
    } catch (error) {
      expect(isParticleEffectValidationError(error)).toBe(true);
      if (isParticleEffectValidationError(error)) {
        expect(error.issues.map(({ path }) => path)).toContain('$.kind');
      }
    }
  });

  it('reports malformed documents and emitter fields precisely', async () => {
    expect(validateParticleEffect(null)).toEqual({
      issues: [
        { code: 'invalid_type', message: 'Expected an object.', path: '$' },
      ],
      success: false,
    });

    const invalidRoot = validateParticleEffect({
      emitters: 'invalid',
      id: '',
      kind: 'particle-preset',
      name: '   ',
      version: 2,
    });
    expect(invalidRoot.success).toBe(false);
    if (!invalidRoot.success) {
      expect(invalidRoot.issues.map(({ path }) => path)).toEqual([
        '$.kind',
        '$.version',
        '$.id',
        '$.name',
        '$.emitters',
      ]);
    }

    const document = await effect();
    const particlePreset = await preset();
    const invalidEmitters = validateParticleEffect({
      ...document,
      emitters: [
        null,
        {
          enabled: 'yes',
          layerId: '',
          name: '',
          offset: null,
          preset: { kind: 'invalid' },
          textureShape: 'triangle',
        },
        {
          enabled: true,
          layerId: 'invalid-offset',
          name: 'Invalid offset',
          offset: { x: Number.POSITIVE_INFINITY, y: Number.NaN },
          preset: particlePreset,
          textureShape: 'circle',
        },
        ...Array.from(
          { length: MAX_PARTICLE_EFFECT_EMITTERS - 2 },
          (_, index) => `invalid-${String(index)}`,
        ),
      ],
    });

    expect(invalidEmitters.success).toBe(false);
    if (!invalidEmitters.success) {
      expect(invalidEmitters.issues.map(({ path }) => path)).toEqual(
        expect.arrayContaining([
          '$.emitters',
          '$.emitters[0]',
          '$.emitters[1].layerId',
          '$.emitters[1].name',
          '$.emitters[1].enabled',
          '$.emitters[1].offset',
          '$.emitters[1].textureShape',
          '$.emitters[1].preset.kind',
          '$.emitters[2].offset.x',
          '$.emitters[2].offset.y',
        ]),
      );
    }

    const empty = validateParticleEffect({ ...document, emitters: [] });
    expect(empty.success).toBe(false);
    if (!empty.success) {
      expect(empty.issues.map(({ path }) => path)).toContain('$.emitters');
    }
  });
});
