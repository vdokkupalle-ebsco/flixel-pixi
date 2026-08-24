import { describe, expect, it } from 'vitest';

import { FlxObject, FlxPhysicsWorld } from '../../src';
import type {
  FlxPhysicsAabb,
  FlxPhysicsBackendBody,
  FlxPhysicsBackendContact,
  FlxPhysicsBackendQueryHit,
  FlxPhysicsBackendWorld,
  FlxPhysicsBodyDefinition,
  FlxPhysicsBodyState,
  FlxPhysicsBodyType,
  FlxPhysicsQueryFilter,
  FlxPhysicsRayQuery,
  FlxPhysicsTransform,
  FlxPhysicsVector,
} from '../../src';

interface FakeBody extends FlxPhysicsBackendBody {
  definition: FlxPhysicsBodyDefinition;
  state: FlxPhysicsBodyState;
}

class FakeBackend implements FlxPhysicsBackendWorld {
  readonly capabilities = Object.freeze({
    shapes: Object.freeze(['box', 'circle', 'polygon'] as const),
    queries: Object.freeze(['point', 'aabb', 'ray'] as const),
    joints: Object.freeze([]),
    sleeping: true,
    continuousCollision: true,
    deterministicReplay: true,
    debugGeometry: true,
  });
  readonly bodies: FakeBody[] = [];
  readonly destroyedBodies: FakeBody[] = [];
  readonly trace: string[] = [];
  contacts: FlxPhysicsBackendContact[] = [];
  queryHits: FlxPhysicsBackendQueryHit[] = [];
  destroyed = false;
  resets = 0;

  setGravity(gravity: FlxPhysicsVector): void {
    this.trace.push(`gravity:${gravity.x},${gravity.y}`);
  }

  createBody(definition: FlxPhysicsBodyDefinition): FlxPhysicsBackendBody {
    const body: FakeBody = {
      definition,
      state: {
        position: definition.position ?? { x: 0, y: 0 },
        angle: definition.angle ?? 0,
        velocity: definition.velocity ?? { x: 0, y: 0 },
        angularVelocity: definition.angularVelocity ?? 0,
        awake: true,
      },
    };
    this.bodies.push(body);
    return body;
  }

  destroyBody(body: FlxPhysicsBackendBody): void {
    this.destroyedBodies.push(body as FakeBody);
  }

  setBodyType(body: FlxPhysicsBackendBody, type: FlxPhysicsBodyType): void {
    (body as FakeBody).definition = { ...(body as FakeBody).definition, type };
  }

  setBodyTransform(
    body: FlxPhysicsBackendBody,
    transform: FlxPhysicsTransform,
  ): void {
    const fake = body as FakeBody;
    fake.state = { ...fake.state, ...transform };
    this.trace.push(`transform:${fake.definition.id}`);
  }

  setBodyVelocity(
    body: FlxPhysicsBackendBody,
    velocity: FlxPhysicsVector,
    angularVelocity: number,
  ): void {
    const fake = body as FakeBody;
    fake.state = { ...fake.state, velocity, angularVelocity };
    this.trace.push(`velocity:${fake.definition.id}`);
  }

  getBodyState(body: FlxPhysicsBackendBody): FlxPhysicsBodyState {
    this.trace.push(`state:${(body as FakeBody).definition.id}`);
    return (body as FakeBody).state;
  }

  applyForce(
    body: FlxPhysicsBackendBody,
    force: FlxPhysicsVector,
    point?: FlxPhysicsVector,
  ): void {
    this.trace.push(
      `force:${(body as FakeBody).definition.id}:${force.x},${force.y}:${point?.x ?? ''}`,
    );
  }

  applyImpulse(
    body: FlxPhysicsBackendBody,
    impulse: FlxPhysicsVector,
    point?: FlxPhysicsVector,
  ): void {
    this.trace.push(
      `impulse:${(body as FakeBody).definition.id}:${impulse.x},${impulse.y}:${point?.x ?? ''}`,
    );
  }

