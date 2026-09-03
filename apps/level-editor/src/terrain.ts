import type { AssetDefinition, JsonValue } from '@flixel-pixi/schemas';
import {
  cellKey,
  inBounds,
  insideSelection,
  sameTile,
  validateTileMap,
  type Cell,
  type TileBounds,
  type TileMap,
  type TileRegion,
  type TileSelection,
} from './tiles';

/** Clockwise corners: top left, top right, bottom right, bottom left. */
export const TERRAIN_CORNERS = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
] as const;
export interface TerrainSet {
  id: string;
  name: string;
  kind: 'corner';
  color: string;
  rules: { mask: number; tile: TileRegion }[];
}
export interface TerrainChoice {
  assetId: string;
  setId: string;
}

export function terrainSets(asset: AssetDefinition): TerrainSet[] {
  return (asset.metadata?.terrainSets ?? []) as unknown as TerrainSet[];
}

export function setTerrainSets(
  asset: AssetDefinition,
  sets: TerrainSet[],
): void {
  (asset.metadata ??= {}).terrainSets = sets as unknown as JsonValue;
}

export function selectedTerrain(
  assets: readonly AssetDefinition[],
  choice?: TerrainChoice,
): TerrainSet | undefined {
  const asset = assets.find((asset) => asset.id === choice?.assetId);
  return asset && terrainSets(asset).find((set) => set.id === choice?.setId);
}

export function validateTerrains(assets: readonly AssetDefinition[]): void {
  for (const asset of assets) {
    if (asset.metadata?.terrainSets === undefined) continue;
    const raw = asset.metadata.terrainSets;
    if (asset.kind !== 'image' || !Array.isArray(raw) || raw.length > 64)
      throw new Error('Invalid terrain sets. Use up to 64 sets per image.');
    const sets = terrainSets(asset);
    const ids = new Set<string>();
    for (const set of sets) {
      if (
        !set ||
        typeof set.id !== 'string' ||
        !set.id ||
        ids.has(set.id) ||
        typeof set.name !== 'string' ||
        !set.name.trim() ||
        set.name.length > 80 ||
        set.kind !== 'corner' ||
        typeof set.color !== 'string' ||
        !/^#[0-9a-f]{6}$/i.test(set.color) ||
        !Array.isArray(set.rules) ||
        set.rules.length > 15
      )
        throw new Error('Invalid corner terrain set.');
      ids.add(set.id);
      const masks = new Set<number>(),
        regions = new Set<string>();
      for (const rule of set.rules) {
        if (
          !rule ||
          !Number.isInteger(rule.mask) ||
          rule.mask < 1 ||
          rule.mask > 15 ||
          masks.has(rule.mask) ||
          !rule.tile ||
          rule.tile.assetId !== asset.id ||
          (rule.tile.rotation ?? 0) !== 0 ||
          rule.tile.flipX
        )
          throw new Error(`Invalid terrain rule in ${set.name}.`);
        validateTileMap({ tileSize: 16, cells: { '0,0': rule.tile } }, assets);
        const key = regionKey(rule.tile);
        if (regions.has(key))
          throw new Error(
            'Assign each source tile to only one terrain pattern per set.',
          );
        masks.add(rule.mask);
        regions.add(key);
      }
    }
  }
}

function regionKey(tile: TileRegion): string {
  return JSON.stringify([
    tile.assetId,
    tile.x,
    tile.y,
    tile.width,
    tile.height,
  ]);
}

/** Resolve artwork transforms as well as the original source region. */
export function terrainMask(
  set: TerrainSet,
  tile?: TileRegion,
): number | undefined {
  if (!tile) return 0;
  const rule = set.rules.find(
    (rule) => regionKey(rule.tile) === regionKey(tile),
  );
  if (!rule) return undefined;
  let mask = 0;
  TERRAIN_CORNERS.forEach(([x, y], index) => {
    if (!(rule.mask & (1 << index))) return;
    let tx = tile.flipX ? 1 - x : x,
      ty: number = y;
    for (let r = 0; r < (tile.rotation ?? 0); r++) [tx, ty] = [1 - ty, tx];
    const next = TERRAIN_CORNERS.findIndex(
      ([cx, cy]) => cx === tx && cy === ty,
    );
    mask |= 1 << next;
  });
  return mask;
}

