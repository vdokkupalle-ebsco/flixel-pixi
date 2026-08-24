import type { JsonObject, ValidationResult } from './types.js';

/** Serializable logical-space vector used by physics documents. @public */
export interface PhysicsVectorDefinition {
  x: number;
  y: number;
}

/** Serializable fixture collision filter. @public */
export interface PhysicsFilterDefinition {
  category?: number;
  group?: number;
  mask?: number;
}

/** Serializable fixture material. @public */
export interface PhysicsMaterialDefinition {
  density?: number;
  friction?: number;
  restitution?: number;
}

/** Fields shared by every serialized physics shape. @public */
export interface PhysicsShapeBaseDefinition {
  angle?: number;
  filter?: PhysicsFilterDefinition;
  id?: string;
  material?: PhysicsMaterialDefinition;
  offset?: PhysicsVectorDefinition;
  sensor?: boolean;
}

/** Serializable box fixture. @public */
export interface PhysicsBoxShapeDefinition extends PhysicsShapeBaseDefinition {
  height: number;
  kind: 'box';
  width: number;
}

/** Serializable circle fixture. @public */
export interface PhysicsCircleShapeDefinition extends PhysicsShapeBaseDefinition {
  kind: 'circle';
  radius: number;
}

/** Serializable capsule fixture. @public */
export interface PhysicsCapsuleShapeDefinition extends PhysicsShapeBaseDefinition {
  axis?: 'x' | 'y';
  kind: 'capsule';
  length: number;
  radius: number;
}

/** Serializable convex polygon fixture. @public */
export interface PhysicsPolygonShapeDefinition extends PhysicsShapeBaseDefinition {
  kind: 'polygon';
  vertices: PhysicsVectorDefinition[];
}

/** Serializable non-compound fixture. @public */
export type PhysicsPrimitiveShapeDefinition =
  | PhysicsBoxShapeDefinition
  | PhysicsCapsuleShapeDefinition
  | PhysicsCircleShapeDefinition
  | PhysicsPolygonShapeDefinition;

/** Serializable compound fixture. @public */
export interface PhysicsCompoundShapeDefinition extends PhysicsShapeBaseDefinition {
  kind: 'compound';
  shapes: PhysicsPrimitiveShapeDefinition[];
}

/** Serializable portable fixture. @public */
export type PhysicsShapeDefinition =
  PhysicsCompoundShapeDefinition | PhysicsPrimitiveShapeDefinition;

/** Version 1 body document linked to a stable game entity id. @public */
export interface PhysicsBodyDocumentV1 {
  allowSleep?: boolean;
  continuousCollision?: boolean;
  entityId: string;
  extensions?: JsonObject;
  filter?: PhysicsFilterDefinition;
  fixedRotation?: boolean;
  gravityScale?: number;
  id: string;
  kind: 'flixel-pixi-physics-body';
  material?: PhysicsMaterialDefinition;
  schemaVersion: 1;
  shapes: PhysicsShapeDefinition[];
  type: 'dynamic' | 'kinematic' | 'static';
}

/** Fields shared by every serialized physics joint. @public */
export interface PhysicsJointBaseDefinition {
  bodyA: string;
  bodyB: string;
  collideConnected?: boolean;
  extensions?: JsonObject;
  id: string;
}

/** Serializable distance joint. Anchors and length use logical pixels. @public */
export interface PhysicsDistanceJointDefinition extends PhysicsJointBaseDefinition {
  anchorA: PhysicsVectorDefinition;
  anchorB: PhysicsVectorDefinition;
  dampingRatio?: number;
  frequencyHz?: number;
  length?: number;
  type: 'distance';
}

/** Serializable revolute joint. Angular values use degrees. @public */
export interface PhysicsRevoluteJointDefinition extends PhysicsJointBaseDefinition {
  anchor: PhysicsVectorDefinition;
  enableLimit?: boolean;
  enableMotor?: boolean;
  lowerAngle?: number;
  maxMotorTorque?: number;
  motorSpeed?: number;
  type: 'revolute';
  upperAngle?: number;
}

/** Serializable prismatic joint. Linear values use logical pixels. @public */
export interface PhysicsPrismaticJointDefinition extends PhysicsJointBaseDefinition {
  anchor: PhysicsVectorDefinition;
  axis: PhysicsVectorDefinition;
  enableLimit?: boolean;
  enableMotor?: boolean;
  lowerTranslation?: number;
  maxMotorForce?: number;
  motorSpeed?: number;
  type: 'prismatic';
  upperTranslation?: number;
}

/** Serializable weld joint. Angular values use degrees. @public */
export interface PhysicsWeldJointDefinition extends PhysicsJointBaseDefinition {
  anchor: PhysicsVectorDefinition;
  dampingRatio?: number;
  frequencyHz?: number;
  referenceAngle?: number;
  type: 'weld';
}

/** Serializable wheel joint. Linear values use logical pixels. @public */
export interface PhysicsWheelJointDefinition extends PhysicsJointBaseDefinition {
  anchor: PhysicsVectorDefinition;
  axis: PhysicsVectorDefinition;
  dampingRatio?: number;
  enableMotor?: boolean;
  frequencyHz?: number;
  maxMotorTorque?: number;
  motorSpeed?: number;
  type: 'wheel';
}

/** Serializable portable joint. @public */
export type PhysicsJointDefinition =
  | PhysicsDistanceJointDefinition
  | PhysicsPrismaticJointDefinition
  | PhysicsRevoluteJointDefinition
  | PhysicsWeldJointDefinition
  | PhysicsWheelJointDefinition;

/** Version 1 world document containing backend-independent body data. @public */
export interface PhysicsWorldDocumentV1 {
  bodies: PhysicsBodyDocumentV1[];
  extensions?: JsonObject;
  gravity: PhysicsVectorDefinition;
  id: string;
  joints?: PhysicsJointDefinition[];
  kind: 'flixel-pixi-physics-world';
  schemaVersion: 1;
}

/** Result of validating one physics body document. @public */
export type PhysicsBodyValidationResult =
  ValidationResult<PhysicsBodyDocumentV1>;
/** Result of validating one physics world document. @public */
export type PhysicsWorldValidationResult =
  ValidationResult<PhysicsWorldDocumentV1>;

/** Deterministic physics JSON formatting options. @public */
export interface SerializePhysicsOptions {
  space?: number;
}
