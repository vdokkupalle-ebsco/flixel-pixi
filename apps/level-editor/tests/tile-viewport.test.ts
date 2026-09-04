import { afterEach, describe, expect, it, vi } from 'vitest';
import { LevelEditorStore } from '../src/editor-store';
import {
  activeLayer,
  activeScene,
  createSpriteEntity,
  createInitialProject,
} from '../src/model';
import { SceneViewport } from '../src/viewport';
import { paletteTiles } from '../src/tile-palette';
import { TileEditing } from '../src/tile-editing';
import { starterTileset } from '../src/tiles';
import { starterTerrainTileset } from '../src/terrain';

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
  const methods = new Map<PropertyKey, ReturnType<typeof vi.fn>>();
  const context = new Proxy(
    {},
    {
      get: (_target, key) => {
        if (!methods.has(key)) methods.set(key, vi.fn());
        return methods.get(key);
      },
    },
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
  return { store, canvas, pointer, cells, captures, context, viewport };
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

describe('terrain viewport interactions', () => {
  const terrainEditor = () => {
    const result = editor();
    const asset = starterTerrainTileset();
    result.store.update(
      'Set terrain tool',
      (draft) => {
        draft.document.assets.push(asset);
        draft.tool = 'terrain';
        draft.terrain = { assetId: asset.id, setId: 'grass' };
        delete draft.tileStamp;
      },
      false,
    );
    return result;
  };
  it('previews an interpolated stroke, commits all neighbors once and restores them through undo/redo', () => {
    const { store, pointer, cells } = terrainEditor();
    pointer('pointerdown', 2, 3);
    pointer('pointermove', 6, 3);
    expect(cells()).toEqual({});
    pointer('pointerup', 6, 3);
    expect(Object.keys(cells())).toHaveLength(21);
    const painted = structuredClone(cells());
    store.undo();
    expect(cells()).toEqual({});
    store.redo();
    expect(cells()).toEqual(painted);
    store.update(
      'Erase terrain tool',
      (draft) => {
        draft.tool = 'terrain-erase';
      },
      false,
    );
    pointer('pointerdown', 4, 3);
    pointer('pointerup', 4, 3);
    expect(cells()['4,3']).toBeUndefined();
    store.undo();
    expect(cells()).toEqual(painted);
  });
  it('cancels a terrain stroke on Escape and respects locked layers', () => {
    const { store, pointer, cells, captures } = terrainEditor();
    pointer('pointerdown', 3, 3);
    pointer('pointermove', 7, 3);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    pointer('pointerup', 7, 3);
    expect(cells()).toEqual({});
    expect(store.status.canUndo).toBe(false);
    store.update(
      'Lock layer',
      (draft) => {
        activeLayer(draft).locked = true;
      },
      false,
    );
    pointer('pointerdown', 3, 3);
    pointer('pointerup', 3, 3);
    expect(cells()).toEqual({});
    expect(captures.size).toBe(0);
  });
  it('discards the entire stroke if release encounters an unsupported neighboring tile', () => {
    const { store, pointer, cells, captures, canvas } = terrainEditor();
    const tile = paletteTiles(starterTileset()).tiles[0];
    if (!tile) throw new Error('Missing test fixture');
    store.update(
      'Place decoration',
      (draft) => {
        activeLayer(draft).tilemap = { tileSize: 16, cells: { '8,3': tile } };
      },
      false,
    );
    const messages: string[] = [];
    canvas.addEventListener('tile-message', (event) =>
      messages.push((event as CustomEvent<string>).detail),
    );
    pointer('pointerdown', 2, 3);
    pointer('pointermove', 5, 3);
    pointer('pointerup', 7, 3);
    expect(cells()).toEqual({ '8,3': tile });
    expect(store.status.canUndo).toBe(false);
    expect(captures.size).toBe(0);
    expect(messages.at(-1)).toContain('outside this set');
  });
});

describe('tile collision outlines', () => {
  it('follows the live stroke and disappears on cancellation or when outlines are turned off', () => {
    const { store, pointer, cells, context, viewport } = editor();
    store.update(
      'Enable collision',
      (draft) => {
        activeLayer(draft).tileCollision = {
          enabled: true,
          friction: 0.4,
          restitution: 0,
        };
      },
      false,
    );
    pointer('pointerdown', 2, 3);
    pointer('pointermove', 12, 3);
    viewport.render();
    expect(cells()).toEqual({});
    expect(context.strokeRect).toHaveBeenCalledWith(32, 48, 176, 16);
    vi.mocked(context.strokeRect).mockClear();
    pointer('pointercancel', 12, 3);
    viewport.render();
    expect(context.strokeRect).not.toHaveBeenCalledWith(32, 48, 176, 16);
    pointer('pointerdown', 2, 3);
    pointer('pointerup', 12, 3);
    const before = structuredClone(cells());
    store.update(
      'Hide collision overlay',
      (draft) => {
        draft.showTileCollisions = false;
      },
      false,
    );
    vi.mocked(context.strokeRect).mockClear();
    viewport.render();
    expect(context.strokeRect).not.toHaveBeenCalledWith(32, 48, 176, 16);
    expect(cells()).toEqual(before);
    expect(activeLayer(store.status.snapshot).tileCollision?.enabled).toBe(
      true,
    );
  });
});

describe('tool cursor feedback', () => {
  it('updates immediately on tool and layer changes without adding history', () => {
    const { store, canvas, pointer } = editor();
    pointer('pointermove', 2, 3);
    const brush = canvas.style.cursor;
    expect(brush).toContain('data:image/svg+xml');
    store.update(
      'Eraser',
      (draft) => {
        draft.tool = 'eraser';
      },
      false,
    );
    expect(canvas.style.cursor).not.toBe(brush);
    store.update(
      'Lock',
      (draft) => {
        activeLayer(draft).locked = true;
      },
      false,
    );
    expect(canvas.style.cursor).toBe('not-allowed');
    store.update(
      'Pick',
      (draft) => {
        draft.tool = 'eyedropper';
      },
      false,
    );
    expect(canvas.style.cursor).toContain('data:image/svg+xml');
    store.update(
      'Select',
      (draft) => {
        draft.tool = 'tile-select';
      },
      false,
    );
    expect(canvas.style.cursor).toContain('data:image/svg+xml');
    expect(store.status.canUndo).toBe(false);
  });

  it('shows blocked outside the map or with a missing painting source', () => {
    const { store, canvas, pointer } = editor();
    pointer('pointermove', -1, 0);
    expect(canvas.style.cursor).toBe('not-allowed');
    pointer('pointermove', 1, 1);
    expect(canvas.style.cursor).not.toBe('not-allowed');
    store.update(
      'No stamp',
      (draft) => {
        delete draft.tileStamp;
      },
      false,
    );
    expect(canvas.style.cursor).toBe('not-allowed');
    store.update(
      'Terrain',
      (draft) => {
        draft.tool = 'terrain';
      },
      false,
    );
    expect(canvas.style.cursor).toBe('not-allowed');
    store.update(
      'Eraser',
      (draft) => {
        draft.tool = 'eraser';
      },
      false,
    );
    expect(canvas.style.cursor).not.toBe('not-allowed');
  });

  it('restores cursors after temporary modifiers, pan drags, cancellation and focus loss', () => {
    const { canvas, pointer, store } = editor();
    window.document.body.append(canvas);
    canvas.tabIndex = 0;
    canvas.focus();
    cleanups.push(() => canvas.remove());
    pointer('pointermove', 2, 3);
    const brush = canvas.style.cursor;
    canvas.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Alt', bubbles: true }),
    );
    expect(canvas.style.cursor).not.toBe(brush);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Alt' }));
    expect(canvas.style.cursor).toBe(brush);
    canvas.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'Space', bubbles: true }),
    );
    expect(canvas.style.cursor).toBe('grab');
    pointer('pointerdown', 2, 3);
    expect(canvas.style.cursor).toBe('grabbing');
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
    expect(canvas.style.cursor).toBe('grabbing');
    pointer('pointerup', 2, 3);
    expect(canvas.style.cursor).toBe(brush);
    pointer('pointerdown', 2, 3, 1);
    expect(canvas.style.cursor).toBe('grabbing');
    pointer('pointercancel', 2, 3);
    expect(canvas.style.cursor).toBe(brush);
    canvas.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Alt', bubbles: true }),
    );
    window.dispatchEvent(new Event('blur'));
    expect(canvas.style.cursor).toBe(brush);
    expect(store.status.canUndo).toBe(false);
  });

  it('keeps a capture cursor until right-drag ends', () => {
    const { canvas, pointer } = editor();
    const brush = canvas.style.cursor;
    pointer('pointerdown', 2, 3, 2);
    const capture = canvas.style.cursor;
    expect(capture).not.toBe(brush);
    pointer('pointermove', 3, 3);
    expect(canvas.style.cursor).toBe(capture);
    pointer('pointerup', 3, 3, 2);
    expect(canvas.style.cursor).toBe(brush);
  });
});

