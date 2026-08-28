import type {
  EntityDefinition,
  PhysicsBodyDocumentV1,
  PhysicsJointDefinition,
  PhysicsWorldDocumentV1,
} from '@flixel-pixi/schemas';

import { createId, entityProperties } from './model';

export type SupportedJointType = PhysicsJointDefinition['type'];

export function bodyForEntity(
  world: PhysicsWorldDocumentV1,
  entityId: string,
): PhysicsBodyDocumentV1 | undefined {
  return world.bodies.find((body) => body.entityId === entityId);
}

export function createBodyForEntity(
  entity: EntityDefinition,
): PhysicsBodyDocumentV1 {
  const properties = entityProperties(entity);
  const width = Number(properties.width ?? 64) * (entity.scale?.x ?? 1);
  const height = Number(properties.height ?? 64) * (entity.scale?.y ?? 1);
  return {
    entityId: entity.id,
    fixedRotation: false,
    gravityScale: 1,
    id: createId('body'),
    kind: 'flixel-pixi-physics-body',
    material: { density: 1, friction: 0.4, restitution: 0.1 },
    schemaVersion: 1,
    shapes: [{ height, kind: 'box', width }],
    type: 'dynamic',
  };
}

export function removeBody(
  world: PhysicsWorldDocumentV1,
  bodyId: string,
): void {
  world.bodies = world.bodies.filter((body) => body.id !== bodyId);
  world.joints = (world.joints ?? []).filter(
    (joint) => joint.bodyA !== bodyId && joint.bodyB !== bodyId,
  );
}

function midpoint(a: EntityDefinition, b: EntityDefinition) {
  return {
    x: (a.position.x + b.position.x) / 2,
    y: (a.position.y + b.position.y) / 2,
  };
}

export function createJoint(
  type: SupportedJointType,
  bodyA: PhysicsBodyDocumentV1,
  bodyB: PhysicsBodyDocumentV1,
  entityA: EntityDefinition,
  entityB: EntityDefinition,
): PhysicsJointDefinition {
  const base = {
    bodyA: bodyA.id,
    bodyB: bodyB.id,
    collideConnected: false,
    id: createId('joint'),
  };
  const anchor = midpoint(entityA, entityB);
  if (type === 'distance') {
    return {
      ...base,
      anchorA: { ...entityA.position },
      anchorB: { ...entityB.position },
      dampingRatio: 0.25,
      frequencyHz: 3,
      length: Math.hypot(
        entityB.position.x - entityA.position.x,
        entityB.position.y - entityA.position.y,
      ),
      type,
    };
  }
  if (type === 'prismatic') {
    return {
      ...base,
      anchor,
      axis: { x: 1, y: 0 },
      enableLimit: true,
      lowerTranslation: -80,
      upperTranslation: 80,
      type,
    };
  }
  if (type === 'revolute') {
    return { ...base, anchor, enableLimit: false, type };
  }
  if (type === 'wheel') {
    return {
      ...base,
      anchor,
      axis: { x: 0, y: 1 },
      dampingRatio: 0.7,
      frequencyHz: 4,
      type,
    };
  }
  return { ...base, anchor, dampingRatio: 0.25, frequencyHz: 3, type: 'weld' };
}

export function updateBodyShape(
  body: PhysicsBodyDocumentV1,
  kind: 'box' | 'circle' | 'capsule',
  width: number,
  height: number,
): void {
  if (kind === 'circle') {
    body.shapes = [{ kind, radius: Math.max(1, Math.min(width, height) / 2) }];
  } else if (kind === 'capsule') {
    const radius = Math.max(1, Math.min(width, height) / 2);
    body.shapes = [
      {
        axis: width >= height ? 'x' : 'y',
        kind,
        length: Math.max(radius * 2, Math.max(width, height)),
        radius,
      },
    ];
  } else {
    body.shapes = [
      { height: Math.max(1, height), kind, width: Math.max(1, width) },
    ];
  }
}
