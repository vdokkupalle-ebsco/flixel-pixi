import type {
  AssetDefinition,
  EntityDefinition,
  JsonObject,
  JsonValue,
  ProjectDocumentV1,
} from '@flixel-pixi/schemas';
import {
  LEVEL_EDITOR_EXTENSION,
  LEVEL_EDITOR_VERSION,
  createPhysicsWorld,
  entityProperties,
  getEditorExtension,
  layerForEntity,
  parseLevelProject,
  sceneLayers,
  type LayerPurpose,
  type LevelEditorSnapshot,
  type SceneEditorSettings,
  type SceneLayerDefinition,
} from './model';
import { customProperties, type CustomProperty } from './gameplay-objects';
import { exportTiledTerrain, importTiledTerrain } from './tiled-terrain';
import { terrainSets } from './terrain';
import type { TileRegion } from './tiles';

interface TiledProperty {
  name: string;
  type: string;
  value: unknown;
}

interface ImportedImage {
  height: number;
  name: string;
  src: string;
  width: number;
}

interface SavedLayer {
  id?: string;
  kind?: 'tiles' | 'objects' | 'group';
  purpose?: LayerPurpose;
  tileCollision?: SceneLayerDefinition['tileCollision'];
}

interface AssetGrid {
  asset: AssetDefinition;
  columns: number;
  firstgid: number;
  height: number;
  margin: number;
  regions: Map<string, number>;
  rows: number;
  spacing: number;
  tileHeight: number;
  tileWidth: number;
  tilecount: number;
  width: number;
}

const H = 0x80000000;
const V = 0x40000000;
const D = 0x20000000;
const FLAGS = 0xf0000000;
const HD = (H | D) >>> 0;
const VD = (V | D) >>> 0;
const HV = (H | V) >>> 0;
const HVD = (H | V | D) >>> 0;
const PREFIX = 'flixelPixi';

const record = (value: unknown, label: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`Invalid Tiled ${label}.`);
  return value as Record<string, unknown>;
};

const integer = (
  value: unknown,
  label: string,
  minimum = 0,
  maximum = 1_000_000,
): number => {
  if (
    !Number.isSafeInteger(value) ||
    Number(value) < minimum ||
    Number(value) > maximum
  )
    throw new Error(`Invalid Tiled ${label}.`);
  return Number(value);
};

const finite = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const properties = (value: unknown): TiledProperty[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is TiledProperty =>
          !!item &&
          typeof item === 'object' &&
          typeof (item as TiledProperty).name === 'string',
      )
    : [];

const property = (value: unknown, name: string): unknown =>
  properties(value).find((item) => item.name === name)?.value;

const saved = (name: string, value: unknown): TiledProperty => ({
  name: `${PREFIX}${name}`,
  type: typeof value === 'boolean' ? 'bool' : 'string',
  value:
    typeof value === 'string' || typeof value === 'boolean'
      ? value
      : JSON.stringify(value),
});

const parseSaved = <T>(value: unknown, label: string): T | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new Error(`Invalid saved ${label}.`);
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`Invalid saved ${label}.`);
  }
};

const slug = (value: string, fallback: string): string =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;

const regionKey = (tile: TileRegion): string =>
  `${tile.x},${tile.y},${tile.width},${tile.height}`;

const snapshotFor = (document: ProjectDocumentV1): LevelEditorSnapshot => ({
  document,
  selectedEntityIds: [],
  snapToGrid: true,
  tool: 'select',
});

const tileTransform = (tile: TileRegion): number => {
  const rotation = tile.rotation ?? 0;
  if (rotation === 0) return tile.flipX ? H : 0;
  if (rotation === 1) return tile.flipX ? HVD : HD;
  if (rotation === 2) return tile.flipX ? V : HV;
  return tile.flipX ? D : VD;
};