/** Build a small patch first, then apply it atomically. Unmapped artwork is protected. */
export function paintTerrain(
  map: TileMap,
  set: TerrainSet,
  cells: readonly Cell[],
  bounds: TileBounds,
  erase = false,
  selection?: TileSelection,
): void {
  const vertices = new Set<string>();
  for (const cell of cells) {
    if (!inBounds(cell, bounds) || !insideSelection(cell, selection)) continue;
    for (const [dx, dy] of TERRAIN_CORNERS)
      vertices.add(cellKey({ x: cell.x + dx, y: cell.y + dy }));
  }
  const affected = new Map<string, Cell>();
  for (const vertex of vertices) {
    const [x = 0, y = 0] = vertex.split(',').map(Number);
    for (const [dx, dy] of TERRAIN_CORNERS) {
      const cell = { x: x - dx, y: y - dy };
      if (inBounds(cell, bounds)) affected.set(cellKey(cell), cell);
    }
  }
  const patch = new Map<string, TileRegion | undefined>();
  for (const [key, cell] of affected) {
    const original = map.cells[key],
      oldMask = terrainMask(set, original);
    if (oldMask === undefined)
      throw new Error(
        'Terrain touches tiles outside this set. Use an empty area or a separate layer.',
      );
    let mask = oldMask;
    TERRAIN_CORNERS.forEach(([dx, dy], index) => {
      if (vertices.has(cellKey({ x: cell.x + dx, y: cell.y + dy })))
        mask = erase ? mask & ~(1 << index) : mask | (1 << index);
    });
    if (mask === oldMask) continue;
    if (!insideSelection(cell, selection))
      throw new Error(
        'Expand the selection to include the neighboring terrain transitions.',
      );
    const tile = set.rules.find((rule) => rule.mask === mask)?.tile;
    if (mask !== 0 && !tile)
      throw new Error(
        `Missing terrain pattern ${mask}. Assign a tile in Terrain rules before painting here.`,
      );
    if (!sameTile(tile, original)) patch.set(key, tile);
  }
  for (const [key, tile] of patch) {
    if (tile) map.cells[key] = { ...tile };
    else Reflect.deleteProperty(map.cells, key);
  }
}

/** A complete corner set gives users an immediately paintable example. */
export function starterTerrainTileset(id = 'terrain-starter'): AssetDefinition {
  const paths = [
    '',
    'M0 0H16L0 16Z',
    'M16 0H32V16Z',
    'M0 0H32V16H0Z',
    'M32 16V32H16Z',
    'M0 0H16L0 16ZM32 16V32H16Z',
    'M16 0H32V32H16Z',
    'M0 0H32V32H16L0 16Z',
    'M0 16L16 32H0Z',
    'M0 0H16V32H0Z',
    'M16 0H32V16ZM0 16L16 32H0Z',
    'M0 0H32V16L16 32H0Z',
    'M0 16H32V32H0Z',
    'M0 0H16L32 16V32H0Z',
    'M16 0H32V32H0V16Z',
    'M0 0H32V32H0Z',
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" shape-rendering="crispEdges">${paths.map((d, mask) => `<g transform="translate(${(mask % 4) * 32} ${Math.floor(mask / 4) * 32})"><path fill="#72a854" d="${d}"/></g>`).join('')}</svg>`;
  const asset: AssetDefinition = {
    id,
    kind: 'image',
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    metadata: {
      fileName: 'Grass corners',
      width: 128,
      height: 128,
      tileWidth: 32,
      tileHeight: 32,
    },
  };
  setTerrainSets(asset, [
    {
      id: 'grass',
      name: 'Grass',
      color: '#72a854',
      kind: 'corner',
      rules: Array.from({ length: 15 }, (_, index) => {
        const mask = index + 1;
        return {
          mask,
          tile: {
            assetId: id,
            x: (mask % 4) * 32,
            y: Math.floor(mask / 4) * 32,
            width: 32,
            height: 32,
          },
        };
      }),
    },
  ]);
  return asset;
}
