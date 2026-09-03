import { describe, expect, it, vi } from 'vitest';
import { serializeProjectDocument } from '@flixel-pixi/schemas';
import { LevelEditorStore } from '../src/editor-store';
import {
  activeLayer,
  createInitialProject,
  getEditorExtension,
  parseLevelProject,
} from '../src/model';
import { TileEditing, activeTileSelection } from '../src/tile-editing';
import {
  transformStamp,
  paintStamp,
  floodCells,
  sameTile,
  tileEntities,
  validateTileMap,
  type TileRegion,
  type TileStamp,
  type StampTransform,
} from '../src/tiles';

const tile: TileRegion = {
  assetId: 'asset-flixel-mark',
  x: 0,
  y: 0,
  width: 16,
  height: 16,
};
const stamp: TileStamp = {
  width: 3,
  height: 2,
  tiles: [
    tile,
    { ...tile, x: 16 },
    null,
    { ...tile, x: 32 },
    null,
    { ...tile, x: 48 },
  ],
};
function setup() {
  const store = new LevelEditorStore({
    document: createInitialProject(),
    tool: 'tile-select',
    selectedEntityIds: [],
    snapToGrid: true,
  });
  store.update('Seed tiles', (draft) => {
    activeLayer(draft).tilemap = {
      tileSize: 16,
      cells: { '1,1': tile, '3,1': { ...tile, x: 16 }, '9,9': tile },
    };
    draft.tileSelection = {
      x: 1,
      y: 1,
      width: 3,
      height: 1,
      sceneId: 'scene-main',
      layerId: 'layer-gameplay',
    };
  });
  store.markSaved();
  const announce = vi.fn(),
    editing = new TileEditing(store, announce);
  return { store, editing, announce };
}

describe('stamp transforms', () => {
  it('rotates non-square stamps, holes and artwork together', () => {
    const rotated = transformStamp(stamp, 'rotate-cw');
    expect([rotated.width, rotated.height]).toEqual([2, 3]);
    expect(rotated.tiles.map((tile) => tile?.x ?? null)).toEqual([
      32,
      0,
      null,
      16,
      48,
      null,
    ]);
    expect(
      rotated.tiles.filter(Boolean).every((tile) => tile?.rotation === 1),
    ).toBe(true);
    expect(stamp.tiles[0]?.rotation).toBeUndefined();
  });
  it('returns to the original after inverse operations for every orientation', () => {
    for (const rotation of [0, 1, 2, 3])
      for (const flipX of [false, true]) {
        const base = {
          ...tile,
          ...(rotation ? { rotation } : {}),
          ...(flipX ? { flipX } : {}),
        };
        const original = { width: 1, height: 1, tiles: [base] };
        for (const flip of ['flip-horizontal', 'flip-vertical'] as const)
          expect(transformStamp(transformStamp(original, flip), flip)).toEqual(
            original,
          );
        expect(
          transformStamp(transformStamp(original, 'rotate-cw'), 'rotate-ccw'),
        ).toEqual(original);
        let result = original as TileStamp;
        for (let i = 0; i < 4; i++)
          result = transformStamp(result, 'rotate-cw');
        expect(result).toEqual(original);
      }
  });
  it('composes flips in map axes after rotation', () => {
    const rotated = transformStamp(
      { width: 1, height: 1, tiles: [tile] },
      'rotate-cw',
    );
    expect(transformStamp(rotated, 'flip-horizontal').tiles[0]).toMatchObject({
      rotation: 3,
      flipX: true,
    });
    expect(transformStamp(rotated, 'flip-vertical').tiles[0]).toMatchObject({
      rotation: 1,
      flipX: true,
    });
    expect(sameTile(tile, { ...tile, rotation: 1 })).toBe(false);
  });
  it('round-trips transformed artwork and rejects malformed transform flags', () => {
    const { store } = setup();
    store.update('Transform tile', (draft) => {
      const map = activeLayer(draft).tilemap;
      if (map) map.cells['1,1'] = { ...tile, rotation: 3, flipX: true };
    });
    const document = parseLevelProject(
      JSON.parse(serializeProjectDocument(store.status.snapshot.document)),
    );
    const map = getEditorExtension(document).scenes['scene-main']?.layers?.find(
      (layer) => layer.id === 'layer-gameplay',
    )?.tilemap;
    expect(map?.cells['1,1']).toMatchObject({ rotation: 3, flipX: true });
    expect(
      tileEntities(map ?? { tileSize: 16, cells: {} }, 'layer-gameplay')[0]
        ?.properties,
    ).toMatchObject({ tileRotation: 3, tileFlipX: true });
    for (const rotation of [-1, 4, 0.5])
      expect(() =>
        validateTileMap(
          { tileSize: 16, cells: { '0,0': { ...tile, rotation } } },
          document.assets,
        ),
      ).toThrow();
  });
});