const decodeTransform = (
  gid: number,
): Pick<TileRegion, 'rotation' | 'flipX'> => {
  const flags = (gid & FLAGS) >>> 0;
  const [rotation, flipX] =
    flags === 0
      ? [0, false]
      : flags === H
        ? [0, true]
        : flags === HD
          ? [1, false]
          : flags === HVD
            ? [1, true]
            : flags === HV
              ? [2, false]
              : flags === V
                ? [2, true]
                : flags === VD
                  ? [3, false]
                  : flags === D
                    ? [3, true]
                    : [-1, false];
  if (rotation < 0) throw new Error('Unsupported Tiled tile transform.');
  return {
    ...(rotation ? { rotation } : {}),
    ...(flipX ? { flipX } : {}),
  };
};

const assetFileName = (asset: AssetDefinition): string => {
  const savedName = asset.metadata?.fileName;
  if (typeof savedName === 'string' && savedName.trim()) return savedName;
  return `${asset.id}.${asset.src.startsWith('data:image/svg') ? 'svg' : 'png'}`;
};

function assetGrid(
  asset: AssetDefinition,
  firstgid: number,
  usedRegions: readonly TileRegion[],
): AssetGrid {
  const width = integer(asset.metadata?.width, 'image width', 1),
    height = integer(asset.metadata?.height, 'image height', 1),
    tileWidth = integer(asset.metadata?.tileWidth ?? 16, 'tile width', 1, 4096),
    tileHeight = integer(
      asset.metadata?.tileHeight ?? 16,
      'tile height',
      1,
      4096,
    ),
    margin = integer(asset.metadata?.tileMargin ?? 0, 'tile margin', 0, 4096),
    spacing = integer(
      asset.metadata?.tileSpacing ?? 0,
      'tile spacing',
      0,
      4096,
    ),
    columns = Math.floor(
      (width - margin * 2 + spacing) / (tileWidth + spacing),
    ),
    rows = Math.floor((height - margin * 2 + spacing) / (tileHeight + spacing));
  if (columns < 1 || rows < 1)
    throw new Error(`No Tiled tiles fit ${assetFileName(asset)}.`);
  const regions = new Map<string, number>();
  for (const tile of usedRegions) {
    const column = (tile.x - margin) / (tileWidth + spacing),
      row = (tile.y - margin) / (tileHeight + spacing);
    if (
      tile.width === tileWidth &&
      tile.height === tileHeight &&
      Number.isInteger(column) &&
      Number.isInteger(row) &&
      column >= 0 &&
      column < columns &&
      row >= 0 &&
      row < rows
    )
      regions.set(regionKey(tile), row * columns + column);
    else if (!regions.has(regionKey(tile)))
      regions.set(regionKey(tile), columns * rows + regions.size);
  }
  return {
    asset,
    columns,
    firstgid,
    height,
    margin,
    regions,
    rows,
    spacing,
    tileHeight,
    tileWidth,
    tilecount: Math.max(
      columns * rows,
      ...[...regions.values()].map((id) => id + 1),
    ),
    width,
  };
}

const tiledProperty = (property: CustomProperty): TiledProperty => ({
  name: property.name,
  type:
    property.type === 'number'
      ? Number.isInteger(property.value)
        ? 'int'
        : 'float'
      : property.type === 'boolean'
        ? 'bool'
        : property.type,
  value: property.value,
});

function exportObject(
  entity: EntityDefinition,
  id: number,
): Record<string, JsonValue> {
  const p = entityProperties(entity),
    scale = entity.scale ?? { x: 1, y: 1 },
    width = finite(p.width, 16) * scale.x,
    height = finite(p.height, 16) * scale.y,
    point = entity.type === 'spawn-point';
  return {
    id,
    name: entity.name ?? '',
    type: String(p.gameplayClass ?? entity.type),
    x: point ? entity.position.x : entity.position.x - width / 2,
    y: point ? entity.position.y : entity.position.y - height / 2,
    width: point ? 0 : width,
    height: point ? 0 : height,
    rotation: ((entity.rotation ?? 0) * 180) / Math.PI,
    visible: p.visible !== false,
    ...(point ? { point: true } : {}),
    properties: [
      ...customProperties(entity).map(tiledProperty),
      saved('Entity', entity),
    ],
  } as unknown as Record<string, JsonValue>;
}

