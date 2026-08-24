import type { FlxObject } from '../objects/flx-object';

/** Two-dimensional vector expressed in Flixel logical units. @public */
export interface FlxPhysicsVector {
  readonly x: number;
  readonly y: number;
}

/** Position and clockwise angle in logical pixels and degrees. @public */
export interface FlxPhysicsTransform {
  readonly position: FlxPhysicsVector;
  readonly angle: number;
}

/** Portable rigid-body authority modes. @public */
export type FlxPhysicsBodyType = 'static' | 'kinematic' | 'dynamic';

/** Collision filtering shared by bodies, shapes, contacts, and queries. @public */
export interface FlxPhysicsFilter {
  /** Category bits owned by this fixture. Defaults to `1`. */
  readonly category?: number;
  /** Category bits this fixture accepts. Defaults to all 16 bits. */
  readonly mask?: number;
  /** Optional solver collision group. Defaults to `0`. */
  readonly group?: number;
}

/** Portable material properties applied to a physics fixture. @public */
export interface FlxPhysicsMaterial {
  readonly density?: number;
  readonly friction?: number;
  readonly restitution?: number;
}

/** Properties shared by every portable shape descriptor. @public */
export interface FlxPhysicsShapeBase {
  readonly offset?: FlxPhysicsVector;
  readonly angle?: number;
  readonly sensor?: boolean;
  readonly filter?: FlxPhysicsFilter;
  readonly material?: FlxPhysicsMaterial;
  /** Stable fixture identifier used by contacts and serialized documents. */
  readonly id?: string;
}

/** Axis-aligned box in the body's local coordinate system. @public */
export interface FlxPhysicsBoxShape extends FlxPhysicsShapeBase {
  readonly kind: 'box';
  readonly width: number;
  readonly height: number;
}

/** Circle in the body's local coordinate system. @public */
export interface FlxPhysicsCircleShape extends FlxPhysicsShapeBase {
  readonly kind: 'circle';
  readonly radius: number;
}

/** Capsule aligned to a local axis. Adapter support is capability-gated. @public */
export interface FlxPhysicsCapsuleShape extends FlxPhysicsShapeBase {
  readonly kind: 'capsule';
  readonly radius: number;
  readonly length: number;
  readonly axis?: 'x' | 'y';
}

/** Convex local-space polygon. Adapter support is capability-gated. @public */
export interface FlxPhysicsPolygonShape extends FlxPhysicsShapeBase {
  readonly kind: 'polygon';
  readonly vertices: readonly FlxPhysicsVector[];
}

/** Shape allowed inside a compound fixture. @public */
export type FlxPhysicsPrimitiveShape =
  | FlxPhysicsBoxShape
  | FlxPhysicsCircleShape
  | FlxPhysicsCapsuleShape
  | FlxPhysicsPolygonShape;

/** Compound of portable primitive shapes. Adapter support is capability-gated. @public */
export interface FlxPhysicsCompoundShape extends FlxPhysicsShapeBase {
  readonly kind: 'compound';
  readonly shapes: readonly FlxPhysicsPrimitiveShape[];
}

/** Portable physics shape descriptor. @public */
export type FlxPhysicsShape =
  FlxPhysicsPrimitiveShape | FlxPhysicsCompoundShape;

/** Portable body creation descriptor passed to a backend. @public */
export interface FlxPhysicsBodyDefinition {
  readonly id?: string;
  readonly type: FlxPhysicsBodyType;
  readonly shapes: readonly FlxPhysicsShape[];
  readonly position?: FlxPhysicsVector;
  readonly angle?: number;
  readonly velocity?: FlxPhysicsVector;
  readonly angularVelocity?: number;
  readonly fixedRotation?: boolean;
  readonly continuousCollision?: boolean;
  readonly allowSleep?: boolean;
  readonly awake?: boolean;
  readonly gravityScale?: number;
  readonly filter?: FlxPhysicsFilter;
  readonly material?: FlxPhysicsMaterial;
}

/** Normalized body state read from a backend after a fixed step. @public */
export interface FlxPhysicsBodyState extends FlxPhysicsTransform {
  readonly velocity: FlxPhysicsVector;
  readonly angularVelocity: number;
  readonly awake: boolean;
}

/** Portable contact lifecycle phases. @public */
export type FlxPhysicsContactPhase = 'begin' | 'stay' | 'end';

