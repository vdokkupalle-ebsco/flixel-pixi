import { describe, expect, it } from 'vitest';
import { createInitialProject, parseLevelProject } from '../src/model';
import {
  paintTerrain,
  terrainTile,
  multiTerrainTileset,
  patternValues,
  patternCode,
  addTerrainType,
  terrainTypes,
  assignTerrainTile,
  starterTerrainTileset,
  starterEdgeTileset,
  terrainMask,
  terrainCoverage,
  terrainRuleMatch,
  terrainSets,
  setTerrainSets,
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

describe('edge terrain editing', () => {
  const edgeAsset = starterEdgeTileset();
  const edgeSet = required(terrainSets(edgeAsset)[0]);
  const edgeMasks = (map: TileMap) =>
    Object.fromEntries(
      Object.entries(map.cells).map(([key, tile]) => [
        key,
        terrainMask(edgeSet, tile),
      ]),
    );

  it('connects cardinal neighbors without changing diagonal cells', () => {
    const map = empty();
    paintTerrain(
      map,
      edgeSet,
      [
        { x: 3, y: 3 },
        { x: 4, y: 3 },
      ],
      bounds,
    );
    expect(edgeMasks(map)).toEqual({
      '3,3': 2,
      '4,3': 8,
    });
    expect(map.cells['2,2']).toBeUndefined();
    paintTerrain(
      map,
      edgeSet,
      [
        { x: 3, y: 3 },
        { x: 4, y: 3 },
      ],
      bounds,
      true,
    );
    expect(map.cells).toEqual({});
  });

  it('joins a road stroke and resolves rotated edge artwork', () => {
    const map = empty();
    paintTerrain(
      map,
      edgeSet,
      [
        { x: 2, y: 3 },
        { x: 3, y: 3 },
      ],
      bounds,
    );
    paintTerrain(
      map,
      edgeSet,
      [
        { x: 3, y: 3 },
        { x: 4, y: 3 },
      ],
      bounds,
    );
    expect(edgeMasks(map)['2,3']).toBe(2);
    expect(edgeMasks(map)['3,3']).toBe(10);
    expect(edgeMasks(map)['4,3']).toBe(8);
    const top = required(edgeSet.rules.find((rule) => rule.mask === 1)).tile;
    const rotated = required(
      transformStamp({ width: 1, height: 1, tiles: [top] }, 'rotate-cw')
        .tiles[0],
    );
    expect(terrainMask(edgeSet, rotated)).toBe(2);
  });

  it('derives missing endpoints, straights and turns from transforms', () => {
    const reduced = structuredClone(edgeSet);
    reduced.rules = reduced.rules.filter((rule) =>
      [1, 3, 5].includes(rule.mask),
    );
    expect(terrainRuleMatch(reduced, 2)).toMatchObject({
      rotation: 1,
      flipX: false,
    });
    expect(terrainRuleMatch(reduced, 9)).toMatchObject({
      rotation: 3,
      flipX: false,
    });
    expect(terrainCoverage(reduced)).toBe(10);
    const map = empty();
    paintTerrain(
      map,
      reduced,
      [
        { x: 2, y: 3 },
        { x: 3, y: 3 },
        { x: 4, y: 3 },
      ],
      bounds,
    );
    expect(
      ['2,3', '3,3', '4,3'].map((key) => terrainMask(reduced, map.cells[key])),
    ).toEqual([2, 10, 8]);
    expect(map.cells['3,3']?.rotation).toBe(1);

    const explicit = required(edgeSet.rules.find((rule) => rule.mask === 2));
    reduced.rules.push(structuredClone(explicit));
    expect(terrainRuleMatch(reduced, 2)?.rule.mask).toBe(2);
    expect(terrainTile(reduced, 2, { x: 0, y: 0 })).toEqual(explicit.tile);
  });

  it('validates and round-trips the complete road sample', () => {
    expect(() => validateTerrains([edgeAsset])).not.toThrow();
    expect(edgeAsset.metadata).toMatchObject({
      width: 136,
      height: 136,
      tileMargin: 1,
      tileSpacing: 2,
    });
    expect(
      required(edgeSet.rules.find((rule) => rule.mask === 15)).tile,
    ).toMatchObject({
      x: 103,
      y: 103,
      width: 32,
      height: 32,
    });
    const project = createInitialProject();
    project.assets.push(edgeAsset);
    expect(() => parseLevelProject(project)).not.toThrow();
    expect(edgeSet.kind).toBe('edge');
    expect(edgeSet.rules).toHaveLength(15);
  });
});

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
      rules: set.rules.filter((rule) => ![1, 2, 4, 8].includes(rule.mask)),
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
    ).toThrow('Missing terrain pattern');
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

