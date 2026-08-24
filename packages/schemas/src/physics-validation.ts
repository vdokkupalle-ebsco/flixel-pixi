import type {
  PhysicsBodyDocumentV1,
  PhysicsBodyValidationResult,
  PhysicsWorldDocumentV1,
  PhysicsWorldValidationResult,
} from './physics-types.js';
import type { JsonValue, ValidationIssue } from './types.js';

type RecordValue = Record<string, unknown>;

/** Structured error thrown while parsing a physics document. @public */
export class PhysicsValidationError extends Error {
  constructor(readonly issues: ValidationIssue[]) {
    super(issues.map(({ path, message }) => `${path}: ${message}`).join('\n'));
    this.name = 'PhysicsValidationError';
  }
}

/** Validate an unknown value as a version 1 physics body. @public */
export function validatePhysicsBody(
  value: unknown,
): PhysicsBodyValidationResult {
  const issues: ValidationIssue[] = [];
  validateBody(value, '$', issues);
  return issues.length > 0
    ? { issues, success: false }
    : { data: clone(value) as PhysicsBodyDocumentV1, success: true };
}

/** Parse or throw for a version 1 physics body. @public */
export function parsePhysicsBody(value: unknown): PhysicsBodyDocumentV1 {
  const result = validatePhysicsBody(value);
  if (!result.success) throw new PhysicsValidationError(result.issues);
  return result.data;
}

/** Validate an unknown value as a version 1 physics world. @public */
export function validatePhysicsWorld(
  value: unknown,
): PhysicsWorldValidationResult {
  if (!isRecord(value)) return invalidRoot();
  const issues: ValidationIssue[] = [];
  literal(value.kind, 'flixel-pixi-physics-world', '$.kind', issues);
  version(value.schemaVersion, '$.schemaVersion', issues);
  string(value.id, '$.id', issues);
  vector(value.gravity, '$.gravity', issues);
  jsonObject(value.extensions, '$.extensions', issues);
  if (!Array.isArray(value.bodies)) {
    add(issues, '$.bodies', 'invalid_type', 'Expected an array.');
  } else {
    const bodyIds = new Set<string>();
    const entityIds = new Set<string>();
    value.bodies.forEach((body, index) => {
      const path = `$.bodies[${String(index)}]`;
      validateBody(body, path, issues);
      if (!isRecord(body)) return;
      duplicate(body.id, `${path}.id`, 'body', bodyIds, issues);
      duplicate(body.entityId, `${path}.entityId`, 'entity', entityIds, issues);
    });
  }
  return issues.length > 0
    ? { issues, success: false }
    : { data: clone(value) as PhysicsWorldDocumentV1, success: true };
}

/** Parse or throw for a version 1 physics world. @public */
export function parsePhysicsWorld(value: unknown): PhysicsWorldDocumentV1 {
  const result = validatePhysicsWorld(value);
  if (!result.success) throw new PhysicsValidationError(result.issues);
  return result.data;
}

/** Identify structured physics parse errors. @public */
export function isPhysicsValidationError(
  value: unknown,
): value is PhysicsValidationError {
  return value instanceof PhysicsValidationError;
}

function validateBody(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!isRecord(value)) {
    add(issues, path, 'invalid_type', 'Expected an object.');
    return;
  }
  literal(value.kind, 'flixel-pixi-physics-body', `${path}.kind`, issues);
  version(value.schemaVersion, `${path}.schemaVersion`, issues);
  string(value.id, `${path}.id`, issues);
  string(value.entityId, `${path}.entityId`, issues);
  if (!['dynamic', 'kinematic', 'static'].includes(String(value.type))) {
    add(
      issues,
      `${path}.type`,
      'invalid_value',
      'Expected static, kinematic, or dynamic.',
    );
  }
  jsonObject(value.extensions, `${path}.extensions`, issues);
  filter(value.filter, `${path}.filter`, issues);
  material(value.material, `${path}.material`, issues);
  optionalFinite(value.gravityScale, `${path}.gravityScale`, issues);
  optionalBoolean(value.fixedRotation, `${path}.fixedRotation`, issues);
  optionalBoolean(
    value.continuousCollision,
    `${path}.continuousCollision`,
    issues,
  );
  optionalBoolean(value.allowSleep, `${path}.allowSleep`, issues);
  if (!Array.isArray(value.shapes)) {
    add(issues, `${path}.shapes`, 'invalid_type', 'Expected an array.');
  } else if (value.shapes.length === 0) {
    add(
      issues,
      `${path}.shapes`,
      'missing_value',
      'Expected at least one shape.',
    );
  } else {
    const fixtureIds = new Set<string>();
    value.shapes.forEach((shape, index) => {
      const shapePath = `${path}.shapes[${String(index)}]`;
      validateShape(shape, shapePath, issues, false);
      if (isRecord(shape) && shape.id !== undefined) {
        duplicate(shape.id, `${shapePath}.id`, 'fixture', fixtureIds, issues);
      }
    });
  }
}

