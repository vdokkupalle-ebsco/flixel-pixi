import { Container, Texture, type Renderer } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  FlxCameraRenderer,
  FlxContext,
  FlxEmitter,
  FlxEmitterRenderHandle,
  FlxG,
  FlxObject,
  FlxParticle,
  FlxSprite,
} from '../../src';

let context: FlxContext;

beforeEach(() => {
  context = new FlxContext(200, 120, 0.5);
  FlxG.installContext(context);
});

afterEach(() => {
  FlxG.clearContext(context);
});

function configuredEmitter(quantity = 8): FlxEmitter {
  const emitter = new FlxEmitter(50, 40, quantity);
  emitter.makeParticles(Texture.WHITE, quantity, 0, false, 0);
  emitter.setSize(20, 10);
  emitter.setXSpeed(-30, 40);
  emitter.setYSpeed(-50, -10);
  emitter.setRotation(-90, 120);
  emitter.gravity = 80;
  emitter.particleDrag.make(2, 3);
  emitter.bounce = 0.4;
  return emitter;
}

describe('Phase 8 particles and emitters', () => {
  it('produces repeatable seeded burst order and launch conditions', () => {
    const capture = (): number[][] => {
      FlxG.globalSeed = 0.375;
      const emitter = configuredEmitter(4);
      emitter.start(true, 2, 0.1, 3);
      FlxG.elapsed = 1 / 60;
      emitter.update();
      const result = emitter.members
        .slice(0, emitter.length)
        .filter((particle): particle is FlxParticle => particle !== null)
        .map((particle) => [
          particle.x,
          particle.y,
          particle.velocity.x,
          particle.velocity.y,
          particle.angularVelocity,
          particle.angle,
          particle.lifespan,
        ]);
      emitter.destroy();
      return result;
    };

    expect(capture()).toEqual(capture());
  });

  it('catches up streams, stops at quantity, and reuses a stable pool', () => {
    const emitter = configuredEmitter(16);
    const identities = emitter.members.slice(0, emitter.length);
    emitter.start(false, 1, 0.01, 5);
    FlxG.elapsed = 0.051;
    emitter.update();
    expect(emitter.on).toBe(false);
    expect(emitter.members.filter((particle) => particle?.exists)).toHaveLength(
      5,
    );

    emitter.start(false, 0.03, 0.01, 0);
    for (let index = 0; index < 1_000; index += 1) {
      FlxG.elapsed = 1 / 60;
      emitter.update();
    }
    expect(emitter.length).toBe(16);
    expect(emitter.members.slice(0, emitter.length)).toEqual(identities);
    expect(emitter.countDead()).toBeGreaterThan(0);
    emitter.destroy();
  });

  it('supports custom particles, manual emission, helpers, and killing', () => {
    let emissions = 0;
    class CustomParticle extends FlxParticle {
      override onEmit(): void {
        emissions += 1;
      }
    }
    const emitter = new FlxEmitter(0, 0, 2);
    emitter.particleClass = CustomParticle;
    emitter.makeParticles(Texture.WHITE, 2, 0, false, 0.5);
    const target = new FlxSprite(20, 30).makeGraphic(10, 14);
    emitter.setSize(4, 6);
    emitter.at(target);
    expect({ x: emitter.x, y: emitter.y }).toEqual({ x: 23, y: 34 });
    emitter.emitParticle();
    expect(emissions).toBe(1);
    expect(emitter.members[0]).toBeInstanceOf(CustomParticle);
    expect(emitter.members[0]?.allowCollisions).toBe(FlxObject.ANY);
    emitter.kill();
    expect(emitter.on).toBe(false);
    expect(emitter.exists).toBe(false);
    target.destroy();
    emitter.destroy();
  });

  it('applies particle lifespan and contact friction behavior', () => {
    const particle = new FlxParticle();
    particle.update();
    expect(particle.lifespan).toBe(0);
    particle.lifespan = 1;
    particle.touching = FlxObject.WALL;
    particle.angularVelocity = 8;
    particle.update();
    expect(particle.angularVelocity).toBe(-8);

    particle.lifespan = 1;
    particle.acceleration.y = 100;
    particle.elasticity = 0.5;
    particle.velocity.y = -2;
    particle.angularVelocity = 10;
    particle.touching = FlxObject.FLOOR;
    particle.wasTouching = FlxObject.NONE;
    FlxG.elapsed = 0.25;
    particle.update();
    expect(particle.lifespan).toBe(0.75);
    expect(particle.drag.x).toBe(500);
    expect(particle.velocity.y).toBe(0);
    expect(particle.angularVelocity).toBe(0);
    particle.exists = true;
    particle.lifespan = 1;
    particle.touching = FlxObject.FLOOR;
    particle.wasTouching = FlxObject.NONE;
    particle.velocity.y = -20;
    particle.angularVelocity = 10;
    particle.update();
    expect(particle.angularVelocity).toBe(5);
    particle.wasTouching = FlxObject.FLOOR;
    particle.angularVelocity = 0;
    particle.update();
    expect(particle.angularVelocity).toBe(0);
    particle.touching = FlxObject.NONE;
    particle.update();
    expect(particle.drag.x).toBe(0);
    particle.lifespan = 0.1;
    particle.update();
    expect(particle.exists).toBe(false);
    particle.destroy();
  });

  it('keeps Pixi particle allocation stable in both render modes', () => {
    const emitter = configuredEmitter(12);
    const optimized = new FlxEmitterRenderHandle(emitter, {
      optimized: true,
    });
    const sprites = new FlxEmitterRenderHandle(emitter);
    optimized.sync(context.camera);
    sprites.sync(context.camera);
    expect(optimized.projectedParticleCount).toBe(12);
    expect(optimized.particleContainer?.particleChildren).toHaveLength(12);
    expect(sprites.projectedParticleCount).toBe(12);
    const projections = optimized.particleContainer?.particleChildren.slice();

    emitter.start(false, 0.03, 0.005, 0);
    for (let index = 0; index < 300; index += 1) {
      FlxG.elapsed = 1 / 60;
      emitter.update();
      optimized.sync(context.camera);
    }
    expect(optimized.particleContainer?.particleChildren).toEqual(projections);
    optimized.destroy();
    optimized.destroy();
    sprites.destroy();
    emitter.destroy();
  });

  it('routes an opt-in ParticleContainer through camera render passes', () => {
    const calls: unknown[] = [];
    const renderer = {
      render(options: unknown): void {
        calls.push(options);
      },
      resolution: 1,
    } as unknown as Renderer;
    const stage = new Container();
    const cameraRenderer = new FlxCameraRenderer(renderer, stage, context);
    cameraRenderer.debugBounds = true;
    const emitter = configuredEmitter(4);
    const handle = cameraRenderer.add(emitter, { optimized: true });
    expect(handle).toBeInstanceOf(FlxEmitterRenderHandle);
    emitter.start(true, 1, 0.1, 2);
    FlxG.elapsed = 1 / 60;
    emitter.update();
    cameraRenderer.render();
    expect(handle.view.position).toMatchObject({ x: 0, y: 0 });
    expect(calls).toHaveLength(2);
    cameraRenderer.destroy();
    emitter.destroy();
    stage.destroy({ children: true });
  });

  it('validates emitter configuration', () => {
    const emitter = new FlxEmitter();
    expect(() => emitter.makeParticles(Texture.WHITE, -1)).toThrow(RangeError);
    expect(() => emitter.makeParticles(Texture.WHITE, 1, -1)).toThrow(
      RangeError,
    );
    expect(() =>
      emitter.makeParticles(Texture.WHITE, 1, 0, false, Number.NaN),
    ).toThrow(RangeError);
    expect(() => emitter.start(true, -1)).toThrow(RangeError);
    expect(() => emitter.start(true, 1, -1)).toThrow(RangeError);
    expect(() => emitter.start(true, 1, 1, -1)).toThrow(RangeError);
    expect(() => emitter.setSize(-1, 1)).toThrow(RangeError);
    expect(() => emitter.setXSpeed(Number.NaN, 1)).toThrow(RangeError);
    expect(() => emitter.setYSpeed(0, Number.NaN)).toThrow(RangeError);
    expect(() => emitter.setRotation(0, Number.NaN)).toThrow(RangeError);
    emitter.destroy();
  });
});
