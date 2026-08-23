import { describe, expect, it, vi } from 'vitest';

import {
  createEffectDocument,
  ParticleEditorStore,
  selectedEmitter,
  type EditorSnapshot,
} from '../src/editor-store';
import { getDefaultStarterPreset } from '../src/presets';

function snapshot(): EditorSnapshot {
  const doc = createEffectDocument(getDefaultStarterPreset(), 'circle');
  return {
    document: doc,
    selectedEmitterId: doc.emitters[0]?.layerId ?? '',
    preview: {
      background: '#07101c',
      pointerMode: 'auto',
      scale: 'fit',
      timeScale: 1,
    },
  };
}

describe('ParticleEditorStore', () => {
  it('tracks valid changes and supports undo and redo', () => {
    const store = new ParticleEditorStore(snapshot());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.update('Renamed emitter', (draft) => {
      const emitter = selectedEmitter(draft);
      emitter.name = 'Celebration sparks';
      emitter.preset.name = 'Celebration sparks';
    });

    expect(selectedEmitter(store.status.snapshot).name).toBe(
      'Celebration sparks',
    );
    expect(store.status.canUndo).toBe(true);
    expect(store.status.dirty).toBe(true);

    store.undo();
    expect(selectedEmitter(store.status.snapshot).name).toBe('Spark fountain');
    expect(store.status.canRedo).toBe(true);

    store.redo();
    expect(selectedEmitter(store.status.snapshot).name).toBe(
      'Celebration sparks',
    );
    expect(listener).toHaveBeenCalledTimes(4);
    unsubscribe();
  });

  it('marks the current snapshot as saved without losing history', () => {
    const store = new ParticleEditorStore(snapshot());
    store.update('Changed capacity', (draft) => {
      selectedEmitter(draft).preset.capacity = 96;
    });

    store.markSaved();

    expect(store.status.dirty).toBe(false);
    expect(store.status.canUndo).toBe(true);
    expect(store.status.label).toBe('All changes saved');
  });

  it('rejects invalid edits without changing the current preset', () => {
    const store = new ParticleEditorStore(snapshot());

    expect(() =>
      store.update('Invalid capacity', (draft) => {
        selectedEmitter(draft).preset.capacity = 0;
      }),
    ).toThrow();
    expect(selectedEmitter(store.status.snapshot).preset.capacity).toBe(160);
    expect(store.status.canUndo).toBe(false);
  });
});
