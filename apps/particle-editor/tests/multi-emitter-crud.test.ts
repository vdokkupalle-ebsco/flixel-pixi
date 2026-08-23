import { describe, expect, it } from 'vitest';
import {
  createEffectDocument,
  createLayerId,
  MAX_EMITTERS,
  ParticleEditorStore,
  selectedEmitter,
  type ParticleEmitterLayerV1,
} from '../src/editor-store';
import { findStarterPreset, getDefaultStarterPreset } from '../src/presets';

describe('multi-emitter CRUD and inspector interactions', () => {
  it('adds a unique emitter up to MAX_EMITTERS', () => {
    const starter = getDefaultStarterPreset();
    const doc = createEffectDocument(starter, 'circle');
    const store = new ParticleEditorStore({
      document: doc,
      selectedEmitterId: doc.emitters[0]?.layerId ?? '',
      preview: {
        background: '#07101c',
        pointerMode: 'auto',
        scale: 'fit',
        timeScale: 1,
      },
    });

    expect(store.status.snapshot.document.emitters).toHaveLength(1);

    const layerId2 = createLayerId();
    store.update('Add Emitter 2', (draft) => {
      draft.document.emitters.push({
        layerId: layerId2,
        name: 'Emitter 2',
        enabled: true,
        offset: { x: 10, y: -20 },
        textureShape: 'square',
        preset: {
          ...getDefaultStarterPreset(),
          id: 'emitter-2',
          name: 'Emitter 2',
        },
      });
      draft.selectedEmitterId = layerId2;
    });

    expect(store.status.snapshot.document.emitters).toHaveLength(2);
    expect(store.status.snapshot.selectedEmitterId).toBe(layerId2);
    expect(selectedEmitter(store.status.snapshot).name).toBe('Emitter 2');
    expect(selectedEmitter(store.status.snapshot).offset).toEqual({
      x: 10,
      y: -20,
    });
    expect(selectedEmitter(store.status.snapshot).textureShape).toBe('square');
  });

  it('duplicates an emitter with deep copied preset and unique IDs', () => {
    const starter = getDefaultStarterPreset();
    const doc = createEffectDocument(starter, 'circle');
    const store = new ParticleEditorStore({
      document: doc,
      selectedEmitterId: doc.emitters[0]?.layerId ?? '',
      preview: {
        background: '#07101c',
        pointerMode: 'auto',
        scale: 'fit',
        timeScale: 1,
      },
    });

    const current = selectedEmitter(store.status.snapshot);
    const newLayerId = createLayerId();
    store.update('Duplicate emitter', (draft) => {
      const duplicateLayer: ParticleEmitterLayerV1 = {
        layerId: newLayerId,
        name: `${current.name} copy`,
        enabled: true,
        offset: { ...current.offset },
        textureShape: current.textureShape,
        preset: {
          ...structuredClone(current.preset),
          id: `${current.preset.id}-copy`,
          name: `${current.name} copy`,
        },
      };
      draft.document.emitters.push(duplicateLayer);
      draft.selectedEmitterId = newLayerId;
    });

    expect(store.status.snapshot.document.emitters).toHaveLength(2);
    const duplicated = selectedEmitter(store.status.snapshot);
    expect(duplicated.layerId).toBe(newLayerId);
    expect(duplicated.name).toBe('Spark fountain copy');
    expect(duplicated.preset.id).toBe('starter-spark-fountain-copy');

    // Mutating duplicate does not mutate original
    store.update('Mutate duplicate', (draft) => {
      selectedEmitter(draft).preset.capacity = 48;
    });

    expect(store.status.snapshot.document.emitters[0]?.preset.capacity).toBe(
      160,
    );
    expect(store.status.snapshot.document.emitters[1]?.preset.capacity).toBe(
      48,
    );
  });

  it('deletes an emitter and selects a valid remaining emitter', () => {
    const starter1 = getDefaultStarterPreset();
    const starter2 = findStarterPreset('starter-campfire');
    if (starter2 === undefined) throw new Error('starter-campfire not found');

    const layer1 = 'layer-1';
    const layer2 = 'layer-2';
    const layer3 = 'layer-3';

    const store = new ParticleEditorStore({
      document: {
        kind: 'flixel-pixi-particle-effect',
        version: 1,
        id: 'tri-effect',
        name: 'Tri Effect',
        emitters: [
          {
            layerId: layer1,
            name: 'Layer 1',
            enabled: true,
            offset: { x: 0, y: 0 },
            textureShape: 'circle',
            preset: starter1,
          },
          {
            layerId: layer2,
            name: 'Layer 2',
            enabled: true,
            offset: { x: 0, y: 0 },
            textureShape: 'circle',
            preset: starter2,
          },
          {
            layerId: layer3,
            name: 'Layer 3',
            enabled: true,
            offset: { x: 0, y: 0 },
            textureShape: 'circle',
            preset: starter1,
          },
        ],
      },
      selectedEmitterId: layer2,
      preview: {
        background: '#07101c',
        pointerMode: 'auto',
        scale: 'fit',
        timeScale: 1,
      },
    });

    // Delete middle layer (layer2) -> should select layer1
    store.update('Delete layer 2', (draft) => {
      draft.document.emitters = draft.document.emitters.filter(
        (e) => e.layerId !== layer2,
      );
      draft.selectedEmitterId = layer1;
    });

    expect(store.status.snapshot.document.emitters).toHaveLength(2);
    expect(store.status.snapshot.selectedEmitterId).toBe(layer1);
    expect(selectedEmitter(store.status.snapshot).name).toBe('Layer 1');
  });

  it('prevents deleting the last emitter (minimum 1 emitter required)', () => {
    const starter = getDefaultStarterPreset();
    const doc = createEffectDocument(starter, 'circle');
    const store = new ParticleEditorStore({
      document: doc,
      selectedEmitterId: doc.emitters[0]?.layerId ?? '',
      preview: {
        background: '#07101c',
        pointerMode: 'auto',
        scale: 'fit',
        timeScale: 1,
      },
    });

    expect(() =>
      store.update('Delete last', (draft) => {
        draft.document.emitters = [];
      }),
    ).toThrow(/must contain at least one emitter/);
  });

  it('toggling enable/disable updates layer state without affecting other layers', () => {
    const starter1 = getDefaultStarterPreset();
    const starter2 = findStarterPreset('starter-campfire');
    if (starter2 === undefined) throw new Error('starter-campfire not found');

    const store = new ParticleEditorStore({
      document: {
        kind: 'flixel-pixi-particle-effect',
        version: 1,
        id: 'multi-effect',
        name: 'Multi Effect',
        emitters: [
          {
            layerId: 'layer-1',
            name: 'Layer 1',
            enabled: true,
            offset: { x: 0, y: 0 },
            textureShape: 'circle',
            preset: starter1,
          },
          {
            layerId: 'layer-2',
            name: 'Layer 2',
            enabled: true,
            offset: { x: 0, y: 0 },
            textureShape: 'circle',
            preset: starter2,
          },
        ],
      },
      selectedEmitterId: 'layer-1',
      preview: {
        background: '#07101c',
        pointerMode: 'auto',
        scale: 'fit',
        timeScale: 1,
      },
    });

    store.update('Disable layer 1', (draft) => {
      const layer1 = draft.document.emitters.find(
        (e) => e.layerId === 'layer-1',
      );
      if (layer1) layer1.enabled = false;
    });

    expect(store.status.snapshot.document.emitters[0]?.enabled).toBe(false);
    expect(store.status.snapshot.document.emitters[1]?.enabled).toBe(true);
  });

  it('inspector edits target only the currently selected layer', () => {
    const starter1 = getDefaultStarterPreset();
    const starter2 = findStarterPreset('starter-campfire');
    if (starter2 === undefined) throw new Error('starter-campfire not found');

    const store = new ParticleEditorStore({
      document: {
        kind: 'flixel-pixi-particle-effect',
        version: 1,
        id: 'multi-effect',
        name: 'Multi Effect',
        emitters: [
          {
            layerId: 'layer-1',
            name: 'Layer 1',
            enabled: true,
            offset: { x: 0, y: 0 },
            textureShape: 'circle',
            preset: starter1,
          },
          {
            layerId: 'layer-2',
            name: 'Layer 2',
            enabled: true,
            offset: { x: 0, y: 0 },
            textureShape: 'square',
            preset: starter2,
          },
        ],
      },
      selectedEmitterId: 'layer-2',
      preview: {
        background: '#07101c',
        pointerMode: 'auto',
        scale: 'fit',
        timeScale: 1,
      },
    });

    store.update('Change layer 2 velocity and seed', (draft) => {
      const selected = selectedEmitter(draft);
      selected.preset.seed = 99999;
      selected.preset.motion.velocity.x.min = -500;
    });

    expect(store.status.snapshot.document.emitters[0]?.preset.seed).toBe(
      20260823,
    );
    expect(store.status.snapshot.document.emitters[1]?.preset.seed).toBe(99999);
    expect(
      store.status.snapshot.document.emitters[1]?.preset.motion.velocity.x.min,
    ).toBe(-500);
  });

  it('rejects adding beyond MAX_EMITTERS', () => {
    const starter = getDefaultStarterPreset();
    const emitters: ParticleEmitterLayerV1[] = Array.from(
      { length: MAX_EMITTERS },
      (_, i) => ({
        layerId: `layer-${String(i + 1)}`,
        name: `Layer ${String(i + 1)}`,
        enabled: true,
        offset: { x: 0, y: 0 },
        textureShape: 'circle',
        preset: starter,
      }),
    );

    const store = new ParticleEditorStore({
      document: {
        kind: 'flixel-pixi-particle-effect',
        version: 1,
        id: 'full-effect',
        name: 'Full Effect',
        emitters,
      },
      selectedEmitterId: 'layer-1',
      preview: {
        background: '#07101c',
        pointerMode: 'auto',
        scale: 'fit',
        timeScale: 1,
      },
    });

    expect(() =>
      store.update('Add 9th emitter', (draft) => {
        draft.document.emitters.push({
          layerId: 'layer-9',
          name: 'Layer 9',
          enabled: true,
          offset: { x: 0, y: 0 },
          textureShape: 'circle',
          preset: starter,
        });
      }),
    ).toThrow(/cannot exceed 8 emitters/);
  });
});
