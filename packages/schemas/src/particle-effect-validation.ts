import {
  MAX_PARTICLE_EFFECT_EMITTERS,
  type ParticleEffectDocumentV1,
  type ParticleEffectValidationResult,
  type ParticleEmitterLayerV1,
} from './particle-effect-types.js';
import { validateParticlePreset } from './particle-validation.js';
import type { ValidationIssue, ValidationIssueCode } from './types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function issue(
  issues: ValidationIssue[],
  path: string,
  code: ValidationIssueCode,
  message: string,
): void {
  issues.push({ code, message, path });
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Validate an exported particle effect and report every actionable path. @public */
export function validateParticleEffect(
  value: unknown,
): ParticleEffectValidationResult {
  if (!isRecord(value)) {
    return {
      issues: [
        { code: 'invalid_type', message: 'Expected an object.', path: '$' },
      ],
      success: false,
    };
  }

  const issues: ValidationIssue[] = [];
  if (value.kind !== 'flixel-pixi-particle-effect') {
    issue(
      issues,
      '$.kind',
      'invalid_value',
      'Expected "flixel-pixi-particle-effect".',
    );
  }
  if (value.version !== 1) {
    issue(
      issues,
      '$.version',
      'unsupported_version',
      'Only particle effect version 1 is supported.',
    );
  }
  if (!nonEmptyString(value.id)) {
    issue(issues, '$.id', 'invalid_value', 'Expected a non-empty string.');
  }
  if (!nonEmptyString(value.name)) {
    issue(issues, '$.name', 'invalid_value', 'Expected a non-empty string.');
  }
  if (!Array.isArray(value.emitters)) {
    issue(issues, '$.emitters', 'invalid_type', 'Expected an array.');
    return { issues, success: false };
  }
  if (value.emitters.length === 0) {
    issue(
      issues,
      '$.emitters',
      'missing_value',
      'A particle effect must contain at least one emitter.',
    );
  }
  if (value.emitters.length > MAX_PARTICLE_EFFECT_EMITTERS) {
    issue(
      issues,
      '$.emitters',
      'invalid_value',
      `A particle effect cannot exceed ${String(MAX_PARTICLE_EFFECT_EMITTERS)} emitters.`,
    );
  }

  const layerIds = new Set<string>();
  const emitters: ParticleEmitterLayerV1[] = [];
  value.emitters.forEach((candidate, index) => {
    const path = `$.emitters[${String(index)}]`;
    if (!isRecord(candidate)) {
      issue(issues, path, 'invalid_type', 'Expected an object.');
      return;
    }

    let valid = true;
    if (!nonEmptyString(candidate.layerId)) {
      issue(
        issues,
        `${path}.layerId`,
        'invalid_value',
        'Expected a non-empty string.',
      );
      valid = false;
    } else if (layerIds.has(candidate.layerId)) {
      issue(
        issues,
        `${path}.layerId`,
        'duplicate_id',
        `Duplicate emitter layerId: "${candidate.layerId}".`,
      );
      valid = false;
    } else {
      layerIds.add(candidate.layerId);
    }
    if (!nonEmptyString(candidate.name)) {
      issue(
        issues,
        `${path}.name`,
        'invalid_value',
        'Expected a non-empty string.',
      );
      valid = false;
    }
    if (typeof candidate.enabled !== 'boolean') {
      issue(issues, `${path}.enabled`, 'invalid_type', 'Expected a boolean.');
      valid = false;
    }
    if (!isRecord(candidate.offset)) {
      issue(issues, `${path}.offset`, 'invalid_type', 'Expected an object.');
      valid = false;
    } else {
      if (!finiteNumber(candidate.offset.x)) {
        issue(
          issues,
          `${path}.offset.x`,
          'invalid_value',
          'Expected a finite number.',
        );
        valid = false;
      }
      if (!finiteNumber(candidate.offset.y)) {
        issue(
          issues,
          `${path}.offset.y`,
          'invalid_value',
          'Expected a finite number.',
        );
        valid = false;
      }
    }
    if (
      candidate.textureShape !== 'circle' &&
      candidate.textureShape !== 'square'
    ) {
      issue(
        issues,
        `${path}.textureShape`,
        'invalid_value',
        'Expected "circle" or "square".',
      );
      valid = false;
    }

    const presetResult = validateParticlePreset(candidate.preset);
    if (!presetResult.success) {
      valid = false;
      for (const presetIssue of presetResult.issues) {
        issues.push({
          ...presetIssue,
          path: `${path}.preset${presetIssue.path.slice(1)}`,
        });
      }
    }

    if (
      valid &&
      nonEmptyString(candidate.layerId) &&
      nonEmptyString(candidate.name) &&
      typeof candidate.enabled === 'boolean' &&
      isRecord(candidate.offset) &&
      finiteNumber(candidate.offset.x) &&
      finiteNumber(candidate.offset.y) &&
      (candidate.textureShape === 'circle' ||
        candidate.textureShape === 'square') &&
      presetResult.success
    ) {
      emitters.push({
        enabled: candidate.enabled,
        layerId: candidate.layerId,
        name: candidate.name,
        offset: { x: candidate.offset.x, y: candidate.offset.y },
        preset: presetResult.data,
        textureShape: candidate.textureShape,
      });
    }
  });

  if (
    issues.length > 0 ||
    !nonEmptyString(value.id) ||
    !nonEmptyString(value.name)
  ) {
    return { issues, success: false };
  }
  return {
    data: {
      emitters,
      id: value.id,
      kind: 'flixel-pixi-particle-effect',
      name: value.name,
      version: 1,
    },
    success: true,
  };
}

/** Structured error thrown while parsing a particle effect document. @public */
export class ParticleEffectValidationError extends TypeError {
  constructor(readonly issues: ValidationIssue[]) {
    super(
      issues.length === 1
        ? issues[0]?.message
        : `Particle effect validation failed with ${String(issues.length)} issues.`,
    );
    this.name = 'ParticleEffectValidationError';
  }
}

/** Parse and validate a versioned particle effect document. @public */
export function parseParticleEffect(value: unknown): ParticleEffectDocumentV1 {
  const result = validateParticleEffect(value);
  if (!result.success) throw new ParticleEffectValidationError(result.issues);
  return result.data;
}

/** Narrow an unknown thrown value to a particle effect validation error. @public */
export function isParticleEffectValidationError(
  error: unknown,
): error is ParticleEffectValidationError {
  return error instanceof ParticleEffectValidationError;
}
