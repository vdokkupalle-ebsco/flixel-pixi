import type { ParticlePresetV1 } from './particle-types.js';
import type { ValidationResult } from './types.js';

/** Maximum number of emitter layers supported by a version 1 effect. @public */
export const MAX_PARTICLE_EFFECT_EMITTERS = 8;

/** Editor drawing hint retained so exported effects can be reopened losslessly. @public */
export type ParticleTextureShape = 'circle' | 'square';

/** Local emitter offset from the composed effect origin. @public */
export interface ParticleEffectOffset {
  x: number;
  y: number;
}

/** One ordered emitter layer inside a composed particle effect. @public */
export interface ParticleEmitterLayerV1 {
  enabled: boolean;
  layerId: string;
  name: string;
  offset: ParticleEffectOffset;
  preset: ParticlePresetV1;
  textureShape: ParticleTextureShape;
}

/** Portable, ordered multi-emitter effect exported by the Particle Editor. @public */
export interface ParticleEffectDocumentV1 {
  emitters: ParticleEmitterLayerV1[];
  id: string;
  kind: 'flixel-pixi-particle-effect';
  name: string;
  version: 1;
}

/** Validation result for a composed particle effect document. @public */
export type ParticleEffectValidationResult =
  ValidationResult<ParticleEffectDocumentV1>;
