import {
  parseParticleEffect,
  parsePhysicsWorld,
  serializeProjectDocument,
} from '@flixel-pixi/schemas';
import { describe, expect, it } from 'vitest';

import {
  activeScene,
  activeSceneSettings,
  createInitialProject,
  getEditorExtension,
  parseLevelProject,
  type LevelEditorSnapshot,
} from '../src/model';

function snapshot(): LevelEditorSnapshot {
  return {
    document: createInitialProject(),
    selectedEntityIds: [],
    snapToGrid: true,
    tool: 'select',
  };
}

describe('level editor project model', () => {
  it('creates a valid versioned project with scene settings and physics', () => {
    const initial = snapshot();
    const json = serializeProjectDocument(initial.document);
    const parsed = parseLevelProject(JSON.parse(json));

    expect(getEditorExtension(parsed).version).toBe(1);
    expect(activeScene(initial).id).toBe('scene-main');
    expect(
      parsePhysicsWorld(activeSceneSettings(initial).physics).schemaVersion,
    ).toBe(1);
  });

  it('includes a Particle Editor compatible starter effect', () => {
    const document = createInitialProject();
    const effectAsset = document.assets.find(
      (asset) => asset.id === 'asset-neon-sparks',
    );
    expect(effectAsset).toBeDefined();
    const encoded =
      effectAsset?.src.slice((effectAsset.src.indexOf(',') ?? -1) + 1) ?? '';
    const effect = parseParticleEffect(JSON.parse(decodeURIComponent(encoded)));
    expect(effect.name).toBe('Neon sparks');
    expect(effect.emitters).toHaveLength(1);
  });

  it('rejects projects without the level editor extension', () => {
    const document = createInitialProject();
    delete document.extensions;
    expect(() => parseLevelProject(document)).toThrow(/extension/i);
  });

  it('rejects unsupported editor versions and malformed physics', () => {
    const unsupported = createInitialProject();
    const unsupportedExtension = unsupported.extensions
      ?.flixelPixiLevelEditor as { version?: number };
    unsupportedExtension.version = 2;
    expect(() => parseLevelProject(unsupported)).toThrow(/version/i);

    const malformed = createInitialProject();
    const malformedExtension = malformed.extensions
      ?.flixelPixiLevelEditor as unknown as {
      scenes: Record<string, { physics: unknown }>;
    };
    const sceneSettings = malformedExtension.scenes['scene-main'];
    expect(sceneSettings).toBeDefined();
    if (sceneSettings === undefined) return;
    sceneSettings.physics = { bodies: 'invalid' };
    expect(() => parseLevelProject(malformed)).toThrow();
  });

  it('serializes the same project deterministically', () => {
    const document = createInitialProject();
    expect(serializeProjectDocument(document, { space: 2 })).toBe(
      serializeProjectDocument(structuredClone(document), { space: 2 }),
    );
  });
});
