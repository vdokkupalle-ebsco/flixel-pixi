import { describe, expect, it } from 'vitest';
import {
  DistanceJoint,
  PrismaticJoint,
  RevoluteJoint,
  WeldJoint,
  WheelJoint,
} from 'planck';

import { FlxObject, FlxPhysicsWorld } from 'flixel-pixi';

import {
  createPlanckPhysicsBackend,
  PlanckPhysicsBackend,
} from '../src/index.js';

const box = (width: number, height: number) => [
  { kind: 'box' as const, width, height },
];

describe('PlanckPhysicsBackend', () => {
  it('simulates a dynamic body against static geometry in logical pixels', () => {
    const backend = createPlanckPhysicsBackend({ metresPerPixel: 0.01 });
    const world = new FlxPhysicsWorld(backend, {
      gravity: { x: 0, y: 900 },
    });
    const ground = new FlxObject(0, 100, 200, 20);
    const player = new FlxObject(90, 0, 20, 20);
    world.addBody(ground, {
      id: 'ground',
      type: 'static',
      shapes: box(200, 20),
    });
    world.addBody(player, {
      id: 'player',
      type: 'dynamic',
      fixedRotation: true,
      shapes: box(20, 20),
    });
    const phases: string[] = [];
    let ended = 0;
    world.contactStarted.add(({ phase, depth }) =>
      phases.push(`${phase}:${depth >= 0}`),
    );
    world.contactStayed.add(({ phase }) => phases.push(phase));
    world.contactEnded.add(() => (ended += 1));

    for (let index = 0; index < 120; index += 1) world.step(1 / 60);

    // Planck's polygon skin and collision slop leave the bodies slightly apart.
    expect(player.y).toBeCloseTo(78.5, 0);
    expect(player.velocity.y).toBeCloseTo(0, 1);
    expect(phases).toContain('begin:true');
    expect(phases).toContain('stay');
    expect(player.touching).toBe(FlxObject.DOWN);

    const playerBody = world.getBody(player);
    playerBody?.setTransform({ position: { x: 90, y: 0 }, angle: 0 });
    world.step(1 / 60);
    expect(ended).toBe(1);
  });

  it('supports point, AABB, ray, fixture filters, and sensors', () => {
    const backend = new PlanckPhysicsBackend();
    const world = new FlxPhysicsWorld(backend);
    const sensor = new FlxObject(10, 20, 30, 40);
    const body = world.addBody(sensor, {
      id: 'sensor',
      type: 'static',
      shapes: [
        {
          id: 'zone',
          kind: 'box',
          width: 30,
          height: 40,
          sensor: true,
          filter: { category: 0x0002, mask: 0x0004 },
        },
      ],
    });

    expect(
      world.queryPoint({ x: 25, y: 40 }, { category: 4, mask: 2 })[0],
    ).toMatchObject({
      body,
      fixture: 'zone',
    });
    expect(
      world.queryPoint(
        { x: 25, y: 40 },
        { category: 4, mask: 2, includeSensors: false },
      ),
    ).toEqual([]);
    expect(world.queryAabb({ x: 0, y: 0, width: 50, height: 70 })).toHaveLength(
      1,
    );
    const ray = world.queryRay({
      from: { x: 0, y: 40 },
      to: { x: 100, y: 40 },
      mode: 'closest',
    });
    expect(ray).toHaveLength(1);
    expect(ray[0]?.point?.x).toBeCloseTo(10, 5);
    expect(ray[0]?.normal).toEqual({ x: -1, y: 0 });
  });

  it('reports overlapping sensors even when Planck has no contact manifold', () => {
    const world = new FlxPhysicsWorld(new PlanckPhysicsBackend());
    const zone = new FlxObject(0, 0, 40, 40);
    const visitor = new FlxObject(10, 10, 10, 10);
    world.addBody(zone, {
      id: 'zone',
      type: 'static',
      shapes: [{ kind: 'box', width: 40, height: 40, sensor: true }],
    });
    world.addBody(visitor, {
      id: 'visitor',
      type: 'dynamic',
      shapes: box(10, 10),
    });
    const contacts: { sensor: boolean; points: number }[] = [];
    world.contactStarted.add((contact) =>
      contacts.push({ sensor: contact.sensor, points: contact.points.length }),
    );

    world.step(1 / 60);

    expect(contacts).toEqual([{ sensor: true, points: 0 }]);
  });

  it('converts degrees and exposes explicit native access', () => {
    const backend = new PlanckPhysicsBackend({ metresPerPixel: 0.02 });
    const world = new FlxPhysicsWorld(backend);
    const object = new FlxObject(10, 20, 20, 10);
    object.angle = 90;
    const body = world.addBody(object, {
      id: 'native',
      type: 'dynamic',
      shapes: [{ kind: 'circle', radius: 5 }],
    });
    const nativeBody = backend.native.getBody(body.id);

    expect(nativeBody?.getPosition()).toMatchObject({ x: 0.4, y: 0.5 });
    expect(nativeBody?.getAngle()).toBeCloseTo(Math.PI / 2);
    body.setTransform({ position: { x: 50, y: 75 }, angle: 180 });
    expect(nativeBody?.getPosition()).toMatchObject({ x: 1, y: 1.5 });
    expect(nativeBody?.getAngle()).toBeCloseTo(Math.PI);
  });

  it('creates and converts every portable joint type', () => {
    const backend = new PlanckPhysicsBackend({ metresPerPixel: 0.01 });
    const world = new FlxPhysicsWorld(backend);
    const bodies = Array.from({ length: 6 }, (_, index) => {
      const object = new FlxObject(index * 50, 0, 10, 10);
      return world.addBody(object, {
        id: `body-${String(index)}`,
        type: index === 0 ? 'static' : 'dynamic',
        shapes: box(10, 10),
      });
    });
    const ground = bodies[0];
    if (ground === undefined) throw new Error('Expected a ground body.');
    const body = (index: number) => {
      const value = bodies[index];
      if (value === undefined) throw new Error('Expected a test body.');
      return value;
    };

    world.addJoint({
      id: 'distance',
      type: 'distance',
      bodyA: ground,
      bodyB: body(1),
      anchorA: { x: 5, y: 5 },
      anchorB: { x: 55, y: 5 },
      length: 40,
      frequencyHz: 3,
      dampingRatio: 0.4,
    });
    world.addJoint({
      id: 'revolute',
      type: 'revolute',
      bodyA: ground,
      bodyB: body(2),
      anchor: { x: 105, y: 5 },
      enableLimit: true,
      lowerAngle: -45,
      upperAngle: 45,
      enableMotor: true,
      motorSpeed: 90,
      maxMotorTorque: 200,
    });
    world.addJoint({
      id: 'prismatic',
      type: 'prismatic',
      bodyA: ground,
      bodyB: body(3),
      anchor: { x: 155, y: 5 },
      axis: { x: 2, y: 0 },
      enableLimit: true,
      lowerTranslation: -20,
      upperTranslation: 30,
      enableMotor: true,
      motorSpeed: 25,
      maxMotorForce: 300,
    });
    world.addJoint({
      id: 'weld',
      type: 'weld',
      bodyA: ground,
      bodyB: body(4),
      anchor: { x: 205, y: 5 },
      referenceAngle: 30,
      frequencyHz: 2,
      dampingRatio: 0.5,
    });
    world.addJoint({
      id: 'wheel',
      type: 'wheel',
      bodyA: ground,
      bodyB: body(5),
      anchor: { x: 255, y: 5 },
      axis: { x: 0, y: 4 },
      enableMotor: true,
      motorSpeed: 180,
      maxMotorTorque: 400,
      frequencyHz: 4,
      dampingRatio: 0.7,
    });

    const distance = backend.native.getJoint('distance');
    const revolute = backend.native.getJoint('revolute');
    const prismatic = backend.native.getJoint('prismatic');
    const weld = backend.native.getJoint('weld');
    const wheel = backend.native.getJoint('wheel');
    expect(distance).toBeInstanceOf(DistanceJoint);
    expect(revolute).toBeInstanceOf(RevoluteJoint);
    expect(prismatic).toBeInstanceOf(PrismaticJoint);
    expect(weld).toBeInstanceOf(WeldJoint);
    expect(wheel).toBeInstanceOf(WheelJoint);
    if (!(distance instanceof DistanceJoint)) throw new Error('Wrong joint.');
    if (!(revolute instanceof RevoluteJoint)) throw new Error('Wrong joint.');
    if (!(prismatic instanceof PrismaticJoint)) throw new Error('Wrong joint.');
    if (!(weld instanceof WeldJoint)) throw new Error('Wrong joint.');
    if (!(wheel instanceof WheelJoint)) throw new Error('Wrong joint.');
    expect(distance.getLength()).toBeCloseTo(0.4);
    expect(distance.getFrequency()).toBe(3);
    expect(revolute.getMotorSpeed()).toBeCloseTo(Math.PI / 2);
    expect(revolute.getLowerLimit()).toBeCloseTo(-Math.PI / 4);
    expect(prismatic.getMotorSpeed()).toBeCloseTo(0.25);
    expect(prismatic.getUpperLimit()).toBeCloseTo(0.3);
    expect(weld.getReferenceAngle()).toBeCloseTo(Math.PI / 6);
    expect(wheel.getMotorSpeed()).toBeCloseTo(Math.PI);
    expect(wheel.getSpringFrequencyHz()).toBe(4);
    expect(backend.native.world.getJointCount()).toBe(5);
  });

  it('simulates motors and destroys joints before connected bodies', () => {
    const backend = new PlanckPhysicsBackend({ metresPerPixel: 0.01 });
    const world = new FlxPhysicsWorld(backend);
    const pivot = world.addBody(new FlxObject(95, 95, 10, 10), {
      id: 'pivot',
      type: 'static',
      shapes: box(10, 10),
    });
    const wheelObject = new FlxObject(95, 115, 10, 10);
    const wheelBody = world.addBody(wheelObject, {
      id: 'motor-body',
      type: 'dynamic',
      shapes: [{ kind: 'circle', radius: 5 }],
    });
    const joint = world.addJoint({
      id: 'motor',
      type: 'revolute',
      bodyA: pivot,
      bodyB: wheelBody,
      anchor: { x: 100, y: 100 },
      enableMotor: true,
      motorSpeed: 180,
      maxMotorTorque: 10_000,
    });

    for (let index = 0; index < 30; index += 1) world.step(1 / 60);

    expect(Math.abs(wheelObject.angle)).toBeGreaterThan(30);
    expect(backend.native.world.getJointCount()).toBe(1);
    wheelBody.destroy();
    expect(joint.destroyed).toBe(true);
    expect(backend.native.getJoint('motor')).toBeUndefined();
    expect(backend.native.world.getJointCount()).toBe(0);
  });

  it('supports polygon and compound fixtures through the portable API', () => {
    const world = new FlxPhysicsWorld(new PlanckPhysicsBackend());
    const object = new FlxObject(20, 20, 40, 40);
    world.addBody(object, {
      id: 'compound',
      type: 'static',
      shapes: [
        {
          kind: 'compound',
          shapes: [
            {
              id: 'circle',
              kind: 'circle',
              radius: 8,
              offset: { x: -10, y: 0 },
            },
            {
              id: 'triangle',
              kind: 'polygon',
              vertices: [
                { x: 0, y: -8 },
                { x: 8, y: 8 },
                { x: -8, y: 8 },
              ],
              offset: { x: 10, y: 0 },
            },
          ],
        },
      ],
    });

    expect(world.queryPoint({ x: 30, y: 40 })[0]?.fixture).toBe('circle');
    expect(world.queryPoint({ x: 50, y: 40 })[0]?.fixture).toBe('triangle');
  });

  it('converts portable impulses and rejects unsupported shapes', () => {
    const world = new FlxPhysicsWorld(
      new PlanckPhysicsBackend({ metresPerPixel: 0.02 }),
    );
    const object = new FlxObject(0, 0, 10, 10);
    const body = world.addBody(object, {
      type: 'dynamic',
      shapes: box(10, 10),
    });
    body.applyImpulse({ x: 0.5, y: 0 });
    world.step(1 / 60);
    expect(object.x).toBeGreaterThan(0);

    expect(() =>
      world.addBody(new FlxObject(), {
        type: 'dynamic',
        shapes: [{ kind: 'capsule', radius: 5, length: 20 }],
      }),
    ).toThrow(/does not support.*capsule/);
  });

  it('resets and destroys repeatedly without retaining bodies', () => {
    for (let iteration = 0; iteration < 25; iteration += 1) {
      const backend = new PlanckPhysicsBackend();
      const world = new FlxPhysicsWorld(backend);
      const object = new FlxObject();
      const body = world.addBody(object, {
        type: 'dynamic',
        shapes: box(10, 10),
      });
      world.step(1 / 60);
      world.reset();
      expect(body.destroyed).toBe(true);
      expect(backend.native.world.getBodyCount()).toBe(0);
      world.destroy();
      world.destroy();
      expect(backend.native.world.getBodyCount()).toBe(0);
    }
  });

  it('reports optional capabilities accurately', () => {
    const backend = new PlanckPhysicsBackend();
    expect(backend.capabilities).toMatchObject({
      continuousCollision: true,
      debugGeometry: false,
      deterministicReplay: false,
      sleeping: true,
    });
    expect(backend.capabilities.shapes).toEqual([
      'box',
      'circle',
      'polygon',
      'compound',
    ]);
    expect(backend.capabilities.queries).toEqual(['point', 'aabb', 'ray']);
    expect(backend.capabilities.joints).toEqual([
      'distance',
      'revolute',
      'prismatic',
      'weld',
      'wheel',
    ]);
  });
});
