import { Texture } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FlxAssets,
  FlxContext,
  FlxG,
  FlxGraphic,
  FlxParticleEffect,
  type ParticleEffectDocumentV1,
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

function fixed(value: number): { max: number; min: number } {
  return { max: value, min: value };
}

function preset(id: string, space: 'local' | 'world'): ParticlePresetV1 {
  return {
    appearance: { texture: { assetId: id } },
    capacity: 4,
    emission: { count: 1, mode: 'burst' },
    id,
    kind: 'particle-preset',
    lifespan: fixed(2),
    motion: {
      acceleration: { x: fixed(0), y: fixed(0) },
      drag: { x: fixed(0), y: fixed(0) },
      velocity: { x: fixed(0), y: fixed(0) },
    },
    name: id,
    schemaVersion: 1,
    seed: 7,
    space,
    spawn: { shape: 'point' },
  };
}

function document(): ParticleEffectDocumentV1 {
  return {
    emitters: [
      {
        enabled: true,
        layerId: 'local-layer',
        name: 'Local',
        offset: { x: 4, y: -3 },
        preset: preset('local-particle', 'local'),
        textureShape: 'circle',
      },
      {
        enabled: false,
        layerId: 'disabled-layer',
        name: 'Disabled',
        offset: { x: 20, y: 20 },
        preset: preset('disabled-particle', 'world'),
        textureShape: 'square',
      },
      {
        enabled: true,
        layerId: 'world-layer',
        name: 'World',
        offset: { x: -5, y: 6 },
        preset: preset('world-particle', 'world'),
        textureShape: 'circle',
      },
    ],
    id: 'layered-effect',
    kind: 'flixel-pixi-particle-effect',
    name: 'Layered effect',
    version: 1,
  };
}

describe('FlxParticleEffect', () => {
  it('creates enabled emitters in document order and applies offsets', () => {
    const graphic = new FlxGraphic(Texture.WHITE);
    const resolver = vi.fn(() => graphic);
    const effect = new FlxParticleEffect(document(), resolver, 30, 40);

    expect(effect.layers.map(({ definition }) => definition.layerId)).toEqual([
      'local-layer',
      'world-layer',
    ]);
    expect(resolver).not.toHaveBeenCalledWith(
      'disabled-particle',
      expect.anything(),
    );
    expect(effect.members[0]).toMatchObject({ x: 34, y: 37 });
    expect(effect.members[1]).toMatchObject({ x: 25, y: 46 });

    effect.start();
    expect(effect.diagnostics).toMatchObject({
      activeCount: 2,
      capacity: 8,
      emittedCount: 2,
      emitting: false,
    });

    effect.destroy();
    graphic.destroy();
  });

  it('moves local particles while already-spawned world particles stay put', () => {
    const graphic = new FlxGraphic(Texture.WHITE);
    const effect = new FlxParticleEffect(document(), () => graphic, 10, 20);
    effect.start();
    const localParticle = effect.layers[0]?.emitter.members[0];
    const worldParticle = effect.layers[1]?.emitter.members[0];
    expect(localParticle).toMatchObject({ x: 14, y: 17 });
    expect(worldParticle).toMatchObject({ x: 5, y: 26 });

    effect.setPosition(50, 60);
    FlxG.elapsed = 0;
    effect.update();
    expect(localParticle).toMatchObject({ x: 54, y: 57 });
    expect(worldParticle).toMatchObject({ x: 5, y: 26 });

    effect.destroy();
    graphic.destroy();
  });

  it('resolves preloaded graphics and supports automatic start', () => {
    const graphic = new FlxGraphic(Texture.WHITE);
    const assets = new FlxAssets().install(context);
    vi.spyOn(assets, 'getGraphic').mockReturnValue(graphic);

    const effect = FlxParticleEffect.fromAssets(document(), {
      assets,
      autoStart: true,
      x: 3,
      y: 7,
    });
    expect(assets.getGraphic).toHaveBeenCalledWith('local-particle');
    expect(assets.getGraphic).toHaveBeenCalledWith('world-particle');
    expect(effect.diagnostics.activeCount).toBe(2);

    effect.destroy();
    graphic.destroy();
  });
});
