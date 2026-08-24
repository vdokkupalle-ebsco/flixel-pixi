import {
  Box,
  Circle,
  Polygon,
  World,
  type Body,
  type Contact,
  type Fixture,
  type FixtureOpt,
  type Shape,
} from 'planck';

import type {
  FlxPhysicsAabb,
  FlxPhysicsBackendBody,
  FlxPhysicsBackendContact,
  FlxPhysicsBackendQueryHit,
  FlxPhysicsBackendWorld,
  FlxPhysicsBodyDefinition,
  FlxPhysicsBodyState,
  FlxPhysicsBodyType,
  FlxPhysicsFilter,
  FlxPhysicsMaterial,
  FlxPhysicsQueryFilter,
  FlxPhysicsRayQuery,
  FlxPhysicsShape,
  FlxPhysicsTransform,
  FlxPhysicsVector,
} from 'flixel-pixi';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

interface BodyRecord {
  readonly body: Body;
  readonly id: string;
}

interface FixtureRecord {
  readonly body: BodyRecord;
  readonly fixture: Fixture;
  readonly id?: string;
  readonly order: number;
}

/** Construction options for the Planck adapter. @public */
export interface PlanckPhysicsBackendOptions {
  /** Solver metres per Flixel logical pixel. Defaults to `0.01`. */
  readonly metresPerPixel?: number;
  readonly positionIterations?: number;
  readonly velocityIterations?: number;
}

/** Explicit solver-native escape hatch for non-portable game code. @public */
export interface PlanckNativeAccess {
  readonly world: World;
  getBody(id: string): Body | undefined;
}

/** Create a synchronous Planck.js implementation of the portable backend. @public */
export function createPlanckPhysicsBackend(
  options: PlanckPhysicsBackendOptions = {},
): PlanckPhysicsBackend {
  return new PlanckPhysicsBackend(options);
}

/** Planck.js implementation of the Flixel-Pixi portable physics contract. @public */
export class PlanckPhysicsBackend implements FlxPhysicsBackendWorld {
  readonly capabilities = Object.freeze({
    shapes: Object.freeze(['box', 'circle', 'polygon', 'compound'] as const),
    queries: Object.freeze(['point', 'aabb', 'ray'] as const),
    joints: Object.freeze([]),
    sleeping: true,
    continuousCollision: true,
    deterministicReplay: false,
    debugGeometry: false,
  });

  readonly native: PlanckNativeAccess;
  readonly #metresPerPixel: number;
  readonly #positionIterations: number;
  readonly #velocityIterations: number;
  readonly #world: World;
  readonly #bodies = new Map<FlxPhysicsBackendBody, BodyRecord>();
  readonly #bodiesById = new Map<string, BodyRecord>();
  readonly #fixtures = new Map<Fixture, FixtureRecord>();
  #activeContacts = new Map<string, FlxPhysicsBackendContact>();
  #contactQueue: FlxPhysicsBackendContact[] = [];
  #destroyed = false;
  #nextFixtureOrder = 1;

  constructor(options: PlanckPhysicsBackendOptions = {}) {
    this.#metresPerPixel = options.metresPerPixel ?? 0.01;
    this.#positionIterations = options.positionIterations ?? 3;
    this.#velocityIterations = options.velocityIterations ?? 8;
    if (!Number.isFinite(this.#metresPerPixel) || this.#metresPerPixel <= 0) {
      throw new RangeError('metresPerPixel must be positive and finite.');
    }
    validateIterations(this.#positionIterations, 'positionIterations');
    validateIterations(this.#velocityIterations, 'velocityIterations');
    this.#world = new World();
    this.native = Object.freeze({
      world: this.#world,
      getBody: (id: string) => this.#bodiesById.get(id)?.body,
    });
  }

  setGravity(gravity: FlxPhysicsVector): void {
    this.#assertUsable();
    this.#world.setGravity(this.#toSolverVector(gravity));
  }

  createBody(definition: FlxPhysicsBodyDefinition): FlxPhysicsBackendBody {
    this.#assertUsable();
    const body = this.#world.createBody({
      type: definition.type,
      position: this.#toSolverVector(definition.position ?? { x: 0, y: 0 }),
      angle: (definition.angle ?? 0) * DEG_TO_RAD,
      linearVelocity: this.#toSolverVector(
        definition.velocity ?? { x: 0, y: 0 },
      ),
      angularVelocity: (definition.angularVelocity ?? 0) * DEG_TO_RAD,
      ...(definition.fixedRotation === undefined
        ? {}
        : { fixedRotation: definition.fixedRotation }),
      ...(definition.continuousCollision === undefined
        ? {}
        : { bullet: definition.continuousCollision }),
      ...(definition.allowSleep === undefined
        ? {}
        : { allowSleep: definition.allowSleep }),
      ...(definition.awake === undefined ? {} : { awake: definition.awake }),
      ...(definition.gravityScale === undefined
        ? {}
        : { gravityScale: definition.gravityScale }),
    });
    const handle: FlxPhysicsBackendBody = body;
    const record = { body, id: definition.id ?? '' };
    this.#bodies.set(handle, record);
    if (record.id.length > 0) this.#bodiesById.set(record.id, record);
    try {
      for (const shape of definition.shapes) {
        this.#createShapeFixtures(record, shape, definition);
      }
    } catch (error) {
      this.#world.destroyBody(body);
      this.#bodies.delete(handle);
      this.#bodiesById.delete(record.id);
      throw error;
    }
    return handle;
  }

