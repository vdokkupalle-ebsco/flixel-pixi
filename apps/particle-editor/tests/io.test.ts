import { describe, expect, it } from 'vitest';

import {
  createEffectDocument,
  type EditorSnapshot,
} from '../src/editor-store';
import {
  createTypeScriptSnippet,
  parseEditorSnapshot,
  parseImportedPreset,
  serializeEditorSnapshot,
} from '../src/io';
import { getDefaultStarterPreset } from '../src/presets';

describe('particle editor import and export', () => {
  it('round-trips autosaved editor state', () => {
    const doc = createEffectDocument(getDefaultStarterPreset(), 'square');
    const original: EditorSnapshot = {
      document: doc,
      selectedEmitterId: doc.emitters[0]?.layerId ?? '',
      preview: {
        background: '#112233',
        pointerMode: 'trail',
        scale: 'large',
        timeScale: 0.5,
      },
    };

    expect(parseEditorSnapshot(serializeEditorSnapshot(original))).toEqual(
      original,
    );
  });

  it('migrates autosaves created before pointer interactions were added', () => {
    const original = {
      preset: getDefaultStarterPreset(),
      preview: {
        background: '#112233',
        scale: 'fit',
        textureShape: 'square',
        timeScale: 1,
      },
    };

    const migrated = parseEditorSnapshot(JSON.stringify(original));
    expect(migrated.preview.pointerMode).toBe('auto');
    expect(migrated.document.emitters[0]?.textureShape).toBe('square');
    expect(migrated.document.emitters[0]?.name).toBe('Spark fountain');
    expect(migrated.selectedEmitterId).toBe(
      migrated.document.emitters[0]?.layerId,
    );
  });

  it('validates imported presets through the public schema API', () => {
    expect(() => parseImportedPreset('{"kind":"unknown"}')).toThrow();
  });

  it('generates a public Flixel-Pixi integration snippet', () => {
    const snippet = createTypeScriptSnippet(getDefaultStarterPreset());

    expect(snippet).toContain("from 'flixel-pixi'");
    expect(snippet).toContain('FlxParticleEmitter.fromAssets');
    expect(snippet).not.toContain('pixi.js');
  });
});
