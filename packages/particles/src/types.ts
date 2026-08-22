import type { ParticlePresetV1 } from '@flixel-pixi/schemas';

export type ParticleEmitterState =
  'complete' | 'destroyed' | 'idle' | 'paused' | 'running';

export interface ParticleState {
  accelerationX: number;
  accelerationY: number;
  active: boolean;
  age: number;
  alpha: number;
  angularVelocity: number;
  color: number;
  dragX: number;
  dragY: number;
  frame?: string;
  readonly index: number;
  lifespan: number;
  rotation: number;
  scale: number;
  velocityX: number;
  velocityY: number;
  x: number;
  y: number;
}

export interface ParticleEmitterDiagnostics {
  activeCount: number;
  capacity: number;
  droppedCount: number;
  emittedCount: number;
  emitting: boolean;
  pooledCount: number;
  state: ParticleEmitterState;
}

export interface ParticleEmitterOptions {
  onDeath?: (particle: Readonly<ParticleState>) => void;
  onSpawn?: (particle: Readonly<ParticleState>) => void;
  originX?: number;
  originY?: number;
}

export interface StartParticleEmitterOptions {
  restart?: boolean;
}

export interface ParticleEmitterSnapshot {
  diagnostics: ParticleEmitterDiagnostics;
  particles: ParticleState[];
  preset: ParticlePresetV1;
}
