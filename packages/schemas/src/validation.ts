import type {
  AssetDefinition,
  EntityDefinition,
  JsonObject,
  ProjectDocumentV1,
  SceneDefinition,
  ValidationIssue,
  ValidationIssueCode,
  ValidationResult,
  Vector2Definition,
} from './types.js';

const assetKinds = new Set(['atlas', 'audio', 'data', 'image', 'tilemap']);

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

function requireArray(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): unknown[] | undefined {
  if (Array.isArray(value)) return value;
  issue(issues, path, 'invalid_type', 'Expected an array.');
  return undefined;
}

function requireNonEmptyString(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is string {
  if (typeof value === 'string' && value.trim().length > 0) return true;
  issue(issues, path, 'invalid_value', 'Expected a non-empty string.');
  return false;
}

function requireFiniteNumber(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is number {
  if (typeof value === 'number' && Number.isFinite(value)) return true;
  issue(issues, path, 'invalid_value', 'Expected a finite number.');
  return false;
}

function validateJsonValue(
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
  ) {
    return true;
  }
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
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      valid =
        validateJsonValue(item, `${path}[${index}]`, issues, ancestors) &&
        valid;
    }
  } else {
    for (const [key, item] of Object.entries(value)) {
      valid =
        validateJsonValue(item, `${path}.${key}`, issues, ancestors) && valid;
    }
  }
  ancestors.delete(value);
  return valid;
}

function validateOptionalJsonObject(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is JsonObject | undefined {
  if (value === undefined) return true;
  if (!isRecord(value)) {
    issue(issues, path, 'invalid_type', 'Expected a JSON object.');
    return false;
  }
  return validateJsonValue(value, path, issues);
}

function validateVector(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is Vector2Definition {
  const vector = requireRecord(value, path, issues);
  if (!vector) return false;
  const xValid = requireFiniteNumber(vector.x, `${path}.x`, issues);
  const yValid = requireFiniteNumber(vector.y, `${path}.y`, issues);
  return xValid && yValid;
}

function validateAsset(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is AssetDefinition {
  const asset = requireRecord(value, path, issues);
  if (!asset) return false;
  let valid = requireNonEmptyString(asset.id, `${path}.id`, issues);
  valid = requireNonEmptyString(asset.src, `${path}.src`, issues) && valid;
  if (typeof asset.kind !== 'string' || !assetKinds.has(asset.kind)) {
    issue(
      issues,
      `${path}.kind`,
      'invalid_value',
      `Expected one of: ${[...assetKinds].join(', ')}.`,
    );
    valid = false;
  }
  return (
    validateOptionalJsonObject(asset.metadata, `${path}.metadata`, issues) &&
    valid
  );
}

function validateEntity(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is EntityDefinition {
  const entity = requireRecord(value, path, issues);
  if (!entity) return false;
  let valid = requireNonEmptyString(entity.id, `${path}.id`, issues);
  valid = requireNonEmptyString(entity.type, `${path}.type`, issues) && valid;
  valid = validateVector(entity.position, `${path}.position`, issues) && valid;
  if (entity.name !== undefined) {
    valid = requireNonEmptyString(entity.name, `${path}.name`, issues) && valid;
  }
  if (entity.rotation !== undefined) {
    valid =
      requireFiniteNumber(entity.rotation, `${path}.rotation`, issues) && valid;
  }
  if (entity.scale !== undefined) {
    valid = validateVector(entity.scale, `${path}.scale`, issues) && valid;
  }
  return (
    validateOptionalJsonObject(
      entity.properties,
      `${path}.properties`,
      issues,
    ) && valid
  );
}

function validateScene(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is SceneDefinition {
  const scene = requireRecord(value, path, issues);
  if (!scene) return false;
  let valid = requireNonEmptyString(scene.id, `${path}.id`, issues);
  valid = requireNonEmptyString(scene.name, `${path}.name`, issues) && valid;
  const entities = requireArray(scene.entities, `${path}.entities`, issues);
  if (!entities) return false;

  const ids = new Set<string>();
  for (const [index, entity] of entities.entries()) {
    const entityPath = `${path}.entities[${index}]`;
    valid = validateEntity(entity, entityPath, issues) && valid;
    if (isRecord(entity) && typeof entity.id === 'string') {
      if (ids.has(entity.id)) {
        issue(
          issues,
          `${entityPath}.id`,
          'duplicate_id',
          `Duplicate entity id: ${entity.id}.`,
        );
        valid = false;
      }
      ids.add(entity.id);
    }
  }
  return valid;
}

function validateUniqueIds(
  values: unknown[],
  path: string,
  noun: string,
  issues: ValidationIssue[],
): boolean {
  const ids = new Set<string>();
  let valid = true;
  for (const [index, value] of values.entries()) {
    if (!isRecord(value) || typeof value.id !== 'string') continue;
    if (ids.has(value.id)) {
      issue(
        issues,
        `${path}[${index}].id`,
        'duplicate_id',
        `Duplicate ${noun} id: ${value.id}.`,
      );
      valid = false;
    }
    ids.add(value.id);
  }
  return valid;
}

export function validateProjectDocument(
  value: unknown,
): ValidationResult<ProjectDocumentV1> {
  const issues: ValidationIssue[] = [];
  const document = requireRecord(value, '$', issues);
  if (!document) return { issues, success: false };

  if (document.schemaVersion !== 1) {
    issue(
      issues,
      '$.schemaVersion',
      document.schemaVersion === undefined
        ? 'missing_value'
        : 'unsupported_version',
      'Expected schema version 1.',
    );
  }

  const project = requireRecord(document.project, '$.project', issues);
  if (project) {
    requireNonEmptyString(project.id, '$.project.id', issues);
    requireNonEmptyString(project.name, '$.project.name', issues);
  }

  const assets = requireArray(document.assets, '$.assets', issues);
  if (assets) {
    for (const [index, asset] of assets.entries()) {
      validateAsset(asset, `$.assets[${index}]`, issues);
    }
    validateUniqueIds(assets, '$.assets', 'asset', issues);
  }

  const scenes = requireArray(document.scenes, '$.scenes', issues);
  if (scenes) {
    for (const [index, scene] of scenes.entries()) {
      validateScene(scene, `$.scenes[${index}]`, issues);
    }
    validateUniqueIds(scenes, '$.scenes', 'scene', issues);
  }

  validateOptionalJsonObject(document.extensions, '$.extensions', issues);

  if (issues.length > 0) return { issues, success: false };
  return { data: value as ProjectDocumentV1, success: true };
}

export class ProjectValidationError extends Error {
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super(
      `Project document is invalid (${issues.length} issue${issues.length === 1 ? '' : 's'}).`,
    );
    this.name = 'ProjectValidationError';
    this.issues = issues;
  }
}

export function parseProjectDocument(value: unknown): ProjectDocumentV1 {
  const result = validateProjectDocument(value);
  if (!result.success) throw new ProjectValidationError(result.issues);
  return result.data;
}
