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
        scale: 'large' as const,
        timeScale: 0.5,
      },
    };

    expect(parseEditorSnapshot(serializeEditorSnapshot(original))).toEqual(
      original,
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
