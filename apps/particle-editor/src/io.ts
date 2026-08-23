import {
  parseParticlePreset,
  serializeParticlePreset,
  type ParticlePresetV1,
} from 'flixel-pixi';

import {
  createEffectDocument,
  validateEffectDocument,
  type EditorSnapshot,
  type ParticleEffectDocumentV1,
  type PreviewSettings,
} from './editor-store';

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
      document: {
        ...snapshot.document,
        emitters: snapshot.document.emitters.map((emitter) => ({
          ...emitter,
          preset: JSON.parse(serializeParticlePreset(emitter.preset)) as unknown,
        })),
      },
      selectedEmitterId: snapshot.selectedEmitterId,
      preview: snapshot.preview,
      savedAt: new Date().toISOString(),
    },
    undefined,
    2,
  );
}

type PersistedPreviewSettings = Omit<PreviewSettings, 'pointerMode'> & {
  pointerMode?: PreviewSettings['pointerMode'];
  textureShape?: 'circle' | 'square';
};

function parsePreviewSettings(value: unknown): PreviewSettings {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError('Saved preview settings are invalid.');
  }
  const record = value as PersistedPreviewSettings;
  if (
    typeof record.background !== 'string' ||
    (record.pointerMode !== undefined &&
      record.pointerMode !== 'auto' &&
      record.pointerMode !== 'burst' &&
      record.pointerMode !== 'trail') ||
    (record.scale !== 'compact' &&
      record.scale !== 'fit' &&
      record.scale !== 'large') ||
    typeof record.timeScale !== 'number' ||
    !Number.isFinite(record.timeScale) ||
    record.timeScale <= 0
  ) {
    throw new TypeError('Saved preview settings are invalid.');
  }

  return {
    background: record.background,
    pointerMode: record.pointerMode ?? 'auto',
    scale: record.scale,
    timeScale: record.timeScale,
  };
}

export function migrateEditorSnapshot(value: unknown): EditorSnapshot {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError('Saved editor data must be an object.');
  }
  const record = value as Record<string, unknown>;

  // Check if it's already a multi-emitter document snapshot
  if ('document' in record && record.document !== undefined) {
    const document = validateEffectDocument(record.document);
    const preview = parsePreviewSettings(record.preview);
    const selectedEmitterId =
      typeof record.selectedEmitterId === 'string' &&
      document.emitters.some(
        (emitter) => emitter.layerId === record.selectedEmitterId,
      )
        ? record.selectedEmitterId
        : (document.emitters[0]?.layerId ?? '');

    return {
      document,
      selectedEmitterId,
      preview,
    };
  }

  // Legacy single-preset migration
  if ('preset' in record && record.preset !== undefined) {
    const preset = parseParticlePreset(record.preset);
    const legacyPreview = record.preview as PersistedPreviewSettings | undefined;
    const textureShape =
      legacyPreview?.textureShape === 'square' ? 'square' : 'circle';
    const document: ParticleEffectDocumentV1 = createEffectDocument(
      preset,
      textureShape,
    );
    const preview = parsePreviewSettings(record.preview);

    return {
      document,
      selectedEmitterId: document.emitters[0]?.layerId ?? '',
      preview,
    };
  }

  throw new TypeError('Saved editor data contains neither document nor preset.');
}

export function parseEditorSnapshot(text: string): EditorSnapshot {
  const value = JSON.parse(text) as unknown;
  return migrateEditorSnapshot(value);
}