describe('weighted terrain variants', () => {
  it('chooses stable variants in proportion to their weights', () => {
    const counts = new Map<string, number>();
    for (let x = 0; x < 8192; x++) {
      const tile = required(terrainTile(set, 15, { x, y: 4 }));
      expect(terrainTile(set, 15, { x, y: 4 })).toEqual(tile);
      expect(terrainMask(set, tile)).toBe(15);
      const key = `${tile.x},${tile.y}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(4);
    const primary = required(set.rules.find((r) => r.mask === 15)).tile;
    const frequency = (counts.get(`${primary.x},${primary.y}`) ?? 0) / 8192;
    expect(frequency).toBeGreaterThan(0.45);
    expect(frequency).toBeLessThan(0.55);
  });
  it('preserves existing variants and matches independently computed previews', () => {
    const map = empty(),
      preview = empty();
    const cells = [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ];
    paintTerrain(map, set, cells, bounds);
    paintTerrain(preview, set, cells, bounds);
    expect(map).toEqual(preview);
    const before = structuredClone(map);
    paintTerrain(map, set, cells, bounds);
    expect(map).toEqual(before);
  });
  it('moves source assignments without creating ambiguous variants', () => {
    const copy = structuredClone(set),
      rule = required(copy.rules.find((r) => r.mask === 15));
    const variant = required(rule.variants?.[0]);
    assignTerrainTile(copy, 1, variant.tile, true);
    expect(terrainMask(copy, variant.tile)).toBe(1);
    expect(rule.variants).toHaveLength(2);
    const a = structuredClone(asset);
    setTerrainSets(a, [copy]);
    expect(() => validateTerrains([a])).not.toThrow();
  });
  it.each([0, -1, NaN, Infinity, 1001])(
    'rejects invalid weight %s',
    (weight) => {
      const a = structuredClone(asset);
      const r = required(terrainSets(a)[0]?.rules.find((r) => r.mask === 15));
      required(r.variants?.[0]).weight = weight;
      expect(() => validateTerrains([a])).toThrow(/weight/i);
    },
  );
  it('accepts legacy rules without variants or weights', () => {
    const a = structuredClone(asset);
    for (const r of required(terrainSets(a)[0]).rules) {
      delete r.variants;
      delete r.weight;
    }
    expect(() => validateTerrains([a])).not.toThrow();
    expect(
      terrainTile(required(terrainSets(a)[0]), 15, { x: 99, y: 99 }),
    ).toEqual(
      required(terrainSets(a)[0]?.rules.find((r) => r.mask === 15)).tile,
    );
  });
});

describe('multiple terrain types', () => {
  it('joins grass to dirt with matching shared corners and erases all types in the target', () => {
    const asset = multiTerrainTileset();
    const set = required(terrainSets(asset)[0]);
    const map = empty();
    paintTerrain(map, set, [{ x: 3, y: 3 }], bounds);
    paintTerrain(map, set, [{ x: 4, y: 3 }], bounds, false, undefined, 2);
    expect(
      patternValues(set, required(terrainMask(set, map.cells['3,3']))),
    ).toEqual([1, 2, 2, 1]);
    expect(
      patternValues(set, required(terrainMask(set, map.cells['4,3']))),
    ).toEqual([2, 2, 2, 2]);
    paintTerrain(map, set, [{ x: 4, y: 3 }], bounds, true, undefined, 2);
    expect(map.cells['4,3']).toBeUndefined();
    expect(
      patternValues(set, required(terrainMask(set, map.cells['3,3']))),
    ).toEqual([1, 0, 0, 1]);
    expect(() => validateTerrains([asset])).not.toThrow();
  });
  it('remaps legacy patterns and variants without changing their artwork when adding a type', () => {
    const copy = structuredClone(set),
      original = copy.rules.map((r) => ({
        tile: r.tile,
        values: patternValues(copy, r.mask),
        variants: r.variants,
      }));
    addTerrainType(copy);
    expect(terrainTypes(copy)).toHaveLength(2);
    original.forEach((r) => {
      const code = required(terrainMask(copy, r.tile));
      expect(patternValues(copy, code)).toEqual(r.values);
      expect(copy.rules.find((rule) => rule.mask === code)?.variants).toEqual(
        r.variants,
      );
    });
    const a = structuredClone(asset);
    setTerrainSets(a, [copy]);
    const document = createInitialProject();
    document.assets.push(a);
    expect(() =>
      parseLevelProject(JSON.parse(JSON.stringify(document))),
    ).not.toThrow();
  });
  it('rotates multi-material assignments and rejects missing mixed transitions atomically', () => {
    const a = multiTerrainTileset(),
      s = required(terrainSets(a)[0]);
    const mixed = patternCode(s, [1, 2, 2, 1]),
      tile = required(s.rules.find((r) => r.mask === mixed)).tile;
    const transformed = required(
      transformStamp({ width: 1, height: 1, tiles: [tile] }, 'rotate-cw')
        .tiles[0],
    );
    expect(patternValues(s, required(terrainMask(s, transformed)))).toEqual([
      1, 1, 2, 2,
    ]);
    const asymmetricMask = patternCode(s, [1, 2, 0, 0]),
      asymmetricRule = required(
        s.rules.find((rule) => rule.mask === asymmetricMask),
      ),
      reflectedMask = required(
        terrainMask(s, { ...asymmetricRule.tile, flipX: true }),
      ),
      reflectedSet = { ...s, rules: [asymmetricRule] };
    expect(terrainRuleMatch(reflectedSet, reflectedMask)).toMatchObject({
      flipX: true,
    });
    const map = empty();
    paintTerrain(map, s, [{ x: 3, y: 3 }], bounds);
    const before = structuredClone(map);
    s.rules = s.rules.filter(
      (rule) => new Set(patternValues(s, rule.mask).filter(Boolean)).size < 2,
    );
    expect(() =>
      paintTerrain(map, s, [{ x: 4, y: 3 }], bounds, false, undefined, 2),
    ).toThrow('Missing terrain pattern');
    expect(map).toEqual(before);
  });
});
