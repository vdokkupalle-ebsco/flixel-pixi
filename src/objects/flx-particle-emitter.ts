import {
  ParticleEmitter,
  type ParticleEmitterDiagnostics,
  type ParticleState,
} from '@flixel-pixi/particles';
import {
  parseParticlePreset,
  type ParticlePresetV1,
} from '@flixel-pixi/schemas';

import { FlxAssets } from '../assets/flx-assets';
import type { FlxGraphic } from '../assets/flx-graphic';
import { FlxFramesCollection } from '../animation/flx-frames-collection';
import { FlxG } from '../core/flx-g';
import { FlxObject } from './flx-object';
import { FlxEmitter } from './flx-emitter';
import { FlxParticle } from './flx-particle';

/** A preloaded image or named frame collection used by a particle preset. @public */
export type FlxParticleEmitterSource = FlxGraphic | FlxFramesCollection;

/** Options for resolving a preset's preloaded asset through {@link FlxAssets}. @public */
export interface FlxParticleEmitterAssetOptions {
  assets?: FlxAssets;
  frames?: FlxFramesCollection;
  x?: number;
  y?: number;
}

/**
 * Renders a validated particle preset through Flixel-Pixi's existing emitter
 * and camera pipeline while delegating simulation to the deterministic runtime.
 * @public
 */
export class FlxParticleEmitter extends FlxEmitter {
  readonly #runtime: ParticleEmitter;
  readonly #activeIndices: Uint8Array;
  readonly #frameIndices = new Map<string, number>();
  readonly #localSpace: boolean;
  #destroyed = false;

  constructor(preset: unknown, source: FlxParticleEmitterSource, x = 0, y = 0) {
    const parsed = parseParticlePreset(preset);
    super(x, y, parsed.capacity);
    this.#runtime = new ParticleEmitter(parsed, { originX: x, originY: y });
    this.#activeIndices = new Uint8Array(parsed.capacity);
    this.#localSpace = parsed.space === 'local';
    this.#configureBounds(parsed);
    this.#configurePool(parsed, source);
  }

  /**
   * Create an emitter from an asset that has already been loaded by
   * {@link FlxAssets}. Named frame presets may provide a frame collection.
   */
  static fromAssets(
    preset: unknown,
    options: FlxParticleEmitterAssetOptions = {},
  ): FlxParticleEmitter {
    const parsed = parseParticlePreset(preset);
    const assets = options.assets ?? FlxAssets.fromContext(FlxG.context);
    if (assets === undefined) {
      throw new Error(
        'No FlxAssets service is installed in the active context.',
      );
    }
    const cachedFrames =
      options.frames ??
      assets.get<FlxFramesCollection>(parsed.appearance.texture.assetId);
    const source =
      cachedFrames instanceof FlxFramesCollection
        ? cachedFrames
        : assets.getGraphic(parsed.appearance.texture.assetId);
    if (source === undefined) {
      throw new Error(
        `Particle asset "${parsed.appearance.texture.assetId}" has not been loaded.`,
      );
    }
    return new FlxParticleEmitter(
      parsed,
      source,
      options.x ?? 0,
      options.y ?? 0,
    );
  }

  get diagnostics(): ParticleEmitterDiagnostics {
    return this.#runtime.diagnostics;
  }

  get preset(): ParticlePresetV1 {
    return this.#runtime.preset;
  }

  /** Start the preset. Passing false continues without resetting its pool. */
  override start(
    restart = true,
    _lifespan = 0,
    _frequency = 0.1,
    _quantity = 0,
  ): void {
    void _lifespan;
    void _frequency;
    void _quantity;
    this.revive();
    this.visible = true;
    this.#runtime.setOrigin(this.x, this.y);
    this.#runtime.start({ restart });
    this.#syncParticles();
  }

  pause(): void {
    this.#runtime.pause();
  }

  resume(): void {
    this.#runtime.resume();
  }

