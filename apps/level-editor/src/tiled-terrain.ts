import type { AssetDefinition, JsonValue } from '@flixel-pixi/schemas';
import {
  patternCode,
  patternValues,
  terrainSets,
  terrainTypes,
  validateTerrains,
  type TerrainRule,
  type TerrainSet,
  type TerrainVariant,
} from './terrain';

interface TiledProperty {
  name: string;
  type: string;
  value: unknown;
}

const property = (properties: unknown, name: string): unknown =>
  Array.isArray(properties)
    ? (properties as TiledProperty[]).find((item) => item?.name === name)?.value
    : undefined;

function integer(value: unknown, label: string, min = 0): number {
  if (!Number.isSafeInteger(value) || Number(value) < min)
    throw new Error(`Invalid Tiled ${label}.`);
  return Number(value);
}

function grid(asset: AssetDefinition, source?: Record<string, unknown>) {
  const metadata = asset.metadata ?? {},
    tileWidth = integer(
      source?.tilewidth ?? metadata.tileWidth,
      'tile width',
      1,
    ),
    tileHeight = integer(
      source?.tileheight ?? metadata.tileHeight,
      'tile height',
      1,
    ),
    margin = integer(source?.margin ?? metadata.tileMargin ?? 0, 'margin'),
    spacing = integer(source?.spacing ?? metadata.tileSpacing ?? 0, 'spacing'),
    width = integer(metadata.width, 'image width', 1),
    height = integer(metadata.height, 'image height', 1),
    columns = Math.floor(
      (width - margin * 2 + spacing) / (tileWidth + spacing),
    ),
    rows = Math.floor((height - margin * 2 + spacing) / (tileHeight + spacing));
  if (columns < 1 || rows < 1)
    throw new Error('No Tiled tiles fit this image.');
  return {
    tileWidth,
    tileHeight,
    margin,
    spacing,
    width,
    height,
    columns,
    rows,
  };
}

function tileId(asset: AssetDefinition, tile: TerrainVariant['tile']): number {
  const g = grid(asset),
    x = (tile.x - g.margin) / (g.tileWidth + g.spacing),
    y = (tile.y - g.margin) / (g.tileHeight + g.spacing);
  if (
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    y < 0 ||
    x >= g.columns ||
    y >= g.rows ||
    tile.width !== g.tileWidth ||
    tile.height !== g.tileHeight
  )
    throw new Error('Terrain source regions must align to the tileset grid.');
  return y * g.columns + x;
}

function wangId(set: TerrainSet, mask: number): number[] {
  const values = patternValues(set, mask);
  return set.kind === 'corner'
    ? [
        0,
        values[1] ?? 0,
        0,
        values[2] ?? 0,
        0,
        values[3] ?? 0,
        0,
        values[0] ?? 0,
      ]
    : [
        values[0] ?? 0,
        0,
        values[1] ?? 0,
        0,
        values[2] ?? 0,
        0,
        values[3] ?? 0,
        0,
      ];
}

export function exportTiledTerrain(
  asset: AssetDefinition,
): Record<string, JsonValue> {
  const g = grid(asset),
    probabilities = new Map<number, number>();
  const wangsets = terrainSets(asset).map((set) => {
    const weights: Record<string, number> = {};
    const wangtiles = set.rules.flatMap((rule) =>
      [rule, ...(rule.variants ?? [])].map((variant) => {
        const id = tileId(asset, variant.tile),
          weight = variant.weight ?? 1;
        probabilities.set(id, Math.max(probabilities.get(id) ?? 0, weight));
        weights[id] = weight;
        return { tileid: id, wangid: wangId(set, rule.mask) };
      }),
    );
    return {
      name: set.name,
      type: set.kind,
      tile: -1,
      colors: terrainTypes(set).map((terrain) => ({
        name: terrain.name,
        color: terrain.color,
        tile: -1,
        probability: 1,
      })),
      properties: [
        { name: 'flixelPixiId', type: 'string', value: set.id },
        {
          name: 'flixelPixiAllowRotation',
          type: 'bool',
          value: set.allowRotation !== false,
        },
        {
          name: 'flixelPixiAllowFlip',
          type: 'bool',
          value: set.allowFlip !== false,
        },
        {
          name: 'flixelPixiWeights',
          type: 'string',
          value: JSON.stringify(weights),
        },
      ],
      wangtiles,
    };
  });
  return {
    type: 'tileset',
    version: '1.10',
    tiledversion: '1.12.2',
    name: String(asset.metadata?.fileName ?? asset.id),
    tilewidth: g.tileWidth,
    tileheight: g.tileHeight,
    tilecount: g.columns * g.rows,
    columns: g.columns,
    image: String(asset.metadata?.fileName ?? ''),
    imagewidth: g.width,
    imageheight: g.height,
    margin: g.margin,
    spacing: g.spacing,
    transformations: {
      hflip: terrainSets(asset).some((set) => set.allowFlip !== false),
      vflip: terrainSets(asset).some((set) => set.allowFlip !== false),
      rotate: terrainSets(asset).some((set) => set.allowRotation !== false),
      preferuntransformed: true,
    },
    tiles: [...probabilities].map(([id, probability]) => ({ id, probability })),
    wangsets,
  } as unknown as Record<string, JsonValue>;
}

