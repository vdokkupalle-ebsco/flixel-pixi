/** @public */
export type JsonPrimitive = boolean | null | number | string;

/** @public */
export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

/** @public */
export interface JsonObject {
  [key: string]: JsonValue;
}

export type AssetKind = 'atlas' | 'audio' | 'data' | 'image' | 'tilemap';

export interface ProjectMetadata {
  id: string;
  name: string;
}

export interface AssetDefinition {
  id: string;
  kind: AssetKind;
  metadata?: JsonObject;
  src: string;
}

export interface Vector2Definition {
  x: number;
  y: number;
}

export interface EntityDefinition {
  id: string;
  name?: string;
  position: Vector2Definition;
  properties?: JsonObject;
  rotation?: number;
  scale?: Vector2Definition;
  type: string;
}

export interface SceneDefinition {
  entities: EntityDefinition[];
  id: string;
  name: string;
}

export interface ProjectDocumentV1 {
  assets: AssetDefinition[];
  extensions?: JsonObject;
  project: ProjectMetadata;
  scenes: SceneDefinition[];
  schemaVersion: 1;
}

export interface LegacyProjectDocumentV0 {
  assets?: AssetDefinition[];
  extensions?: JsonObject;
  id: string;
  name: string;
  scenes?: SceneDefinition[];
  schemaVersion: 0;
}

export type ProjectDocument = ProjectDocumentV1;

/** @public */
export type ValidationIssueCode =
  | 'duplicate_id'
  | 'invalid_type'
  | 'invalid_value'
  | 'missing_value'
  | 'unsupported_version';

/** @public */
export interface ValidationIssue {
  code: ValidationIssueCode;
  message: string;
  path: string;
}

/** @public */
export type ValidationResult<T> =
  { data: T; success: true } | { issues: ValidationIssue[]; success: false };