export function exportTiledMap(
  document: ProjectDocumentV1,
): Record<string, JsonValue> {
  const parsed = parseLevelProject(structuredClone(document)),
    snapshot = snapshotFor(parsed),
    extension = getEditorExtension(parsed),
    scene = parsed.scenes.find(
      (candidate) => candidate.id === extension.activeSceneId,
    );
  if (!scene) throw new Error('Active scene is missing.');
  const settings = extension.scenes[scene.id];
  if (!settings) throw new Error('Active scene settings are missing.');
  const layers = sceneLayers(snapshot),
    tileSize = settings.gridSize,
    conflicting = layers.find(
      (layer) =>
        Object.keys(layer.tilemap?.cells ?? {}).length > 0 &&
        layer.tilemap?.tileSize !== tileSize,
    );
  if (conflicting)
    throw new Error(
      `Layer “${conflicting.name}” uses a different tile size. Match it to the ${tileSize}px scene grid before Tiled export.`,
    );
  const used = new Map<string, TileRegion[]>();
  for (const layer of layers)
    for (const tile of Object.values(layer.tilemap?.cells ?? {}))
      (
        used.get(tile.assetId) ?? used.set(tile.assetId, []).get(tile.assetId)
      )?.push(tile);
  const imageAssets = parsed.assets.filter((asset) => asset.kind === 'image');
  let nextGid = 1;
  const grids = imageAssets.map((asset) => {
    const grid = assetGrid(asset, nextGid, used.get(asset.id) ?? []);
    nextGid += grid.tilecount;
    return grid;
  });
  if (nextGid >= 0x10000000)
    throw new Error('Tiled map contains too many tiles.');
  const gridByAsset = new Map(grids.map((grid) => [grid.asset.id, grid]));
  let nextLayerId = 1,
    nextObjectId = 1;
  const children = (parentId?: string): SceneLayerDefinition[] =>
    layers
      .filter((layer) => layer.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  const layerProperties = (layer: SceneLayerDefinition) => [
    saved('Layer', {
      id: layer.id,
      kind: layer.kind ?? 'tiles',
      purpose: layer.purpose,
      tileCollision: layer.tileCollision,
    }),
  ];
  const exportLayer = (
    layer: SceneLayerDefinition,
  ): Record<string, JsonValue> => {
    const id = nextLayerId++,
      common = {
        id,
        name: layer.name,
        type: 'group',
        visible: layer.visible,
        locked: layer.locked,
        opacity: layer.opacity ?? 1,
        offsetx: layer.offsetX ?? 0,
        offsety: layer.offsetY ?? 0,
        properties: layerProperties(layer),
      };
    if (layer.kind === 'group')
      return {
        ...common,
        layers: children(layer.id).map(exportLayer),
      } as unknown as Record<string, JsonValue>;
    const content: Record<string, JsonValue>[] = [];
    if (layer.tilemap) {
      const columns = Math.ceil(settings.width / tileSize),
        rows = Math.ceil(settings.height / tileSize),
        data = Array<number>(columns * rows).fill(0);
      for (const [key, tile] of Object.entries(layer.tilemap.cells)) {
        const [x = 0, y = 0] = key.split(',').map(Number),
          grid = gridByAsset.get(tile.assetId),
          local = grid?.regions.get(regionKey(tile));
        if (!grid || local === undefined)
          throw new Error(`Tile ${key} in “${layer.name}” is not exportable.`);
        data[y * columns + x] =
          ((grid.firstgid + local) | tileTransform(tile)) >>> 0;
      }
      content.push({
        id: nextLayerId++,
        name: `${layer.name} · Tiles`,
        type: 'tilelayer',
        width: columns,
        height: rows,
        x: 0,
        y: 0,
        opacity: 1,
        visible: true,
        data,
        properties: [saved('Synthetic', true)],
      } as unknown as Record<string, JsonValue>);
    }
    const entities = scene.entities
      .filter((entity) => layerForEntity(snapshot, entity).id === layer.id)
      .sort(
        (a, b) => finite(a.properties?.zIndex) - finite(b.properties?.zIndex),
      );
    if (entities.length || layer.kind === 'objects')
      content.push({
        id: nextLayerId++,
        name: `${layer.name} · Objects`,
        type: 'objectgroup',
        draworder: 'topdown',
        opacity: 1,
        visible: true,
        objects: entities.map((entity) => exportObject(entity, nextObjectId++)),
        properties: [saved('Synthetic', true)],
      } as unknown as Record<string, JsonValue>);
    return { ...common, layers: content } as unknown as Record<
      string,
      JsonValue
    >;
  };
  const tiledTilesets = grids.map((grid) => {
    const normalized = structuredClone(grid.asset);
    (normalized.metadata ??= {}).tileWidth = grid.tileWidth;
    normalized.metadata.tileHeight = grid.tileHeight;
    normalized.metadata.tileMargin = grid.margin;
    normalized.metadata.tileSpacing = grid.spacing;
    const base = terrainSets(normalized).length
      ? exportTiledTerrain(normalized)
      : ({
          type: 'tileset',
          version: '1.10',
          tiledversion: '1.12.2',
          name: assetFileName(grid.asset),
          tilewidth: grid.tileWidth,
          tileheight: grid.tileHeight,
          tilecount: grid.tilecount,
          columns: grid.columns,
          image: assetFileName(grid.asset),
          imagewidth: grid.width,
          imageheight: grid.height,
          margin: grid.margin,
          spacing: grid.spacing,
        } as Record<string, JsonValue>);
    const tileDefinitions = new Map<number, Record<string, JsonValue>>(
      Array.isArray(base.tiles)
        ? (base.tiles as Record<string, JsonValue>[]).map((tile) => [
            Number(tile.id),
            tile,
          ])
        : [],
    );
    for (const [key, id] of grid.regions) {
      if (id < grid.columns * grid.rows) continue;
      const [x = 0, y = 0, width = 0, height = 0] = key.split(',').map(Number);
      tileDefinitions.set(id, { id, x, y, width, height });
    }
    return {
      ...base,
      firstgid: grid.firstgid,
      name: assetFileName(grid.asset),
      image: assetFileName(grid.asset),
      tilecount: grid.tilecount,
      properties: [
        ...properties(base.properties),
        saved('AssetId', grid.asset.id),
        saved('AssetSource', grid.asset.src),
        saved('AssetMetadata', grid.asset.metadata ?? {}),
      ],
      ...(tileDefinitions.size ? { tiles: [...tileDefinitions.values()] } : {}),
    } as unknown as Record<string, JsonValue>;
  });
  return {
    type: 'map',
    version: '1.10',
    tiledversion: '1.12.2',
    orientation: 'orthogonal',
    renderorder: 'right-down',
    infinite: false,
    width: Math.ceil(settings.width / tileSize),
    height: Math.ceil(settings.height / tileSize),
    tilewidth: tileSize,
    tileheight: tileSize,
    backgroundcolor: settings.background,
    nextlayerid: nextLayerId,
    nextobjectid: nextObjectId,
    layers: children().map(exportLayer),
    tilesets: tiledTilesets,
    properties: [
      saved('ProjectId', parsed.project.id),
      saved('ProjectName', parsed.project.name),
      saved('SceneId', scene.id),
      saved('SceneName', scene.name),
      saved('PixelWidth', String(settings.width)),
      saved('PixelHeight', String(settings.height)),
      saved('ActiveLayerId', settings.activeLayerId ?? ''),
      saved('Physics', settings.physics),
      saved(
        'ExtraAssets',
        parsed.assets.filter((asset) => asset.kind !== 'image'),
      ),
    ],
  } as unknown as Record<string, JsonValue>;
}

const importCustomProperties = (value: unknown): CustomProperty[] => {
  const result: CustomProperty[] = [];
  for (const item of properties(value)) {
    if (item.name.startsWith(PREFIX)) continue;
    if (item.type === 'bool' && typeof item.value === 'boolean')
      result.push({ name: item.name, type: 'boolean', value: item.value });
    else if (
      (item.type === 'int' || item.type === 'float') &&
      typeof item.value === 'number' &&
      Number.isFinite(item.value)
    )
      result.push({ name: item.name, type: 'number', value: item.value });
    else if (
      item.type === 'color' &&
      typeof item.value === 'string' &&
      /^#[0-9a-f]{6}$/i.test(item.value)
    )
      result.push({ name: item.name, type: 'color', value: item.value });
    else if (typeof item.value === 'string')
      result.push({ name: item.name, type: 'string', value: item.value });
  }
  return result;
};

function importObject(
  rawValue: unknown,
  layerId: string,
  index: number,
  gridSize: number,
): EntityDefinition {
  const raw = record(rawValue, 'object'),
    preserved = parseSaved<EntityDefinition>(
      property(raw.properties, `${PREFIX}Entity`),
      'Tiled object',
    );
  if (preserved) {
    const entity = structuredClone(preserved);
    (entity.properties ??= {}).layerId = layerId;
    return entity;
  }
  const point = raw.point === true,
    width = Math.max(1, finite(raw.width, gridSize)),
    height = Math.max(1, finite(raw.height, gridSize)),
    x = finite(raw.x),
    y = finite(raw.y),
    tiledType = typeof raw.type === 'string' ? raw.type : '',
    type = point
      ? 'spawn-point'
      : /trigger/i.test(tiledType)
        ? 'trigger'
        : 'region';
  return {
    id: `object-${integer(raw.id ?? index + 1, 'object ID', 1)}`,
    name:
      typeof raw.name === 'string' && raw.name.trim()
        ? raw.name
        : `${type} ${index + 1}`,
    type,
    position: point ? { x, y } : { x: x + width / 2, y: y + height / 2 },
    rotation: (finite(raw.rotation) * Math.PI) / 180,
    scale: { x: 1, y: 1 },
    properties: {
      layerId,
      gameplayClass: tiledType || type,
      customProperties: importCustomProperties(
        raw.properties,
      ) as unknown as JsonValue,
      locked: false,
      visible: raw.visible !== false,
      originX: 0.5,
      originY: 0.5,
      width,
      height,
      zIndex: index,
    },
  };
}

export function importTiledMap(
  input: unknown,
  importedImages: readonly ImportedImage[] = [],
): ProjectDocumentV1 {
  const map = record(input, 'map JSON');
  if (map.type !== 'map') throw new Error('Choose a Tiled JSON map (.tmj).');
  if (map.orientation !== 'orthogonal')
    throw new Error('Only orthogonal Tiled maps are supported.');
  if (map.infinite === true)
    throw new Error(
      'Infinite Tiled maps are not supported yet. Export a finite map.',
    );
  const columns = integer(map.width, 'map width', 1, 8192),
    rows = integer(map.height, 'map height', 1, 8192),
    gridSize = integer(map.tilewidth, 'tile width', 1, 1024);
  if (integer(map.tileheight, 'tile height', 1, 1024) !== gridSize)
    throw new Error('Use square Tiled map tiles.');
  if (columns * rows > 4_194_304)
    throw new Error('Tiled maps can contain up to 4,194,304 cells per layer.');
  if (!Array.isArray(map.tilesets) || map.tilesets.length > 256)
    throw new Error('Invalid Tiled tilesets.');
  const imagesByName = new Map(
    importedImages.map((image) => [image.name.split(/[\\/]/).at(-1), image]),
  );
  const ids = new Set<string>();
  const grids: AssetGrid[] = [];
  const assets = (map.tilesets as unknown[]).map((value, index) => {
    const raw = record(value, 'tileset');
    if (typeof raw.source === 'string')
      throw new Error('Embed Tiled tilesets in the map before importing.');
    const firstgid = integer(raw.firstgid, 'tileset first GID', 1, 0x0fffffff),
      imageName = String(raw.image ?? ''),
      supplied = imagesByName.get(imageName.split(/[\\/]/).at(-1)),
      embedded = property(raw.properties, `${PREFIX}AssetSource`),
      src = typeof embedded === 'string' ? embedded : supplied?.src;
    if (!src)
      throw new Error(
        `Select the map together with its image “${imageName || `tileset ${index + 1}`}”.`,
      );
    let id = String(
      property(raw.properties, `${PREFIX}AssetId`) ??
        slug(imageName || String(raw.name ?? ''), `tileset-${index + 1}`),
    );
    while (ids.has(id)) id = `${id}-${index + 1}`;
    ids.add(id);
    const metadata =
      parseSaved<JsonObject>(
        property(raw.properties, `${PREFIX}AssetMetadata`),
        'asset metadata',
      ) ?? {};
    metadata.fileName = imageName || supplied?.name || `${id}.png`;
    metadata.width = integer(
      raw.imagewidth ?? supplied?.width ?? metadata.width,
      'image width',
      1,
    );
    metadata.height = integer(
      raw.imageheight ?? supplied?.height ?? metadata.height,
      'image height',
      1,
    );
    metadata.tileWidth = integer(raw.tilewidth, 'tileset tile width', 1, 4096);
    metadata.tileHeight = integer(
      raw.tileheight,
      'tileset tile height',
      1,
      4096,
    );
    metadata.tileMargin = integer(raw.margin ?? 0, 'tileset margin', 0, 4096);
    metadata.tileSpacing = integer(
      raw.spacing ?? 0,
      'tileset spacing',
      0,
      4096,
    );
    const asset: AssetDefinition = { id, kind: 'image', metadata, src };
    if (Array.isArray(raw.wangsets))
      metadata.terrainSets = importTiledTerrain(
        asset,
        raw,
      ) as unknown as JsonValue;
    const grid = assetGrid(asset, firstgid, []);
    grid.tilecount = integer(
      raw.tilecount ?? grid.columns * grid.rows,
      'tileset tile count',
      1,
      0x0fffffff,
    );
    grids.push(grid);
    return asset;
  });
  grids.sort((a, b) => a.firstgid - b.firstgid);
  for (let index = 1; index < grids.length; index++)
    if (
      (grids[index - 1]?.firstgid ?? 0) + (grids[index - 1]?.tilecount ?? 0) >
      (grids[index]?.firstgid ?? 0)
    )
      throw new Error(
        'Tiled tileset GID ranges must be unique and non-overlapping.',
      );
  const regionFor = (grid: AssetGrid, localId: number): TileRegion => {
    const rawTileset = record(
        (map.tilesets as unknown[]).find(
          (value) => record(value, 'tileset').firstgid === grid.firstgid,
        ),
        'tileset',
      ),
      definition = Array.isArray(rawTileset.tiles)
        ? (rawTileset.tiles as unknown[])
            .map((value) => record(value, 'tile definition'))
            .find((tile) => tile.id === localId)
        : undefined;
    if (
      definition &&
      [definition.x, definition.y, definition.width, definition.height].every(
        Number.isSafeInteger,
      )
    )
      return {
        assetId: grid.asset.id,
        x: Number(definition.x),
        y: Number(definition.y),
        width: Number(definition.width),
        height: Number(definition.height),
      };
    if (localId >= grid.columns * grid.rows)
      throw new Error(`Invalid local tile ID ${localId}.`);
    return {
      assetId: grid.asset.id,
      x:
        grid.margin +
        (localId % grid.columns) * (grid.tileWidth + grid.spacing),
      y:
        grid.margin +
        Math.floor(localId / grid.columns) * (grid.tileHeight + grid.spacing),
      width: grid.tileWidth,
      height: grid.tileHeight,
    };
  };
  const layers: SceneLayerDefinition[] = [];
  const entities: EntityDefinition[] = [];
  const layerIds = new Set<string>();
  const entityIds = new Set<string>();
  let rawLayerCount = 0;
  let rawObjectCount = 0;
  const uniqueLayerId = (requested: string, fallback: string) => {
    let id = requested || fallback,
      suffix = 2;
    while (layerIds.has(id)) id = `${requested || fallback}-${suffix++}`;
    layerIds.add(id);
    return id;
  };
  const importTileLayer = (
    raw: Record<string, unknown>,
    layer: SceneLayerDefinition,
  ) => {
    if (!Array.isArray(raw.data))
      throw new Error(
        `Tile layer “${String(raw.name ?? layer.name)}” must use a JSON data array.`,
      );
    const width = integer(raw.width, 'layer width', 1, 8192),
      height = integer(raw.height, 'layer height', 1, 8192);
    if (
      width !== columns ||
      height !== rows ||
      raw.data.length !== width * height
    )
      throw new Error(
        `Tile layer “${String(raw.name ?? layer.name)}” has invalid dimensions.`,
      );
    const cells: Record<string, TileRegion> = {};
    raw.data.forEach((value, position) => {
      const gid = integer(value, 'tile GID', 0, 0xffffffff);
      if (!gid) return;
      const base = (gid & ~FLAGS) >>> 0,
        grid = [...grids]
          .reverse()
          .find((candidate) => candidate.firstgid <= base);
      if (!grid || base >= grid.firstgid + grid.tilecount)
        throw new Error(`Unknown Tiled tile GID ${base}.`);
      const tile = regionFor(grid, base - grid.firstgid);
      cells[`${position % width},${Math.floor(position / width)}`] = {
        ...tile,
        ...decodeTransform(gid),
      };
    });
    layer.tilemap = { tileSize: gridSize, cells };
  };
  const importObjects = (
    raw: Record<string, unknown>,
    layer: SceneLayerDefinition,
  ) => {
    if (!Array.isArray(raw.objects))
      throw new Error('Invalid Tiled object layer.');
    rawObjectCount += raw.objects.length;
    if (rawObjectCount > 65_536)
      throw new Error('Tiled maps can contain up to 65,536 objects.');
    for (const [index, object] of raw.objects.entries()) {
      const entity = importObject(object, layer.id, index, gridSize),
        baseId = entity.id;
      let suffix = 2;
      while (entityIds.has(entity.id)) entity.id = `${baseId}-${suffix++}`;
      entityIds.add(entity.id);
      entities.push(entity);
    }
  };
  const importLayerList = (values: unknown[], parentId?: string): void => {
    rawLayerCount += values.length;
    if (rawLayerCount > 4_096)
      throw new Error('Tiled maps can contain up to 4,096 layers.');
    values.forEach((value, index) => {
      const raw = record(value, 'layer'),
        savedLayer = parseSaved<SavedLayer>(
          property(raw.properties, `${PREFIX}Layer`),
          'layer metadata',
        ),
        type = String(raw.type ?? ''),
        kind =
          savedLayer?.kind === 'tiles'
            ? undefined
            : (savedLayer?.kind ??
              (type === 'group'
                ? 'group'
                : type === 'objectgroup'
                  ? 'objects'
                  : undefined)),
        id = uniqueLayerId(
          typeof savedLayer?.id === 'string' ? savedLayer.id : '',
          `layer-${integer(raw.id ?? index + 1, 'layer ID', 1)}`,
        ),
        purpose = (
          ['background', 'gameplay', 'collision', 'foreground', 'ui'].includes(
            String(savedLayer?.purpose),
          )
            ? savedLayer?.purpose
            : 'gameplay'
        ) as LayerPurpose,
        layer: SceneLayerDefinition = {
          id,
          name:
            typeof raw.name === 'string' && raw.name.trim()
              ? raw.name.replace(/ · (Tiles|Objects)$/, '')
              : `Layer ${layers.length + 1}`,
          order: index * 100,
          purpose,
          visible: raw.visible !== false,
          locked: raw.locked === true,
          ...(finite(raw.opacity, 1) !== 1
            ? { opacity: finite(raw.opacity, 1) }
            : {}),
          ...(finite(raw.offsetx) ? { offsetX: finite(raw.offsetx) } : {}),
          ...(finite(raw.offsety) ? { offsetY: finite(raw.offsety) } : {}),
          ...(kind ? { kind } : {}),
          ...(parentId ? { parentId } : {}),
          ...(savedLayer?.tileCollision
            ? { tileCollision: savedLayer.tileCollision }
            : {}),
        };
      layers.push(layer);
      if (type === 'group') {
        if (!Array.isArray(raw.layers))
          throw new Error('Invalid Tiled group layer.');
        const synthetic = raw.layers.map((child) => record(child, 'layer'));
        if (savedLayer && savedLayer.kind !== 'group') {
          for (const child of synthetic) {
            if (child.type === 'tilelayer') importTileLayer(child, layer);
            else if (child.type === 'objectgroup') importObjects(child, layer);
          }
        } else importLayerList(raw.layers, layer.id);
      } else if (type === 'tilelayer') importTileLayer(raw, layer);
      else if (type === 'objectgroup') importObjects(raw, layer);
      else throw new Error(`Unsupported Tiled layer type “${type}”.`);
    });
  };
  if (!Array.isArray(map.layers) || map.layers.length === 0)
    throw new Error('Tiled map must contain at least one layer.');
  importLayerList(map.layers);
  if (!layers.some((layer) => layer.kind !== 'group'))
    throw new Error('Tiled map must contain a tile or object layer.');
  const projectId = String(
      property(map.properties, `${PREFIX}ProjectId`) ?? 'tiled-project',
    ),
    projectName = String(
      property(map.properties, `${PREFIX}ProjectName`) ?? 'Imported Tiled map',
    ),
    sceneId = String(
      property(map.properties, `${PREFIX}SceneId`) ?? 'scene-main',
    ),
    sceneName = String(
      property(map.properties, `${PREFIX}SceneName`) ?? 'Tiled map',
    ),
    physics =
      parseSaved<SceneEditorSettings['physics']>(
        property(map.properties, `${PREFIX}Physics`),
        'physics data',
      ) ?? createPhysicsWorld(sceneId),
    extras =
      parseSaved<AssetDefinition[]>(
        property(map.properties, `${PREFIX}ExtraAssets`),
        'extra assets',
      ) ?? [],
    pixelWidth = Number(
      property(map.properties, `${PREFIX}PixelWidth`) ?? columns * gridSize,
    ),
    pixelHeight = Number(
      property(map.properties, `${PREFIX}PixelHeight`) ?? rows * gridSize,
    );
  if (
    ![pixelWidth, pixelHeight].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  )
    throw new Error('Invalid saved map pixel size.');
  const active = String(
    property(map.properties, `${PREFIX}ActiveLayerId`) ??
      layers.find((layer) => layer.kind !== 'group')?.id,
  );
  const document: ProjectDocumentV1 = {
    schemaVersion: 1,
    project: { id: projectId, name: projectName },
    assets: [...assets, ...extras],
    scenes: [{ id: sceneId, name: sceneName, entities }],
    extensions: {
      [LEVEL_EDITOR_EXTENSION]: {
        version: LEVEL_EDITOR_VERSION,
        activeSceneId: sceneId,
        scenes: {
          [sceneId]: {
            activeLayerId: layers.some((layer) => layer.id === active)
              ? active
              : layers.find((layer) => layer.kind !== 'group')?.id,
            background:
              typeof map.backgroundcolor === 'string' &&
              /^#[0-9a-f]{6}$/i.test(map.backgroundcolor)
                ? map.backgroundcolor
                : typeof map.backgroundcolor === 'string' &&
                    /^#[0-9a-f]{8}$/i.test(map.backgroundcolor)
                  ? `#${map.backgroundcolor.slice(3)}`
                  : '#0b1320',
            gridSize,
            width: pixelWidth,
            height: pixelHeight,
            layers,
            physics,
          },
        },
      } as unknown as JsonObject,
    },
  };
  return parseLevelProject(document);
}

export type { ImportedImage };
