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

/** Version 1 world document containing backend-independent body data. @public */
export interface PhysicsWorldDocumentV1 {
  bodies: PhysicsBodyDocumentV1[];
  extensions?: JsonObject;
  gravity: PhysicsVectorDefinition;
  id: string;
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