function validateShape(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  primitiveOnly: boolean,
): void {
  if (!isRecord(value)) {
    add(issues, path, 'invalid_type', 'Expected an object.');
    return;
  }
  if (value.id !== undefined) string(value.id, `${path}.id`, issues);
  vectorOptional(value.offset, `${path}.offset`, issues);
  optionalFinite(value.angle, `${path}.angle`, issues);
  optionalBoolean(value.sensor, `${path}.sensor`, issues);
  filter(value.filter, `${path}.filter`, issues);
  material(value.material, `${path}.material`, issues);
  if (value.kind === 'box') {
    positive(value.width, `${path}.width`, issues);
    positive(value.height, `${path}.height`, issues);
  } else if (value.kind === 'circle') {
    positive(value.radius, `${path}.radius`, issues);
  } else if (value.kind === 'capsule') {
    positive(value.radius, `${path}.radius`, issues);
    positive(value.length, `${path}.length`, issues);
    if (value.axis !== undefined && value.axis !== 'x' && value.axis !== 'y') {
      add(issues, `${path}.axis`, 'invalid_value', 'Expected x or y.');
    }
  } else if (value.kind === 'polygon') {
    if (!Array.isArray(value.vertices) || value.vertices.length < 3) {
      add(
        issues,
        `${path}.vertices`,
        'invalid_value',
        'Expected at least 3 vertices.',
      );
    } else {
      value.vertices.forEach((point, index) =>
        vector(point, `${path}.vertices[${String(index)}]`, issues),
      );
    }
  } else if (value.kind === 'compound' && !primitiveOnly) {
    if (!Array.isArray(value.shapes) || value.shapes.length === 0) {
      add(
        issues,
        `${path}.shapes`,
        'missing_value',
        'Expected at least one child shape.',
      );
    } else {
      value.shapes.forEach((shape, index) =>
        validateShape(shape, `${path}.shapes[${String(index)}]`, issues, true),
      );
    }
  } else {
    add(
      issues,
      `${path}.kind`,
      'invalid_value',
      'Expected box, circle, capsule, polygon, or compound.',
    );
  }
}

function filter(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    add(issues, path, 'invalid_type', 'Expected an object.');
    return;
  }
  for (const key of ['category', 'mask', 'group'] as const) {
    const candidate = value[key];
    if (candidate !== undefined && !Number.isSafeInteger(candidate)) {
      add(issues, `${path}.${key}`, 'invalid_value', 'Expected an integer.');
    }
  }
}

function material(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    add(issues, path, 'invalid_type', 'Expected an object.');
    return;
  }
  nonNegative(value.density, `${path}.density`, issues);
  nonNegative(value.friction, `${path}.friction`, issues);
  if (
    value.restitution !== undefined &&
    (!finite(value.restitution) ||
      value.restitution < 0 ||
      value.restitution > 1)
  ) {
    add(
      issues,
      `${path}.restitution`,
      'invalid_value',
      'Expected a number from 0 to 1.',
    );
  }
}

function vector(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isRecord(value)) {
    add(issues, path, 'invalid_type', 'Expected an object.');
    return;
  }
  requiredFinite(value.x, `${path}.x`, issues);
  requiredFinite(value.y, `${path}.y`, issues);
}

function vectorOptional(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (value !== undefined) vector(value, path, issues);
}

function positive(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!finite(value) || value <= 0)
    add(issues, path, 'invalid_value', 'Expected a positive finite number.');
}

function nonNegative(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (value !== undefined && (!finite(value) || value < 0)) {
    add(
      issues,
      path,
      'invalid_value',
      'Expected a non-negative finite number.',
    );
  }
}

function requiredFinite(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!finite(value))
    add(issues, path, 'invalid_value', 'Expected a finite number.');
}

function optionalFinite(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (value !== undefined) requiredFinite(value, path, issues);
}

function optionalBoolean(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (value !== undefined && typeof value !== 'boolean') {
    add(issues, path, 'invalid_type', 'Expected a boolean.');
  }
}

function string(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    add(issues, path, 'invalid_value', 'Expected a non-empty string.');
  }
}

function literal(
  value: unknown,
  expected: string,
  path: string,
  issues: ValidationIssue[],
): void {
  if (value !== expected)
    add(issues, path, 'invalid_value', `Expected "${expected}".`);
}

function version(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (value !== 1)
    add(
      issues,
      path,
      'unsupported_version',
      'Only schema version 1 is supported.',
    );
}

function duplicate(
  value: unknown,
  path: string,
  label: string,
  ids: Set<string>,
  issues: ValidationIssue[],
): void {
  if (typeof value !== 'string' || value.trim().length === 0) return;
  if (ids.has(value))
    add(issues, path, 'duplicate_id', `Duplicate ${label} id: "${value}".`);
  ids.add(value);
}

function jsonObject(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (value !== undefined && (!isRecord(value) || !isJson(value))) {
    add(issues, path, 'invalid_value', 'Expected a JSON object.');
  }
}

function isJson(value: unknown): value is JsonValue {
  if (value === null || typeof value === 'boolean' || typeof value === 'string')
    return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJson);
  return isRecord(value) && Object.values(value).every(isJson);
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clone(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown;
}

function add(
  issues: ValidationIssue[],
  path: string,
  code: ValidationIssue['code'],
  message: string,
): void {
  issues.push({ code, message, path });
}

function invalidRoot(): PhysicsWorldValidationResult {
  return {
    issues: [
      { code: 'invalid_type', message: 'Expected an object.', path: '$' },
    ],
    success: false,
  };
}
