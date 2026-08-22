import type { ParticlePresetV1 } from './particle-types.js';
import { parseParticlePreset } from './particle-validation.js';
import type { JsonValue } from './types.js';

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

/** @public */
export interface SerializeParticlePresetOptions {
  space?: number;
}

/** Serialize a validated particle preset with deterministic key ordering. @public */
export function serializeParticlePreset(
  value: ParticlePresetV1,
  options: SerializeParticlePresetOptions = {},
): string {
  const preset = parseParticlePreset(value);
  const space = Math.max(0, Math.min(10, options.space ?? 2));
  return `${JSON.stringify(sortJson(preset as unknown as JsonValue), null, space)}\n`;
}
