import { describe, expect, it, vi } from 'vitest';

import type { ParticlePresetV1 } from '@flixel-pixi/schemas';

import {
  ParticleEmitter,
  ParticleRandom,
  sampleParticleColor,
  sampleParticleCurve,
  type ParticleState,
} from '../src/index.js';

function fixed(min: number, max = min): { max: number; min: number } {
  return { max, min };
}

function vector(x = 0, y = 0) {
  return { x: fixed(x), y: fixed(y) };
}

function preset(overrides: Partial<ParticlePresetV1> = {}): ParticlePresetV1 {
  return {
    appearance: {
      alpha: {
        stops: [
          { time: 0, value: 1 },
          { time: 1, value: 0 },
        ],
      },
      colors: [
        { color: 0xff00_00ff, time: 0 },
        { color: 0x0000_ffff, time: 1 },
      ],
      rotation: { initial: fixed(10), velocity: fixed(20) },
      scale: {
        stops: [
          { time: 0, value: 1 },
          { time: 1, value: 2 },
        ],
      },
      texture: {
        assetId: 'spark',
        frames: ['one', 'two'],
        selection: 'sequence',
      },
    },
    capacity: 4,
    emission: { count: 2, mode: 'burst' },
    id: 'test',
    kind: 'particle-preset',
    lifespan: fixed(2),
    motion: {
      acceleration: vector(2, 0),
      drag: vector(1, 0),
      velocity: vector(4, 0),
    },
    name: 'Test',
    schemaVersion: 1,
    seed: 42,
    space: 'world',
    spawn: { shape: 'point' },
    ...overrides,
  };
}

describe('ParticleRandom', () => {
  it('repeats a sequence after reset and exposes the normalized seed', () => {
    const random = new ParticleRandom(0x1_0000_0001);
    const first = [random.next(), random.next(), random.next()];
    expect(random.seed).toBe(1);
    random.reset();
    expect([random.next(), random.next(), random.next()]).toEqual(first);
    random.reset(9);
    expect(random.seed).toBe(9);
    expect(random.range(4, 4)).toBe(4);
    expect(random.range(0, 1)).toBeGreaterThanOrEqual(0);
  });
});

describe('particle curves', () => {
  it('samples linear, stepped, clamped, and empty curves', () => {
    const linear = {
      stops: [
        { time: 0.25, value: 2 },
        { time: 0.75, value: 6 },
      ],
    };
    expect(sampleParticleCurve({ stops: [] }, 0.5)).toBe(0);
    expect(sampleParticleCurve(linear, 0)).toBe(2);
    expect(sampleParticleCurve(linear, 0.5)).toBe(4);
    expect(sampleParticleCurve(linear, 1)).toBe(6);
    expect(sampleParticleCurve({ ...linear, interpolation: 'step' }, 0.5)).toBe(
      2,
    );
  });

  it('interpolates every RGBA channel and clamps at both ends', () => {
    const colors = [
      { color: 0xff00_00ff, time: 0 },
      { color: 0x00ff_ff00, time: 1 },
    ];
    expect(sampleParticleColor([], 0.5)).toBe(0xffff_ffff);
    expect(sampleParticleColor(colors, -1)).toBe(0xff00_00ff);
    expect(sampleParticleColor(colors, 0.5)).toBe(0x8080_8080);
    expect(sampleParticleColor(colors, 2)).toBe(0x00ff_ff00);
  });
});

