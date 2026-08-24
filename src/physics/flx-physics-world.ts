import { FlxSignal } from '../core/flx-signal';
import { FlxObject } from '../objects/flx-object';
import type {
  FlxPhysicsAabb,
  FlxPhysicsBackendBody,
  FlxPhysicsBackendContact,
  FlxPhysicsBackendJoint,
  FlxPhysicsBackendJointDefinition,
  FlxPhysicsBackendQueryHit,
  FlxPhysicsBackendWorld,
  FlxPhysicsBody,
  FlxPhysicsBodyState,
  FlxPhysicsBodyType,
  FlxPhysicsCapabilities,
  FlxPhysicsContact,
  FlxPhysicsDebugPrimitive,
  FlxPhysicsFilter,
  FlxPhysicsJoint,
  FlxPhysicsJointDefinition,
  FlxPhysicsJointType,
  FlxPhysicsMaterial,
  FlxPhysicsObjectDefinition,
  FlxPhysicsQueryFilter,
  FlxPhysicsQueryHit,
  FlxPhysicsRayQuery,
  FlxPhysicsShape,
  FlxPhysicsTransform,
  FlxPhysicsVector,
  FlxPhysicsWorldOptions,
} from './flx-physics-types';
import { FlxPhysicsUnsupportedCapabilityError } from './flx-physics-types';

const DEFAULT_GRAVITY: FlxPhysicsVector = Object.freeze({ x: 0, y: 0 });

interface PhysicsBinding {
  readonly backendBody: FlxPhysicsBackendBody;
  readonly body: PhysicsBodyBinding;
  readonly object: FlxObject;
  readonly order: number;
  readonly onObjectDestroyed: () => void;
  previousMoves: boolean;
  type: FlxPhysicsBodyType;
}

interface PhysicsJointRecord {
  readonly backendJoint: FlxPhysicsBackendJoint;
  readonly bodyA: PhysicsBinding;
  readonly bodyB: PhysicsBinding;
  readonly joint: PhysicsJointBinding;
  readonly order: number;
}

/**
 * State-scoped owner for an optional physics backend.
 *
 * Coordinates use Flixel logical pixels, degrees, and seconds. A bound body is
 * positioned at its object's midpoint. Static and kinematic objects push their
 * transforms before each step; dynamic bodies pull solver state afterward.
 * @public
 */
export class FlxPhysicsWorld {
  paused: boolean;
  readonly contactStarted = new FlxSignal<FlxPhysicsContact>();
  readonly contactStayed = new FlxSignal<FlxPhysicsContact>();
  readonly contactEnded = new FlxSignal<FlxPhysicsContact>();

  readonly #backend: FlxPhysicsBackendWorld;
  readonly #capabilities: FlxPhysicsCapabilities;
  readonly #byBackend = new Map<FlxPhysicsBackendBody, PhysicsBinding>();
  readonly #byId = new Map<string, PhysicsBinding>();
  readonly #byObject = new Map<FlxObject, PhysicsBinding>();
  readonly #jointsById = new Map<string, PhysicsJointRecord>();
  #destroyed = false;
  #nextBodyId = 1;
  #nextJointId = 1;
  #nextOrder = 1;
  #owner: object | null = null;

  constructor(
    backend: FlxPhysicsBackendWorld,
    options: FlxPhysicsWorldOptions = {},
  ) {
    if (backend === null || typeof backend !== 'object') {
      throw new TypeError('Physics backend must be an object.');
    }
    this.#backend = backend;
    this.#capabilities = freezeCapabilities(backend.capabilities);
    this.paused = options.paused ?? false;
    this.setGravity(options.gravity ?? DEFAULT_GRAVITY);
  }

  get capabilities(): FlxPhysicsCapabilities {
    return this.#capabilities;
  }

  get bodyCount(): number {
    return this.#byId.size;
  }

