import { describe, expect, it } from 'vitest';
import {
  createEffectDocument,
  type ParticleEffectDocumentV1,
} from '../src/editor-store';
import {
  createMultiEmitterTypeScriptSnippet,
  createTypeScriptSnippet,
  parseImportedDocument,
  serializeEffectDocument,
} from '../src/io';
import { findStarterPreset, getDefaultStarterPreset } from '../src/presets';

describe('multi-emitter import and export', () => {
  it('round-trips effect documents through serialization', () => {
    const starter1 = getDefaultStarterPreset();
    const starter2 = findStarterPreset('starter-campfire');
    if (starter2 === undefined) throw new Error('starter-campfire not found');

    const original: ParticleEffectDocumentV1 = {
      kind: 'flixel-pixi-particle-effect',
      version: 1,
      id: 'campfire-composed',
      name: 'Campfire Composed',
      emitters: [
        {
          layerId: 'flames-layer',
          name: 'Flames',
          enabled: true,
          offset: { x: 0, y: 0 },
          textureShape: 'circle',
          preset: starter2,
        },
        {
          layerId: 'sparks-layer',
          name: 'Sparks',
          enabled: false,
          offset: { x: 0, y: -12 },
          textureShape: 'square',
          preset: starter1,
        },
      ],
    };

    const json = serializeEffectDocument(original);
    const parsed = parseImportedDocument(json);

    expect(parsed).toEqual(original);
  });

  it('excludes preview and selection settings from exported effect JSON', () => {
    const starter = getDefaultStarterPreset();
    const doc = createEffectDocument(starter, 'circle');
    const json = serializeEffectDocument(doc);
    const parsed = JSON.parse(json) as Record<string, unknown>;

    expect(parsed.kind).toBe('flixel-pixi-particle-effect');
    expect(parsed.version).toBe(1);
    expect(parsed.preview).toBeUndefined();
    expect(parsed.selectedEmitterId).toBeUndefined();
    expect(parsed.savedAt).toBeUndefined();
  });

  it('imports a legacy single ParticlePresetV1 by wrapping it in a one-emitter effect document', () => {
    const starter = getDefaultStarterPreset();
    const presetJson = JSON.stringify(starter);

    const doc = parseImportedDocument(presetJson);
    expect(doc.kind).toBe('flixel-pixi-particle-effect');
    expect(doc.version).toBe(1);
    expect(doc.name).toBe(starter.name);
    expect(doc.emitters).toHaveLength(1);
    expect(doc.emitters[0]?.preset.id).toBe(starter.id);
    expect(doc.emitters[0]?.enabled).toBe(true);
    expect(doc.emitters[0]?.offset).toEqual({ x: 0, y: 0 });
  });

  it('generates multi-emitter TypeScript code that includes only enabled layers and correct offsets', () => {
    const starter1 = getDefaultStarterPreset();
    const starter2 = findStarterPreset('starter-campfire');
    if (starter2 === undefined) throw new Error('starter-campfire not found');

    const doc: ParticleEffectDocumentV1 = {
      kind: 'flixel-pixi-particle-effect',
      version: 1,
      id: 'volcano',
      name: 'Volcano Blast',
      emitters: [
        {
          layerId: 'flames',
          name: 'Flames & Fire',
          enabled: true,
          offset: { x: 0, y: 5 },
          textureShape: 'circle',
          preset: starter2,
        },
        {
          layerId: 'sparks',
          name: 'Electric Sparks',
          enabled: true,
          offset: { x: 2, y: -15 },
          textureShape: 'circle',
          preset: starter1,
        },
        {
          layerId: 'disabled-smoke',
          name: 'Hidden Smoke',
          enabled: false,
          offset: { x: 0, y: -30 },
          textureShape: 'circle',
          preset: starter1,
        },
      ],
    };

    const code = createMultiEmitterTypeScriptSnippet(doc);

    expect(code).toContain("from 'flixel-pixi'");
    expect(code).not.toContain('pixi.js');
    expect(code).toContain('createVolcanoBlastEmitters');
    expect(code).toContain('FlxParticleEmitter.fromAssets');
    expect(code).toContain('flamesFirePreset');
    expect(code).toContain('electricSparksPreset');
    expect(code).not.toContain('hiddenSmokePreset');
    expect(code).toContain('x: originX + offset.x');
    expect(code).toContain('y: originY + offset.y');
    expect(code).toContain('// Preload texture assets with FlxAssets before creating emitters:');
    expect(code).toContain('// - editor-flame');
    expect(code).toContain('// - editor-spark');
  });

  it('handles name collisions deterministically in TypeScript code generation', () => {
    const starter = getDefaultStarterPreset();
    const doc: ParticleEffectDocumentV1 = {
      kind: 'flixel-pixi-particle-effect',
      version: 1,
      id: 'twin-sparks',
      name: 'Twin Sparks',
      emitters: [
        {
          layerId: 'layer-1',
          name: 'Sparks',
          enabled: true,
          offset: { x: -10, y: 0 },
          textureShape: 'circle',
          preset: starter,
        },
        {
          layerId: 'layer-2',
          name: 'Sparks',
          enabled: true,
          offset: { x: 10, y: 0 },
          textureShape: 'circle',
          preset: starter,
        },
      ],
    };

    const code = createMultiEmitterTypeScriptSnippet(doc);
    expect(code).toContain('const sparksPreset =');
    expect(code).toContain('const sparksPreset2 =');
  });

  it('preserves single-preset TypeScript snippet creation', () => {
    const starter = getDefaultStarterPreset();
    const snippet = createTypeScriptSnippet(starter);

    expect(snippet).toContain("from 'flixel-pixi'");
    expect(snippet).toContain('FlxParticleEmitter.fromAssets');
    expect(snippet).not.toContain('pixi.js');
  });
});
