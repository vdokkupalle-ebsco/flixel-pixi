import {
  parseParticlePreset,
  serializeParticlePreset,
  type ParticleNumberRange,
  type ParticlePresetV1,
  type ParticleVectorRange,
} from '@flixel-pixi/schemas';

import { sampleParticleColor, sampleParticleCurve } from './curves.js';
import { ParticleRandom } from './random.js';
import type {
  ParticleEmitterDiagnostics,
  ParticleEmitterOptions,
  ParticleEmitterSnapshot,
  ParticleEmitterState,
  ParticleState,
  StartParticleEmitterOptions,
} from './types.js';

function clonePreset(value: unknown): ParticlePresetV1 {
  const parsed = parseParticlePreset(value);
  return JSON.parse(serializeParticlePreset(parsed)) as ParticlePresetV1;
}

function range(random: ParticleRandom, value: ParticleNumberRange): number {
  return random.range(value.min, value.max);
}

function vector(
  random: ParticleRandom,
  value: ParticleVectorRange | undefined,
): [number, number] {
  return value === undefined
    ? [0, 0]
    : [range(random, value.x), range(random, value.y)];
}

function approachZero(value: number, amount: number): number {
  if (value > 0) return Math.max(0, value - amount);
  if (value < 0) return Math.min(0, value + amount);
  return 0;
}

function inactiveParticle(index: number): ParticleState {
  return {
    accelerationX: 0,
    accelerationY: 0,
    active: false,
    age: 0,
    alpha: 1,
    angularVelocity: 0,
    color: 0xffff_ffff,
    dragX: 0,
    dragY: 0,
    index,
    lifespan: 0,
    rotation: 0,
    scale: 1,
    velocityX: 0,
    velocityY: 0,
    x: 0,
    y: 0,
  };
}

function copyParticle(particle: ParticleState): ParticleState {
  return { ...particle };
}

/** Deterministic, fixed-capacity particle simulator with no renderer dependency. */
export class ParticleEmitter {
  readonly #options: ParticleEmitterOptions;
  readonly #particles: ParticleState[];
  readonly #random: ParticleRandom;
  readonly #preset: ParticlePresetV1;
  #activeCount = 0;
  #droppedCount = 0;
  #emissionAccumulator = 0;
  #emissionElapsed = 0;
  #emittedCount = 0;
  #emitting = false;
  #originX: number;
  #originY: number;
  #poolCursor = 0;
  #state: ParticleEmitterState = 'idle';

  constructor(preset: unknown, options: ParticleEmitterOptions = {}) {
    this.#preset = clonePreset(preset);
    this.#random = new ParticleRandom(this.#preset.seed);
    this.#particles = Array.from(
      { length: this.#preset.capacity },
      (_, index) => inactiveParticle(index),
    );
    this.#options = options;
    this.#originX = options.originX ?? 0;
    this.#originY = options.originY ?? 0;
    this.#requireFinite(this.#originX, 'originX');
    this.#requireFinite(this.#originY, 'originY');
  }

  get diagnostics(): ParticleEmitterDiagnostics {
    return {
      activeCount: this.#activeCount,
      capacity: this.#particles.length,
      droppedCount: this.#droppedCount,
      emittedCount: this.#emittedCount,
      emitting: this.#emitting,
      pooledCount: this.#particles.length - this.#activeCount,
      state: this.#state,
    };
  }

