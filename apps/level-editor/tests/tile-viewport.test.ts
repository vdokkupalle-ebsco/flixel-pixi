import { afterEach, describe, expect, it, vi } from 'vitest';
import { LevelEditorStore } from '../src/editor-store';
import { activeLayer, createInitialProject } from '../src/model';
import { SceneViewport } from '../src/viewport';
import { paletteTiles } from '../src/tile-palette';
import { TileEditing } from '../src/tile-editing';
import { starterTileset } from '../src/tiles';

const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  vi.restoreAllMocks();
});

function editor() {
  const document = createInitialProject(),
    asset = starterTileset();
  document.assets.push(asset);
  const store = new LevelEditorStore({
    document,
    selectedEntityIds: [],
    snapToGrid: true,
    tool: 'brush',
    tileStamp: {
      width: 1,
      height: 1,
      tiles: [paletteTiles(asset).tiles[0] ?? null],
    },
  });
  const canvas = window.document.createElement('canvas');
  const context = new Proxy(
    {},
    { get: () => vi.fn() },
  ) as CanvasRenderingContext2D;
  Object.defineProperty(canvas, 'getContext', { value: () => context });
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 1056, 636),
  );
  const captures = new Set<number>();
  canvas.setPointerCapture = (id) => {
    captures.add(id);
  };
  canvas.hasPointerCapture = (id) => captures.has(id);
  canvas.releasePointerCapture = (id) => {
    captures.delete(id);
  };
  const viewport = new SceneViewport(canvas, store);
  cleanups.push(() => viewport.destroy());
  const pointer = (type: string, x: number, y: number, button = 0) =>
    canvas.dispatchEvent(
      new PointerEvent(type, {
        pointerId: 1,
        button,
        clientX: 48 + (x + 0.5) * 16,
        clientY: 48 + (y + 0.5) * 16,
      }),
    );
  const cells = () => activeLayer(store.status.snapshot).tilemap?.cells ?? {};
  return { store, canvas, pointer, cells, captures };
}

describe('tile viewport interactions', () => {
  it('commits a fast drag only on release and undoes it as one operation', () => {
    const { store, pointer, cells, captures } = editor();
    pointer('pointerdown', 2, 3);
    pointer('pointermove', 12, 3);
    expect(cells()).toEqual({});
    pointer('pointerup', 12, 3);
    expect(Object.keys(cells())).toHaveLength(11);
    expect(captures.size).toBe(0);
    store.undo();
    expect(cells()).toEqual({});
    store.redo();
    expect(Object.keys(cells())).toHaveLength(11);
  });

  it('cancels on Escape and pointer cancellation without changing history', () => {
    const { store, pointer, cells, captures } = editor();
    pointer('pointerdown', 2, 3);
    pointer('pointermove', 8, 3);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    pointer('pointerup', 8, 3);
    expect(cells()).toEqual({});
    expect(store.status.canUndo).toBe(false);
    pointer('pointerdown', 2, 3);
    pointer('pointercancel', 2, 3);
    expect(captures.size).toBe(0);
    expect(cells()).toEqual({});
  });

  it('protects locked and hidden layers from painting and erasing', () => {
    const { store, pointer, cells, canvas } = editor();
    const messages = vi.fn();
    canvas.addEventListener('tile-message', messages);
    for (const state of ['locked', 'hidden'] as const) {
      store.update('Layer state', (draft) => {
        activeLayer(draft).locked = state === 'locked';
        activeLayer(draft).visible = state !== 'hidden';
      });
      pointer('pointerdown', 1, 1);
      pointer('pointerup', 1, 1);
      expect(cells()).toEqual({});
    }
    expect(messages).toHaveBeenCalledTimes(2);
  });

  it('right-drag captures a reusable multi-cell stamp without painting', () => {
    const { store, pointer, cells } = editor();
    pointer('pointerdown', 2, 3);
    pointer('pointermove', 4, 3);
    pointer('pointerup', 4, 3);
    const original = structuredClone(cells());
    pointer('pointerdown', 2, 3, 2);
    pointer('pointermove', 4, 3, 2);
    pointer('pointerup', 4, 3, 2);
    expect(cells()).toEqual(original);
    expect(store.status.snapshot.tileStamp).toMatchObject({
      width: 3,
      height: 1,
    });
    pointer('pointerdown', 2, 5);
    pointer('pointerup', 2, 5);
    expect(Object.keys(cells())).toHaveLength(6);
  });

  it('discards a live stroke when the active layer changes', () => {
    const { store, pointer, cells } = editor();
    pointer('pointerdown', 2, 3);
    pointer('pointermove', 4, 3);
    store.update('Lock layer', (draft) => {
      activeLayer(draft).locked = true;
    });
    pointer('pointerup', 4, 3);
    expect(cells()).toEqual({});
  });
  it('selects without painting, previews paste, commits once and can undo it', () => {
    const { store, pointer, cells } = editor();
    pointer('pointerdown', 2, 3);
    pointer('pointermove', 4, 3);
    pointer('pointerup', 4, 3);
    store.update(
      'Select tool',
      (draft) => {
        draft.tool = 'tile-select';
      },
      false,
    );
    pointer('pointerdown', 2, 3);
    pointer('pointermove', 4, 3);
    pointer('pointerup', 4, 3);
    expect(store.status.snapshot.tileSelection).toMatchObject({
      x: 2,
      y: 3,
      width: 3,
      height: 1,
    });
    expect(Object.keys(cells())).toHaveLength(3);
    const editing = new TileEditing(store, vi.fn());
    editing.copy();
    editing.paste();
    pointer('pointerdown', 7, 5);
    pointer('pointermove', 8, 5);
    expect(Object.keys(cells())).toHaveLength(3);
    pointer('pointerup', 8, 5);
    expect(Object.keys(cells())).toHaveLength(6);
    expect(store.status.snapshot.tool).toBe('tile-select');
    expect(store.status.snapshot.tileSelection).toMatchObject({
      x: 8,
      y: 5,
      width: 3,
    });
    store.undo();
    expect(Object.keys(cells())).toHaveLength(3);
    store.redo();
    expect(Object.keys(cells())).toHaveLength(6);
  });

  it('Escape cancels a pending paste without modifying tiles', () => {
    const { store, cells } = editor();
    store.update(
      'Pending paste',
      (draft) => {
        draft.tool = 'paste';
      },
      false,
    );
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(cells()).toEqual({});
    expect(store.status.canUndo).toBe(false);
    expect(store.status.snapshot.tool).toBe('tile-select');
  });
});