  get jointCount(): number {
    return this.#jointsById.size;
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  addBody(
    object: FlxObject,
    definition: FlxPhysicsObjectDefinition,
  ): FlxPhysicsBody {
    this.#assertUsable();
    if (object.destroyed) throw new Error('Cannot bind a destroyed FlxObject.');
    if (this.#byObject.has(object)) {
      throw new Error('FlxObject is already bound in this physics world.');
    }
    validateBodyDefinition(definition, this.#capabilities);
    const id = definition.id ?? `physics-body-${this.#nextBodyId++}`;
    if (id.length === 0) throw new Error('Physics body id must not be empty.');
    if (this.#byId.has(id)) {
      throw new Error(`Physics body id "${id}" is already in use.`);
    }

    const body = new PhysicsBodyBinding(this, id, object, definition.type);
    object.attachPhysicsOwner(body);
    let backendBody: FlxPhysicsBackendBody;
    try {
      backendBody = this.#backend.createBody({
        ...definition,
        id,
        position: midpoint(object),
        angle: object.angle,
        velocity: { x: object.velocity.x, y: object.velocity.y },
        angularVelocity: object.angularVelocity,
      });
    } catch (error) {
      object.detachPhysicsOwner(body);
      throw error;
    }

    const binding: PhysicsBinding = {
      backendBody,
      body,
      object,
      order: this.#nextOrder++,
      previousMoves: object.moves,
      type: definition.type,
      onObjectDestroyed: () => this.removeBody(body),
    };
    this.#byBackend.set(backendBody, binding);
    this.#byId.set(id, binding);
    this.#byObject.set(object, binding);
    object.addDestroyCallback(binding.onObjectDestroyed);
    if (definition.type !== 'kinematic') object.moves = false;
    return body;
  }

  getBody(idOrObject: string | FlxObject): FlxPhysicsBody | undefined {
    this.#assertUsable();
    return (
      typeof idOrObject === 'string'
        ? this.#byId.get(idOrObject)
        : this.#byObject.get(idOrObject)
    )?.body;
  }

  removeBody(bodyOrObject: FlxPhysicsBody | FlxObject): boolean {
    if (this.#destroyed) return false;
    const byObject = bodyOrObject instanceof FlxObject;
    const binding = byObject
      ? this.#byObject.get(bodyOrObject)
      : this.#byId.get(bodyOrObject.id);
    if (binding === undefined || (!byObject && binding.body !== bodyOrObject)) {
      return false;
    }
    this.#releaseJointsForBody(binding, true);
    this.#releaseBinding(binding, true);
    return true;
  }

  addJoint(definition: FlxPhysicsJointDefinition): FlxPhysicsJoint {
    this.#assertUsable();
    validateJointDefinition(definition, this.#capabilities);
    const bodyA = this.#requireBinding(definition.bodyA);
    const bodyB = this.#requireBinding(definition.bodyB);
    if (bodyA === bodyB) {
      throw new Error('Physics joint bodies must be different.');
    }
    if (
      this.#backend.createJoint === undefined ||
      this.#backend.destroyJoint === undefined
    ) {
      throw new FlxPhysicsUnsupportedCapabilityError(
        `joint:${definition.type}`,
      );
    }
    const id = definition.id ?? `physics-joint-${this.#nextJointId++}`;
    if (id.length === 0) throw new Error('Physics joint id must not be empty.');
    if (this.#jointsById.has(id)) {
      throw new Error(`Physics joint id "${id}" is already in use.`);
    }
    const joint = new PhysicsJointBinding(
      this,
      id,
      definition.type,
      bodyA.body,
      bodyB.body,
    );
    const backendDefinition: FlxPhysicsBackendJointDefinition = {
      ...definition,
      id,
      bodyA: bodyA.backendBody,
      bodyB: bodyB.backendBody,
    };
    const backendJoint = this.#backend.createJoint(backendDefinition);
    this.#jointsById.set(id, {
      backendJoint,
      bodyA,
      bodyB,
      joint,
      order: this.#nextOrder++,
    });
    return joint;
  }

  getJoint(id: string): FlxPhysicsJoint | undefined {
    this.#assertUsable();
    return this.#jointsById.get(id)?.joint;
  }

  removeJoint(jointOrId: FlxPhysicsJoint | string): boolean {
    if (this.#destroyed) return false;
    const binding = this.#jointsById.get(
      typeof jointOrId === 'string' ? jointOrId : jointOrId.id,
    );
    if (
      binding === undefined ||
      (typeof jointOrId !== 'string' && binding.joint !== jointOrId)
    ) {
      return false;
    }
    this.#releaseJoint(binding, true);
    return true;
  }

