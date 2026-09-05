import type { AssetDefinition } from '@flixel-pixi/schemas';
import type { TileRegion } from './tiles';

export interface ShapePoint {
  x: number;
  y: number;
}
/** Coordinates are normalized to the source tile, independent of map cell size. */
export type TileShape =
  | { kind: 'rectangle'; x: number; y: number; width: number; height: number }
  | { kind: 'polygon'; points: ShapePoint[] };
export interface TileShapeEntry {
  x: number;
  y: number;
  width: number;
  height: number;
  shapes: TileShape[];
}

export function shapePoints(shape: TileShape): ShapePoint[] {
  if (shape.kind === 'polygon') return shape.points;
  const { x, y, width, height } = shape;
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
}

export function validateShapes(value: unknown): asserts value is TileShape[] {
  if (!Array.isArray(value) || value.length > 16)
    throw new Error('Use up to 16 collision shapes per tile.');
  for (const shape of value) {
    if (!shape || !['rectangle', 'polygon'].includes(shape.kind))
      throw new Error('Choose a rectangle or polygon collision shape.');
    if (
      shape.kind === 'rectangle' &&
      (!Number.isFinite(shape.width) ||
        !Number.isFinite(shape.height) ||
        shape.width <= 0 ||
        shape.height <= 0)
    )
      throw new Error('Rectangles must have positive width and height.');
    const points = shapePoints(shape);
    if (
      !Array.isArray(points) ||
      points.length < 3 ||
      points.length > 8 ||
      points.some(
        (p) =>
          !p ||
          !Number.isFinite(p.x) ||
          !Number.isFinite(p.y) ||
          p.x < 0 ||
          p.y < 0 ||
          p.x > 1 ||
          p.y > 1,
      )
    )
      throw new Error('Use 3–8 vertices inside the tile.');
    // Every other vertex must lie strictly on the same side of every edge.
    // This rejects concavity, crossed edges, duplicate vertices and collinearity.
    let direction = 0;
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length];
      if (!a || !b) throw new Error('Missing polygon vertex.');
      for (let j = 0; j < points.length; j++) {
        if (j === i || j === (i + 1) % points.length) continue;
        const p = points[j];
        if (!p) throw new Error('Missing polygon vertex.');
        const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
        if (
          Math.abs(cross) < 1e-8 ||
          (direction && Math.sign(cross) !== direction)
        )
          throw new Error(
            'Polygons must be convex, with no crossed edges or collinear vertices. Use multiple shapes for concave areas.',
          );
        direction = Math.sign(cross);
      }
    }
  }
}

export function tileShapeEntries(asset: AssetDefinition): TileShapeEntry[] {
  return (asset.metadata?.tileCollisionShapes ??
    []) as unknown as TileShapeEntry[];
}
export function sourceShapeEntry(
  asset: AssetDefinition | undefined,
  tile: TileRegion,
): TileShapeEntry | undefined {
  return (
    asset &&
    tileShapeEntries(asset).find(
      (e) =>
        e.x === tile.x &&
        e.y === tile.y &&
        e.width === tile.width &&
        e.height === tile.height,
    )
  );
}
export function setTileShapes(
  asset: AssetDefinition,
  tile: TileRegion,
  shapes: TileShape[] | undefined,
): void {
  if (shapes) validateShapes(shapes);
  const entries = tileShapeEntries(asset).filter(
    (e) =>
      e.x !== tile.x ||
      e.y !== tile.y ||
      e.width !== tile.width ||
      e.height !== tile.height,
  );
  if (shapes !== undefined)
    entries.push({
      x: tile.x,
      y: tile.y,
      width: tile.width,
      height: tile.height,
      shapes: structuredClone(shapes),
    });
  (asset.metadata ??= {}).tileCollisionShapes = JSON.parse(
    JSON.stringify(entries),
  );
}
export function validateTileShapes(assets: readonly AssetDefinition[]): void {
  for (const asset of assets) {
    const entries: unknown = asset.metadata?.tileCollisionShapes;
    if (entries === undefined) continue;
    if (!Array.isArray(entries) || entries.length > 4096)
      throw new Error('Invalid tileset collision metadata.');
    const seen = new Set<string>();
    for (const entry of entries) {
      if (
        !entry ||
        ![entry.x, entry.y, entry.width, entry.height].every(
          Number.isSafeInteger,
        ) ||
        entry.x < 0 ||
        entry.y < 0 ||
        entry.width <= 0 ||
        entry.height <= 0
      )
        throw new Error('Invalid collision source tile region.');
      const key = `${entry.x},${entry.y},${entry.width},${entry.height}`;
      if (seen.has(key))
        throw new Error('Duplicate collision source tile region.');
      seen.add(key);
      validateShapes(entry.shapes);
    }
  }
}

/** Match the canvas transform: flip horizontally, then rotate around the cell center. */
export function transformedShape(
  shape: TileShape,
  tile: TileRegion,
  size: number,
  x: number,
  y: number,
): ShapePoint[] {
  return shapePoints(shape).map((point) => {
    let px = (point.x - 0.5) * (tile.flipX ? -1 : 1),
      py = point.y - 0.5;
    for (let i = 0; i < (tile.rotation ?? 0); i++) [px, py] = [-py, px];
    return { x: x + (px + 0.5) * size, y: y + (py + 0.5) * size };
  });
}
