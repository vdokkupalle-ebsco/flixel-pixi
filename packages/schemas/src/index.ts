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
export {
  serializeParticleEffect,
  type SerializeParticleEffectOptions,
} from './particle-effect-serialization.js';
export {
  MAX_PARTICLE_EFFECT_EMITTERS,
  type ParticleEffectDocumentV1,
  type ParticleEffectOffset,
  type ParticleEffectValidationResult,
  type ParticleEmitterLayerV1,
  type ParticleTextureShape,
} from './particle-effect-types.js';
export {
  isParticleEffectValidationError,
  parseParticleEffect,
  ParticleEffectValidationError,
  validateParticleEffect,
} from './particle-effect-validation.js';
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
  PhysicsBodyDocumentV1,
  PhysicsBodyValidationResult,
  PhysicsBoxShapeDefinition,
  PhysicsCapsuleShapeDefinition,
  PhysicsCircleShapeDefinition,
  PhysicsCompoundShapeDefinition,
  PhysicsFilterDefinition,
  PhysicsMaterialDefinition,
  PhysicsPolygonShapeDefinition,
  PhysicsPrimitiveShapeDefinition,
  PhysicsShapeBaseDefinition,
  PhysicsShapeDefinition,
  PhysicsVectorDefinition,
  PhysicsWorldDocumentV1,
  PhysicsWorldValidationResult,
  SerializePhysicsOptions,
} from './physics-types.js';
export {
  isPhysicsValidationError,
  parsePhysicsBody,
  parsePhysicsWorld,
  PhysicsValidationError,
  validatePhysicsBody,
  validatePhysicsWorld,
} from './physics-validation.js';
export {
  serializePhysicsBody,
  serializePhysicsWorld,
} from './physics-serialization.js';
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
