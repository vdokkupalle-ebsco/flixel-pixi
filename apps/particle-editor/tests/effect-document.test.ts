import { describe, expect, it } from 'vitest';
import {
  cloneEffectDocument,
  createEffectDocument,
  ParticleEditorStore,
  selectedEmitter,
  validateEffectDocument,
  type EditorSnapshot,
  type ParticleEffectDocumentV1,
} from '../src/editor-store';
import { parseEditorSnapshot } from '../src/io';
import { findStarterPreset, getDefaultStarterPreset } from '../src/presets';

describe('ParticleEffectDocumentV1', () => {
  it('creates a valid one-emitter document from a preset', () => {
    const starter = getDefaultStarterPreset();
    const doc = createEffectDocument(starter, 'circle');

    expect(doc.kind).toBe('flixel-pixi-particle-effect');
    expect(doc.version).toBe(1);
    expect(doc.id).toBe(starter.id);
    expect(doc.name).toBe(starter.name);
    expect(doc.emitters).toHaveLength(1);
    expect(doc.emitters[0]?.name).toBe(starter.name);
    expect(doc.emitters[0]?.enabled).toBe(true);
    expect(doc.emitters[0]?.offset).toEqual({ x: 0, y: 0 });
    expect(doc.emitters[0]?.textureShape).toBe('circle');
    expect(doc.emitters[0]?.preset.id).toBe(starter.id);
  });

  it('migrates a legacy single-preset autosave into a valid document', () => {
    const legacy = {
      preset: getDefaultStarterPreset(),
      preview: {
        background: '#07101c',
        pointerMode: 'burst',
        scale: 'fit',
        textureShape: 'square',
        timeScale: 1,
      },
    };

    const snapshot = parseEditorSnapshot(JSON.stringify(legacy));
    expect(snapshot.document.kind).toBe('flixel-pixi-particle-effect');
    expect(snapshot.document.emitters).toHaveLength(1);
    expect(snapshot.document.emitters[0]?.textureShape).toBe('square');
    expect(snapshot.selectedEmitterId).toBe(
      snapshot.document.emitters[0]?.layerId,
    );
    expect(snapshot.preview.pointerMode).toBe('burst');
  });

  it('rejects duplicate layer IDs', () => {
    const starter = getDefaultStarterPreset();
    const doc: ParticleEffectDocumentV1 = {
      kind: 'flixel-pixi-particle-effect',
      version: 1,
      id: 'test-effect',
      name: 'Test Effect',
      emitters: [
        {
          layerId: 'layer-dup',
          name: 'Layer 1',
          enabled: true,
          offset: { x: 0, y: 0 },
          textureShape: 'circle',
          preset: starter,
        },
        {
          layerId: 'layer-dup',
          name: 'Layer 2',
          enabled: true,
          offset: { x: 0, y: 0 },
          textureShape: 'circle',
          preset: starter,
        },
      ],
    };

    expect(() => validateEffectDocument(doc)).toThrow(/Duplicate emitter layerId/);
  });

  it('rejects an empty emitter list', () => {
    const doc = {
      kind: 'flixel-pixi-particle-effect',
      version: 1,
      id: 'empty-effect',
      name: 'Empty',
      emitters: [],
    };

    expect(() => validateEffectDocument(doc)).toThrow(
      /must contain at least one emitter/,
    );
  });

  it('rejects documents exceeding the max limit of 8 emitters', () => {
    const starter = getDefaultStarterPreset();
    const emitters = Array.from({ length: 9 }, (_, index) => ({
      layerId: `layer-${String(index + 1)}`,
      name: `Layer ${String(index + 1)}`,
      enabled: true,
      offset: { x: 0, y: 0 },
      textureShape: 'circle' as const,
      preset: starter,
    }));

    const doc = {
      kind: 'flixel-pixi-particle-effect',
      version: 1,
      id: 'too-many-emitters',
      name: 'Too Many',
      emitters,
    };

    expect(() => validateEffectDocument(doc)).toThrow(/cannot exceed 8 emitters/);
  });

  it('rejects an invalid selected emitter that does not exist in the document', () => {
    const starter = getDefaultStarterPreset();
    const doc = createEffectDocument(starter, 'circle');
    const invalidSnapshot: EditorSnapshot = {
      document: doc,
      selectedEmitterId: 'non-existent-layer-id',
      preview: {
        background: '#07101c',
        pointerMode: 'auto',
        scale: 'fit',
        timeScale: 1,
      },
    };

    expect(() => new ParticleEditorStore(invalidSnapshot)).toThrow(
      /Selected emitter "non-existent-layer-id" was not found/,
    );
  });

  it('validates every contained ParticlePresetV1', () => {
    const invalidDoc = {
      kind: 'flixel-pixi-particle-effect',
      version: 1,
      id: 'invalid-preset-effect',
      name: 'Invalid',
      emitters: [
        {
          layerId: 'layer-1',
          name: 'Layer 1',
          enabled: true,
          offset: { x: 0, y: 0 },
          textureShape: 'circle',
          preset: { kind: 'not-a-preset' },
        },
      ],
    };

    expect(() => validateEffectDocument(invalidDoc)).toThrow();
  });

  it('undo and redo restore both emitter data and selection', () => {
    const starter1 = getDefaultStarterPreset();
    const starter2 = findStarterPreset('starter-campfire');
    if (starter2 === undefined) throw new Error('starter-campfire not found');
    const doc: ParticleEffectDocumentV1 = {
      kind: 'flixel-pixi-particle-effect',
      version: 1,
      id: 'multi-effect',
      name: 'Multi Effect',
      emitters: [
        {
          layerId: 'layer-1',
          name: 'Sparks',
          enabled: true,
          offset: { x: 0, y: 0 },
          textureShape: 'circle',
          preset: starter1,
        },
        {
          layerId: 'layer-2',
          name: 'Flames',
          enabled: true,
          offset: { x: 0, y: -10 },
          textureShape: 'circle',
          preset: starter2,
        },
      ],
    };

    const store = new ParticleEditorStore({
      document: doc,
      selectedEmitterId: 'layer-1',
      preview: {
        background: '#07101c',
        pointerMode: 'auto',
        scale: 'fit',
        timeScale: 1,
      },
    });

    // Edit layer-1
    store.update('Renamed Sparks', (draft) => {
      selectedEmitter(draft).name = 'Golden Sparks';
    });
    expect(selectedEmitter(store.status.snapshot).name).toBe('Golden Sparks');

    // Switch selection and edit layer-2
    store.update('Select layer-2', (draft) => {
      draft.selectedEmitterId = 'layer-2';
    });
    expect(store.status.snapshot.selectedEmitterId).toBe('layer-2');

    store.update('Edit layer-2 capacity', (draft) => {
      selectedEmitter(draft).preset.capacity = 300;
    });
    expect(selectedEmitter(store.status.snapshot).preset.capacity).toBe(300);

    // Undo edit layer-2
    store.undo();
    expect(selectedEmitter(store.status.snapshot).preset.capacity).toBe(220);

    // Undo select layer-2
    store.undo();
    expect(store.status.snapshot.selectedEmitterId).toBe('layer-1');
    expect(selectedEmitter(store.status.snapshot).name).toBe('Golden Sparks');

    // Undo edit layer-1
    store.undo();
    expect(selectedEmitter(store.status.snapshot).name).toBe('Sparks');

    // Redo all
    store.redo();
    expect(selectedEmitter(store.status.snapshot).name).toBe('Golden Sparks');
    store.redo();
    expect(store.status.snapshot.selectedEmitterId).toBe('layer-2');
    store.redo();
    expect(selectedEmitter(store.status.snapshot).preset.capacity).toBe(300);
  });

  it('editing one emitter does not mutate another emitter or cloned document', () => {
    const starter = getDefaultStarterPreset();
    const doc: ParticleEffectDocumentV1 = {
      kind: 'flixel-pixi-particle-effect',
      version: 1,
      id: 'multi-effect',
      name: 'Multi Effect',
      emitters: [
        {
          layerId: 'layer-1',
          name: 'Emitter A',
          enabled: true,
          offset: { x: 0, y: 0 },
          textureShape: 'circle',
          preset: starter,
        },
        {
          layerId: 'layer-2',
          name: 'Emitter B',
          enabled: true,
          offset: { x: 0, y: 0 },
          textureShape: 'circle',
          preset: starter,
        },
      ],
    };

    const clone = cloneEffectDocument(doc);
    const store = new ParticleEditorStore({
      document: doc,
      selectedEmitterId: 'layer-1',
      preview: {
        background: '#07101c',
        pointerMode: 'auto',
        scale: 'fit',
        timeScale: 1,
      },
    });

    store.update('Mutate emitter A', (draft) => {
      const a = selectedEmitter(draft);
      a.preset.capacity = 42;
      a.preset.name = 'Custom A';
    });

    const currentDoc = store.status.snapshot.document;
    const emitterA = currentDoc.emitters.find((e) => e.layerId === 'layer-1');
    const emitterB = currentDoc.emitters.find((e) => e.layerId === 'layer-2');

    expect(emitterA?.preset.capacity).toBe(42);
    expect(emitterA?.preset.name).toBe('Custom A');
    expect(emitterB?.preset.capacity).toBe(160);
    expect(emitterB?.preset.name).toBe('Spark fountain');
    expect(clone.emitters[0]?.preset.capacity).toBe(160);
  });
});
