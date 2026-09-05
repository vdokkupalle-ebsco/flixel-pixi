import type { AssetDefinition, JsonValue } from '@flixel-pixi/schemas';
import {
  cellKey,
  inBounds,
  insideSelection,
  lineCells,
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
/** Clockwise edges: top, right, bottom, left. */
export const TERRAIN_EDGES = [
  [0.5, 0],
  [1, 0.5],
  [0.5, 1],
  [0, 0.5],
] as const;
export interface TerrainVariant {
  tile: TileRegion;
  weight?: number;
}
export interface TerrainRule extends TerrainVariant {
  mask: number;
  variants?: TerrainVariant[];
}
export interface TerrainSet {
  id: string;
  name: string;
  kind: 'corner' | 'edge';
  terrains?: { name: string; color: string }[];
  allowRotation?: boolean;
  allowFlip?: boolean;
  color: string;
  rules: TerrainRule[];
}
export interface TerrainChoice {
  terrainIndex?: number;
  edgeWidth?: 1 | 3 | 5;
  edgeStraight?: boolean;
  edgeClosed?: boolean;
  edgeEnds?: 'caps' | 'junctions';
  assetId: string;
  setId: string;
}
export interface EdgeBrushOptions {
  width?: 1 | 3 | 5;
  straight?: boolean;
  closed?: boolean;
  ends?: 'caps' | 'junctions';
}

export function terrainTypes(set: TerrainSet) {
  return set.terrains ?? [{ name: set.name, color: set.color }];
}
export function terrainPatternCount(set: TerrainSet): number {
  return (terrainTypes(set).length + 1) ** 4;
}
export function patternValues(set: TerrainSet, mask: number): number[] {
  const base = terrainTypes(set).length + 1;
  return [0, 1, 2, 3].map((i) => Math.floor(mask / base ** i) % base);
}
export function patternCode(
  set: TerrainSet,
  values: readonly number[],
): number {
  const base = terrainTypes(set).length + 1;
  return values.reduce((mask, value, i) => mask + value * base ** i, 0);
}
export function addTerrainType(set: TerrainSet): void {
  const types = terrainTypes(set);
  if (types.length >= 3) return;
  const old = set.rules.map((rule) => ({
    rule,
    values: patternValues(set, rule.mask),
  }));
  set.terrains = [
    ...types.map((type) => ({ ...type })),
    {
      name: `Terrain ${types.length + 1}`,
      color: types.length === 1 ? '#ad7953' : '#5799bd',
    },
  ];
  for (const { rule, values } of old) rule.mask = patternCode(set, values);
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
        (set.kind !== 'corner' && set.kind !== 'edge') ||
        typeof set.color !== 'string' ||
        !/^#[0-9a-f]{6}$/i.test(set.color) ||
        (set.allowRotation !== undefined &&
          typeof set.allowRotation !== 'boolean') ||
        (set.allowFlip !== undefined && typeof set.allowFlip !== 'boolean') ||
        !Array.isArray(set.rules) ||
        set.rules.length > 255
      )
        throw new Error('Invalid terrain set.');
      if (
        set.terrains !== undefined &&
        (!Array.isArray(set.terrains) ||
          set.terrains.length < 1 ||
          set.terrains.length > 3 ||
          set.terrains.some(
            (type) =>
              !type ||
              typeof type.name !== 'string' ||
              !type.name.trim() ||
              type.name.length > 80 ||
              typeof type.color !== 'string' ||
              !/^#[0-9a-f]{6}$/i.test(type.color),
          ))
      )
        throw new Error('Use 1 to 3 named terrain types with valid colors.');
      if (set.rules.length >= terrainPatternCount(set))
        throw new Error('Too many terrain patterns.');
      ids.add(set.id);
      const masks = new Set<number>(),
        regions = new Set<string>();
      for (const rule of set.rules) {
        if (
          !rule ||
          !Number.isInteger(rule.mask) ||
          rule.mask < 1 ||
          rule.mask >= terrainPatternCount(set) ||
          masks.has(rule.mask) ||
          !rule.tile ||
          rule.tile.assetId !== asset.id ||
          (rule.tile.rotation ?? 0) !== 0 ||
          rule.tile.flipX
        )
          throw new Error(`Invalid terrain rule in ${set.name}.`);
        if (
          rule.variants !== undefined &&
          (!Array.isArray(rule.variants) || rule.variants.length > 15)
        )
          throw new Error('Use up to 16 tiles per terrain pattern.');
        for (const variant of [rule, ...(rule.variants ?? [])]) {
          if (
            !variant ||
            !variant.tile ||
            variant.tile.assetId !== asset.id ||
            (variant.tile.rotation ?? 0) !== 0 ||
            variant.tile.flipX ||
            (variant.weight !== undefined &&
              (!Number.isFinite(variant.weight) ||
                variant.weight < 0.01 ||
                variant.weight > 1000))
          )
            throw new Error(
              'Invalid terrain variant. Weights must be between 0.01 and 1000.',
            );
          validateTileMap(
            { tileSize: 16, cells: { '0,0': variant.tile } },
            assets,
          );
          const key = regionKey(variant.tile);
          if (regions.has(key))
            throw new Error(
              'Assign each source tile to only one terrain pattern per set.',
            );
          regions.add(key);
        }
        masks.add(rule.mask);
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
  const rule = set.rules.find((rule) =>
    [rule, ...(rule.variants ?? [])].some(
      (variant) => regionKey(variant.tile) === regionKey(tile),
    ),
  );
  if (!rule) return undefined;
  const values = patternValues(set, rule.mask),
    transformed = [0, 0, 0, 0];
  const positions = set.kind === 'edge' ? TERRAIN_EDGES : TERRAIN_CORNERS;
  positions.forEach(([x, y], index) => {
    if (!values[index]) return;
    let tx = tile.flipX ? 1 - x : x,
      ty: number = y;
    for (let r = 0; r < (tile.rotation ?? 0); r++) [tx, ty] = [1 - ty, tx];
    const next = positions.findIndex(([cx, cy]) => cx === tx && cy === ty);
    transformed[next] = values[index] ?? 0;
  });
  return patternCode(set, transformed);
}

export interface TerrainRuleMatch {
  rule: TerrainRule;
  rotation: 0 | 1 | 2 | 3;
  flipX: boolean;
}

/** Explicit artwork wins; otherwise reuse the closest rotated or reflected rule. */
export function terrainRuleMatch(
  set: TerrainSet,
  mask: number,
): TerrainRuleMatch | undefined {
  const direct = set.rules.find((rule) => rule.mask === mask);
  if (direct) return { rule: direct, rotation: 0, flipX: false };
  const rotations = set.allowRotation === false ? [0] : [0, 1, 2, 3];
  const transforms = [
    ...rotations
      .filter((rotation) => rotation !== 0)
      .map((rotation) => ({ rotation, flipX: false })),
    ...(set.allowFlip === false
      ? []
      : rotations.map((rotation) => ({ rotation, flipX: true }))),
  ] as { rotation: 0 | 1 | 2 | 3; flipX: boolean }[];
  for (const transform of transforms)
    for (const rule of set.rules) {
      if (
        !Number.isInteger(rule.mask) ||
        rule.mask < 1 ||
        rule.mask >= terrainPatternCount(set) ||
        !rule.tile
      )
        continue;
      if (terrainMask(set, { ...rule.tile, ...transform }) === mask)
        return { rule, ...transform };
    }
  return undefined;
}

export function terrainCoverage(set: TerrainSet): number {
  let count = 0;
  for (let mask = 1; mask < terrainPatternCount(set); mask++)
    if (terrainRuleMatch(set, mask)) count++;
  return count;
}

export interface TerrainDiagnostics {
  assigned: number[];
  derived: number[];
  missing: number[];
  duplicated: number[];
  unreachable: number[];
}

/** Report authoring coverage separately from malformed imported rule data. */
export function terrainDiagnostics(set: TerrainSet): TerrainDiagnostics {
  const count = terrainPatternCount(set),
    assigned: number[] = [],
    derived: number[] = [],
    missing: number[] = [],
    duplicated: number[] = [],
    unreachable: number[] = [],
    masks = new Set<number>(),
    regions = new Set<string>();
  for (const rule of set.rules) {
    if (!Number.isInteger(rule.mask) || rule.mask < 1 || rule.mask >= count) {
      unreachable.push(rule.mask);
      continue;
    }
    let duplicate = masks.has(rule.mask);
    masks.add(rule.mask);
    for (const variant of [rule, ...(rule.variants ?? [])]) {
      if (!variant?.tile) {
        unreachable.push(rule.mask);
        continue;
      }
      const key = regionKey(variant.tile);
      if (regions.has(key)) duplicate = true;
      regions.add(key);
    }
    if (duplicate) duplicated.push(rule.mask);
  }
  for (let mask = 1; mask < count; mask++) {
    if (set.rules.some((rule) => rule.mask === mask)) assigned.push(mask);
    else if (terrainRuleMatch(set, mask)) derived.push(mask);
    else missing.push(mask);
  }
  return {
    assigned,
    derived,
    missing,
    duplicated: [...new Set(duplicated)],
    unreachable: [...new Set(unreachable)],
  };
}

/** Stable per-cell choice keeps previews, stroke segmentation and undo deterministic. */
export function terrainTile(
  set: TerrainSet,
  mask: number,
  cell: Cell,
): TileRegion | undefined {
  const match = terrainRuleMatch(set, mask);
  if (!match) return undefined;
  const { rule, rotation, flipX } = match;
  const choices = [rule, ...(rule.variants ?? [])];
  const transformed = (tile: TileRegion): TileRegion =>
    rotation === 0 && !flipX ? tile : { ...tile, rotation, flipX };
  if (choices.length === 1) return transformed(rule.tile);
  let hash = 2166136261;
  for (const char of `${set.id}:${mask}:${cell.x}:${cell.y}`)
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x846ca68b);
  hash ^= hash >>> 16;
  const total = choices.reduce((sum, choice) => sum + (choice.weight ?? 1), 0);
  let choice = ((hash >>> 0) / 4294967296) * total;
  for (const variant of choices) {
    choice -= variant.weight ?? 1;
    if (choice < 0) return transformed(variant.tile);
  }
  const tile = choices.at(-1)?.tile;
  return tile ? transformed(tile) : undefined;
}

