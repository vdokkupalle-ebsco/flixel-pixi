import type { JsonObject, ValidationResult } from './types.js';

/** @public */
export type ParticleSpace = 'local' | 'world';
/** @public */
export type ParticleFrameSelection = 'random' | 'sequence';
/** @public */
export type ParticleCurveInterpolation = 'linear' | 'step';
/** Portable blend modes supported by particle presets. @public */
export type ParticleBlendMode = 'add' | 'multiply' | 'normal' | 'screen';

/** @public */
export interface ParticleNumberRange {
  max: number;
  min: number;
}

/** @public */
export interface ParticleVectorRange {
  x: ParticleNumberRange;
  y: ParticleNumberRange;
}

/** @public */
export interface ParticleCurveStop {
  time: number;
  value: number;
}

/** @public */
export interface ParticleCurve {
  interpolation?: ParticleCurveInterpolation;
  stops: ParticleCurveStop[];
}

/** @public */
export interface ParticleColorStop {
  /** Unsigned 32-bit RGBA value in 0xRRGGBBAA order. */
  color: number;
  time: number;
}

/** @public */
export interface ParticleTextureDefinition {
  assetId: string;
  frames?: string[];
  selection?: ParticleFrameSelection;
}

/** @public */
export type ParticleEmissionDefinition =
  | {
      count: number;
      mode: 'burst';
    }
  | {
      duration?: number;
      mode: 'continuous';
      rate: number;
    };

/** @public */
export type ParticleSpawnDefinition =
  | { shape: 'point' }
  | { height: number; shape: 'rectangle'; width: number }
  | { innerRadius?: number; radius: number; shape: 'circle' };

/** @public */
export interface ParticleMotionDefinition {
  acceleration?: ParticleVectorRange;
  drag?: ParticleVectorRange;
  velocity: ParticleVectorRange;
}

/** @public */
export interface ParticleRotationDefinition {
  initial: ParticleNumberRange;
  velocity: ParticleNumberRange;
}

/** @public */
export interface ParticleAppearanceDefinition {
  alpha?: ParticleCurve;
  blendMode?: ParticleBlendMode;
  colors?: ParticleColorStop[];
  rotation?: ParticleRotationDefinition;
  scale?: ParticleCurve;
  texture: ParticleTextureDefinition;
}

/** @public */
export interface ParticlePresetV1 {
  appearance: ParticleAppearanceDefinition;
  capacity: number;
  emission: ParticleEmissionDefinition;
  extensions?: JsonObject;
  id: string;
  kind: 'particle-preset';
  lifespan: ParticleNumberRange;
  motion: ParticleMotionDefinition;
  name: string;
  schemaVersion: 1;
  seed: number;
  space: ParticleSpace;
  spawn: ParticleSpawnDefinition;
}

/** @public */
export type ParticlePreset = ParticlePresetV1;
/** @public */
export type ParticlePresetValidationResult = ValidationResult<ParticlePresetV1>;
