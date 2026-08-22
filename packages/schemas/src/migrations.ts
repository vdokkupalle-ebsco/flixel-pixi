import type { LegacyProjectDocumentV0, ProjectDocumentV1 } from './types.js';
import { parseProjectDocument, ProjectValidationError } from './validation.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function migrateVersion0(value: Record<string, unknown>): ProjectDocumentV1 {
  const legacy = value as unknown as LegacyProjectDocumentV0;
  return parseProjectDocument({
    assets: legacy.assets ?? [],
    ...(legacy.extensions === undefined
      ? {}
      : { extensions: legacy.extensions }),
    project: {
      id: legacy.id,
      name: legacy.name,
    },
    scenes: legacy.scenes ?? [],
    schemaVersion: 1,
  });
}

export const LATEST_PROJECT_SCHEMA_VERSION = 1 as const;

export function migrateProjectDocument(value: unknown): ProjectDocumentV1 {
  if (!isRecord(value)) return parseProjectDocument(value);
  if (value.schemaVersion === 0) return migrateVersion0(value);
  return parseProjectDocument(value);
}

export function isProjectValidationError(
  error: unknown,
): error is ProjectValidationError {
  return error instanceof ProjectValidationError;
}
