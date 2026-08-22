import { describe, expect, it } from 'vitest';

import {
  createTypeScriptSnippet,
  parseEditorSnapshot,
  parseImportedPreset,
  serializeEditorSnapshot,
} from '../src/io';
import { getDefaultStarterPreset } from '../src/presets';

describe('particle editor import and export', () => {
  it('round-trips autosaved editor state', () => {
    const original = {
      preset: getDefaultStarterPreset(),
      preview: {
        background: '#112233',
        pointerMode: 'trail' as const,
        scale: 'large' as const,
        textureShape: 'square' as const,
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
        textureShape: 'circle',
        timeScale: 1,
      },
    };

    expect(
      parseEditorSnapshot(JSON.stringify(original)).preview.pointerMode,
    ).toBe('auto');
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