export function importTiledTerrain(
  asset: AssetDefinition,
  input: unknown,
): TerrainSet[] {
  if (!input || typeof input !== 'object')
    throw new Error('Invalid Tiled tileset JSON.');
  const source = input as Record<string, unknown>,
    g = grid(asset, source);
  if (
    source.type !== 'tileset' ||
    integer(source.imagewidth, 'image width', 1) !== g.width ||
    integer(source.imageheight, 'image height', 1) !== g.height ||
    !Array.isArray(source.wangsets) ||
    source.wangsets.length > 64
  )
    throw new Error('Choose Tiled tileset JSON for the selected source image.');
  const probabilities = new Map<number, number>();
  if (Array.isArray(source.tiles))
    for (const raw of source.tiles as Record<string, unknown>[]) {
      const id = integer(raw?.id, 'tile ID');
      if (typeof raw?.probability === 'number')
        probabilities.set(id, raw.probability);
    }
  const transforms =
    source.transformations && typeof source.transformations === 'object'
      ? (source.transformations as Record<string, unknown>)
      : {};
  const ids = new Set<string>();
  const sets = (source.wangsets as Record<string, unknown>[]).map(
    (raw, setIndex) => {
      if (!raw || (raw.type !== 'corner' && raw.type !== 'edge'))
        throw new Error('Mixed Tiled Wang sets are not supported.');
      if (
        !Array.isArray(raw.colors) ||
        raw.colors.length < 1 ||
        raw.colors.length > 3
      )
        throw new Error('Use 1 to 3 Wang colors per terrain set.');
      const terrains = (raw.colors as Record<string, unknown>[]).map(
        (color) => {
          if (
            !color ||
            typeof color.name !== 'string' ||
            typeof color.color !== 'string' ||
            !/^#[0-9a-f]{6}$/i.test(color.color)
          )
            throw new Error('Invalid Tiled Wang color.');
          return { name: color.name, color: color.color };
        },
      );
      let id = String(
        property(raw.properties, 'flixelPixiId') ?? `wang-set-${setIndex + 1}`,
      );
      while (!id || ids.has(id)) id = `${id || 'wang-set'}-${setIndex + 1}`;
      ids.add(id);
      const set: TerrainSet = {
        id,
        name:
          typeof raw.name === 'string' && raw.name.trim()
            ? raw.name
            : `Terrain ${setIndex + 1}`,
        kind: raw.type,
        color: terrains[0]?.color ?? '#72a854',
        terrains,
        allowRotation:
          (property(raw.properties, 'flixelPixiAllowRotation') as
            boolean | undefined) ?? transforms.rotate === true,
        allowFlip:
          (property(raw.properties, 'flixelPixiAllowFlip') as
            boolean | undefined) ??
          (transforms.hflip === true || transforms.vflip === true),
        rules: [],
      };
      let savedWeights: Record<string, unknown> = {};
      const weights = property(raw.properties, 'flixelPixiWeights');
      if (typeof weights === 'string') {
        try {
          const parsed = JSON.parse(weights);
          if (parsed && typeof parsed === 'object') savedWeights = parsed;
        } catch {
          throw new Error(`Invalid saved weights in ${set.name}.`);
        }
      }
      if (!Array.isArray(raw.wangtiles))
        throw new Error(`Invalid Wang tiles in ${set.name}.`);
      for (const wangtile of raw.wangtiles as Record<string, unknown>[]) {
        const localId = integer(wangtile?.tileid, 'Wang tile ID'),
          values = wangtile?.wangid;
        if (
          localId >= g.columns * g.rows ||
          !Array.isArray(values) ||
          values.length !== 8
        )
          throw new Error(`Invalid Wang tile in ${set.name}.`);
        if (
          values.some(
            (value) =>
              !Number.isInteger(value) ||
              Number(value) < 0 ||
              Number(value) > terrains.length,
          )
        )
          throw new Error(`Invalid Wang color index in ${set.name}.`);
        const positions = values.map(Number);
        if (
          (set.kind === 'corner' &&
            [0, 2, 4, 6].some((index) => positions[index])) ||
          (set.kind === 'edge' &&
            [1, 3, 5, 7].some((index) => positions[index]))
        )
          throw new Error('Mixed Tiled Wang IDs are not supported.');
        const pattern =
          set.kind === 'corner'
            ? [positions[7], positions[1], positions[3], positions[5]]
            : [positions[0], positions[2], positions[4], positions[6]];
        const mask = patternCode(set, pattern as number[]);
        if (mask === 0) continue;
        const x = localId % g.columns,
          y = Math.floor(localId / g.columns),
          weightValue =
            savedWeights[String(localId)] ?? probabilities.get(localId) ?? 1,
          weight = typeof weightValue === 'number' ? weightValue : 1,
          variant: TerrainVariant = {
            tile: {
              assetId: asset.id,
              x: g.margin + x * (g.tileWidth + g.spacing),
              y: g.margin + y * (g.tileHeight + g.spacing),
              width: g.tileWidth,
              height: g.tileHeight,
            },
            weight,
          };
        const rule = set.rules.find((candidate) => candidate.mask === mask);
        if (rule) (rule.variants ??= []).push(variant);
        else set.rules.push({ mask, ...variant } as TerrainRule);
      }
      set.rules.sort((a, b) => a.mask - b.mask);
      return set;
    },
  );
  const copy = structuredClone(asset);
  (copy.metadata ??= {}).tileWidth = g.tileWidth;
  copy.metadata.tileHeight = g.tileHeight;
  copy.metadata.tileMargin = g.margin;
  copy.metadata.tileSpacing = g.spacing;
  (copy.metadata ??= {}).terrainSets = sets as unknown as JsonValue;
  validateTerrains([copy]);
  (asset.metadata ??= {}).tileWidth = g.tileWidth;
  asset.metadata.tileHeight = g.tileHeight;
  asset.metadata.tileMargin = g.margin;
  asset.metadata.tileSpacing = g.spacing;
  return sets;
}
