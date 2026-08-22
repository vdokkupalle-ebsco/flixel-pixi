import { describe, expect, it, vi } from 'vitest';

import { ParticleEditorStore, type EditorSnapshot } from '../src/editor-store';
import { getDefaultStarterPreset } from '../src/presets';

function snapshot(): EditorSnapshot {
  return {
    preset: getDefaultStarterPreset(),
    preview: {
      background: '#07101c',
      pointerMode: 'auto',
      scale: 'fit',
      textureShape: 'circle',
      timeScale: 1,
    },
  };
}

describe('ParticleEditorStore', () => {
  it('tracks valid changes and supports undo and redo', () => {
    const store = new ParticleEditorStore(snapshot());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.update('Renamed emitter', ({ preset }) => {
      preset.name = 'Celebration sparks';
    });

    expect(store.status.snapshot.preset.name).toBe('Celebration sparks');
    expect(store.status.canUndo).toBe(true);
    expect(store.status.dirty).toBe(true);

    store.undo();
    expect(store.status.snapshot.preset.name).toBe('Spark fountain');
    expect(store.status.canRedo).toBe(true);

    store.redo();
    expect(store.status.snapshot.preset.name).toBe('Celebration sparks');
    expect(listener).toHaveBeenCalledTimes(4);
    unsubscribe();
  });

  it('marks the current snapshot as saved without losing history', () => {
    const store = new ParticleEditorStore(snapshot());
    store.update('Changed capacity', ({ preset }) => {
      preset.capacity = 96;
    });

    store.markSaved();

    expect(store.status.dirty).toBe(false);
    expect(store.status.canUndo).toBe(true);
    expect(store.status.label).toBe('All changes saved');
  });

  it('rejects invalid edits without changing the current preset', () => {
    const store = new ParticleEditorStore(snapshot());

    expect(() =>
      store.update('Invalid capacity', ({ preset }) => {
        preset.capacity = 0;
      }),
    ).toThrow();
    expect(store.status.snapshot.preset.capacity).toBe(160);
    expect(store.status.canUndo).toBe(false);
  });
});