  resetPreset(): void {
    this.#runtime.reset();
    this.#syncParticles();
  }

  stop(clear = false): void {
    this.#runtime.stop(clear);
    this.#syncParticles();
  }

  override update(): void {
    this.#runtime.setOrigin(this.x, this.y);
    this.#capturePreviousTransforms();
    this.#runtime.update(FlxG.elapsed);
    this.#syncParticles();
  }

  override kill(): void {
    this.#runtime.stop(true);
    this.#syncParticles();
    super.kill();
  }

  override destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#runtime.destroy();
    super.destroy();
  }

  #capturePreviousTransforms(): void {
    for (const member of this.members) {
      if (member === null || !member.exists) continue;
      member.last.copyFrom(member);
      member.lastAngle = member.angle;
    }
  }

  #configureBounds(preset: ParticlePresetV1): void {
    const spawn = preset.spawn;
    if (spawn.shape === 'rectangle') this.setSize(spawn.width, spawn.height);
    else if (spawn.shape === 'circle') {
      this.setSize(spawn.radius * 2, spawn.radius * 2);
    }
  }

  #configurePool(
    preset: ParticlePresetV1,
    source: FlxParticleEmitterSource,
  ): void {
    const namedFrames = preset.appearance.texture.frames;
    if (source instanceof FlxFramesCollection) {
      source.frames.forEach((frame, index) => {
        if (frame.name === null) return;
        this.#frameIndices.set(frame.name, index);
        const alternate = frame.name.endsWith('.png')
          ? frame.name.slice(0, -4)
          : `${frame.name}.png`;
        this.#frameIndices.set(alternate, index);
      });
      for (const name of namedFrames ?? []) source.getByName(name);
    } else if (namedFrames !== undefined) {
      throw new TypeError(
        'Particle presets with named frames require a FlxFramesCollection.',
      );
    }

    this.maxSize = preset.capacity;
    for (let index = 0; index < preset.capacity; index += 1) {
      const particle = new FlxParticle();
      if (source instanceof FlxFramesCollection) particle.loadFrames(source);
      else particle.loadGraphic(source);
      particle.active = false;
      particle.allowCollisions = FlxObject.NONE;
      particle.exists = false;
      this.add(particle);
    }
  }

  #syncParticles(): void {
    this.#activeIndices.fill(0);
    this.#runtime.forEachActive((state) => {
      this.#activeIndices[state.index] = 1;
      const particle = this.members[state.index];
      if (particle === null || particle === undefined) return;
      this.#syncParticle(particle, state);
    });
    for (let index = 0; index < this.length; index += 1) {
      if (this.#activeIndices[index] === 0) this.members[index]?.kill();
    }
    this.on = this.#runtime.diagnostics.emitting;
  }

  #syncParticle(particle: FlxParticle, state: Readonly<ParticleState>): void {
    const x = state.x + (this.#localSpace ? this.x : 0);
    const y = state.y + (this.#localSpace ? this.y : 0);
    if (!particle.exists) particle.reset(x, y);
    else {
      particle.x = x;
      particle.y = y;
    }
    particle.visible = true;
    particle.velocity.make(state.velocityX, state.velocityY);
    particle.acceleration.make(state.accelerationX, state.accelerationY);
    particle.drag.make(state.dragX, state.dragY);
    particle.angle = state.rotation;
    particle.angularVelocity = state.angularVelocity;
    particle.scale.make(state.scale, state.scale);
    particle.color = state.color >>> 8;
    particle.alpha = state.alpha * ((state.color & 0xff) / 255);
    particle.lifespan = Math.max(0, state.lifespan - state.age);
    if (state.frame !== undefined) {
      const frame = this.#frameIndices.get(state.frame);
      if (frame === undefined) {
        throw new Error(`Particle frame "${state.frame}" is unavailable.`);
      }
      particle.frame = frame;
    }
  }
}
