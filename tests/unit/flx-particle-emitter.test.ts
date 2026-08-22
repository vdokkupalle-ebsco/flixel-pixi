import { Texture } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FlxAssets,
  FlxAtlas,
  FlxContext,
  FlxFramesCollection,
  FlxG,
  FlxGraphic,
  FlxParticleEmitter,
  type ParticlePresetV1,
} from '../../src';

let context: FlxContext;

beforeEach(() => {
  context = new FlxContext(200, 120, 0.5);
  FlxG.installContext(context);
});

afterEach(() => {
  FlxG.clearContext(context);
});

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
      blendMode: 'add',
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

function namedFrames(): FlxFramesCollection {
  const atlas = FlxAtlas.fromTextureAndRects('particles', Texture.WHITE, [
    { height: 1, name: 'one.png', width: 1, x: 0, y: 0 },
    { height: 1, name: 'two.png', width: 1, x: 0, y: 0 },
  ]);
  return FlxFramesCollection.fromAtlas([
    atlas.getFrame('one'),
    atlas.getFrame('two'),
  ]);
}

describe('FlxParticleEmitter', () => {
  it('projects deterministic preset state into a stable FlxParticle pool', () => {
    const emitter = new FlxParticleEmitter(preset(), namedFrames(), 10, 20);
    const identities = emitter.members.slice();
    emitter.start();

    expect(emitter.diagnostics.activeCount).toBe(2);
    expect(emitter.members.filter((particle) => particle?.exists)).toHaveLength(
      2,
    );
    expect(emitter.members[0]).toMatchObject({
      alpha: 1,
      angle: 10,
      blend: 'add',
      color: 0xff0000,
      currentFrameName: 'one.png',
      x: 10,
      y: 20,
    });
    expect(emitter.members[1]?.currentFrameName).toBe('two.png');

    FlxG.elapsed = 1;
    emitter.update();
    expect(emitter.members[0]).toMatchObject({
      alpha: 0.5,
      angle: 30,
      color: 0x800080,
      x: 15,
    });
    expect(emitter.members[0]?.scale.x).toBe(1.5);

    emitter.resetPreset();
    emitter.start();
    expect(emitter.members.slice()).toEqual(identities);
    emitter.destroy();
  });

  it('keeps local particles attached to a moving emitter origin', () => {
    const value = preset({
      appearance: { texture: { assetId: 'spark' } },
      emission: { count: 1, mode: 'burst' },
      motion: { velocity: vector() },
      space: 'local',
    });
    const graphic = new FlxGraphic(Texture.WHITE);
    const emitter = new FlxParticleEmitter(value, graphic, 10, 20);
    emitter.start();
    expect(emitter.members[0]).toMatchObject({ x: 10, y: 20 });

    emitter.x = 40;
    emitter.y = 50;
    FlxG.elapsed = 0;
    emitter.update();
    expect(emitter.members[0]).toMatchObject({ x: 40, y: 50 });
    emitter.destroy();
    graphic.destroy();
  });

  it('resolves already-loaded graphics through FlxAssets', () => {
    const value = preset({
      appearance: { texture: { assetId: 'spark' } },
      emission: { count: 1, mode: 'burst' },
    });
    const graphic = new FlxGraphic(Texture.WHITE);
    const assets = new FlxAssets().install(context);
    vi.spyOn(assets, 'getGraphic').mockReturnValue(graphic);
    const emitter = FlxParticleEmitter.fromAssets(value, { x: 3, y: 4 });
    emitter.start();
    expect(assets.getGraphic).toHaveBeenCalledWith('spark');
    expect(emitter.members[0]).toMatchObject({ x: 3, y: 4 });
    emitter.destroy();
    graphic.destroy();
  });

  it('validates sources and exposes runtime lifecycle controls', () => {
    expect(
      () => new FlxParticleEmitter(preset(), new FlxGraphic(Texture.WHITE)),
    ).toThrow('named frames');
    expect(() =>
      FlxParticleEmitter.fromAssets(
        preset({ appearance: { texture: { assetId: 'missing' } } }),
        { assets: new FlxAssets() },
      ),
    ).toThrow('has not been loaded');

    const emitter = new FlxParticleEmitter(preset(), namedFrames());
    emitter.start();
    emitter.pause();
    expect(emitter.diagnostics.state).toBe('paused');
    emitter.resume();
    emitter.stop(true);
    expect(emitter.diagnostics.activeCount).toBe(0);
    emitter.start();
    emitter.kill();
    expect(emitter.exists).toBe(false);
    expect(emitter.diagnostics.activeCount).toBe(0);
    emitter.destroy();
    emitter.destroy();
  });
});