/** Each source region has a single corner meaning within a set. */
export function assignTerrainTile(
  set: TerrainSet,
  mask: number,
  tile: TileRegion,
  asVariant = false,
): void {
  const target = set.rules.find((rule) => rule.mask === mask);
  if (mask < 1 || mask >= terrainPatternCount(set) || (asVariant && !target))
    return;
  if (
    asVariant &&
    target &&
    [target, ...(target.variants ?? [])].some((v) => sameTile(v.tile, tile))
  )
    return;
  if (asVariant && (target?.variants?.length ?? 0) >= 15) return;
  for (const rule of set.rules) {
    rule.variants = (rule.variants ?? []).filter(
      (v) => !sameTile(v.tile, tile),
    );
    if (rule.mask !== mask && sameTile(rule.tile, tile)) {
      const replacement = rule.variants.shift();
      if (replacement) {
        rule.tile = replacement.tile;
        rule.weight = replacement.weight ?? 1;
      } else set.rules = set.rules.filter((candidate) => candidate !== rule);
    }
  }
  if (asVariant && target)
    (target.variants ??= []).push({ tile: { ...tile }, weight: 1 });
  else if (target) target.tile = { ...tile };
  else set.rules.push({ mask, tile: { ...tile } });
  set.rules.sort((a, b) => a.mask - b.mask);
}

