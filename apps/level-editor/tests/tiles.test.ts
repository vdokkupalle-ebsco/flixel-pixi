import { describe, expect, it } from 'vitest';
import { serializeProjectDocument } from '@flixel-pixi/schemas';
import { LevelEditorStore } from '../src/editor-store';
import {
  activeLayer,
  createInitialProject,
  getEditorExtension,
  parseLevelProject,
} from '../src/model';
import { paletteTiles } from '../src/tile-palette';
import {
  cellKey,
  fillPattern,
  floodCells,
  lineCells,
  paintStamp,
  rectangleCells,
  starterTileset,
  tileBounds,
  tileEntities,
  validateTileMap,
  type TileMap,
  type TileStamp,
} from '../src/tiles';

const asset = starterTileset();
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing fixture');
  return value;
}
const [grass, edge, dirt] = [0, 1, 2].map((index) =>
  required(paletteTiles(asset).tiles[index]),
);
const stamp: TileStamp = {
  width: 2,
  height: 1,
  tiles: [required(grass), required(dirt)],
};
const bounds = { columns: 5, rows: 4 };
const map = (): TileMap => ({ tileSize: 16, cells: {} });

describe('tile authoring', () => {
  it('interpolates fast strokes in both directions without gaps', () => {
    const points = lineCells({ x: 0, y: 0 }, { x: 10, y: 3 });
    expect(points).toHaveLength(11);
    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points.at(-1)).toEqual({ x: 10, y: 3 });
    for (let i = 1; i < points.length; i++) {
      expect(
        Math.abs(required(points[i]).x - required(points[i - 1]).x),
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(required(points[i]).y - required(points[i - 1]).y),
      ).toBeLessThanOrEqual(1);
    }
    expect(lineCells({ x: 3, y: 4 }, { x: 0, y: 0 })).toHaveLength(5);
  });

  it('clips stamps at every boundary and never creates sprite entities', () => {
    const layer = map();
    paintStamp(layer, stamp, { x: 4, y: 3 }, bounds);
    paintStamp(layer, stamp, { x: -1, y: 0 }, bounds);
    expect(layer.cells).toEqual({ '4,3': grass, '0,0': dirt });
    expect(tileBounds(81, 65, 16)).toEqual(bounds);
  });

  it('finds only four-connected matching cells and respects barriers', () => {
    const layer = map();
    for (let y = 0; y < bounds.rows; y++)
      layer.cells[`2,${y}`] = required(edge);
    const cells = floodCells(layer, { x: 0, y: 0 }, bounds);
    expect(cells).toHaveLength(8);
    expect(cells.every((cell) => cell.x < 2)).toBe(true);
    expect(floodCells(layer, { x: -1, y: 0 }, bounds)).toEqual([]);
    fillPattern(layer, stamp, cells, { x: 1, y: 1 });
    expect(layer.cells['0,0']).toEqual(dirt);
    expect(layer.cells['1,0']).toEqual(grass);
    expect(layer.cells['2,0']).toEqual(edge);
    expect(layer.cells['3,0']).toBeUndefined();
  });

  it('fills reverse-drag rectangles with a repeating multi-tile stamp', () => {
    const layer = map();
    const cells = rectangleCells({ x: 7, y: 7 }, { x: 1, y: 1 }, bounds);
    expect(cells).toHaveLength(12);
    fillPattern(layer, stamp, cells, { x: 1, y: 1 });
    expect(layer.cells['1,1']).toEqual(grass);
    expect(layer.cells['2,1']).toEqual(dirt);
    expect(layer.cells['3,2']).toEqual(grass);
    expect(layer.cells['0,0']).toBeUndefined();
  });

  it('round-trips tile grids and keeps a whole operation in one undo entry', () => {
    const initial = createInitialProject();
    initial.assets.push(asset);
    const store = new LevelEditorStore({
      document: initial,
      selectedEntityIds: [],
      snapToGrid: true,
      tool: 'brush',
      tileStamp: stamp,
    });
    store.update('Painted tiles', (draft) => {
      const tiles = map();
      for (const at of lineCells({ x: 0, y: 0 }, { x: 3, y: 0 }))
        paintStamp(tiles, stamp, at, bounds);
      activeLayer(draft).tilemap = tiles;
    });
    expect(
      Object.keys(activeLayer(store.status.snapshot).tilemap?.cells ?? {}),
    ).toHaveLength(5);
    expect(store.status.snapshot.document.scenes[0]?.entities).toEqual([]);
    const serialized = serializeProjectDocument(store.status.snapshot.document);
    const restored = parseLevelProject(JSON.parse(serialized));
    expect(
      getEditorExtension(restored).scenes['scene-main']?.layers?.find(
        (layer) => layer.id === 'layer-gameplay',
      )?.tilemap,
    ).toEqual(activeLayer(store.status.snapshot).tilemap);
    store.undo();
    expect(activeLayer(store.status.snapshot).tilemap).toBeUndefined();
    store.redo();
    expect(
      Object.keys(activeLayer(store.status.snapshot).tilemap?.cells ?? {}),
    ).toHaveLength(5);
    store.markSaved();
    expect(store.status.dirty).toBe(false);
  });

  it('rejects missing images, invalid coordinates, and out-of-image regions on import', () => {
    for (const cells of [
      { '0,0': { ...required(grass), assetId: 'missing' } },
      { '-1,0': required(grass) },
      { '0,0': { ...required(grass), width: 9999 } },
      { '0,0': null },
    ]) {
      expect(() => validateTileMap({ tileSize: 16, cells }, [asset])).toThrow(
        /Invalid tile/,
      );
    }
    expect(() =>
      validateTileMap({ tileSize: 0, cells: {} }, [asset]),
    ).toThrow();
    expect(() =>
      floodCells(map(), { x: 0, y: 0 }, { columns: 1024, rows: 1024 }),
    ).toThrow(/262,144/);
  });

  it('slices sheets with spacing and margin and preserves atlas regions', () => {
    const sheet = {
      ...asset,
      metadata: {
        width: 37,
        height: 20,
        tileWidth: 16,
        tileHeight: 16,
        tileMargin: 2,
        tileSpacing: 1,
      },
    };
    expect(paletteTiles(sheet).tiles.map((tile) => [tile.x, tile.y])).toEqual([
      [2, 2],
      [19, 2],
    ]);
    expect(
      paletteTiles({ ...asset, metadata: { ...asset.metadata, tileWidth: 0 } })
        .tiles,
    ).toEqual([]);
    const atlas = {
      ...asset,
      metadata: {
        ...asset.metadata,
        atlasFrames: [{ name: 'ground', x: 40, y: 5, width: 12, height: 18 }],
      },
    };
    expect(paletteTiles(atlas).tiles).toEqual([
      { assetId: asset.id, x: 40, y: 5, width: 12, height: 18 },
    ]);
  });

  it('expands preview tiles with exact regions, top-left origins and layer order', () => {
    const layer = map();
    layer.cells[cellKey({ x: 2, y: 3 })] = required(edge);
    const before = structuredClone(layer);
    const [entity] = tileEntities(layer, 'ground');
    expect(entity?.position).toEqual({ x: 32, y: 48 });
    expect(entity?.properties).toMatchObject({
      layerId: 'ground',
      frameX: 32,
      frameY: 0,
      frameWidth: 32,
      frameHeight: 32,
      width: 16,
      height: 16,
      originX: 0,
      originY: 0,
      zIndex: -1,
    });
    expect(layer).toEqual(before);
  });
});