/** One normalized contact point in Flixel logical units. @public */
export interface FlxPhysicsContactPoint {
  readonly point: FlxPhysicsVector;
  readonly separation: number;
}

/** Opaque body token owned by a physics backend. @public */
export type FlxPhysicsBackendBody = object;

/** Opaque joint token owned by a physics backend. @public */
export type FlxPhysicsBackendJoint = object;

/** Contact emitted by a backend before Flixel object binding. @public */
export interface FlxPhysicsBackendContact {
  readonly id: string;
  readonly phase: FlxPhysicsContactPhase;
  readonly bodyA: FlxPhysicsBackendBody;
  readonly bodyB: FlxPhysicsBackendBody;
  readonly fixtureA?: string;
  readonly fixtureB?: string;
  readonly sensor: boolean;
  readonly normal: FlxPhysicsVector;
  readonly points: readonly FlxPhysicsContactPoint[];
}

/** Axis-aligned query bounds in Flixel logical pixels. @public */
export interface FlxPhysicsAabb {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Optional filter applied to portable physics queries. @public */
export interface FlxPhysicsQueryFilter extends FlxPhysicsFilter {
  readonly includeSensors?: boolean;
}

/** Backend query result before Flixel object binding. @public */
export interface FlxPhysicsBackendQueryHit {
  readonly body: FlxPhysicsBackendBody;
  readonly fixture?: string;
  readonly point?: FlxPhysicsVector;
  readonly normal?: FlxPhysicsVector;
  readonly fraction?: number;
}

/** Portable ray query. Adapter support is capability-gated. @public */
export interface FlxPhysicsRayQuery {
  readonly from: FlxPhysicsVector;
  readonly to: FlxPhysicsVector;
  readonly filter?: FlxPhysicsQueryFilter;
  readonly mode?: 'closest' | 'all';
}

/** Shapes a backend can create through the portable contract. @public */
export type FlxPhysicsShapeCapability = FlxPhysicsShape['kind'];

/** Queries a backend can execute through the portable contract. @public */
export type FlxPhysicsQueryCapability = 'point' | 'aabb' | 'ray' | 'shape-cast';

/** Joint constraints available through the portable physics contract. @public */
export type FlxPhysicsJointType =
  'distance' | 'revolute' | 'prismatic' | 'weld' | 'wheel';

/** Shared options for every portable joint. @public */
export interface FlxPhysicsJointDefinitionBase {
  readonly id?: string;
  readonly bodyA: FlxPhysicsBody;
  readonly bodyB: FlxPhysicsBody;
  readonly collideConnected?: boolean;
}

/** Keeps two world-space anchor points at a configured distance. @public */
export interface FlxPhysicsDistanceJointDefinition extends FlxPhysicsJointDefinitionBase {
  readonly type: 'distance';
  readonly anchorA: FlxPhysicsVector;
  readonly anchorB: FlxPhysicsVector;
  readonly length?: number;
  readonly frequencyHz?: number;
  readonly dampingRatio?: number;
}

/** Hinge constraint around one world-space anchor. @public */
export interface FlxPhysicsRevoluteJointDefinition extends FlxPhysicsJointDefinitionBase {
  readonly type: 'revolute';
  readonly anchor: FlxPhysicsVector;
  readonly enableLimit?: boolean;
  readonly lowerAngle?: number;
  readonly upperAngle?: number;
  readonly enableMotor?: boolean;
  readonly motorSpeed?: number;
  readonly maxMotorTorque?: number;
}

/** Slider constraint along a world-space axis. @public */
export interface FlxPhysicsPrismaticJointDefinition extends FlxPhysicsJointDefinitionBase {
  readonly type: 'prismatic';
  readonly anchor: FlxPhysicsVector;
  readonly axis: FlxPhysicsVector;
  readonly enableLimit?: boolean;
  readonly lowerTranslation?: number;
  readonly upperTranslation?: number;
  readonly enableMotor?: boolean;
  readonly motorSpeed?: number;
  readonly maxMotorForce?: number;
}

/** Attaches two bodies at one world-space anchor. @public */
export interface FlxPhysicsWeldJointDefinition extends FlxPhysicsJointDefinitionBase {
  readonly type: 'weld';
  readonly anchor: FlxPhysicsVector;
  readonly referenceAngle?: number;
  readonly frequencyHz?: number;
  readonly dampingRatio?: number;
}

/** Vehicle suspension constraint along a world-space axis. @public */
export interface FlxPhysicsWheelJointDefinition extends FlxPhysicsJointDefinitionBase {
  readonly type: 'wheel';
  readonly anchor: FlxPhysicsVector;
  readonly axis: FlxPhysicsVector;
  readonly enableMotor?: boolean;
  readonly motorSpeed?: number;
  readonly maxMotorTorque?: number;
  readonly frequencyHz?: number;
  readonly dampingRatio?: number;
}

/** Portable joint creation descriptor. @public */
export type FlxPhysicsJointDefinition =
  | FlxPhysicsDistanceJointDefinition
  | FlxPhysicsRevoluteJointDefinition
  | FlxPhysicsPrismaticJointDefinition
  | FlxPhysicsWeldJointDefinition
  | FlxPhysicsWheelJointDefinition;

/** Joint descriptor after portable bodies have been mapped to backend handles. @public */
export type FlxPhysicsBackendJointDefinition =
  | (Omit<FlxPhysicsDistanceJointDefinition, 'bodyA' | 'bodyB'> & {
      readonly bodyA: FlxPhysicsBackendBody;
      readonly bodyB: FlxPhysicsBackendBody;
    })
  | (Omit<FlxPhysicsRevoluteJointDefinition, 'bodyA' | 'bodyB'> & {
      readonly bodyA: FlxPhysicsBackendBody;
      readonly bodyB: FlxPhysicsBackendBody;
    })
  | (Omit<FlxPhysicsPrismaticJointDefinition, 'bodyA' | 'bodyB'> & {
      readonly bodyA: FlxPhysicsBackendBody;
      readonly bodyB: FlxPhysicsBackendBody;
    })
  | (Omit<FlxPhysicsWeldJointDefinition, 'bodyA' | 'bodyB'> & {
      readonly bodyA: FlxPhysicsBackendBody;
      readonly bodyB: FlxPhysicsBackendBody;
    })
  | (Omit<FlxPhysicsWheelJointDefinition, 'bodyA' | 'bodyB'> & {
      readonly bodyA: FlxPhysicsBackendBody;
      readonly bodyB: FlxPhysicsBackendBody;
    });

/** Immutable feature report for one physics backend. @public */
export interface FlxPhysicsCapabilities {
  readonly shapes: readonly FlxPhysicsShapeCapability[];
  readonly queries: readonly FlxPhysicsQueryCapability[];
  readonly joints: readonly FlxPhysicsJointType[];
  readonly sleeping: boolean;
  readonly continuousCollision: boolean;
  readonly deterministicReplay: boolean;
  readonly debugGeometry: boolean;
}

/** Renderer-neutral debug geometry produced by a physics backend. @public */
export type FlxPhysicsDebugPrimitive =
  | {
      readonly kind: 'line';
      readonly from: FlxPhysicsVector;
      readonly to: FlxPhysicsVector;
      readonly color: number;
    }
  | {
      readonly kind: 'polygon';
      readonly vertices: readonly FlxPhysicsVector[];
      readonly color: number;
      readonly filled?: boolean;
    }
  | {
      readonly kind: 'circle';
      readonly center: FlxPhysicsVector;
      readonly radius: number;
      readonly color: number;
      readonly filled?: boolean;
    }
  | {
      readonly kind: 'point';
      readonly point: FlxPhysicsVector;
      readonly color: number;
      readonly size?: number;
    };

/** Construction options owned by the portable world host. @public */
export interface FlxPhysicsWorldOptions {
  readonly gravity?: FlxPhysicsVector;
  readonly paused?: boolean;
}

/** Body descriptor accepted when binding a `FlxObject` to a world. @public */
export type FlxPhysicsObjectDefinition = Omit<
  FlxPhysicsBodyDefinition,
  'position' | 'angle' | 'velocity' | 'angularVelocity'
>;

/** Portable body exposed to game code without a solver-native handle. @public */
export interface FlxPhysicsBody {
  readonly id: string;
  readonly object: FlxObject;
  readonly type: FlxPhysicsBodyType;
  readonly destroyed: boolean;
  setType(type: FlxPhysicsBodyType): void;
  setTransform(transform: FlxPhysicsTransform): void;
  setVelocity(velocity: FlxPhysicsVector, angularVelocity?: number): void;
  applyForce(force: FlxPhysicsVector, point?: FlxPhysicsVector): void;
  applyImpulse(impulse: FlxPhysicsVector, point?: FlxPhysicsVector): void;
  destroy(): void;
}

/** Portable joint exposed without leaking a solver-native handle. @public */
export interface FlxPhysicsJoint {
  readonly id: string;
  readonly type: FlxPhysicsJointType;
  readonly bodyA: FlxPhysicsBody;
  readonly bodyB: FlxPhysicsBody;
  readonly destroyed: boolean;
  destroy(): void;
}

/** Normalized contact published after body synchronization. @public */
export interface FlxPhysicsContact {
  readonly id: string;
  readonly phase: FlxPhysicsContactPhase;
  readonly bodyA: FlxPhysicsBody;
  readonly bodyB: FlxPhysicsBody;
  readonly objectA: FlxObject;
  readonly objectB: FlxObject;
  /** Maximum penetration depth in logical pixels. */
  readonly depth: number;
  readonly fixtureA?: string;
  readonly fixtureB?: string;
  readonly sensor: boolean;
  readonly normal: FlxPhysicsVector;
  readonly points: readonly FlxPhysicsContactPoint[];
}

/** Portable query hit mapped back to a bound Flixel object. @public */
export interface FlxPhysicsQueryHit {
  readonly body: FlxPhysicsBody;
  readonly object: FlxObject;
  readonly fixture?: string;
  readonly point?: FlxPhysicsVector;
  readonly normal?: FlxPhysicsVector;
  readonly fraction?: number;
}

/**
 * Low-level renderer-neutral world implemented by an optional solver adapter.
 * Game code normally uses `FlxPhysicsWorld` instead of backend body handles.
 * @public
 */
export interface FlxPhysicsBackendWorld {
  readonly capabilities: FlxPhysicsCapabilities;