/** Build a small patch first, then apply it atomically. Unmapped artwork is protected. */
export function paintTerrain(
  map: TileMap,
  set: TerrainSet,
  cells: readonly Cell[],
  bounds: TileBounds,
  erase = false,
  selection?: TileSelection,
  terrainIndex = 1,
  edgeOptions: EdgeBrushOptions = {},
): void {
  if (
    !Number.isInteger(terrainIndex) ||
    terrainIndex < 1 ||
    terrainIndex > terrainTypes(set).length
  )
    throw new Error('Choose a terrain type to paint.');
  const positions = set.kind === 'edge' ? TERRAIN_EDGES : TERRAIN_CORNERS;
  const vertices = new Set<string>();
  const path: Cell[] = [];
  for (const cell of cells) {
    if (!inBounds(cell, bounds) || !insideSelection(cell, selection)) continue;
    const previous = path.at(-1),
      segment = previous ? lineCells(previous, cell).slice(1) : [cell];
    for (const step of segment) {
      const last = path.at(-1);
      if (set.kind === 'edge' && last && last.x !== step.x && last.y !== step.y)
        path.push({ x: step.x, y: last.y });
      path.push(step);
    }
  }
  if (
    set.kind === 'edge' &&
    !erase &&
    (path.length > 1 || (edgeOptions.width ?? 1) > 1)
  ) {
    const width = edgeOptions.width ?? 1;
    if (![1, 3, 5].includes(width))
      throw new Error('Choose a road width of 1, 3 or 5 cells.');
    if (width === 1) {
      for (let index = 1; index < path.length; index++) {
        const from = path[index - 1],
          to = path[index];
        if (!from || !to) continue;
        vertices.add(cellKey({ x: from.x + to.x + 1, y: from.y + to.y + 1 }));
      }
    } else {
      const radius = (width - 1) / 2;
      for (let index = 1; index < path.length; index++) {
        const from = path[index - 1],
          to = path[index];
        if (!from || !to) continue;
        const horizontal = from.y === to.y;
        for (let offset = -radius; offset <= radius; offset++) {
          const laneFrom = {
              x: from.x + (horizontal ? 0 : offset),
              y: from.y + (horizontal ? offset : 0),
            },
            laneTo = {
              x: to.x + (horizontal ? 0 : offset),
              y: to.y + (horizontal ? offset : 0),
            };
          if (inBounds(laneFrom, bounds) && inBounds(laneTo, bounds))
            vertices.add(
              cellKey({
                x: laneFrom.x + laneTo.x + 1,
                y: laneFrom.y + laneTo.y + 1,
              }),
            );
        }
      }
    }
    // A click without pointer movement retains the established four-way
    // junction behavior, regardless of the selected brush width.
    if (vertices.size === 0 && path[0])
      for (const [dx, dy] of positions)
        vertices.add(
          cellKey({ x: path[0].x * 2 + dx * 2, y: path[0].y * 2 + dy * 2 }),
        );
    if (edgeOptions.ends === 'junctions' && !edgeOptions.closed)
      for (const cell of [path[0], path.at(-1)])
        if (cell)
          for (const [dx, dy] of positions)
            vertices.add(
              cellKey({ x: cell.x * 2 + dx * 2, y: cell.y * 2 + dy * 2 }),
            );
  } else {
    for (const cell of path)
      for (const [dx, dy] of positions)
        vertices.add(
          cellKey({ x: cell.x * 2 + dx * 2, y: cell.y * 2 + dy * 2 }),
        );
  }
  const affected = new Map<string, Cell>();
  for (const vertex of vertices) {
    const [x = 0, y = 0] = vertex.split(',').map(Number);
    for (const [dx, dy] of positions) {
      const cell = { x: (x - dx * 2) / 2, y: (y - dy * 2) / 2 };
      if (
        Number.isInteger(cell.x) &&
        Number.isInteger(cell.y) &&
        inBounds(cell, bounds)
      )
        affected.set(cellKey(cell), cell);
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
    const values = patternValues(set, oldMask);
    positions.forEach(([dx, dy], index) => {
      if (
        vertices.has(
          cellKey({ x: cell.x * 2 + dx * 2, y: cell.y * 2 + dy * 2 }),
        )
      )
        values[index] = erase ? 0 : terrainIndex;
    });
    const mask = patternCode(set, values);
    if (mask === oldMask) continue;
    if (!insideSelection(cell, selection))
      throw new Error(
        'Expand the selection to include the neighboring terrain transitions.',
      );
    const tile = terrainTile(set, mask, cell);
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="128" shape-rendering="crispEdges">${paths.map((d, mask) => `<g transform="translate(${(mask % 4) * 32} ${Math.floor(mask / 4) * 32})"><path fill="#72a854" d="${d}"/></g>`).join('')}${[0, 1, 2].map((i) => `<g transform="translate(128 ${i * 32})"><path fill="#72a854" d="M0 0H32V32H0Z"/><path fill="${['#8dbb67', '#5b8e43', '#a1c876'][i]}" d="M${5 + i * 3} 8h4v4h-4zM19 21h3v3h-3z"/></g>`).join('')}</svg>`;
  const asset: AssetDefinition = {
    id,
    kind: 'image',
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    metadata: {
      fileName: 'Grass corners',
      width: 160,
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
          ...(mask === 15
            ? {
                weight: 3,
                variants: [0, 1, 2].map((i) => ({
                  weight: 1,
                  tile: {
                    assetId: id,
                    x: 128,
                    y: i * 32,
                    width: 32,
                    height: 32,
                  },
                })),
              }
            : {}),
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

/** Complete two-material corner atlas for trying connected terrain types. */
export function multiTerrainTileset(
  id = 'multi-terrain-starter',
): AssetDefinition {
  const set: TerrainSet = {
    id: 'landscape',
    name: 'Grass and dirt',
    color: '#72a854',
    kind: 'corner',
    terrains: [
      { name: 'Grass', color: '#72a854' },
      { name: 'Dirt', color: '#ad7953' },
    ],
    rules: [],
  };
  const count = terrainPatternCount(set),
    columns = 9,
    size = 32;
  const cells = Array.from({ length: count }, (_, mask) => {
    const x = (mask % columns) * size,
      y = Math.floor(mask / columns) * size;
    if (mask)
      set.rules.push({
        mask,
        tile: { assetId: id, x, y, width: size, height: size },
      });
    return `<g transform="translate(${x} ${y})">${patternValues(set, mask)
      .map((value, i) =>
        value
          ? `<rect x="${i === 1 || i === 2 ? 16 : 0}" y="${i >= 2 ? 16 : 0}" width="16" height="16" fill="${terrainTypes(set)[value - 1]?.color}"/>`
          : '',
      )
      .join('')}</g>`;
  });
  const asset: AssetDefinition = {
    id,
    kind: 'image',
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="288" height="288" shape-rendering="crispEdges">${cells.join('')}</svg>`)}`,
    metadata: {
      fileName: 'Grass and dirt transitions',
      width: 288,
      height: 288,
      tileWidth: 32,
      tileHeight: 32,
    },
  };
  setTerrainSets(asset, [set]);
  return asset;
}

/** Complete edge set for connected roads, paths and fences. */
export function starterEdgeTileset(
  id = 'edge-terrain-starter',
): AssetDefinition {
  const size = 32,
    gutter = 2,
    margin = 1,
    stride = size + gutter,
    atlasSize = margin * 2 + size * 4 + gutter * 3;
  const paths = Array.from({ length: 16 }, (_, mask) => {
    const lines = [
      [16, 16, 16, 0],
      [16, 16, 32, 16],
      [16, 16, 16, 32],
      [16, 16, 0, 16],
    ];
    const x = margin + (mask % 4) * stride,
      y = margin + Math.floor(mask / 4) * stride;
    return mask
      ? `<svg x="${x}" y="${y}" width="${size}" height="${size}" overflow="hidden"><circle cx="16" cy="16" r="5" fill="#c69a61"/>${lines.map(([x1, y1, x2, y2], index) => (mask & (2 ** index) ? `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#c69a61" stroke-width="10"/>` : '')).join('')}</svg>`
      : '';
  });
  const asset: AssetDefinition = {
    id,
    kind: 'image',
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${atlasSize}" height="${atlasSize}" shape-rendering="crispEdges">${paths.join('')}</svg>`)}`,
    metadata: {
      fileName: 'Road edges',
      width: atlasSize,
      height: atlasSize,
      tileWidth: size,
      tileHeight: size,
      tileMargin: margin,
      tileSpacing: gutter,
    },
  };
  setTerrainSets(asset, [
    {
      id: 'road',
      name: 'Road',
      color: '#c69a61',
      kind: 'edge',
      rules: Array.from({ length: 15 }, (_, index) => {
        const mask = index + 1;
        return {
          mask,
          tile: {
            assetId: id,
            x: margin + (mask % 4) * stride,
            y: margin + Math.floor(mask / 4) * stride,
            width: size,
            height: size,
          },
        };
      }),
    },
  ]);
  return asset;
}