describe('ParticleEmitter', () => {
  it('starts a burst, advances motion and appearance, then completes', () => {
    const spawned: ParticleState[] = [];
    const died: number[] = [];
    const emitter = new ParticleEmitter(preset(), {
      onDeath: (particle) => died.push(particle.index),
      onSpawn: (particle) => spawned.push({ ...particle }),
      originX: 10,
      originY: 20,
    });

    expect(emitter.diagnostics).toEqual({
      activeCount: 0,
      capacity: 4,
      droppedCount: 0,
      emittedCount: 0,
      emitting: false,
      pooledCount: 4,
      state: 'idle',
    });
    emitter.start();
    expect(spawned.map(({ frame }) => frame)).toEqual(['one', 'two']);
    expect(spawned[0]).toMatchObject({ rotation: 10, x: 10, y: 20 });

    emitter.update(1);
    const midway = emitter.snapshot();
    expect(midway.particles[0]).toMatchObject({
      age: 1,
      alpha: 0.5,
      color: 0x8000_80ff,
      rotation: 30,
      scale: 1.5,
      velocityX: 5,
      x: 15,
    });
    emitter.update(1);
    expect(emitter.state).toBe('complete');
    expect(died).toEqual([0, 1]);
  });

  it('produces identical snapshots for the same seed and updates', () => {
    const value = preset({
      appearance: {
        texture: {
          assetId: 'spark',
          frames: ['a', 'b', 'c'],
          selection: 'random',
        },
      },
      lifespan: fixed(1, 3),
      motion: { velocity: { x: fixed(-5, 5), y: fixed(-2, 2) } },
      spawn: { height: 10, shape: 'rectangle', width: 20 },
    });
    const first = new ParticleEmitter(value, { originX: 4, originY: 8 });
    const second = new ParticleEmitter(value, { originX: 4, originY: 8 });
    first.start();
    second.start();
    first.update(0.25);
    second.update(0.25);
    expect(first.snapshot()).toEqual(second.snapshot());
  });

  it('uses area-correct circle spawning and local coordinates', () => {
    const emitter = new ParticleEmitter(
      preset({
        capacity: 20,
        emission: { count: 20, mode: 'burst' },
        space: 'local',
        spawn: { innerRadius: 4, radius: 8, shape: 'circle' },
      }),
      { originX: 100, originY: 100 },
    );
    emitter.start();
    emitter.forEachActive((particle) => {
      const distance = Math.hypot(particle.x, particle.y);
      expect(distance).toBeGreaterThanOrEqual(4);
      expect(distance).toBeLessThanOrEqual(8);
    });
  });

  it('emits continuously, pauses, resumes, and honors duration', () => {
    const emitter = new ParticleEmitter(
      preset({
        emission: { duration: 0.5, mode: 'continuous', rate: 4 },
        lifespan: fixed(0.5),
      }),
    );
    emitter.start();
    emitter.update(0.25);
    expect(emitter.diagnostics.activeCount).toBe(1);
    emitter.pause();
    emitter.update(1);
    expect(emitter.diagnostics.activeCount).toBe(1);
    emitter.resume();
    emitter.update(0.25);
    expect(emitter.diagnostics).toMatchObject({
      activeCount: 2,
      emittedCount: 2,
      emitting: false,
      state: 'running',
    });
    emitter.update(0.5);
    expect(emitter.state).toBe('complete');
  });

  it('reports capacity drops and reuses pooled particle identities', () => {
    const indices: number[] = [];
    const emitter = new ParticleEmitter(
      preset({
        capacity: 1,
        emission: { count: 3, mode: 'burst' },
        lifespan: fixed(0.1),
      }),
      { onSpawn: (particle) => indices.push(particle.index) },
    );
    emitter.start();
    expect(emitter.diagnostics).toMatchObject({
      activeCount: 1,
      droppedCount: 2,
      emittedCount: 1,
    });
    emitter.update(0.1);
    emitter.start({ restart: false });
    expect(indices).toEqual([0, 0]);
    expect(emitter.diagnostics).toMatchObject({
      droppedCount: 4,
      emittedCount: 2,
    });
  });

  it('stops emission while particles drain or clears them immediately', () => {
    const onDeath = vi.fn();
    const emitter = new ParticleEmitter(preset(), { onDeath });
    emitter.start();
    emitter.stop();
    expect(emitter.diagnostics).toMatchObject({
      activeCount: 2,
      emitting: false,
      state: 'running',
    });
    emitter.stop(true);
    expect(emitter.state).toBe('complete');
    expect(onDeath).toHaveBeenCalledTimes(2);
  });

  it('resets counters, randomness, particles, and defensive preset copies', () => {
    const emitter = new ParticleEmitter(preset());
    emitter.start();
    const first = emitter.snapshot();
    const exposed = emitter.preset;
    exposed.name = 'Changed';
    emitter.reset();
    emitter.start();
    expect(emitter.snapshot().particles).toEqual(first.particles);
    expect(emitter.preset.name).toBe('Test');
  });

  it('validates origins, elapsed time, presets, and destroyed lifecycle', () => {
    expect(() => new ParticleEmitter({})).toThrow();
    expect(
      () => new ParticleEmitter(preset(), { originX: Number.NaN }),
    ).toThrow(RangeError);
    const emitter = new ParticleEmitter(preset());
    expect(() => emitter.setOrigin(0, Number.POSITIVE_INFINITY)).toThrow(
      RangeError,
    );
    expect(() => emitter.update(-1)).toThrow(RangeError);
    emitter.update(0);
    emitter.pause();
    emitter.resume();
    emitter.destroy();
    emitter.destroy();
    expect(emitter.state).toBe('destroyed');
    expect(emitter.diagnostics.capacity).toBe(0);
    expect(() => emitter.start()).toThrow('destroyed');
    expect(() => emitter.snapshot()).toThrow('destroyed');
    expect(() => emitter.forEachActive(() => undefined)).toThrow('destroyed');
  });
});
