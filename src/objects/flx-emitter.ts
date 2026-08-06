import type { Texture } from 'pixi.js';

import { FlxGraphic } from '../assets/flx-graphic';
import { FlxG } from '../core/flx-g';
import { FlxGroup } from '../core/flx-group';
import { FlxPoint } from '../math/flx-point';
import {
  FlxEmitterRenderHandle,
  type FlxEmitterRenderOptions,
} from '../rendering/flx-emitter-render-handle';
import type { FlxRenderHandle } from '../rendering/flx-render-handle';
import { FlxObject } from './flx-object';
import { FlxParticle } from './flx-particle';

/** Constructor for custom particles created and recycled by an emitter. @public */
export type FlxParticleConstructor = new () => FlxParticle;

/** Deterministic burst/stream emitter backed by `FlxGroup` recycling. @public */
export class FlxEmitter extends FlxGroup<FlxParticle> {
  x: number;
  y: number;
  width = 0;
  height = 0;
  minParticleSpeed = new FlxPoint(-100, -100);
  maxParticleSpeed = new FlxPoint(100, 100);
  particleDrag = new FlxPoint();
  minRotation = -360;
  maxRotation = 360;
  gravity = 0;
  on = false;
  frequency = 0.1;
  lifespan = 3;
  bounce = 0;
  particleClass: FlxParticleConstructor | null = null;

  readonly #renderHandles = new Set<FlxRenderHandle>();
  readonly #point = new FlxPoint();
  #ownedGraphic: FlxGraphic | null = null;
  #quantity = 0;
  #explode = true;
  #timer = 0;
  #counter = 0;
  #destroyed = false;

  constructor(x = 0, y = 0, size = 0) {
    super(size);
    this.x = x;
    this.y = y;
  }

  makeParticles(
    source: FlxGraphic | Texture,
    quantity = 50,
    bakedRotations = 16,
    multiple = false,
    collide = 0.8,
  ): this {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new RangeError('Particle quantity must be a non-negative integer.');
    }
    if (!Number.isInteger(bakedRotations) || bakedRotations < 0) {
      throw new RangeError(
        'Baked rotation count must be a non-negative integer.',
      );
    }
    if (!Number.isFinite(collide)) {
      throw new RangeError('Particle collision scale must be finite.');
    }
    void bakedRotations;

    for (const member of this.members) member?.destroy();
    this.clear();
    this.#ownedGraphic?.destroy();
    this.#ownedGraphic =
      source instanceof FlxGraphic ? null : new FlxGraphic(source);
    const graphic = this.#ownedGraphic ?? source;
    this.maxSize = quantity;
    const particleType = this.particleClass ?? FlxParticle;

    for (let index = 0; index < quantity; index += 1) {
      const particle = new particleType();
      particle.loadGraphic(graphic, multiple);
      if (multiple) particle.randomFrame();
      if (collide > 0) {
        particle.width *= collide;
        particle.height *= collide;
        particle.centerOffsets();
      } else {
        particle.allowCollisions = FlxObject.NONE;
      }
      particle.exists = false;
      this.add(particle);
    }
    return this;
  }

  override update(): void {
    if (this.on) {
      if (this.#explode) {
        this.on = false;
        const quantity =
          this.#quantity <= 0 || this.#quantity > this.length
            ? this.length
            : this.#quantity;
        for (let index = 0; index < quantity; index += 1) this.emitParticle();
        this.#quantity = 0;
      } else {
        this.#timer += FlxG.elapsed;
        while (this.frequency > 0 && this.#timer > this.frequency && this.on) {
          this.#timer -= this.frequency;
          this.emitParticle();
          this.#counter += 1;
          if (this.#quantity > 0 && this.#counter >= this.#quantity) {
            this.on = false;
            this.#quantity = 0;
          }
        }
      }
    }
    super.update();
  }

  start(explode = true, lifespan = 0, frequency = 0.1, quantity = 0): void {
    if (!Number.isFinite(lifespan) || lifespan < 0) {
      throw new RangeError(
        'Particle lifespan must be non-negative and finite.',
      );
    }
    if (!Number.isFinite(frequency) || frequency < 0) {
      throw new RangeError(
        'Emitter frequency must be non-negative and finite.',
      );
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new RangeError('Emission quantity must be a non-negative integer.');
    }
    this.revive();
    this.visible = true;
    this.on = true;
    this.#explode = explode;
    this.lifespan = lifespan;
    this.frequency = frequency;
    this.#quantity += quantity;
    this.#counter = 0;
    this.#timer = 0;
  }

  emitParticle(): void {
    const particleType = this.particleClass ?? FlxParticle;
    const particle = this.recycle(particleType);
    if (particle === null) return;
    particle.lifespan = this.lifespan;
    particle.elasticity = this.bounce;
    particle.reset(
      this.x - Math.trunc(particle.width * 0.5) + FlxG.random() * this.width,
      this.y - Math.trunc(particle.height * 0.5) + FlxG.random() * this.height,
    );
    particle.visible = true;
    particle.velocity.x = this.#randomRange(
      this.minParticleSpeed.x,
      this.maxParticleSpeed.x,
    );
    particle.velocity.y = this.#randomRange(
      this.minParticleSpeed.y,
      this.maxParticleSpeed.y,
    );
    particle.acceleration.y = this.gravity;
    particle.angularVelocity = this.#randomRange(
      this.minRotation,
      this.maxRotation,
    );
    if (particle.angularVelocity !== 0) {
      particle.angle = FlxG.random() * 360 - 180;
    }
    particle.drag.copyFrom(this.particleDrag);
    particle.onEmit();
  }

  setSize(width: number, height: number): void {
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 0 ||
      height < 0
    ) {
      throw new RangeError(
        'Emitter dimensions must be non-negative and finite.',
      );
    }
    this.width = width;
    this.height = height;
  }

  setXSpeed(min = 0, max = 0): void {
    this.#setRange(this.minParticleSpeed, 'x', min, max);
  }

  setYSpeed(min = 0, max = 0): void {
    this.#setRange(this.minParticleSpeed, 'y', min, max);
  }

  setRotation(min = 0, max = 0): void {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new RangeError('Emitter rotation range must be finite.');
    }
    this.minRotation = min;
    this.maxRotation = max;
  }

  at(object: FlxObject): void {
    object.getMidpoint(this.#point);
    this.x = this.#point.x - Math.trunc(this.width * 0.5);
    this.y = this.#point.y - Math.trunc(this.height * 0.5);
  }

  createRenderHandle(
    options: FlxEmitterRenderOptions = {},
  ): FlxEmitterRenderHandle {
    const handle = new FlxEmitterRenderHandle(this, options, () => {
      this.#renderHandles.delete(handle);
    });
    this.#renderHandles.add(handle);
    return handle;
  }

  override kill(): void {
    this.on = false;
    super.kill();
  }

  override destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    for (const handle of [...this.#renderHandles]) handle.destroy();
    super.destroy();
    this.#ownedGraphic?.destroy();
    this.#ownedGraphic = null;
  }

  #randomRange(min: number, max: number): number {
    return min === max ? min : min + FlxG.random() * (max - min);
  }

  #setRange(
    minPoint: FlxPoint,
    axis: 'x' | 'y',
    min: number,
    max: number,
  ): void {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new RangeError('Emitter speed range must be finite.');
    }
    minPoint[axis] = min;
    this.maxParticleSpeed[axis] = max;
  }
}