  queryPoint(
    point: FlxPhysicsVector,
    filter?: FlxPhysicsQueryFilter,
  ): readonly FlxPhysicsBackendQueryHit[] {
    void point;
    void filter;
    return this.queryHits;
  }

  queryAabb(
    bounds: FlxPhysicsAabb,
    filter?: FlxPhysicsQueryFilter,
  ): readonly FlxPhysicsBackendQueryHit[] {
    void bounds;
    void filter;
    return this.queryHits;
  }

  queryRay(query: FlxPhysicsRayQuery): readonly FlxPhysicsBackendQueryHit[] {
    void query;
    return this.queryHits;
  }

  drainContacts(): readonly FlxPhysicsBackendContact[] {
    const contacts = this.contacts;
    this.contacts = [];
    return contacts;
  }

  getDebugGeometry() {
    return [{ kind: 'point' as const, point: { x: 1, y: 2 }, color: 0xffffff }];
  }

  step(elapsed: number): void {
    this.trace.push(`step:${elapsed}`);
  }

  reset(): void {
    this.resets += 1;
  }

  destroy(): void {
    this.destroyed = true;
  }
}

class ScaledFakeBackend extends FakeBackend {
  constructor(readonly scale: number) {
    super();
  }

  override setGravity(gravity: FlxPhysicsVector): void {
    super.setGravity(scaleVector(gravity, this.scale));
  }

  override createBody(
    definition: FlxPhysicsBodyDefinition,
  ): FlxPhysicsBackendBody {
    return super.createBody({
      ...definition,
      ...(definition.position === undefined
        ? {}
        : { position: scaleVector(definition.position, this.scale) }),
      ...(definition.velocity === undefined
        ? {}
        : { velocity: scaleVector(definition.velocity, this.scale) }),
    });
  }

  override setBodyTransform(
    body: FlxPhysicsBackendBody,
    transform: FlxPhysicsTransform,
  ): void {
    super.setBodyTransform(body, {
      angle: transform.angle,
      position: scaleVector(transform.position, this.scale),
    });
  }

  override setBodyVelocity(
    body: FlxPhysicsBackendBody,
    velocity: FlxPhysicsVector,
    angularVelocity: number,
  ): void {
    super.setBodyVelocity(
      body,
      scaleVector(velocity, this.scale),
      angularVelocity,
    );
  }

  override getBodyState(body: FlxPhysicsBackendBody): FlxPhysicsBodyState {
    const state = super.getBodyState(body);
    return {
      ...state,
      position: scaleVector(state.position, 1 / this.scale),
      velocity: scaleVector(state.velocity, 1 / this.scale),
    };
  }
}

const box = [{ kind: 'box' as const, width: 10, height: 20 }];

