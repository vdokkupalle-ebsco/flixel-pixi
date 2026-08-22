import type { JsonObject, ValidationResult } from './types.js';

export type ParticleSpace = 'local' | 'world';
export type ParticleFrameSelection = 'random' | 'sequence';
export type ParticleCurveInterpolation = 'linear' | 'step';

export interface ParticleNumberRange {
  max: number;
  min: number;
}

export interface ParticleVectorRange {
  x: ParticleNumberRange;
  y: ParticleNumberRange;
}

export interface ParticleCurveStop {
  time: number;
  value: number;
}

export interface ParticleCurve {
  interpolation?: ParticleCurveInterpolation;
  stops: ParticleCurveStop[];
}

export interface ParticleColorStop {
  /** Unsigned 32-bit RGBA value in 0xRRGGBBAA order. */
  color: number;
  time: number;
}

export interface ParticleTextureDefinition {
  assetId: string;
  frames?: string[];
  selection?: ParticleFrameSelection;
}

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

export type ParticleSpawnDefinition =
  | { shape: 'point' }
  | { height: number; shape: 'rectangle'; width: number }
  | { innerRadius?: number; radius: number; shape: 'circle' };

export interface ParticleMotionDefinition {
  acceleration?: ParticleVectorRange;
  drag?: ParticleVectorRange;
  velocity: ParticleVectorRange;
}

export interface ParticleRotationDefinition {
  initial: ParticleNumberRange;
  velocity: ParticleNumberRange;
}

export interface ParticleAppearanceDefinition {
  alpha?: ParticleCurve;
  colors?: ParticleColorStop[];
  rotation?: ParticleRotationDefinition;
  scale?: ParticleCurve;
  texture: ParticleTextureDefinition;
}

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

export type ParticlePreset = ParticlePresetV1;
export type ParticlePresetValidationResult = ValidationResult<ParticlePresetV1>;
