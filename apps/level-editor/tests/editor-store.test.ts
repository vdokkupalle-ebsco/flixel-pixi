import { describe, expect, it, vi } from 'vitest';

import { LevelEditorStore, type LevelEditorStatus } from '../src/editor-store';
import {
  activeScene,
  createInitialProject,
  createSpriteEntity,
} from '../src/model';

function createStore(): LevelEditorStore {
  return new LevelEditorStore({
    document: createInitialProject(),
    selectedEntityIds: [],
    snapToGrid: true,
    tool: 'select',
  });
}

describe('LevelEditorStore', () => {
  it('tracks project mutations through bounded undo and redo history', () => {
    const store = createStore();
    store.update('Added sprite', (draft) => {
      activeScene(draft).entities.push(
        createSpriteEntity('asset-flixel-mark', 1),
      );
    });
    expect(activeScene(store.status.snapshot).entities).toHaveLength(1);
    expect(store.status.dirty).toBe(true);
    expect(store.status.canUndo).toBe(true);

    store.undo();
    expect(activeScene(store.status.snapshot).entities).toHaveLength(0);
    store.redo();
    expect(activeScene(store.status.snapshot).entities).toHaveLength(1);
  });

  it('does not put ephemeral tool changes in history', () => {
    const store = createStore();
    store.update(
      'Rotate tool',
      (draft) => {
        draft.tool = 'rotate';
      },
      false,
    );
    expect(store.status.snapshot.tool).toBe('rotate');
    expect(store.status.canUndo).toBe(false);
    expect(store.status.dirty).toBe(false);
  });

  it('publishes cloned snapshots to subscribers', () => {
    const store = createStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.update('Renamed', (draft) => {
      draft.document.project.name = 'Platformer';
    });
    const status = listener.mock.calls.at(-1)?.[0] as LevelEditorStatus;
    expect(status.snapshot.document.project.name).toBe('Platformer');
    unsubscribe();
  });
});
