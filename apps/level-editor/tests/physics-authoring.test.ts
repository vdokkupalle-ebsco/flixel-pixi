import { parsePhysicsWorld } from '@flixel-pixi/schemas';
import { describe, expect, it } from 'vitest';

import { createSpriteEntity } from '../src/model';
import {
  createBodyForEntity,
  createJoint,
  removeBody,
  updateBodyShape,
  type SupportedJointType,
} from '../src/physics-authoring';

describe('physics authoring', () => {
  it('creates portable bodies sized from the rendered entity', () => {
    const entity = createSpriteEntity('asset-flixel-mark', 1);
    const body = createBodyForEntity(entity);
    expect(body.entityId).toBe(entity.id);
    expect(body.shapes[0]).toMatchObject({
      height: 96,
      kind: 'box',
      width: 96,
    });
    updateBodyShape(body, 'circle', 120, 80);
    expect(body.shapes[0]).toEqual({ kind: 'circle', radius: 40 });
  });

  it.each<SupportedJointType>([
    'distance',
    'revolute',
    'prismatic',
    'weld',
    'wheel',
  ])('creates a schema-valid %s joint', (type) => {
    const entityA = createSpriteEntity('asset-flixel-mark', 1);
    const entityB = createSpriteEntity('asset-flixel-mark', 2);
    const bodyA = createBodyForEntity(entityA);
    const bodyB = createBodyForEntity(entityB);
    const world = {
      bodies: [bodyA, bodyB],
      gravity: { x: 0, y: 900 },
      id: 'test-world',
      joints: [createJoint(type, bodyA, bodyB, entityA, entityB)],
      kind: 'flixel-pixi-physics-world' as const,
      schemaVersion: 1 as const,
    };
    expect(parsePhysicsWorld(world).joints?.[0]?.type).toBe(type);
  });

  it('removes joints when a connected body is removed', () => {
    const entityA = createSpriteEntity('asset-flixel-mark', 1);
    const entityB = createSpriteEntity('asset-flixel-mark', 2);
    const bodyA = createBodyForEntity(entityA);
    const bodyB = createBodyForEntity(entityB);
    const world = {
      bodies: [bodyA, bodyB],
      gravity: { x: 0, y: 900 },
      id: 'test-world',
      joints: [createJoint('distance', bodyA, bodyB, entityA, entityB)],
      kind: 'flixel-pixi-physics-world' as const,
      schemaVersion: 1 as const,
    };
    removeBody(world, bodyA.id);
    expect(world.bodies).toEqual([bodyB]);
    expect(world.joints).toEqual([]);
  });
});