describe('object cursor feedback', () => {
  it('matches transform hit testing and stays stable throughout a drag', () => {
    const { store, canvas, pointer } = editor();
    store.update(
      'Object',
      (draft) => {
        const entity = createSpriteEntity('asset-flixel-mark', 1);
        entity.position = { x: 104, y: 104 };
        activeScene(draft).entities.push(entity);
        draft.tool = 'select';
      },
      false,
    );
    pointer('pointermove', 6, 6);
    expect(canvas.style.cursor).toBe('move');
    pointer('pointermove', 9, 9);
    expect(canvas.style.cursor).toBe('nwse-resize');
    pointer('pointerdown', 9, 9);
    pointer('pointermove', 20, 20);
    expect(canvas.style.cursor).toBe('nwse-resize');
    pointer('pointercancel', 20, 20);
    expect(canvas.style.cursor).toBe('default');
    store.update(
      'Rotate',
      (draft) => {
        draft.tool = 'rotate';
      },
      false,
    );
    pointer('pointermove', 6, 6);
    expect(canvas.style.cursor).toContain('data:image/svg+xml');
    store.update(
      'Lock',
      (draft) => {
        activeLayer(draft).locked = true;
      },
      false,
    );
    expect(canvas.style.cursor).toBe('not-allowed');
    pointer('pointerdown', 6, 6);
    expect(store.status.snapshot.selectedEntityIds).toEqual([]);
    expect(store.status.canUndo).toBe(false);
  });
});