  setGravity(gravity: FlxPhysicsVector): void {
    this.#assertUsable();
    validateVector(gravity, 'Physics gravity');
    this.#backend.setGravity(copyVector(gravity));
  }

  queryPoint(
    point: FlxPhysicsVector,
    filter?: FlxPhysicsQueryFilter,
  ): readonly FlxPhysicsQueryHit[] {
    this.#assertQuery('point');
    validateVector(point, 'Physics query point');
    validateFilter(filter);
    return this.#normalizeHits(
      this.#backend.queryPoint(copyVector(point), filter),
    );
  }

  queryAabb(
    bounds: FlxPhysicsAabb,
    filter?: FlxPhysicsQueryFilter,
  ): readonly FlxPhysicsQueryHit[] {
    this.#assertQuery('aabb');
    validateAabb(bounds);
    validateFilter(filter);
    return this.#normalizeHits(this.#backend.queryAabb({ ...bounds }, filter));
  }

  queryRay(query: FlxPhysicsRayQuery): readonly FlxPhysicsQueryHit[] {
    this.#assertQuery('ray');
    validateVector(query.from, 'Physics ray start');
    validateVector(query.to, 'Physics ray end');
    validateFilter(query.filter);
    if (this.#backend.queryRay === undefined) {
      throw new FlxPhysicsUnsupportedCapabilityError('query:ray');
    }
    return this.#normalizeHits(this.#backend.queryRay(query));
  }

  getDebugGeometry(): readonly FlxPhysicsDebugPrimitive[] {
    this.#assertUsable();
    if (
      !this.#capabilities.debugGeometry ||
      this.#backend.getDebugGeometry === undefined
    ) {
      throw new FlxPhysicsUnsupportedCapabilityError('debug-geometry');
    }
    return this.#backend.getDebugGeometry();
  }

  step(elapsed: number): void {
    this.#assertUsable();
    if (!Number.isFinite(elapsed) || elapsed <= 0) {
      throw new RangeError('Physics elapsed time must be positive and finite.');
    }
    if (this.paused) return;
    for (const binding of this.#orderedBindings()) {
      if (binding.type !== 'dynamic') this.#pushObject(binding);
    }
    this.#backend.step(elapsed);
    for (const binding of this.#orderedBindings()) {
      if (binding.type === 'dynamic') this.#pullBody(binding);
    }
    this.#dispatchContacts(this.#backend.drainContacts());
  }

  reset(): void {
    this.#assertUsable();
    for (const binding of this.#orderedJoints()) {
      this.#releaseJoint(binding, false);
    }
    for (const binding of this.#orderedBindings()) {
      this.#releaseBinding(binding, false);
    }
    this.#backend.reset();
  }

  destroy(): void {
    if (this.#destroyed) return;
    for (const binding of this.#orderedJoints()) {
      this.#releaseJoint(binding, false);
    }
    for (const binding of this.#orderedBindings()) {
      this.#releaseBinding(binding, false);
    }
    this.contactStarted.destroy();
    this.contactStayed.destroy();
    this.contactEnded.destroy();
    this.#destroyed = true;
    this.#backend.destroy();
  }

  /** @internal */
  attachOwner(owner: object): void {
    this.#assertUsable();
    if (this.#owner !== null && this.#owner !== owner) {
      throw new Error('Physics world is already owned by another state.');
    }
    this.#owner = owner;
  }

  /** @internal */
  detachOwner(owner: object): void {
    if (this.#owner === owner) this.#owner = null;
  }

  /** @internal */
  setBodyType(body: PhysicsBodyBinding, type: FlxPhysicsBodyType): void {
    const binding = this.#requireBinding(body);
    this.#backend.setBodyType(binding.backendBody, type);
    binding.type = type;
    body.updateType(type);
    binding.object.moves = type === 'kinematic' ? binding.previousMoves : false;
  }

  /** @internal */
  setBodyTransform(
    body: PhysicsBodyBinding,
    transform: FlxPhysicsTransform,
  ): void {
    const binding = this.#requireBinding(body);
    validateTransform(transform);
    this.#backend.setBodyTransform(
      binding.backendBody,
      copyTransform(transform),
    );
    applyTransform(binding.object, transform);
  }

  /** @internal */
  setBodyVelocity(
    body: PhysicsBodyBinding,
    velocity: FlxPhysicsVector,
    angularVelocity: number,
  ): void {
    const binding = this.#requireBinding(body);
    validateVector(velocity, 'Physics velocity');
    validateFinite(angularVelocity, 'Physics angular velocity');
    this.#backend.setBodyVelocity(
      binding.backendBody,
      copyVector(velocity),
      angularVelocity,
    );
    binding.object.velocity.copyFrom(velocity);
    binding.object.angularVelocity = angularVelocity;
  }

  /** @internal */
  applyBodyForce(
    body: PhysicsBodyBinding,
    force: FlxPhysicsVector,
    point?: FlxPhysicsVector,
  ): void {
    const binding = this.#requireBinding(body);
    validateVector(force, 'Physics force');
    if (point !== undefined) validateVector(point, 'Physics force point');
    this.#backend.applyForce(
      binding.backendBody,
      copyVector(force),
      point && copyVector(point),
    );
  }

  /** @internal */
  applyBodyImpulse(
    body: PhysicsBodyBinding,
    impulse: FlxPhysicsVector,
    point?: FlxPhysicsVector,
  ): void {
    const binding = this.#requireBinding(body);
    validateVector(impulse, 'Physics impulse');
    if (point !== undefined) validateVector(point, 'Physics impulse point');
    this.#backend.applyImpulse(
      binding.backendBody,
      copyVector(impulse),
      point && copyVector(point),
    );
  }

  #assertQuery(query: 'point' | 'aabb' | 'ray'): void {
    this.#assertUsable();
    if (!this.#capabilities.queries.includes(query)) {
      throw new FlxPhysicsUnsupportedCapabilityError(`query:${query}`);
    }
  }

  #assertUsable(): void {
    if (this.#destroyed) throw new Error('Physics world has been destroyed.');
  }

  #requireBinding(body: FlxPhysicsBody): PhysicsBinding {
    this.#assertUsable();
    const binding = this.#byId.get(body.id);
    if (binding === undefined || binding.body !== body) {
      throw new Error(`Physics body "${body.id}" has been destroyed.`);
    }
    return binding;
  }

  #orderedBindings(): PhysicsBinding[] {
    return [...this.#byId.values()].sort((a, b) => a.order - b.order);
  }

  #orderedJoints(): PhysicsJointRecord[] {
    return [...this.#jointsById.values()].sort((a, b) => a.order - b.order);
  }

  #pushObject(binding: PhysicsBinding): void {
    const object = binding.object;
    this.#backend.setBodyTransform(binding.backendBody, {
      position: midpoint(object),
      angle: object.angle,
    });
    this.#backend.setBodyVelocity(
      binding.backendBody,
      { x: object.velocity.x, y: object.velocity.y },
      object.angularVelocity,
    );
  }

  #pullBody(binding: PhysicsBinding): void {
    const state = this.#backend.getBodyState(binding.backendBody);
    validateBodyState(state);
    applyTransform(binding.object, state);
    binding.object.velocity.copyFrom(state.velocity);
    binding.object.angularVelocity = state.angularVelocity;
  }

  #releaseBinding(binding: PhysicsBinding, destroyBackend: boolean): void {
    if (!this.#byId.has(binding.body.id)) return;
    this.#byId.delete(binding.body.id);
    this.#byObject.delete(binding.object);
    this.#byBackend.delete(binding.backendBody);
    binding.object.removeDestroyCallback(binding.onObjectDestroyed);
    binding.object.detachPhysicsOwner(binding.body);
    binding.object.moves = binding.previousMoves;
    binding.body.markDestroyed();
    if (destroyBackend) this.#backend.destroyBody(binding.backendBody);
  }

  #releaseJointsForBody(body: PhysicsBinding, destroyBackend: boolean): void {
    for (const joint of this.#orderedJoints()) {
      if (joint.bodyA === body || joint.bodyB === body) {
        this.#releaseJoint(joint, destroyBackend);
      }
    }
  }

  #releaseJoint(binding: PhysicsJointRecord, destroyBackend: boolean): void {
    if (!this.#jointsById.has(binding.joint.id)) return;
    this.#jointsById.delete(binding.joint.id);
    binding.joint.markDestroyed();
    if (destroyBackend) this.#backend.destroyJoint?.(binding.backendJoint);
  }

  #normalizeHits(
    hits: readonly FlxPhysicsBackendQueryHit[],
  ): FlxPhysicsQueryHit[] {
    return hits
      .map((hit) => {
        const binding = this.#byBackend.get(hit.body);
        return binding === undefined ? undefined : { hit, binding };
      })
      .filter(
        (entry): entry is NonNullable<typeof entry> => entry !== undefined,
      )
      .sort((a, b) => a.binding.order - b.binding.order)
      .map(({ hit, binding }) =>
        Object.freeze({
          body: binding.body,
          object: binding.object,
          ...(hit.fixture === undefined ? {} : { fixture: hit.fixture }),
          ...(hit.point === undefined
            ? {}
            : { point: freezeVector(hit.point) }),
          ...(hit.normal === undefined
            ? {}
            : { normal: freezeVector(hit.normal) }),
          ...(hit.fraction === undefined ? {} : { fraction: hit.fraction }),
        }),
      );
  }

  #dispatchContacts(contacts: readonly FlxPhysicsBackendContact[]): void {
    const normalized = contacts
      .map((contact) => this.#normalizeContact(contact))
      .filter(
        (
          contact,
        ): contact is FlxPhysicsContact & { orderA: number; orderB: number } =>
          contact !== undefined,
      )
      .sort(
        (a, b) =>
          Math.min(a.orderA, a.orderB) - Math.min(b.orderA, b.orderB) ||
          Math.max(a.orderA, a.orderB) - Math.max(b.orderA, b.orderB) ||
          a.id.localeCompare(b.id) ||
          phaseOrder(a.phase) - phaseOrder(b.phase),
      );

    for (const entry of normalized) {
      const contact: FlxPhysicsContact = Object.freeze({
        id: entry.id,
        phase: entry.phase,
        bodyA: entry.bodyA,
        bodyB: entry.bodyB,
        objectA: entry.objectA,
        objectB: entry.objectB,
        depth: entry.depth,
        ...(entry.fixtureA === undefined ? {} : { fixtureA: entry.fixtureA }),
        ...(entry.fixtureB === undefined ? {} : { fixtureB: entry.fixtureB }),
        sensor: entry.sensor,
        normal: entry.normal,
        points: entry.points,
      });
      if (!contact.sensor && contact.phase !== 'end') applyTouching(contact);
      if (contact.phase === 'begin') this.contactStarted.dispatch(contact);
      else if (contact.phase === 'stay') this.contactStayed.dispatch(contact);
      else this.contactEnded.dispatch(contact);
    }
  }

  #normalizeContact(
    contact: FlxPhysicsBackendContact,
  ): (FlxPhysicsContact & { orderA: number; orderB: number }) | undefined {
    const first = this.#byBackend.get(contact.bodyA);
    const second = this.#byBackend.get(contact.bodyB);
    if (first === undefined || second === undefined) return undefined;
    validateVector(contact.normal, 'Physics contact normal');
    return {
      id: contact.id,
      phase: contact.phase,
      bodyA: first.body,
      bodyB: second.body,
      objectA: first.object,
      objectB: second.object,
      depth: Math.max(0, ...contact.points.map((point) => -point.separation)),
      ...(contact.fixtureA === undefined ? {} : { fixtureA: contact.fixtureA }),
      ...(contact.fixtureB === undefined ? {} : { fixtureB: contact.fixtureB }),
      sensor: contact.sensor,
      normal: freezeVector(contact.normal),
      points: Object.freeze(
        contact.points.map((point) =>
          Object.freeze({
            point: freezeVector(point.point),
            separation: point.separation,
          }),
        ),
      ),
      orderA: first.order,
      orderB: second.order,
    };
  }
}

