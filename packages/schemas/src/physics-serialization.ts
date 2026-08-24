import type {
  PhysicsBodyDocumentV1,
  PhysicsWorldDocumentV1,
  SerializePhysicsOptions,
} from './physics-types.js';
import { parsePhysicsBody, parsePhysicsWorld } from './physics-validation.js';

/** Serialize a validated body with stable recursive key ordering. @public */
export function serializePhysicsBody(
  value: PhysicsBodyDocumentV1,
  options: SerializePhysicsOptions = {},
): string {
  return serialize(parsePhysicsBody(value), options.space);
}

/** Serialize a validated world with stable recursive key ordering. @public */
export function serializePhysicsWorld(
  value: PhysicsWorldDocumentV1,
  options: SerializePhysicsOptions = {},
): string {
  return serialize(parsePhysicsWorld(value), options.space);
}

function serialize(value: unknown, requestedSpace = 2): string {
  const space = Math.max(0, Math.min(10, requestedSpace));
  return `${JSON.stringify(sortJson(value), undefined, space)}\n`;
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([key, child]) => [key, sortJson(child)]),
  );
}
