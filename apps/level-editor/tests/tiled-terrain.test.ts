import { describe, expect, it } from 'vitest';
import {
  starterEdgeTileset,
  starterTerrainTileset,
  terrainSets,
  validateTerrains,
} from '../src/terrain';
import { exportTiledTerrain, importTiledTerrain } from '../src/tiled-terrain';

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing test fixture');
  return value;
}

describe('Tiled Wang set interchange', () => {
  it('exports corner positions, weighted variants and transformations', () => {
    const asset = starterTerrainTileset(),
      set = required(terrainSets(asset)[0]);
    set.allowRotation = true;
    set.allowFlip = false;
    const output = exportTiledTerrain(asset) as Record<string, unknown>,
      wangset = required((output.wangsets as Record<string, unknown>[])[0]),
      wangtiles = wangset.wangtiles as Record<string, unknown>[];
    expect(output).toMatchObject({
      type: 'tileset',
      tilewidth: 32,
      tileheight: 32,
      columns: 5,
      transformations: {
        rotate: true,
        hflip: false,
        vflip: false,
      },
    });
    expect(wangset).toMatchObject({ name: 'Grass', type: 'corner' });
    expect(wangtiles.find((tile) => tile.tileid === 1)?.wangid).toEqual([
      0, 0, 0, 0, 0, 0, 0, 1,
    ]);
    expect(
      wangtiles.filter(
        (tile) =>
          JSON.stringify(tile.wangid) ===
          JSON.stringify([0, 1, 0, 1, 0, 1, 0, 1]),
      ),
    ).toHaveLength(4);
  });

  it.each([
    ['corner', starterTerrainTileset()],
    ['edge', starterEdgeTileset()],
  ])('round-trips a %s set against the selected image', (_, source) => {
    const expected = required(terrainSets(source)[0]);
    expected.allowRotation = false;
    expected.allowFlip = true;
    const target = structuredClone(source);
    if (target.metadata) delete target.metadata.terrainSets;
    const sets = importTiledTerrain(target, exportTiledTerrain(source));
    expect(sets).toHaveLength(1);
    expect(required(sets[0])).toMatchObject({
      id: expected.id,
      name: expected.name,
      kind: expected.kind,
      allowRotation: false,
      allowFlip: true,
    });
    expect(required(sets[0]).rules.map((rule) => rule.mask)).toEqual(
      expected.rules.map((rule) => rule.mask),
    );
    expect(() => {
      if (target.metadata) target.metadata.terrainSets = sets as never;
      validateTerrains([target]);
    }).not.toThrow();
    const full = required(sets[0]).rules.find((rule) => rule.mask === 15);
    if (expected.kind === 'corner') {
      expect(full?.weight).toBe(3);
      expect(full?.variants).toHaveLength(3);
    }
  });

  it('rejects mixed Wang IDs and a tileset for another image size', () => {
    const asset = starterEdgeTileset(),
      mixed = exportTiledTerrain(asset) as Record<string, unknown>,
      wangset = required((mixed.wangsets as Record<string, unknown>[])[0]),
      wangtile = required((wangset.wangtiles as Record<string, unknown>[])[0]);
    wangtile.wangid = [1, 1, 0, 0, 0, 0, 0, 0];
    expect(() => importTiledTerrain(asset, mixed)).toThrow(/Mixed/);
    const wrong = exportTiledTerrain(asset) as Record<string, unknown>;
    wrong.imagewidth = 999;
    expect(() => importTiledTerrain(asset, wrong)).toThrow(
      /selected source image/,
    );
  });
});
