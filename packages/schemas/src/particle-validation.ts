import type {
  ParticleAppearanceDefinition,
  ParticleCurve,
  ParticleMotionDefinition,
  ParticleNumberRange,
  ParticlePresetV1,
  ParticlePresetValidationResult,
  ParticleTextureDefinition,
  ParticleVectorRange,
} from './particle-types.js';
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

function requireRecord(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): Record<string, unknown> | undefined {
  if (isRecord(value)) return value;
  issue(issues, path, 'invalid_type', 'Expected an object.');
  return undefined;
}

function requireString(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is string {
  if (typeof value === 'string' && value.trim().length > 0) return true;
  issue(issues, path, 'invalid_value', 'Expected a non-empty string.');
  return false;
}

function requireFinite(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is number {
  if (typeof value === 'number' && Number.isFinite(value)) return true;
  issue(issues, path, 'invalid_value', 'Expected a finite number.');
  return false;
}

function requireNonNegative(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is number {
  if (requireFinite(value, path, issues) && value >= 0) return true;
  if (typeof value === 'number' && Number.isFinite(value)) {
    issue(issues, path, 'invalid_value', 'Expected a non-negative number.');
  }
  return false;
}

function requirePositive(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is number {
  if (requireFinite(value, path, issues) && value > 0) return true;
  if (typeof value === 'number' && Number.isFinite(value)) {
    issue(
      issues,
      path,
      'invalid_value',
      'Expected a number greater than zero.',
    );
  }
  return false;
}

function requirePositiveInteger(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is number {
  if (Number.isSafeInteger(value) && (value as number) > 0) return true;
  issue(issues, path, 'invalid_value', 'Expected a positive safe integer.');
  return false;
}

function validateRange(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  minimum = Number.NEGATIVE_INFINITY,
  minimumExclusive = false,
): value is ParticleNumberRange {
  const range = requireRecord(value, path, issues);
  if (!range) return false;
  const min = range.min;
  const max = range.max;
  const minValid = requireFinite(min, `${path}.min`, issues);
  const maxValid = requireFinite(max, `${path}.max`, issues);
  if (!minValid || !maxValid) return false;
  let valid = true;
  if (min < minimum || (minimumExclusive && min === minimum)) {
    issue(
      issues,
      `${path}.min`,
      'invalid_value',
      minimumExclusive
        ? `Expected a value greater than ${minimum}.`
        : `Expected a value of at least ${minimum}.`,
    );
    valid = false;
  }
  if (max < min) {
    issue(
      issues,
      `${path}.max`,
      'invalid_value',
      'Expected max to be greater than or equal to min.',
    );
    valid = false;
  }
  return valid;
}

function validateVectorRange(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  minimum = Number.NEGATIVE_INFINITY,
): value is ParticleVectorRange {
  const vector = requireRecord(value, path, issues);
  if (!vector) return false;
  const xValid = validateRange(vector.x, `${path}.x`, issues, minimum);
  const yValid = validateRange(vector.y, `${path}.y`, issues, minimum);
  return xValid && yValid;
}

function validateCurve(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  valueMinimum = Number.NEGATIVE_INFINITY,
  valueMaximum = Number.POSITIVE_INFINITY,
): value is ParticleCurve {
  const curve = requireRecord(value, path, issues);
  if (!curve) return false;
  let valid = true;
  if (
    curve.interpolation !== undefined &&
    curve.interpolation !== 'linear' &&
    curve.interpolation !== 'step'
  ) {
    issue(
      issues,
      `${path}.interpolation`,
      'invalid_value',
      'Expected linear or step.',
    );
    valid = false;
  }
  if (!Array.isArray(curve.stops) || curve.stops.length === 0) {
    issue(
      issues,
      `${path}.stops`,
      'invalid_value',
      'Expected at least one curve stop.',
    );
    return false;
  }
  let previousTime = -1;
  curve.stops.forEach((entry, index) => {
    const stopPath = `${path}.stops[${index}]`;
    const stop = requireRecord(entry, stopPath, issues);
    if (!stop) {
      valid = false;
      return;
    }
    const time = stop.time;
    const stopValue = stop.value;
    const timeValid = requireFinite(time, `${stopPath}.time`, issues);
    const valueValid = requireFinite(stopValue, `${stopPath}.value`, issues);
    if (timeValid) {
      if (time < 0 || time > 1 || time <= previousTime) {
        issue(
          issues,
          `${stopPath}.time`,
          'invalid_value',
          'Expected strictly increasing time values between 0 and 1.',
        );
        valid = false;
      }
      previousTime = time;
    }
    if (valueValid && (stopValue < valueMinimum || stopValue > valueMaximum)) {
      issue(
        issues,
        `${stopPath}.value`,
        'invalid_value',
        `Expected a value between ${valueMinimum} and ${valueMaximum}.`,
      );
      valid = false;
    }
  });
  return valid;
}

function validateTexture(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is ParticleTextureDefinition {
  const texture = requireRecord(value, path, issues);
  if (!texture) return false;
  let valid = requireString(texture.assetId, `${path}.assetId`, issues);
  if (
    texture.selection !== undefined &&
    texture.selection !== 'random' &&
    texture.selection !== 'sequence'
  ) {
    issue(
      issues,
      `${path}.selection`,
      'invalid_value',
      'Expected random or sequence.',
    );
    valid = false;
  }
  if (texture.frames !== undefined) {
    if (!Array.isArray(texture.frames) || texture.frames.length === 0) {
      issue(
        issues,
        `${path}.frames`,
        'invalid_value',
        'Expected at least one frame name.',
      );
      valid = false;
    } else {
      const frames = new Set<string>();
      texture.frames.forEach((frame, index) => {
        if (!requireString(frame, `${path}.frames[${index}]`, issues)) {
          valid = false;
        } else if (frames.has(frame)) {
          issue(
            issues,
            `${path}.frames[${index}]`,
            'duplicate_id',
            `Duplicate frame name: ${frame}.`,
          );
          valid = false;
        }
        if (typeof frame === 'string') frames.add(frame);
      });
    }
  }
  return valid;
}

function validateAppearance(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is ParticleAppearanceDefinition {
  const appearance = requireRecord(value, path, issues);
  if (!appearance) return false;
  let valid = validateTexture(appearance.texture, `${path}.texture`, issues);
  if (appearance.alpha !== undefined) {
    valid =
      validateCurve(appearance.alpha, `${path}.alpha`, issues, 0, 1) && valid;
  }
  if (appearance.scale !== undefined) {
    valid =
      validateCurve(appearance.scale, `${path}.scale`, issues, 0) && valid;
  }
  if (appearance.rotation !== undefined) {
    const rotation = requireRecord(
      appearance.rotation,
      `${path}.rotation`,
      issues,
    );
    valid = rotation !== undefined && valid;
    if (rotation) {
      valid =
        validateRange(rotation.initial, `${path}.rotation.initial`, issues) &&
        valid;
      valid =
        validateRange(rotation.velocity, `${path}.rotation.velocity`, issues) &&
        valid;
    }
  }
  if (appearance.colors !== undefined) {
    if (!Array.isArray(appearance.colors) || appearance.colors.length === 0) {
      issue(
        issues,
        `${path}.colors`,
        'invalid_value',
        'Expected at least one color stop.',
      );
      valid = false;
    } else {
      let previousTime = -1;
      appearance.colors.forEach((entry, index) => {
        const stopPath = `${path}.colors[${index}]`;
        const stop = requireRecord(entry, stopPath, issues);
        if (!stop) {
          valid = false;
          return;
        }
        if (
          !Number.isSafeInteger(stop.color) ||
          (stop.color as number) < 0 ||
          (stop.color as number) > 0xffff_ffff
        ) {
          issue(
            issues,
            `${stopPath}.color`,
            'invalid_value',
            'Expected an unsigned 32-bit RGBA value.',
          );
          valid = false;
        }
        const time = stop.time;
        if (requireFinite(time, `${stopPath}.time`, issues)) {
          if (time < 0 || time > 1 || time <= previousTime) {
            issue(
              issues,
              `${stopPath}.time`,
              'invalid_value',
              'Expected strictly increasing time values between 0 and 1.',
            );
            valid = false;
          }
          previousTime = time;
        } else {
          valid = false;
        }
      });
    }
  }
  return valid;
}

function validateMotion(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is ParticleMotionDefinition {
  const motion = requireRecord(value, path, issues);
  if (!motion) return false;
  let valid = validateVectorRange(motion.velocity, `${path}.velocity`, issues);
  if (motion.acceleration !== undefined) {
    valid =
      validateVectorRange(
        motion.acceleration,
        `${path}.acceleration`,
        issues,
      ) && valid;
  }
  if (motion.drag !== undefined) {
    valid =
      validateVectorRange(motion.drag, `${path}.drag`, issues, 0) && valid;
  }
  return valid;
}

function validateJson(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  ancestors = new Set<object>(),
): boolean {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string' ||
    (typeof value === 'number' && Number.isFinite(value))
  )
    return true;
  if (typeof value !== 'object' || value === null) {
    issue(issues, path, 'invalid_type', 'Expected JSON-compatible data.');
    return false;
  }
  if (ancestors.has(value)) {
    issue(issues, path, 'invalid_value', 'JSON data cannot contain a cycle.');
    return false;
  }
  ancestors.add(value);
  let valid = true;
  const entries = Array.isArray(value)
    ? value.entries()
    : Object.entries(value);
  for (const [key, item] of entries) {
    valid =
      validateJson(
        item,
        Array.isArray(value) ? `${path}[${key}]` : `${path}.${key}`,
        issues,
        ancestors,
      ) && valid;
  }
  ancestors.delete(value);
  return valid;
}

/** Error thrown when a particle preset cannot be parsed. @public */
export class ParticlePresetValidationError extends Error {
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super(
      `Particle preset is invalid (${issues.length} issue${issues.length === 1 ? '' : 's'}).`,
    );
    this.name = 'ParticlePresetValidationError';
    this.issues = issues;
  }
}

/** Validate an unknown value as a version 1 particle preset. @public */
export function validateParticlePreset(
  value: unknown,
): ParticlePresetValidationResult {
  const issues: ValidationIssue[] = [];
  const preset = requireRecord(value, '$', issues);
  if (!preset) return { issues, success: false };
  if (preset.kind !== 'particle-preset') {
    issue(
      issues,
      '$.kind',
      preset.kind === undefined ? 'missing_value' : 'invalid_value',
      'Expected particle-preset.',
    );
  }
  if (preset.schemaVersion !== 1) {
    issue(
      issues,
      '$.schemaVersion',
      preset.schemaVersion === undefined
        ? 'missing_value'
        : 'unsupported_version',
      'Expected particle preset version 1.',
    );
  }
  requireString(preset.id, '$.id', issues);
  requireString(preset.name, '$.name', issues);
  requirePositiveInteger(preset.capacity, '$.capacity', issues);
  if (
    !Number.isSafeInteger(preset.seed) ||
    (preset.seed as number) < 0 ||
    (preset.seed as number) > 0xffff_ffff
  ) {
    issue(
      issues,
      '$.seed',
      'invalid_value',
      'Expected an unsigned 32-bit integer.',
    );
  }
  if (preset.space !== 'local' && preset.space !== 'world') {
    issue(issues, '$.space', 'invalid_value', 'Expected local or world.');
  }
  validateRange(preset.lifespan, '$.lifespan', issues, 0, true);

  const emission = requireRecord(preset.emission, '$.emission', issues);
  if (emission) {
    if (emission.mode === 'burst') {
      requirePositiveInteger(emission.count, '$.emission.count', issues);
    } else if (emission.mode === 'continuous') {
      requirePositive(emission.rate, '$.emission.rate', issues);
      if (emission.duration !== undefined)
        requireNonNegative(emission.duration, '$.emission.duration', issues);
    } else {
      issue(
        issues,
        '$.emission.mode',
        'invalid_value',
        'Expected burst or continuous.',
      );
    }
  }

  const spawn = requireRecord(preset.spawn, '$.spawn', issues);
  if (spawn) {
    if (spawn.shape === 'rectangle') {
      requireNonNegative(spawn.width, '$.spawn.width', issues);
      requireNonNegative(spawn.height, '$.spawn.height', issues);
    } else if (spawn.shape === 'circle') {
      const radiusValid = requireNonNegative(
        spawn.radius,
        '$.spawn.radius',
        issues,
      );
      if (
        spawn.innerRadius !== undefined &&
        requireNonNegative(spawn.innerRadius, '$.spawn.innerRadius', issues) &&
        radiusValid &&
        spawn.innerRadius > (spawn.radius as number)
      ) {
        issue(
          issues,
          '$.spawn.innerRadius',
          'invalid_value',
          'Expected innerRadius to be no greater than radius.',
        );
      }
    } else if (spawn.shape !== 'point') {
      issue(
        issues,
        '$.spawn.shape',
        'invalid_value',
        'Expected point, rectangle, or circle.',
      );
    }
  }

  validateMotion(preset.motion, '$.motion', issues);
  validateAppearance(preset.appearance, '$.appearance', issues);
  if (preset.extensions !== undefined) {
    if (!isRecord(preset.extensions)) {
      issue(issues, '$.extensions', 'invalid_type', 'Expected a JSON object.');
    } else {
      validateJson(preset.extensions, '$.extensions', issues);
    }
  }
  return issues.length === 0
    ? { data: value as ParticlePresetV1, success: true }
    : { issues, success: false };
}

/** Parse an unknown value or throw a {@link ParticlePresetValidationError}. @public */
export function parseParticlePreset(value: unknown): ParticlePresetV1 {
  const result = validateParticlePreset(value);
  if (!result.success) throw new ParticlePresetValidationError(result.issues);
  return result.data;
}

/** Return whether an error came from particle preset parsing. @public */
export function isParticlePresetValidationError(
  error: unknown,
): error is ParticlePresetValidationError {
  return error instanceof ParticlePresetValidationError;
}