  destroyBody(handle: FlxPhysicsBackendBody): void {
    const record = this.#requireBody(handle);
    for (
      let fixture = record.body.getFixtureList();
      fixture !== null;
      fixture = fixture.getNext()
    ) {
      this.#fixtures.delete(fixture);
    }
    this.#world.destroyBody(record.body);
    this.#bodies.delete(handle);
    this.#bodiesById.delete(record.id);
  }

  setBodyType(handle: FlxPhysicsBackendBody, type: FlxPhysicsBodyType): void {
    this.#requireBody(handle).body.setType(type);
  }

  setBodyTransform(
    handle: FlxPhysicsBackendBody,
    transform: FlxPhysicsTransform,
  ): void {
    this.#requireBody(handle).body.setTransform(
      this.#toSolverVector(transform.position),
      transform.angle * DEG_TO_RAD,
    );
  }

  setBodyVelocity(
    handle: FlxPhysicsBackendBody,
    velocity: FlxPhysicsVector,
    angularVelocity: number,
  ): void {
    const body = this.#requireBody(handle).body;
    body.setLinearVelocity(this.#toSolverVector(velocity));
    body.setAngularVelocity(angularVelocity * DEG_TO_RAD);
  }

  getBodyState(handle: FlxPhysicsBackendBody): FlxPhysicsBodyState {
    const body = this.#requireBody(handle).body;
    return {
      position: this.#fromSolverVector(body.getPosition()),
      angle: body.getAngle() * RAD_TO_DEG,
      velocity: this.#fromSolverVector(body.getLinearVelocity()),
      angularVelocity: body.getAngularVelocity() * RAD_TO_DEG,
      awake: body.isAwake(),
    };
  }

  applyForce(
    handle: FlxPhysicsBackendBody,
    force: FlxPhysicsVector,
    point?: FlxPhysicsVector,
  ): void {
    const body = this.#requireBody(handle).body;
    const solverForce = this.#toSolverVector(force);
    if (point === undefined) body.applyForceToCenter(solverForce, true);
    else body.applyForce(solverForce, this.#toSolverVector(point), true);
  }

  applyImpulse(
    handle: FlxPhysicsBackendBody,
    impulse: FlxPhysicsVector,
    point?: FlxPhysicsVector,
  ): void {
    const body = this.#requireBody(handle).body;
    body.applyLinearImpulse(
      this.#toSolverVector(impulse),
      point === undefined ? body.getWorldCenter() : this.#toSolverVector(point),
      true,
    );
  }

  queryPoint(
    point: FlxPhysicsVector,
    filter?: FlxPhysicsQueryFilter,
  ): readonly FlxPhysicsBackendQueryHit[] {
    this.#assertUsable();
    const solverPoint = this.#toSolverVector(point);
    const epsilon = 1e-6;
    const hits: FlxPhysicsBackendQueryHit[] = [];
    this.#world.queryAABB(
      {
        lowerBound: { x: solverPoint.x - epsilon, y: solverPoint.y - epsilon },
        upperBound: { x: solverPoint.x + epsilon, y: solverPoint.y + epsilon },
      },
      (fixture) => {
        const record = this.#fixtures.get(fixture);
        if (
          record !== undefined &&
          fixture.testPoint(solverPoint) &&
          matchesFilter(fixture, filter)
        ) {
          hits.push(this.#queryHit(record));
        }
        return true;
      },
    );
    return hits;
  }

  queryAabb(
    bounds: FlxPhysicsAabb,
    filter?: FlxPhysicsQueryFilter,
  ): readonly FlxPhysicsBackendQueryHit[] {
    this.#assertUsable();
    const hits: FlxPhysicsBackendQueryHit[] = [];
    this.#world.queryAABB(
      {
        lowerBound: this.#toSolverVector({ x: bounds.x, y: bounds.y }),
        upperBound: this.#toSolverVector({
          x: bounds.x + bounds.width,
          y: bounds.y + bounds.height,
        }),
      },
      (fixture) => {
        const record = this.#fixtures.get(fixture);
        if (record !== undefined && matchesFilter(fixture, filter)) {
          hits.push(this.#queryHit(record));
        }
        return true;
      },
    );
    return hits;
  }

  queryRay(query: FlxPhysicsRayQuery): readonly FlxPhysicsBackendQueryHit[] {
    this.#assertUsable();
    const hits: FlxPhysicsBackendQueryHit[] = [];
    this.#world.rayCast(
      this.#toSolverVector(query.from),
      this.#toSolverVector(query.to),
      (fixture, point, normal, fraction) => {
        const record = this.#fixtures.get(fixture);
        if (record === undefined || !matchesFilter(fixture, query.filter))
          return -1;
        hits.push({
          ...this.#queryHit(record),
          point: this.#fromSolverVector(point),
          normal: { x: normal.x, y: normal.y },
          fraction,
        });
        return query.mode === 'closest' ? fraction : 1;
      },
    );
    hits.sort(
      (first, second) => (first.fraction ?? 0) - (second.fraction ?? 0),
    );
    return query.mode === 'closest' ? hits.slice(0, 1) : hits;
  }

  drainContacts(): readonly FlxPhysicsBackendContact[] {
    this.#assertUsable();
    const contacts = this.#contactQueue;
    this.#contactQueue = [];
    return contacts;
  }

  step(elapsed: number): void {
    this.#assertUsable();
    this.#world.step(
      elapsed,
      this.#velocityIterations,
      this.#positionIterations,
    );
    const current = this.#collectContacts();
    const queue: FlxPhysicsBackendContact[] = [];
    for (const [id, contact] of current) {
      queue.push({
        ...contact,
        phase: this.#activeContacts.has(id) ? 'stay' : 'begin',
      });
    }
    for (const [id, contact] of this.#activeContacts) {
      if (!current.has(id)) queue.push({ ...contact, phase: 'end' });
    }
    this.#activeContacts = current;
    this.#contactQueue.push(...queue);
  }

  reset(): void {
    this.#assertUsable();
    for (const record of [...this.#bodies.values()]) {
      this.#world.destroyBody(record.body);
    }
    this.#bodies.clear();
    this.#bodiesById.clear();
    this.#fixtures.clear();
    this.#activeContacts.clear();
    this.#contactQueue = [];
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.reset();
    this.#destroyed = true;
  }

  #createShapeFixtures(
    body: BodyRecord,
    shape: FlxPhysicsShape,
    definition: FlxPhysicsBodyDefinition,
  ): void {
    if (shape.kind === 'compound') {
      shape.shapes.forEach((child, index) =>
        this.#createPrimitiveFixture(body, child, definition, {
          ...((child.id ?? shape.id) === undefined
            ? {}
            : {
                id: child.id ?? `${String(shape.id)}:${String(index)}`,
              }),
          ...((child.filter ?? shape.filter) === undefined
            ? {}
            : { filter: child.filter ?? shape.filter }),
          ...((child.material ?? shape.material) === undefined
            ? {}
            : { material: child.material ?? shape.material }),
          ...((child.sensor ?? shape.sensor) === undefined
            ? {}
            : { sensor: child.sensor ?? shape.sensor }),
        }),
      );
      return;
    }
    this.#createPrimitiveFixture(body, shape, definition, {});
  }

  #createPrimitiveFixture(
    body: BodyRecord,
    shape: Exclude<FlxPhysicsShape, { kind: 'compound' }>,
    definition: FlxPhysicsBodyDefinition,
    compoundDefaults: {
      readonly filter?: FlxPhysicsFilter;
      readonly id?: string;
      readonly material?: FlxPhysicsMaterial;
      readonly sensor?: boolean;
    },
  ): void {
    if (shape.kind === 'capsule') {
      throw new Error('Planck adapter does not support capsule shapes.');
    }
    const fixture = body.body.createFixture(this.#toPlanckShape(shape), {
      ...fixtureOptions(
        shape.material ?? compoundDefaults.material ?? definition.material,
        shape.filter ?? compoundDefaults.filter ?? definition.filter,
        shape.sensor ?? compoundDefaults.sensor,
      ),
    });
    const id = shape.id ?? compoundDefaults.id;
    this.#fixtures.set(fixture, {
      body,
      fixture,
      ...(id === undefined ? {} : { id }),
      order: this.#nextFixtureOrder++,
    });
  }

  #toPlanckShape(
    shape: Exclude<FlxPhysicsShape, { kind: 'compound' | 'capsule' }>,
  ): Shape {
    const offset = this.#toSolverVector(shape.offset ?? { x: 0, y: 0 });
    const angle = (shape.angle ?? 0) * DEG_TO_RAD;
    if (shape.kind === 'box') {
      return new Box(
        (shape.width * this.#metresPerPixel) / 2,
        (shape.height * this.#metresPerPixel) / 2,
        offset,
        angle,
      );
    }
    if (shape.kind === 'circle') {
      return new Circle(offset, shape.radius * this.#metresPerPixel);
    }
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    return new Polygon(
      shape.vertices.map((vertex) => ({
        x:
          (vertex.x * cosine - vertex.y * sine) * this.#metresPerPixel +
          offset.x,
        y:
          (vertex.x * sine + vertex.y * cosine) * this.#metresPerPixel +
          offset.y,
      })),
    );
  }

  #collectContacts(): Map<string, FlxPhysicsBackendContact> {
    const contacts = new Map<string, FlxPhysicsBackendContact>();
    for (
      let contact: Contact | null = this.#world.getContactList();
      contact !== null;
      contact = contact.getNext()
    ) {
      if (!contact.isTouching()) continue;
      const first = this.#fixtures.get(contact.getFixtureA());
      const second = this.#fixtures.get(contact.getFixtureB());
      if (first === undefined || second === undefined) continue;
      const manifold = contact.getWorldManifold(null);
      if (manifold === undefined) continue;
      const id = contactId(first, second);
      contacts.set(id, {
        id,
        phase: 'stay',
        bodyA: first.body.body,
        bodyB: second.body.body,
        ...(first.id === undefined ? {} : { fixtureA: first.id }),
        ...(second.id === undefined ? {} : { fixtureB: second.id }),
        sensor: first.fixture.isSensor() || second.fixture.isSensor(),
        normal: { x: manifold.normal.x, y: manifold.normal.y },
        points: manifold.points
          .slice(0, manifold.pointCount)
          .map((point, index) => ({
            point: this.#fromSolverVector(point),
            separation:
              (manifold.separations[index] ?? 0) / this.#metresPerPixel,
          })),
      });
    }
    return contacts;
  }

  #queryHit(record: FixtureRecord): FlxPhysicsBackendQueryHit {
    return {
      body: record.body.body,
      ...(record.id === undefined ? {} : { fixture: record.id }),
    };
  }

  #requireBody(handle: FlxPhysicsBackendBody): BodyRecord {
    this.#assertUsable();
    const body = this.#bodies.get(handle);
    if (body === undefined)
      throw new Error('Planck physics body has been destroyed.');
    return body;
  }

  #toSolverVector(vector: FlxPhysicsVector): FlxPhysicsVector {
    return {
      x: vector.x * this.#metresPerPixel,
      y: vector.y * this.#metresPerPixel,
    };
  }

  #fromSolverVector(vector: FlxPhysicsVector): FlxPhysicsVector {
    return {
      x: vector.x / this.#metresPerPixel,
      y: vector.y / this.#metresPerPixel,
    };
  }

  #assertUsable(): void {
    if (this.#destroyed)
      throw new Error('Planck physics backend has been destroyed.');
  }
}