  get preset(): ParticlePresetV1 {
    return clonePreset(this.#preset);
  }

  get state(): ParticleEmitterState {
    return this.#state;
  }

  destroy(): void {
    if (this.#state === 'destroyed') return;
    this.#deactivateAll(false);
    this.#particles.length = 0;
    this.#emitting = false;
    this.#state = 'destroyed';
  }

  forEachActive(callback: (particle: Readonly<ParticleState>) => void): void {
    this.#assertUsable();
    for (const particle of this.#particles) {
      if (particle.active) callback(particle);
    }
  }

  pause(): void {
    this.#assertUsable();
    if (this.#state === 'running') this.#state = 'paused';
  }

  reset(): void {
    this.#assertUsable();
    this.#deactivateAll(false);
    this.#random.reset(this.#preset.seed);
    this.#droppedCount = 0;
    this.#emissionAccumulator = 0;
    this.#emissionElapsed = 0;
    this.#emittedCount = 0;
    this.#emitting = false;
    this.#poolCursor = 0;
    this.#state = 'idle';
  }

  resume(): void {
    this.#assertUsable();
    if (this.#state === 'paused') this.#state = 'running';
  }

  setOrigin(x: number, y: number): void {
    this.#assertUsable();
    this.#requireFinite(x, 'x');
    this.#requireFinite(y, 'y');
    this.#originX = x;
    this.#originY = y;
  }

  snapshot(): ParticleEmitterSnapshot {
    this.#assertUsable();
    return {
      diagnostics: this.diagnostics,
      particles: this.#particles
        .filter((particle) => particle.active)
        .map(copyParticle),
      preset: this.preset,
    };
  }

  start(options: StartParticleEmitterOptions = {}): void {
    this.#assertUsable();
    if (options.restart ?? true) this.reset();
    this.#state = 'running';
    this.#emitting = true;
    if (this.#preset.emission.mode === 'burst') {
      this.#emit(this.#preset.emission.count);
      this.#emitting = false;
      if (this.#activeCount === 0) this.#state = 'complete';
    }
  }

  stop(clear = false): void {
    this.#assertUsable();
    this.#emitting = false;
    if (clear) this.#deactivateAll(true);
    this.#state = this.#activeCount === 0 ? 'complete' : 'running';
  }

  update(elapsed: number): void {
    this.#assertUsable();
    if (!Number.isFinite(elapsed) || elapsed < 0) {
      throw new RangeError('elapsed must be non-negative and finite.');
    }
    if (this.#state !== 'running' || elapsed === 0) return;

    this.#updateParticles(elapsed);
    if (this.#emitting && this.#preset.emission.mode === 'continuous') {
      const emission = this.#preset.emission;
      const activeElapsed =
        emission.duration === undefined
          ? elapsed
          : Math.max(
              0,
              Math.min(elapsed, emission.duration - this.#emissionElapsed),
            );
      this.#emissionElapsed += activeElapsed;
      this.#emissionAccumulator += activeElapsed * emission.rate;
      const quantity = Math.floor(this.#emissionAccumulator);
      if (quantity > 0) {
        this.#emissionAccumulator -= quantity;
        this.#emit(quantity);
      }
      if (
        emission.duration !== undefined &&
        this.#emissionElapsed >= emission.duration
      ) {
        this.#emitting = false;
      }
    }
    if (!this.#emitting && this.#activeCount === 0) this.#state = 'complete';
  }

  #assertUsable(): void {
    if (this.#state === 'destroyed') {
      throw new Error('The particle emitter has been destroyed.');
    }
  }

  #deactivate(particle: ParticleState, notify: boolean): void {
    if (!particle.active) return;
    particle.active = false;
    this.#activeCount -= 1;
    if (notify) this.#options.onDeath?.(particle);
  }

  #deactivateAll(notify: boolean): void {
    for (const particle of this.#particles) this.#deactivate(particle, notify);
  }

  #emit(quantity: number): void {
    for (let index = 0; index < quantity; index += 1) {
      const particle = this.#acquire();
      if (particle === undefined) {
        this.#droppedCount += quantity - index;
        return;
      }
      this.#spawn(particle);
    }
  }

  #acquire(): ParticleState | undefined {
    for (let offset = 0; offset < this.#particles.length; offset += 1) {
      const index = (this.#poolCursor + offset) % this.#particles.length;
      const particle = this.#particles[index];
      if (particle !== undefined && !particle.active) {
        this.#poolCursor = (index + 1) % this.#particles.length;
        return particle;
      }
    }
    return undefined;
  }

  #spawn(particle: ParticleState): void {
    const spawn = this.#preset.spawn;
    let x = 0;
    let y = 0;
    if (spawn.shape === 'rectangle') {
      x = this.#random.range(-spawn.width * 0.5, spawn.width * 0.5);
      y = this.#random.range(-spawn.height * 0.5, spawn.height * 0.5);
    } else if (spawn.shape === 'circle') {
      const angle = this.#random.next() * Math.PI * 2;
      const inner = spawn.innerRadius ?? 0;
      const radius = Math.sqrt(
        inner * inner +
          this.#random.next() * (spawn.radius * spawn.radius - inner * inner),
      );
      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius;
    }
    if (this.#preset.space === 'world') {
      x += this.#originX;
      y += this.#originY;
    }

    const [velocityX, velocityY] = vector(
      this.#random,
      this.#preset.motion.velocity,
    );
    const [accelerationX, accelerationY] = vector(
      this.#random,
      this.#preset.motion.acceleration,
    );
    const [dragX, dragY] = vector(this.#random, this.#preset.motion.drag);
    const rotation = this.#preset.appearance.rotation;
    const frames = this.#preset.appearance.texture.frames;
    let frame: string | undefined;
    if (frames !== undefined) {
      const selection = this.#preset.appearance.texture.selection ?? 'sequence';
      const frameIndex =
        selection === 'random'
          ? Math.floor(this.#random.next() * frames.length)
          : this.#emittedCount % frames.length;
      frame = frames[frameIndex];
    }

    Object.assign(particle, {
      accelerationX,
      accelerationY,
      active: true,
      age: 0,
      alpha:
        this.#preset.appearance.alpha === undefined
          ? 1
          : sampleParticleCurve(this.#preset.appearance.alpha, 0),
      angularVelocity:
        rotation === undefined ? 0 : range(this.#random, rotation.velocity),
      color:
        this.#preset.appearance.colors === undefined
          ? 0xffff_ffff
          : sampleParticleColor(this.#preset.appearance.colors, 0),
      dragX,
      dragY,
      frame,
      lifespan: range(this.#random, this.#preset.lifespan),
      rotation:
        rotation === undefined ? 0 : range(this.#random, rotation.initial),
      scale:
        this.#preset.appearance.scale === undefined
          ? 1
          : sampleParticleCurve(this.#preset.appearance.scale, 0),
      velocityX,
      velocityY,
      x,
      y,
    });
    this.#activeCount += 1;
    this.#emittedCount += 1;
    this.#options.onSpawn?.(particle);
  }

  #updateParticles(elapsed: number): void {
    for (const particle of this.#particles) {
      if (!particle.active) continue;
      particle.age += elapsed;
      if (particle.age >= particle.lifespan) {
        this.#deactivate(particle, true);
        continue;
      }
      particle.velocityX += particle.accelerationX * elapsed;
      particle.velocityY += particle.accelerationY * elapsed;
      particle.velocityX = approachZero(
        particle.velocityX,
        particle.dragX * elapsed,
      );
      particle.velocityY = approachZero(
        particle.velocityY,
        particle.dragY * elapsed,
      );
      particle.x += particle.velocityX * elapsed;
      particle.y += particle.velocityY * elapsed;
      particle.rotation += particle.angularVelocity * elapsed;
      const progress = particle.age / particle.lifespan;
      if (this.#preset.appearance.alpha !== undefined) {
        particle.alpha = sampleParticleCurve(
          this.#preset.appearance.alpha,
          progress,
        );
      }
      if (this.#preset.appearance.scale !== undefined) {
        particle.scale = sampleParticleCurve(
          this.#preset.appearance.scale,
          progress,
        );
      }
      if (this.#preset.appearance.colors !== undefined) {
        particle.color = sampleParticleColor(
          this.#preset.appearance.colors,
          progress,
        );
      }
    }
  }

  #requireFinite(value: number, name: string): void {
    if (!Number.isFinite(value))
      throw new RangeError(`${name} must be finite.`);
  }
}