describe('FlxPhysicsWorld object bindings', () => {
  it('uses midpoint coordinates and the documented authority order', () => {
    const backend = new FakeBackend();
    const world = new FlxPhysicsWorld(backend);
    const fixed = new FlxObject(10, 20, 10, 20);
    const moving = new FlxObject(30, 40, 10, 20);
    const dynamic = new FlxObject(50, 60, 10, 20);
    fixed.velocity.x = 1;
    fixed.velocity.y = 2;
    moving.velocity.x = 3;
    moving.velocity.y = 4;
    moving.angularVelocity = 5;
    world.addBody(fixed, { id: 'fixed', type: 'static', shapes: box });
    world.addBody(moving, { id: 'moving', type: 'kinematic', shapes: box });
    world.addBody(dynamic, { id: 'dynamic', type: 'dynamic', shapes: box });
    fakeBody(backend, 2).state = {
      position: { x: 105, y: 210 },
      angle: 15,
      velocity: { x: 7, y: 8 },
      angularVelocity: 9,
      awake: true,
    };
    backend.trace.length = 0;

    world.step(0.5);

    expect(fakeBody(backend, 0).definition.position).toEqual({ x: 15, y: 30 });
    expect(backend.trace).toEqual([
      'transform:fixed',
      'velocity:fixed',
      'transform:moving',
      'velocity:moving',
      'step:0.5',
      'state:dynamic',
    ]);
    expect(dynamic).toMatchObject({
      x: 100,
      y: 200,
      angle: 15,
      angularVelocity: 9,
    });
    expect(dynamic.velocity).toMatchObject({ x: 7, y: 8 });
    expect(dynamic.last).toMatchObject({ x: 50, y: 60 });
    expect(fixed.moves).toBe(false);
    expect(moving.moves).toBe(true);
    expect(dynamic.moves).toBe(false);
  });

  it('supports controls, type changes, and restores arcade motion on detach', () => {
    const backend = new FakeBackend();
    const world = new FlxPhysicsWorld(backend);
    const object = new FlxObject(0, 0, 10, 10);
    object.touching = FlxObject.DOWN;
    const body = world.addBody(object, {
      id: 'player',
      type: 'dynamic',
      shapes: box,
    });

    body.setTransform({ position: { x: 20, y: 30 }, angle: 45 });
    body.setVelocity({ x: 2, y: 3 }, 4);
    body.applyForce({ x: 5, y: 6 });
    body.applyImpulse({ x: 7, y: 8 }, { x: 9, y: 10 });
    body.setType('kinematic');

    expect(object).toMatchObject({ x: 15, y: 25, angle: 45, moves: true });
    expect(body.type).toBe('kinematic');
    expect(backend.trace).toContain('force:player:5,6:');
    expect(backend.trace).toContain('impulse:player:7,8:9');
    expect(world.removeBody(object)).toBe(true);
    expect(world.removeBody(body)).toBe(false);
    expect(body.destroyed).toBe(true);
    expect(object.moves).toBe(true);
    expect(object.touching).toBe(FlxObject.DOWN);
    expect(backend.destroyedBodies).toHaveLength(1);
  });

  it('normalizes and stably orders query results', () => {
    const backend = new FakeBackend();
    const world = new FlxPhysicsWorld(backend);
    const firstObject = new FlxObject();
    const secondObject = new FlxObject();
    const first = world.addBody(firstObject, {
      id: 'a',
      type: 'static',
      shapes: box,
    });
    const second = world.addBody(secondObject, {
      id: 'b',
      type: 'static',
      shapes: box,
    });
    backend.queryHits = [
      { body: fakeBody(backend, 1), fraction: 0.8 },
      { body: {}, fraction: 0.1 },
      { body: fakeBody(backend, 0), fixture: 'main', fraction: 0.2 },
    ];

    expect(world.queryPoint({ x: 0, y: 0 }).map((hit) => hit.body)).toEqual([
      first,
      second,
    ]);
    expect(
      world.queryAabb({ x: 0, y: 0, width: 10, height: 10 })[0],
    ).toMatchObject({
      object: firstObject,
      fixture: 'main',
    });
    expect(
      world.queryRay({ from: { x: 0, y: 0 }, to: { x: 1, y: 1 } }),
    ).toHaveLength(2);
    expect(world.getDebugGeometry()).toHaveLength(1);
  });

  it('publishes immutable contacts after synchronization and tolerates mutation', () => {
    const backend = new FakeBackend();
    const world = new FlxPhysicsWorld(backend);
    const firstObject = new FlxObject(0, 0, 10, 10);
    const secondObject = new FlxObject(10, 0, 10, 10);
    const first = world.addBody(firstObject, {
      id: 'a',
      type: 'dynamic',
      shapes: box,
    });
    const second = world.addBody(secondObject, {
      id: 'b',
      type: 'dynamic',
      shapes: box,
    });
    const seen: string[] = [];
    world.contactStarted.add((contact) => {
      seen.push(`${contact.id}:${contact.objectA.x}`);
      first.destroy();
    });
    world.contactStayed.add((contact) => seen.push(contact.id));
    const firstBackendBody = fakeBody(backend, 0);
    firstBackendBody.state = {
      ...firstBackendBody.state,
      position: { x: 25, y: 5 },
    };
    backend.contacts = [
      contact('one', 'begin', fakeBody(backend, 0), fakeBody(backend, 1)),
      contact('two', 'stay', fakeBody(backend, 0), fakeBody(backend, 1)),
    ];

    world.step(1 / 60);

    expect(seen).toEqual(['one:20', 'two']);
    expect(first.destroyed).toBe(true);
    expect(second.destroyed).toBe(false);
    expect(firstObject.touching).toBe(FlxObject.RIGHT);
    expect(secondObject.touching).toBe(FlxObject.LEFT);
  });

  it('keeps adapter unit scaling behind the logical-pixel boundary', () => {
    const backend = new ScaledFakeBackend(0.1);
    const world = new FlxPhysicsWorld(backend, { gravity: { x: 0, y: 900 } });
    const object = new FlxObject(10, 20, 10, 20);
    world.addBody(object, { type: 'dynamic', shapes: box });
    const solverBody = fakeBody(backend, 0);

    expect(solverBody.definition.position).toEqual({ x: 1.5, y: 3 });
    expect(backend.trace[0]).toBe('gravity:0,90');
    solverBody.state = {
      ...solverBody.state,
      position: { x: 2.5, y: 4 },
      velocity: { x: 1.2, y: -0.5 },
    };
    world.step(1 / 60);

    expect(object).toMatchObject({ x: 20, y: 30 });
    expect(object.velocity.x).toBeCloseTo(12);
    expect(object.velocity.y).toBeCloseTo(-5);
  });

  it('cleans up in either destruction order and blocks arcade separation', () => {
    const backend = new FakeBackend();
    const world = new FlxPhysicsWorld(backend);
    const first = new FlxObject(0, 0, 10, 10);
    const second = new FlxObject(20, 0, 10, 10);
    const body = world.addBody(first, { type: 'dynamic', shapes: box });

    expect(() => FlxObject.separate(first, second)).toThrow('physics-managed');
    first.destroy();
    body.destroy();
    expect(world.bodyCount).toBe(0);
    expect(backend.destroyedBodies).toHaveLength(1);

    const detachedObject = new FlxObject();
    const detachedBody = world.addBody(detachedObject, {
      type: 'dynamic',
      shapes: box,
    });
    detachedBody.destroy();
    detachedObject.destroy();
    expect(backend.destroyedBodies).toHaveLength(2);

    const other = new FlxObject();
    world.addBody(other, { type: 'static', shapes: box });
    world.destroy();
    other.destroy();
    expect(backend.destroyed).toBe(true);
  });

  it('rejects invalid and unsupported portable definitions', () => {
    const backend = new FakeBackend();
    const world = new FlxPhysicsWorld(backend);
    expect(() =>
      world.addBody(new FlxObject(), {
        type: 'dynamic',
        shapes: [{ kind: 'box', width: 0, height: 10 }],
      }),
    ).toThrow('width');
    expect(() =>
      world.addBody(new FlxObject(), {
        type: 'dynamic',
        shapes: [{ kind: 'capsule', radius: 2, length: 4 }],
      }),
    ).toThrow('shape:capsule');
    expect(() => world.queryPoint({ x: 0, y: 0 }, { mask: 1.5 })).toThrow(
      '16-bit integer',
    );
  });
});

function contact(
  id: string,
  phase: 'begin' | 'stay',
  bodyA: FlxPhysicsBackendBody,
  bodyB: FlxPhysicsBackendBody,
): FlxPhysicsBackendContact {
  return {
    id,
    phase,
    bodyA,
    bodyB,
    sensor: false,
    normal: { x: 1, y: 0 },
    points: [{ point: { x: 10, y: 5 }, separation: -1 }],
  };
}

function fakeBody(backend: FakeBackend, index: number): FakeBody {
  const body = backend.bodies[index];
  if (body === undefined) throw new Error(`Missing fake body ${index}.`);
  return body;
}

function scaleVector(
  vector: FlxPhysicsVector,
  scale: number,
): FlxPhysicsVector {
  return { x: vector.x * scale, y: vector.y * scale };
}