function fixtureOptions(
  material?: FlxPhysicsMaterial,
  filter?: FlxPhysicsFilter,
  sensor = false,
): FixtureOpt {
  return {
    density: material?.density ?? 1,
    friction: material?.friction ?? 0.2,
    restitution: material?.restitution ?? 0,
    isSensor: sensor,
    filterCategoryBits: filter?.category ?? 1,
    filterMaskBits: filter?.mask ?? 0xffff,
    filterGroupIndex: filter?.group ?? 0,
  };
}

function matchesFilter(
  fixture: Fixture,
  filter?: FlxPhysicsQueryFilter,
): boolean {
  if (filter?.includeSensors === false && fixture.isSensor()) return false;
  if (
    filter?.category === undefined &&
    filter?.mask === undefined &&
    filter?.group === undefined
  ) {
    return true;
  }
  const queryGroup = filter?.group ?? 0;
  const fixtureGroup = fixture.getFilterGroupIndex();
  if (queryGroup !== 0 && queryGroup === fixtureGroup) return queryGroup > 0;
  return (
    (fixture.getFilterCategoryBits() & (filter?.mask ?? 0xffff)) !== 0 &&
    ((filter?.category ?? 0xffff) & fixture.getFilterMaskBits()) !== 0
  );
}

function contactId(first: FixtureRecord, second: FixtureRecord): string {
  const low = Math.min(first.order, second.order);
  const high = Math.max(first.order, second.order);
  return `planck-contact-${String(low)}-${String(high)}`;
}

function validateIterations(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive integer.`);
  }
}