  setGravity(gravity: FlxPhysicsVector): void;
  createBody(definition: FlxPhysicsBodyDefinition): FlxPhysicsBackendBody;
  destroyBody(body: FlxPhysicsBackendBody): void;
  createJoint?(
    definition: FlxPhysicsBackendJointDefinition,
  ): FlxPhysicsBackendJoint;
  destroyJoint?(joint: FlxPhysicsBackendJoint): void;
  setBodyType(body: FlxPhysicsBackendBody, type: FlxPhysicsBodyType): void;
  setBodyTransform(
    body: FlxPhysicsBackendBody,
    transform: FlxPhysicsTransform,
  ): void;
  setBodyVelocity(
    body: FlxPhysicsBackendBody,
    velocity: FlxPhysicsVector,
    angularVelocity: number,
  ): void;
  getBodyState(body: FlxPhysicsBackendBody): FlxPhysicsBodyState;
  applyForce(
    body: FlxPhysicsBackendBody,
    force: FlxPhysicsVector,
    point?: FlxPhysicsVector,
  ): void;
  applyImpulse(
    body: FlxPhysicsBackendBody,
    impulse: FlxPhysicsVector,
    point?: FlxPhysicsVector,
  ): void;
  queryPoint(
    point: FlxPhysicsVector,
    filter?: FlxPhysicsQueryFilter,
  ): readonly FlxPhysicsBackendQueryHit[];
  queryAabb(
    bounds: FlxPhysicsAabb,
    filter?: FlxPhysicsQueryFilter,
  ): readonly FlxPhysicsBackendQueryHit[];
  queryRay?(query: FlxPhysicsRayQuery): readonly FlxPhysicsBackendQueryHit[];
  drainContacts(): readonly FlxPhysicsBackendContact[];
  getDebugGeometry?(): readonly FlxPhysicsDebugPrimitive[];
  step(elapsed: number): void;
  reset(): void;
  destroy(): void;
}

/** Error thrown when portable code requests an unsupported adapter feature. @public */
export class FlxPhysicsUnsupportedCapabilityError extends Error {
  readonly capability: string;

  constructor(capability: string) {
    super(`The active physics backend does not support "${capability}".`);
    this.name = 'FlxPhysicsUnsupportedCapabilityError';
    this.capability = capability;
  }
}
