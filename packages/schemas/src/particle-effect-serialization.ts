import type { ParticleEffectDocumentV1 } from './particle-effect-types.js';
import { parseParticleEffect } from './particle-effect-validation.js';
import { serializeParticlePreset } from './particle-serialization.js';

/** @public */
export interface SerializeParticleEffectOptions {
  space?: number;
}

/** Serialize a validated particle effect with deterministic field ordering. @public */
export function serializeParticleEffect(
  value: ParticleEffectDocumentV1,
  options: SerializeParticleEffectOptions = {},
): string {
  const effect = parseParticleEffect(value);
  const space = Math.max(0, Math.min(10, options.space ?? 2));
  return `${JSON.stringify(
    {
      emitters: effect.emitters.map((layer) => ({
        enabled: layer.enabled,
        layerId: layer.layerId,
        name: layer.name,
        offset: { x: layer.offset.x, y: layer.offset.y },
        preset: JSON.parse(serializeParticlePreset(layer.preset)) as unknown,
        textureShape: layer.textureShape,
      })),
      id: effect.id,
      kind: effect.kind,
      name: effect.name,
      version: effect.version,
    },
    undefined,
    space,
  )}\n`;
}
