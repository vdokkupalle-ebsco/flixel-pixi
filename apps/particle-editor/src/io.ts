import {
  parseParticlePreset,
  serializeParticlePreset,
  type ParticlePresetV1,
} from 'flixel-pixi';

import type { EditorSnapshot, PreviewSettings } from './editor-store';

export const AUTOSAVE_KEY = 'flixel-pixi:particle-editor:v1';

export function createTypeScriptSnippet(preset: ParticlePresetV1): string {
  return `import {
  FlxParticleEmitter,
  type ParticlePresetV1,
} from 'flixel-pixi';

const preset = ${serializeParticlePreset(preset, { space: 2 })} satisfies ParticlePresetV1;

// Preload preset.appearance.texture.assetId with FlxAssets first.
const emitter = FlxParticleEmitter.fromAssets(preset, { x: 160, y: 120 });
add(emitter);
emitter.start();`;
}

export function parseImportedPreset(text: string): ParticlePresetV1 {
  return parseParticlePreset(JSON.parse(text) as unknown);
}

export function serializeEditorSnapshot(snapshot: EditorSnapshot): string {
  return JSON.stringify(
    {
      preset: JSON.parse(serializeParticlePreset(snapshot.preset)) as unknown,
      preview: snapshot.preview,
      savedAt: new Date().toISOString(),
    },
    undefined,
    2,
  );
}

function isPreviewSettings(value: unknown): value is PreviewSettings {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.background === 'string' &&
    (record.scale === 'compact' ||
      record.scale === 'fit' ||
      record.scale === 'large') &&
    typeof record.timeScale === 'number' &&
    Number.isFinite(record.timeScale) &&
    record.timeScale > 0
  );
}

export function parseEditorSnapshot(text: string): EditorSnapshot {
  const value = JSON.parse(text) as unknown;
  if (typeof value !== 'object' || value === null) {
    throw new TypeError('Saved editor data must be an object.');
  }
  const record = value as Record<string, unknown>;
  if (!isPreviewSettings(record.preview)) {
    throw new TypeError('Saved preview settings are invalid.');
  }
  return {
    preset: parseParticlePreset(record.preset),
    preview: record.preview,
  };
}
