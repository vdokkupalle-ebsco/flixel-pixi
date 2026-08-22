export {
  isProjectValidationError,
  LATEST_PROJECT_SCHEMA_VERSION,
  migrateProjectDocument,
} from './migrations.js';
export {
  serializeProjectDocument,
  type SerializeProjectOptions,
} from './serialization.js';
export {
  serializeParticlePreset,
  type SerializeParticlePresetOptions,
} from './particle-serialization.js';
export type {
  ParticleAppearanceDefinition,
  ParticleBlendMode,
  ParticleColorStop,
  ParticleCurve,
  ParticleCurveInterpolation,
  ParticleCurveStop,
  ParticleEmissionDefinition,
  ParticleFrameSelection,
  ParticleMotionDefinition,
  ParticleNumberRange,
  ParticlePreset,
  ParticlePresetV1,
  ParticlePresetValidationResult,
  ParticleRotationDefinition,
  ParticleSpace,
  ParticleSpawnDefinition,
  ParticleTextureDefinition,
  ParticleVectorRange,
} from './particle-types.js';
export {
  isParticlePresetValidationError,
  parseParticlePreset,
  ParticlePresetValidationError,
  validateParticlePreset,
} from './particle-validation.js';
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
