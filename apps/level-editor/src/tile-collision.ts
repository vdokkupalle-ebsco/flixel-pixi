import type { SceneEditorSettings, SceneLayerDefinition } from './model';
import { inBounds, tileBounds, type TileBounds, type TileMap } from './tiles';

export interface TileCollisionSettings {
  enabled: boolean;
  friction: number;
  restitution: number;
}

export const DEFAULT_TILE_COLLISION: TileCollisionSettings = {
  enabled: false,
  friction: 0.4,
  restitution: 0,
};

export interface CollisionRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TileCollider extends CollisionRectangle {
  layerId: string;
  friction: number;
  restitution: number;
}

export function validateTileCollision(
  value: unknown,
): asserts value is TileCollisionSettings {
  const collision = value as TileCollisionSettings | null;
  if (
    !collision ||
    typeof collision !== 'object' ||
    Array.isArray(collision) ||
    typeof collision.enabled !== 'boolean' ||
    ![collision.friction, collision.restitution].every(
      (number) =>
        typeof number === 'number' &&
        Number.isFinite(number) &&
        number >= 0 &&
        number <= 1,
    )
  )
    throw new Error(
      'Invalid tile collision settings. Friction and bounce must be between 0 and 1.',
    );
}

/** Merge horizontal runs with identical runs on the next row. No empty cells are filled.
 * Work scales with occupied cells, even on very large sparse maps. Returned units are pixels.
 */
export function mergeTileCollisions(
  map: TileMap,
  bounds: TileBounds,
): CollisionRectangle[] {
  const rows = new Map<number, Set<number>>();
  for (const key of Object.keys(map.cells)) {
    const [x = 0, y = 0] = key.split(',').map(Number);
    if (!inBounds({ x, y }, bounds)) continue;
    const row = rows.get(y) ?? new Set<number>();
    row.add(x);
    rows.set(y, row);
  }
  const result: CollisionRectangle[] = [];
  let previous = new Map<string, CollisionRectangle>(),
    previousY = -2;
  for (const [y, row] of [...rows.entries()].sort(([a], [b]) => a - b)) {
    const xs = [...row].sort((a, b) => a - b);
    const next = new Map<string, CollisionRectangle>();
    if (y !== previousY + 1) previous.clear();
    for (let index = 0; index < xs.length;) {
      const x = xs[index] ?? 0;
      let width = 1;
      while (xs[index + width] === x + width) width++;
      const key = `${x},${width}`;
      const rectangle = previous.get(key) ?? { x, y, width, height: 0 };
      if (!previous.has(key)) result.push(rectangle);
      rectangle.height++;
      next.set(key, rectangle);
      index += width;
    }
    previous = next;
    previousY = y;
  }
  return result.map(({ x, y, width, height }) => ({
    x: x * map.tileSize,
    y: y * map.tileSize,
    width: width * map.tileSize,
    height: height * map.tileSize,
  }));
}

export function layerTileColliders(
  layer: SceneLayerDefinition,
  settings: Pick<SceneEditorSettings, 'width' | 'height'>,
  map = layer.tilemap,
): TileCollider[] {
  if (!layer.visible || !layer.tileCollision?.enabled || !map) return [];
  return mergeTileCollisions(
    map,
    tileBounds(settings.width, settings.height, map.tileSize),
  ).map((rectangle) => ({
    ...rectangle,
    layerId: layer.id,
    friction: layer.tileCollision?.friction ?? DEFAULT_TILE_COLLISION.friction,
    restitution:
      layer.tileCollision?.restitution ?? DEFAULT_TILE_COLLISION.restitution,
  }));
}

export function sceneTileColliders(
  settings: SceneEditorSettings,
): TileCollider[] {
  return (settings.layers ?? []).flatMap((layer) =>
    layerTileColliders(layer, settings),
  );
}