class PhysicsBodyBinding implements FlxPhysicsBody {
  #destroyed = false;
  #type: FlxPhysicsBodyType;

  constructor(
    readonly world: FlxPhysicsWorld,
    readonly id: string,
    readonly object: FlxObject,
    type: FlxPhysicsBodyType,
  ) {
    this.#type = type;
  }

  get type(): FlxPhysicsBodyType {
    return this.#type;
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  setType(type: FlxPhysicsBodyType): void {
    this.world.setBodyType(this, type);
  }

  setTransform(transform: FlxPhysicsTransform): void {
    this.world.setBodyTransform(this, transform);
  }

  setVelocity(velocity: FlxPhysicsVector, angularVelocity = 0): void {
    this.world.setBodyVelocity(this, velocity, angularVelocity);
  }

  applyForce(force: FlxPhysicsVector, point?: FlxPhysicsVector): void {
    this.world.applyBodyForce(this, force, point);
  }

  applyImpulse(impulse: FlxPhysicsVector, point?: FlxPhysicsVector): void {
    this.world.applyBodyImpulse(this, impulse, point);
  }

  destroy(): void {
    this.world.removeBody(this);
  }

  updateType(type: FlxPhysicsBodyType): void {
    this.#type = type;
  }

  markDestroyed(): void {
    this.#destroyed = true;
  }
}

class PhysicsJointBinding implements FlxPhysicsJoint {
  #destroyed = false;

