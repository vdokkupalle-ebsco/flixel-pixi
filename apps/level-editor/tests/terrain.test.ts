import { describe, expect, it } from 'vitest';
import { createInitialProject, parseLevelProject } from '../src/model';
import {
  paintTerrain,
  starterTerrainTileset,
  terrainMask,
  terrainSets,
  validateTerrains,
  type TerrainSet,
} from '../src/terrain';
import { transformStamp, type TileMap, type TileRegion } from '../src/tiles';

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing test fixture');
  return value;
}

const asset = starterTerrainTileset();
const set = required(terrainSets(asset)[0]);
const bounds = { columns: 8, rows: 8 };
const empty = (): TileMap => ({ tileSize: 16, cells: {} });
const masks = (map: TileMap) =>
  Object.fromEntries(
    Object.entries(map.cells).map(([key, tile]) => [
      key,
      terrainMask(set, tile),
    ]),
  );

describe('corner terrain editing', () => {
  it('creates exact transitions around a filled cell and erases them together', () => {
    const map = empty();
    paintTerrain(map, set, [{ x: 3, y: 3 }], bounds);
    expect(masks(map)).toEqual({
      '2,2': 4,
      '3,2': 12,
      '4,2': 8,
      '2,3': 6,
      '3,3': 15,
      '4,3': 9,
      '2,4': 2,
      '3,4': 3,
      '4,4': 1,
    });
    paintTerrain(map, set, [{ x: 3, y: 3 }], bounds, true);
    expect(map.cells).toEqual({});
  });
  it('joins adjacent strokes without seams and repairs an erased connection', () => {
    const map = empty();
    paintTerrain(map, set, [{ x: 2, y: 3 }], bounds);
    paintTerrain(map, set, [{ x: 3, y: 3 }], bounds);
    expect(masks(map)['2,3']).toBe(15);
    expect(masks(map)['3,3']).toBe(15);
    paintTerrain(map, set, [{ x: 3, y: 3 }], bounds, true);
    expect(masks(map)['2,3']).toBe(9);
    expect(map.cells['3,3']).toBeUndefined();
  });
  it('clips at map boundaries and repeats without changing tile orientation or data', () => {
    const map = empty();
    paintTerrain(map, set, [{ x: 0, y: 0 }], bounds);
    expect(Object.keys(map.cells)).toHaveLength(4);
    const original = structuredClone(map);
    paintTerrain(map, set, [{ x: 0, y: 0 }], bounds);
    expect(map).toEqual(original);
  });
  it('resolves corners of rotated and reflected artwork', () => {
    const tile = required(set.rules.find((rule) => rule.mask === 1)).tile;
    const stamp = { width: 1, height: 1, tiles: [tile] };
    expect(
      terrainMask(set, required(transformStamp(stamp, 'rotate-cw').tiles[0])),
    ).toBe(2);
    expect(
      terrainMask(set, required(transformStamp(stamp, 'rotate-ccw').tiles[0])),
    ).toBe(8);
    expect(
      terrainMask(
        set,
        required(transformStamp(stamp, 'flip-horizontal').tiles[0]),
      ),
    ).toBe(2);
    expect(
      terrainMask(
        set,
        required(transformStamp(stamp, 'flip-vertical').tiles[0]),
      ),
    ).toBe(8);
  });
  it('rejects missing rules atomically, including all cells in an interpolated segment', () => {
    const map = empty();
    const incomplete: TerrainSet = {
      ...set,
      rules: set.rules.filter((rule) => rule.mask !== 8),
    };
    expect(() =>
      paintTerrain(
        map,
        incomplete,
        [
          { x: 2, y: 2 },
          { x: 3, y: 2 },
        ],
        bounds,
      ),
    ).toThrow('Missing terrain pattern 8');
    expect(map.cells).toEqual({});
  });
  it('protects unrelated artwork and selections, including neighboring cells', () => {
    const map = empty();
    const tile: TileRegion = {
      assetId: 'decoration',
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    };
    map.cells['2,2'] = tile;
    expect(() => paintTerrain(map, set, [{ x: 3, y: 3 }], bounds)).toThrow(
      'outside this set',
    );
    expect(map.cells).toEqual({ '2,2': tile });
    const selection = {
      x: 3,
      y: 3,
      width: 1,
      height: 1,
      sceneId: 'scene',
      layerId: 'layer',
    };
    const blank = empty();
    expect(() =>
      paintTerrain(blank, set, [{ x: 3, y: 3 }], bounds, false, selection),
    ).toThrow('Expand the selection');
    expect(blank.cells).toEqual({});
    paintTerrain(blank, set, [{ x: 0, y: 0 }], bounds, false, selection);
    expect(blank.cells).toEqual({});
  });
  it('allows a stroke when the selection includes its transitions', () => {
    const map = empty();
    paintTerrain(map, set, [{ x: 3, y: 3 }], bounds, false, {
      x: 2,
      y: 2,
      width: 3,
      height: 3,
      sceneId: 's',
      layerId: 'l',
    });
    expect(Object.keys(map.cells)).toHaveLength(9);
  });
});

describe('terrain persistence and validation', () => {
  it('round-trips rules in the existing document contract and accepts older files', () => {
    const document = createInitialProject();
    expect(() => parseLevelProject(document)).not.toThrow();
    document.assets.push(asset);
    const loaded = parseLevelProject(JSON.parse(JSON.stringify(document)));
    expect(
      terrainSets(required(loaded.assets.find((a) => a.id === asset.id))),
    ).toEqual([set]);
  });
  it('rejects a malformed terrain-set container during project import', () => {
    const document = createInitialProject();
    const invalid = structuredClone(asset);
    invalid.metadata = { ...invalid.metadata, terrainSets: null };
    document.assets.push(invalid);
    expect(() => parseLevelProject(document)).toThrow('Invalid terrain sets');
  });
  it.each([
    (s: TerrainSet) => {
      s.kind = 'mixed' as 'corner';
    },
    (s: TerrainSet) => {
      required(s.rules[0]).mask = 16;
    },
    (s: TerrainSet) => {
      required(s.rules[0]).tile.assetId = 'missing';
    },
    (s: TerrainSet) => {
      required(s.rules[0]).tile.width = 10000;
    },
    (s: TerrainSet) => {
      required(s.rules[0]).tile.rotation = 1;
    },
    (s: TerrainSet) => {
      required(s.rules[0]).tile = required(s.rules[1]).tile;
    },
    (s: TerrainSet) => {
      required(s.rules[0]).mask = required(s.rules[1]).mask;
    },
    (s: TerrainSet) => {
      s.color = 'red; background:bad';
    },
  ])('rejects malformed rules and ambiguous source assignments', (mutate) => {
    const invalid = structuredClone(asset);
    mutate(required(terrainSets(invalid)[0]));
    expect(() => validateTerrains([invalid])).toThrow();
  });
});