describe('tile clipboard and selections', () => {
  it('copies without dirtying the document, retaining holes independently of history', () => {
    const { store, editing } = setup();
    editing.copy();
    expect(store.status.dirty).toBe(false);
    expect(editing.canPaste).toBe(true);
    editing.deleteSelection();
    store.undo();
    editing.paste();
    expect(store.status.snapshot.tool).toBe('paste');
    expect(store.status.snapshot.tileSelection).toBeUndefined();
    expect(store.status.snapshot.tileStamp?.tiles).toEqual([
      tile,
      null,
      { ...tile, x: 16 },
    ]);
  });
  it('cuts only the active selection as one undoable edit', () => {
    const { store, editing } = setup();
    editing.copy(true);
    expect(activeLayer(store.status.snapshot).tilemap?.cells).toEqual({
      '9,9': tile,
    });
    store.undo();
    expect(
      Object.keys(activeLayer(store.status.snapshot).tilemap?.cells ?? {}),
    ).toHaveLength(3);
    expect(editing.canPaste).toBe(true);
  });
  it('protects locked and hidden layers from cut/delete/paste', () => {
    const { store, editing, announce } = setup();
    editing.copy();
    store.update('Lock', (draft) => {
      activeLayer(draft).locked = true;
    });
    const before = store.status.snapshot.document;
    editing.copy(true);
    editing.deleteSelection();
    editing.paste();
    expect(store.status.snapshot.document).toEqual(before);
    expect(announce).toHaveBeenCalledTimes(4);
  });
  it('rejects missing clipboard assets and ignores selections from another layer', () => {
    const { store, editing, announce } = setup();
    editing.copy();
    store.replace('Empty project', {
      document: { ...createInitialProject(), assets: [] },
      tool: 'tile-select',
      selectedEntityIds: [],
      snapToGrid: true,
    });
    editing.paste();
    expect(announce).toHaveBeenLastCalledWith(expect.stringMatching(/missing/));
    store.update(
      'Stale selection',
      (draft) => {
        draft.tileSelection = {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          sceneId: 'other',
          layerId: 'layer-gameplay',
        };
      },
      false,
    );
    expect(activeTileSelection(store.status.snapshot)).toBeUndefined();
  });
  it('constrains painting and flood traversal to a selection and replaces paste holes', () => {
    const { store } = setup(),
      selection = activeTileSelection(store.status.snapshot);
    const map = { tileSize: 16, cells: {} };
    expect(
      floodCells(map, { x: 1, y: 1 }, { columns: 10, rows: 10 }, selection),
    ).toHaveLength(3);
    paintStamp(
      map,
      { width: 5, height: 1, tiles: Array(5).fill(tile) as TileRegion[] },
      { x: 0, y: 1 },
      { columns: 10, rows: 10 },
      selection,
    );
    expect(Object.keys(map.cells)).toEqual(['1,1', '2,1', '3,1']);
    paintStamp(
      map,
      { width: 2, height: 1, tiles: [null, tile] },
      { x: 2, y: 1 },
      { columns: 10, rows: 10 },
      undefined,
      true,
    );
    expect(Object.keys(map.cells)).toEqual(['1,1', '3,1']);
  });
  it('transforms the stamp without changing saved tile data', () => {
    const { store, editing } = setup();
    editing.copy();
    editing.paste();
    for (const operation of [
      'rotate-cw',
      'flip-horizontal',
      'flip-vertical',
      'rotate-ccw',
    ] as StampTransform[])
      editing.transform(operation);
    expect(store.status.dirty).toBe(false);
  });
});
