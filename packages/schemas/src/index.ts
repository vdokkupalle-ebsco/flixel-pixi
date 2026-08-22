export {
  isProjectValidationError,
  LATEST_PROJECT_SCHEMA_VERSION,
  migrateProjectDocument,
} from './migrations.js';
export {
  serializeProjectDocument,
  type SerializeProjectOptions,
} from './serialization.js';
export type {
  AssetDefinition,
  AssetKind,
  EntityDefinition,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  LegacyProjectDocumentV0,
  ProjectDocument,
  ProjectDocumentV1,
  ProjectMetadata,
  SceneDefinition,
  ValidationIssue,
  ValidationIssueCode,
  ValidationResult,
  Vector2Definition,
} from './types.js';
export {
  parseProjectDocument,
  ProjectValidationError,
  validateProjectDocument,
} from './validation.js';
