import type { JsonValue, ProjectDocumentV1 } from './types.js';
import { parseProjectDocument } from './validation.js';

function sortJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(sortJson);
  if (typeof value !== 'object' || value === null) return value;

  const sorted: Record<string, JsonValue> = {};
  for (const key of Object.keys(value).sort()) {
    const item = value[key];
    if (item !== undefined) sorted[key] = sortJson(item);
  }
  return sorted;
}

export interface SerializeProjectOptions {
  space?: number;
}

export function serializeProjectDocument(
  value: ProjectDocumentV1,
  options: SerializeProjectOptions = {},
): string {
  const document = parseProjectDocument(value);
  const space = Math.max(0, Math.min(10, options.space ?? 2));
  return `${JSON.stringify(sortJson(document as unknown as JsonValue), null, space)}\n`;
}
