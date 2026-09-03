import type { AssetDefinition, EntityDefinition } from '@flixel-pixi/schemas';

export interface TileRegion {
  assetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TileStamp {
  width: number;
  height: number;
  tiles: (TileRegion | null)[];
}

export interface TileMap {
  tileSize: number;
  cells: Record<string, TileRegion>;
}

export interface Cell {
  x: number;
  y: number;
}
export interface TileBounds {
  columns: number;
  rows: number;
}
export type TileTool = 'brush' | 'eraser' | 'fill' | 'rectangle' | 'eyedropper';
export const isTileTool = (tool: string): tool is TileTool =>
  ['brush', 'eraser', 'fill', 'rectangle', 'eyedropper'].includes(tool);
export const cellKey = ({ x, y }: Cell): string => `${x},${y}`;
export const inBounds = (cell: Cell, bounds: TileBounds): boolean =>
  cell.x >= 0 && cell.y >= 0 && cell.x < bounds.columns && cell.y < bounds.rows;

export function tileBounds(
  width: number,
  height: number,
  tileSize: number,
): TileBounds {
  return {
    columns: Math.floor(width / tileSize),
    rows: Math.floor(height / tileSize),
  };
}

export function validateTileMap(
  value: unknown,
  assets: readonly AssetDefinition[],
): asserts value is TileMap {
  const map = value as TileMap | null;
  if (
    !map ||
    !Number.isInteger(map.tileSize) ||
    map.tileSize < 1 ||
    map.tileSize > 1024 ||
    !map.cells ||
    typeof map.cells !== 'object' ||
    Array.isArray(map.cells)
  )
    throw new Error('Invalid tile layer.');
  const images = new Map(
    assets
      .filter((asset) => asset.kind === 'image')
      .map((asset) => [asset.id, asset]),
  );
  for (const [key, tile] of Object.entries(map.cells)) {
    const asset = images.get(tile?.assetId);
    if (
      !/^\d+,\d+$/.test(key) ||
      key.split(',').some((n) => !Number.isSafeInteger(Number(n))) ||
      !tile ||
      !asset ||
      ![tile.x, tile.y, tile.width, tile.height].every(Number.isSafeInteger) ||
      tile.x < 0 ||
      tile.y < 0 ||
      tile.width <= 0 ||
      tile.height <= 0 ||
      tile.x + tile.width > Number(asset.metadata?.width ?? Infinity) ||
      tile.y + tile.height > Number(asset.metadata?.height ?? Infinity)
    )
      throw new Error(`Invalid tile at ${key}.`);
  }
}

/** Bresenham interpolation keeps quick brush strokes continuous. */
export function lineCells(from: Cell, to: Cell): Cell[] {
  const cells: Cell[] = [];
  let { x, y } = from;
  const dx = Math.abs(to.x - x),
    dy = -Math.abs(to.y - y);
  const sx = x < to.x ? 1 : -1,
    sy = y < to.y ? 1 : -1;
  let error = dx + dy;
  for (;;) {
    cells.push({ x, y });
    if (x === to.x && y === to.y) break;
    const twice = 2 * error;
    if (twice >= dy) {
      error += dy;
      x += sx;
    }
    if (twice <= dx) {
      error += dx;
      y += sy;
    }
  }
  return cells;
}

export function rectangleCells(
  from: Cell,
  to: Cell,
  bounds: TileBounds,
): Cell[] {
  const cells: Cell[] = [];
  for (
    let y = Math.max(0, Math.min(from.y, to.y));
    y <= Math.min(bounds.rows - 1, Math.max(from.y, to.y));
    y++
  )
    for (
      let x = Math.max(0, Math.min(from.x, to.x));
      x <= Math.min(bounds.columns - 1, Math.max(from.x, to.x));
      x++
    )
      cells.push({ x, y });
  return cells;
}

export function sameTile(
  a: TileRegion | undefined | null,
  b: TileRegion | undefined | null,
): boolean {
  return a == null || b == null
    ? a == null && b == null
    : a.assetId === b.assetId &&
        a.x === b.x &&
        a.y === b.y &&
        a.width === b.width &&
        a.height === b.height;
}

/** Iterative, four-connected flood fill; membership is read before any edits. */
export function floodCells(
  map: TileMap,
  start: Cell,
  bounds: TileBounds,
): Cell[] {
  if (!inBounds(start, bounds)) return [];
  if (bounds.columns * bounds.rows > 262144)
    throw new Error(
      'Fill supports maps up to 262,144 cells. Increase the cell size or use the brush.',
    );
  const target = map.cells[cellKey(start)];
  const queue = [start],
    result: Cell[] = [];
  const visited = new Set<string>([cellKey(start)]);
  for (const cell of queue) {
    if (!sameTile(map.cells[cellKey(cell)], target)) continue;
    result.push(cell);
    for (const next of [
      { x: cell.x - 1, y: cell.y },
      { x: cell.x + 1, y: cell.y },
      { x: cell.x, y: cell.y - 1 },
      { x: cell.x, y: cell.y + 1 },
    ]) {
      const key = cellKey(next);
      if (inBounds(next, bounds) && !visited.has(key)) {
        visited.add(key);
        queue.push(next);
      }
    }
  }
  return result;
}

export function paintStamp(
  map: TileMap,
  stamp: TileStamp,
  at: Cell,
  bounds: TileBounds,
): void {
  for (let y = 0; y < stamp.height; y++)
    for (let x = 0; x < stamp.width; x++) {
      const cell = { x: at.x + x, y: at.y + y };
      if (!inBounds(cell, bounds)) continue;
      const tile = stamp.tiles[y * stamp.width + x];
      if (tile) map.cells[cellKey(cell)] = { ...tile };
    }
}

export function fillPattern(
  map: TileMap,
  stamp: TileStamp,
  cells: readonly Cell[],
  origin: Cell,
): void {
  for (const cell of cells) {
    const x = (((cell.x - origin.x) % stamp.width) + stamp.width) % stamp.width;
    const y =
      (((cell.y - origin.y) % stamp.height) + stamp.height) % stamp.height;
    const tile = stamp.tiles[y * stamp.width + x];
    if (tile) map.cells[cellKey(cell)] = { ...tile };
  }
}

/** Preview-only sprite descriptions; the saved project stays a compact tile grid. */
export function tileEntities(
  map: TileMap,
  layerId: string,
): EntityDefinition[] {
  return Object.entries(map.cells).map(([key, tile]) => {
    const [x = 0, y = 0] = key.split(',').map(Number);
    return {
      id: `tile-${layerId}-${key}`,
      type: 'sprite',
      position: { x: x * map.tileSize, y: y * map.tileSize },
      properties: {
        assetId: tile.assetId,
        layerId,
        frameX: tile.x,
        frameY: tile.y,
        frameWidth: tile.width,
        frameHeight: tile.height,
        width: map.tileSize,
        height: map.tileSize,
        originX: 0,
        originY: 0,
        visible: true,
        zIndex: -1,
      },
    };
  });
}

export function starterTileset(): AssetDefinition {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="32" shape-rendering="crispEdges"><path fill="#487b45" d="M0 0h32v32H0z"/><path fill="#619950" d="M2 3h4v2H2zM19 7h5v2h-5zM8 21h4v3H8zM25 25h4v2h-4z"/><path fill="#79543a" d="M32 0h32v32H32z"/><path fill="#65a454" d="M32 0h32v7H32z"/><path fill="#466f3a" d="M32 7h8v3h-8zM49 7h11v3H49z"/><path fill="#96704d" d="M37 17h5v3h-5zM54 26h6v2h-6z"/><path fill="#79543a" d="M64 0h32v32H64z"/><path fill="#96704d" d="M69 6h5v3h-5zM86 16h6v2h-6zM74 25h4v2h-4z"/><path fill="#576776" d="M96 0h32v32H96z"/><path fill="#83919b" d="M97 1h30v2H97zM97 17h30v2H97z"/><path stroke="#394653" d="M96 16h32M112 0v16M104 16v16M124 16v16"/></svg>`;
  return {
    id: 'tiles-starter',
    kind: 'image',
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    metadata: {
      fileName: 'Starter terrain',
      width: 128,
      height: 32,
      tileWidth: 32,
      tileHeight: 32,
    },
  };
}
