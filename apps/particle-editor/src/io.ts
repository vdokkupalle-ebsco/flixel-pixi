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
  type ParticleEmitterLayerV1,
  type PreviewSettings,
} from './editor-store';
import { createZipBlob, type ZipFileEntry } from './zip';

export const AUTOSAVE_KEY = 'flixel-pixi:particle-editor:v1';

function toSafeIdentifier(name: string, fallback: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join('');
  if (cleaned.length === 0 || /^[0-9]/.test(cleaned)) {
    return `${fallback}${cleaned}`;
  }
  return cleaned;
}

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

export function createMultiEmitterTypeScriptSnippet(
  document: ParticleEffectDocumentV1,
): string {
  const enabledLayers = document.emitters.filter((e) => e.enabled);
  if (enabledLayers.length === 0) {
    return `// Effect "${document.name}" has no enabled emitters.`;
  }

  const textureIds = Array.from(
    new Set(
      enabledLayers.map((e) => e.preset.appearance.texture.assetId),
    ),
  );

  const usedIdentifiers = new Set<string>();
  const layerVarNames = enabledLayers.map((layer, index) => {
    let base = toSafeIdentifier(layer.name, 'layer');
    if (base.length === 0) base = `layer${String(index + 1)}`;
    let varName = `${base}Preset`;
    let suffix = 2;
    while (usedIdentifiers.has(varName)) {
      varName = `${base}Preset${String(suffix)}`;
      suffix += 1;
    }
    usedIdentifiers.add(varName);
    return varName;
  });

  const presetDeclarations = enabledLayers
    .map((layer, index) => {
      const varName = layerVarNames[index];
      const serialized = serializeParticlePreset(layer.preset, { space: 2 });
      return `const ${varName} = ${serialized} satisfies ParticlePresetV1;`;
    })
    .join('\n\n');

  const layerObjects = enabledLayers
    .map((layer, index) => {
      const varName = layerVarNames[index];
      return `  {
    name: ${JSON.stringify(layer.name)},
    offset: { x: ${String(layer.offset.x)}, y: ${String(layer.offset.y)} },
    preset: ${varName},
  },`;
    })
    .join('\n');

  const preloadComments = textureIds
    .map((id) => `// - ${id}`)
    .join('\n');

  const rawFnName = toSafeIdentifier(document.name, 'Effect');
  const effectFnName = `create${rawFnName.charAt(0).toUpperCase()}${rawFnName.slice(1)}Emitters`;

  return `import {
  FlxParticleEmitter,
  type ParticlePresetV1,
} from 'flixel-pixi';

// Preload texture assets with FlxAssets before creating emitters:
${preloadComments}

${presetDeclarations}

const layers = [
${layerObjects}
];

export function ${effectFnName}(
  originX = 160,
  originY = 120,
): FlxParticleEmitter[] {
  return layers.map(({ preset, offset }) => {
    const emitter = FlxParticleEmitter.fromAssets(preset, {
      x: originX + offset.x,
      y: originY + offset.y,
    });
    emitter.start();
    return emitter;
  });
}`;
}

export function serializeEffectDocument(
  document: ParticleEffectDocumentV1,
): string {
  return JSON.stringify(
    {
      kind: 'flixel-pixi-particle-effect',
      version: 1,
      id: document.id,
      name: document.name,
      emitters: document.emitters.map((emitter) => ({
        layerId: emitter.layerId,
        name: emitter.name,
        enabled: emitter.enabled,
        offset: emitter.offset,
        textureShape: emitter.textureShape,
        preset: JSON.parse(serializeParticlePreset(emitter.preset)) as unknown,
      })),
    },
    undefined,
    2,
  );
}

export function parseImportedDocument(text: string): ParticleEffectDocumentV1 {
  const value = JSON.parse(text) as unknown;
  if (typeof value !== 'object' || value === null) {
    throw new TypeError('Imported file must be a JSON object.');
  }
  const record = value as Record<string, unknown>;

  if (record.kind === 'flixel-pixi-particle-effect') {
    return validateEffectDocument(record);
  }

  if (record.kind === 'particle-preset') {
    const preset = parseParticlePreset(record);
    return createEffectDocument(preset);
  }

  throw new TypeError(
    `Unsupported file kind: "${String(record.kind)}". Expected "flixel-pixi-particle-effect" or "particle-preset".`,
  );
}

export function parseImportedPreset(text: string): ParticlePresetV1 {
  return parseParticlePreset(JSON.parse(text) as unknown);
}

export function serializeEditorSnapshot(snapshot: EditorSnapshot): string {
  return JSON.stringify(
    {
      document: JSON.parse(serializeEffectDocument(snapshot.document)) as unknown,
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

export async function createEffectBundleZip(
  document: ParticleEffectDocumentV1,
  getTexturePngBlob: (layer: ParticleEmitterLayerV1) => Promise<Blob>,
): Promise<Blob> {
  const effectJson = serializeEffectDocument(document);
  const tsCode = createMultiEmitterTypeScriptSnippet(document);
  const rootDir = document.id;

  const rawFnName = toSafeIdentifier(document.name, 'Effect');
  const effectFnName = `create${rawFnName.charAt(0).toUpperCase()}${rawFnName.slice(1)}Emitters`;

  const layerList = document.emitters
    .map(
      (e) =>
        `- **${e.name}** (${e.preset.emission.mode === 'continuous' ? `${String(e.preset.emission.rate)}/sec` : `${String(e.preset.emission.count)} burst`}, offset: [${String(e.offset.x)}, ${String(e.offset.y)}])`,
    )
    .join('\n');

  const readme = `# ${document.name} Particle Effect

Composed multi-emitter particle effect created with the Flixel-Pixi Particle Editor.

## Emitter Layers
${layerList}

## Quick Integration

1. Preload all textures in \`textures/\` using \`FlxAssets\`.
2. Instantiate and add the emitters in your state:

\`\`\`ts
import { ${effectFnName} } from './${document.id}';

// Inside your FlxState.create():
const emitters = ${effectFnName}(160, 120);
for (const emitter of emitters) {
  add(emitter);
}
\`\`\`
`;

  const entries: ZipFileEntry[] = [
    {
      path: `${rootDir}/${document.id}.effect.json`,
      data: effectJson,
    },
    {
      path: `${rootDir}/${document.id}.ts`,
      data: tsCode,
    },
    {
      path: `${rootDir}/README.md`,
      data: readme,
    },
  ];

  const processedAssets = new Set<string>();
  for (const layer of document.emitters) {
    const assetId = layer.preset.appearance.texture.assetId;
    if (processedAssets.has(assetId)) continue;
    processedAssets.add(assetId);
    const pngBlob = await getTexturePngBlob(layer);
    const arrayBuffer = await pngBlob.arrayBuffer();
    entries.push({
      path: `${rootDir}/textures/${assetId}.png`,
      data: new Uint8Array(arrayBuffer),
    });
  }

  return createZipBlob(entries);
}