  constructor(
    readonly world: FlxPhysicsWorld,
    readonly id: string,
    readonly type: FlxPhysicsJointType,
    readonly bodyA: FlxPhysicsBody,
    readonly bodyB: FlxPhysicsBody,
  ) {}

  get destroyed(): boolean {
    return this.#destroyed;
  }

  destroy(): void {
    this.world.removeJoint(this);
  }

  markDestroyed(): void {
    this.#destroyed = true;
  }
}

function freezeCapabilities(
  capabilities: FlxPhysicsCapabilities,
): FlxPhysicsCapabilities {
  return Object.freeze({
    shapes: Object.freeze([...capabilities.shapes]),
    queries: Object.freeze([...capabilities.queries]),
    joints: Object.freeze([...capabilities.joints]),
    sleeping: capabilities.sleeping,
    continuousCollision: capabilities.continuousCollision,
    deterministicReplay: capabilities.deterministicReplay,
    debugGeometry: capabilities.debugGeometry,
  });
}

function validateBodyDefinition(
  definition: FlxPhysicsObjectDefinition,
  capabilities: FlxPhysicsCapabilities,
): void {
  if (!['static', 'kinematic', 'dynamic'].includes(definition.type)) {
    throw new Error(`Invalid physics body type "${definition.type}".`);
  }
  if (definition.shapes.length === 0) {
    throw new Error('Physics body requires at least one shape.');
  }
  validateFilter(definition.filter);
  validateMaterial(definition.material);
  if (definition.gravityScale !== undefined) {
    validateFinite(definition.gravityScale, 'Physics gravity scale');
  }
  if (definition.continuousCollision && !capabilities.continuousCollision) {
    throw new FlxPhysicsUnsupportedCapabilityError('continuous-collision');
  }
  if (definition.allowSleep && !capabilities.sleeping) {
    throw new FlxPhysicsUnsupportedCapabilityError('sleeping');
  }
  for (const shape of definition.shapes) validateShape(shape, capabilities);
}

function validateJointDefinition(
  definition: FlxPhysicsJointDefinition,
  capabilities: FlxPhysicsCapabilities,
): void {
  if (!capabilities.joints.includes(definition.type)) {
    throw new FlxPhysicsUnsupportedCapabilityError(`joint:${definition.type}`);
  }
  if (definition.id !== undefined && definition.id.length === 0) {
    throw new Error('Physics joint id must not be empty.');
  }

  if (definition.type === 'distance') {
    validateVector(definition.anchorA, 'Physics distance anchor A');
    validateVector(definition.anchorB, 'Physics distance anchor B');
    if (definition.length !== undefined) {
      validatePositive(definition.length, 'Physics distance length');
    }
    validateSpring(definition.frequencyHz, definition.dampingRatio, 'distance');
    return;
  }

  validateVector(definition.anchor, `Physics ${definition.type} anchor`);
  if (definition.type === 'revolute') {
    validateAngularMotorAndLimits(definition);
    return;
  }
  if (definition.type === 'prismatic') {
    validateAxis(definition.axis, 'Physics prismatic axis');
    validateLinearMotorAndLimits(definition);
    return;
  }
  if (definition.type === 'weld') {
    if (definition.referenceAngle !== undefined) {
      validateFinite(definition.referenceAngle, 'Physics weld reference angle');
    }
    validateSpring(definition.frequencyHz, definition.dampingRatio, 'weld');
    return;
  }

  validateAxis(definition.axis, 'Physics wheel axis');
  validateMotor(
    definition.motorSpeed,
    definition.maxMotorTorque,
    'Physics wheel motor torque',
  );
  validateSpring(definition.frequencyHz, definition.dampingRatio, 'wheel');
}

function validateAngularMotorAndLimits(
  definition: Extract<FlxPhysicsJointDefinition, { type: 'revolute' }>,
): void {
  validateMotor(
    definition.motorSpeed,
    definition.maxMotorTorque,
    'Physics revolute motor torque',
  );
  validateLimits(
    definition.lowerAngle,
    definition.upperAngle,
    'Physics revolute angle',
  );
}

function validateLinearMotorAndLimits(
  definition: Extract<FlxPhysicsJointDefinition, { type: 'prismatic' }>,
): void {
  validateMotor(
    definition.motorSpeed,
    definition.maxMotorForce,
    'Physics prismatic motor force',
  );
  validateLimits(
    definition.lowerTranslation,
    definition.upperTranslation,
    'Physics prismatic translation',
  );
}

function validateMotor(
  speed: number | undefined,
  maximum: number | undefined,
  maximumLabel: string,
): void {
  if (speed !== undefined) validateFinite(speed, 'Physics joint motor speed');
  if (maximum !== undefined) validateNonNegative(maximum, maximumLabel);
}

function validateLimits(
  lower: number | undefined,
  upper: number | undefined,
  label: string,
): void {
  if (lower !== undefined) validateFinite(lower, `${label} lower limit`);
  if (upper !== undefined) validateFinite(upper, `${label} upper limit`);
  if (lower !== undefined && upper !== undefined && lower > upper) {
    throw new RangeError(
      `${label} lower limit must not exceed its upper limit.`,
    );
  }
}

function validateSpring(
  frequencyHz: number | undefined,
  dampingRatio: number | undefined,
  type: string,
): void {
  if (frequencyHz !== undefined) {
    validateNonNegative(frequencyHz, `Physics ${type} frequency`);
  }
  if (
    dampingRatio !== undefined &&
    (!Number.isFinite(dampingRatio) || dampingRatio < 0 || dampingRatio > 1)
  ) {
    throw new RangeError(
      `Physics ${type} damping ratio must be between 0 and 1.`,
    );
  }
}

function validateAxis(axis: FlxPhysicsVector, label: string): void {
  validateVector(axis, label);
  if (axis.x === 0 && axis.y === 0) {
    throw new RangeError(`${label} must not be zero.`);
  }
}

function validateShape(
  shape: FlxPhysicsShape,
  capabilities: FlxPhysicsCapabilities,
): void {
  if (!capabilities.shapes.includes(shape.kind)) {
    throw new FlxPhysicsUnsupportedCapabilityError(`shape:${shape.kind}`);
  }
  if (shape.offset !== undefined) {
    validateVector(shape.offset, 'Physics shape offset');
  }
  if (shape.angle !== undefined)
    validateFinite(shape.angle, 'Physics shape angle');
  validateFilter(shape.filter);
  validateMaterial(shape.material);
  if (shape.kind === 'box') {
    validatePositive(shape.width, 'Physics box width');
    validatePositive(shape.height, 'Physics box height');
  } else if (shape.kind === 'circle') {
    validatePositive(shape.radius, 'Physics circle radius');
  } else if (shape.kind === 'capsule') {
    validatePositive(shape.radius, 'Physics capsule radius');
    validatePositive(shape.length, 'Physics capsule length');
  } else if (shape.kind === 'polygon') {
    if (shape.vertices.length < 3) {
      throw new Error('Physics polygon requires at least 3 vertices.');
    }
    for (const vertex of shape.vertices) {
      validateVector(vertex, 'Physics polygon vertex');
    }
  } else {
    if (shape.shapes.length === 0) {
      throw new Error('Physics compound requires at least one shape.');
    }
    for (const child of shape.shapes) validateShape(child, capabilities);
  }
}

function validateFilter(
  filter?: FlxPhysicsFilter | FlxPhysicsQueryFilter,
): void {
  if (filter === undefined) return;
  for (const [name, value] of [
    ['category', filter.category],
    ['mask', filter.mask],
    ['group', filter.group],
  ] as const) {
    if (
      value !== undefined &&
      (!Number.isSafeInteger(value) ||
        (name === 'group'
          ? value < -0x8000 || value > 0x7fff
          : value < 0 || value > 0xffff))
    ) {
      throw new RangeError(
        `Physics filter ${name} must be a ${name === 'group' ? 'signed' : 'unsigned'} 16-bit integer.`,
      );
    }
  }
}

function validateMaterial(material?: FlxPhysicsMaterial): void {
  if (material === undefined) return;
  if (material.density !== undefined && material.density < 0) {
    throw new RangeError('Physics density must be non-negative.');
  }
  if (material.friction !== undefined && material.friction < 0) {
    throw new RangeError('Physics friction must be non-negative.');
  }
  if (
    material.restitution !== undefined &&
    (material.restitution < 0 || material.restitution > 1)
  ) {
    throw new RangeError('Physics restitution must be between 0 and 1.');
  }
  for (const value of [
    material.density,
    material.friction,
    material.restitution,
  ]) {
    if (value !== undefined) validateFinite(value, 'Physics material value');
  }
}

function validateAabb(bounds: FlxPhysicsAabb): void {
  validateFinite(bounds.x, 'Physics query x');
  validateFinite(bounds.y, 'Physics query y');
  validatePositive(bounds.width, 'Physics query width');
  validatePositive(bounds.height, 'Physics query height');
}

function validateTransform(transform: FlxPhysicsTransform): void {
  validateVector(transform.position, 'Physics transform position');
  validateFinite(transform.angle, 'Physics transform angle');
}

function validateBodyState(state: FlxPhysicsBodyState): void {
  validateTransform(state);
  validateVector(state.velocity, 'Physics body velocity');
  validateFinite(state.angularVelocity, 'Physics body angular velocity');
}

function validateVector(vector: FlxPhysicsVector, label: string): void {
  if (!Number.isFinite(vector.x) || !Number.isFinite(vector.y)) {
    throw new RangeError(`${label} must contain finite x and y values.`);
  }
}

function validatePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be positive and finite.`);
  }
}

function validateNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be non-negative and finite.`);
  }
}

function validateFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
}

function copyVector(vector: FlxPhysicsVector): FlxPhysicsVector {
  return { x: vector.x, y: vector.y };
}

function freezeVector(vector: FlxPhysicsVector): FlxPhysicsVector {
  return Object.freeze(copyVector(vector));
}

function copyTransform(transform: FlxPhysicsTransform): FlxPhysicsTransform {
  return { position: copyVector(transform.position), angle: transform.angle };
}

function midpoint(object: FlxObject): FlxPhysicsVector {
  return {
    x: object.x + object.width * 0.5,
    y: object.y + object.height * 0.5,
  };
}

function applyTransform(
  object: FlxObject,
  transform: FlxPhysicsTransform,
): void {
  object.x = transform.position.x - object.width * 0.5;
  object.y = transform.position.y - object.height * 0.5;
  object.angle = transform.angle;
}

function phaseOrder(phase: FlxPhysicsContact['phase']): number {
  return phase === 'begin' ? 0 : phase === 'stay' ? 1 : 2;
}

function applyTouching(contact: FlxPhysicsContact): void {
  const { x, y } = contact.normal;
  if (Math.abs(x) >= Math.abs(y)) {
    contact.objectA.touching |= x >= 0 ? FlxObject.RIGHT : FlxObject.LEFT;
    contact.objectB.touching |= x >= 0 ? FlxObject.LEFT : FlxObject.RIGHT;
  } else {
    contact.objectA.touching |= y >= 0 ? FlxObject.DOWN : FlxObject.UP;
    contact.objectB.touching |= y >= 0 ? FlxObject.UP : FlxObject.DOWN;
  }
}
