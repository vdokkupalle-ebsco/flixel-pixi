import { describe, expect, it } from 'vitest';
import { serializeProjectDocument } from '@flixel-pixi/schemas';
import { LevelEditorStore } from '../src/editor-store';
import {
  activeLayer,
  activeSceneSettings,
  createInitialProject,
  parseLevelProject,
  type SceneLayerDefinition,
} from '../src/model';
import {
  DEFAULT_TILE_COLLISION,
  layerTileColliders,
  mergeTileCollisions,
  sceneTileColliders,
  type CollisionRectangle,
} from '../src/tile-collision';
import {
  tileCollisionControls,
  updateTileCollision,
} from '../src/tile-collision-controls';
import { starterTileset, type TileMap } from '../src/tiles';

const tile = { assetId: 'tiles-starter', x: 0, y: 0, width: 32, height: 32 };
const map = (keys: string[], size = 16): TileMap => ({
  tileSize: size,
  cells: Object.fromEntries(keys.map((key) => [key, { ...tile }])),
});
const bounds = { columns: 10, rows: 10 };
const layer = (keys: string[]): SceneLayerDefinition => ({
  id: 'ground',
  name: 'Ground',
  purpose: 'gameplay',
  order: 0,
  visible: true,
  locked: false,
  tileCollision: { ...DEFAULT_TILE_COLLISION, enabled: true },
  tilemap: map(keys),
});
const store = () => {
  const document = createInitialProject();
  document.assets.push(starterTileset());
  return new LevelEditorStore({
    document,
    selectedEntityIds: [],
    snapToGrid: true,
    tool: 'brush',
  });
};

function coveredCells(
  rectangles: CollisionRectangle[],
  size: number,
): string[] {
  const cells: string[] = [];
  for (const rect of rectangles)
    for (let y = rect.y; y < rect.y + rect.height; y += size)
      for (let x = rect.x; x < rect.x + rect.width; x += size)
        cells.push(`${x / size},${y / size}`);
  return cells.sort();
}

describe('tile collider generation', () => {
  it('merges a rectangular floor into one correctly positioned collider', () => {
    expect(
      mergeTileCollisions(
        map(['2,3', '3,3', '4,3', '2,4', '3,4', '4,4']),
        bounds,
      ),
    ).toEqual([{ x: 32, y: 48, width: 48, height: 32 }]);
  });
  it('covers occupied cells exactly for all 3 × 3 arrangements, preserving holes', () => {
    const keys = Array.from(
      { length: 9 },
      (_, index) => `${index % 3},${Math.floor(index / 3)}`,
    );
    for (let mask = 0; mask < 512; mask++) {
      const filled = keys.filter((_, index) => mask & (1 << index));
      const rectangles = mergeTileCollisions(map(filled), bounds);
      expect(coveredCells(rectangles, 16)).toEqual([...filled].sort());
      expect(mergeTileCollisions(map([...filled].reverse()), bounds)).toEqual(
        rectangles,
      );
    }
  });
  it('clips partial edge cells, retains sparse behavior, and ignores artwork transforms', () => {
    const source = map(['0,0', '1,0', '8,8', '999999,999999'], 32);
    const first = source.cells['0,0'];
    if (first) {
      first.flipX = true;
      first.rotation = 1;
    }
    expect(
      layerTileColliders(
        { ...layer([]), tilemap: source },
        { width: 63, height: 63 },
      ),
    ).toMatchObject([{ x: 0, y: 0, width: 32, height: 32 }]);
    expect(
      mergeTileCollisions(source, { columns: 1000000, rows: 1000000 }),
    ).toHaveLength(3);
    expect(source.cells['999999,999999']).toBeDefined();
  });
  it('requires opt-in and visibility, while locked layers keep their collisions', () => {
    const ground = layer(['1,1']);
    const settings = { width: 160, height: 160 };
    const disabled = { ...ground };
    delete disabled.tileCollision;
    expect(layerTileColliders(disabled, settings)).toEqual([]);
    expect(layerTileColliders({ ...ground, visible: false }, settings)).toEqual(
      [],
    );
    expect(
      layerTileColliders({ ...ground, locked: true }, settings),
    ).toHaveLength(1);
    expect(
      layerTileColliders(
        { ...ground, tileCollision: { ...DEFAULT_TILE_COLLISION } },
        settings,
      ),
    ).toEqual([]);
  });
});

describe('tile collision settings', () => {
  it('enables and tunes collisions with undo, deterministic save/load, and no generated entities', () => {
    const editor = store();
    editor.update('Paint floor', (draft) => {
      activeLayer(draft).tilemap = map(['1,4', '2,4']);
    });
    updateTileCollision(editor, 'enabled', true);
    updateTileCollision(editor, 'friction', '0.75');
    updateTileCollision(editor, 'restitution', '0.2');
    const document = editor.status.snapshot.document;
    const loaded = parseLevelProject(
      JSON.parse(serializeProjectDocument(document)),
    );
    const snapshot = { ...editor.status.snapshot, document: loaded };
    expect(sceneTileColliders(activeSceneSettings(snapshot))).toMatchObject([
      { width: 32, height: 16, friction: 0.75, restitution: 0.2 },
    ]);
    expect(loaded.scenes[0]?.entities).toEqual([]);
    expect(activeSceneSettings(snapshot).physics.bodies).toEqual([]);
    editor.undo();
    expect(activeLayer(editor.status.snapshot).tileCollision?.restitution).toBe(
      0,
    );
    editor.redo();
    expect(activeLayer(editor.status.snapshot).tileCollision?.restitution).toBe(
      0.2,
    );
    updateTileCollision(editor, 'enabled', false);
    expect(
      sceneTileColliders(activeSceneSettings(editor.status.snapshot)),
    ).toEqual([]);
    editor.undo();
    expect(
      sceneTileColliders(activeSceneSettings(editor.status.snapshot)),
    ).toHaveLength(1);
  });
  it.each(['', 'oops', '-1', '1.1', 'Infinity'])(
    'rejects invalid material input %s without history changes',
    (value) => {
      const editor = store();
      expect(() => updateTileCollision(editor, 'friction', value)).toThrow(
        'between 0 and 1',
      );
      expect(editor.status.canUndo).toBe(false);
    },
  );
  it('blocks edits to locked layers and renders disabled controls', () => {
    const editor = store();
    editor.update(
      'Lock',
      (draft) => {
        activeLayer(draft).locked = true;
      },
      false,
    );
    expect(() => updateTileCollision(editor, 'enabled', true)).toThrow(
      'Unlock',
    );
    const host = document.createElement('div');
    host.innerHTML = tileCollisionControls(
      activeLayer(editor.status.snapshot),
      activeSceneSettings(editor.status.snapshot),
    );
    expect(
      host.querySelector<HTMLInputElement>('[data-tile-collision="enabled"]')
        ?.disabled,
    ).toBe(true);
  });
  it('shows merged counts and hidden-layer status in the controls', () => {
    const editor = store();
    editor.update('Paint', (draft) => {
      activeLayer(draft).tilemap = map(['1,1', '2,1']);
    });
    updateTileCollision(editor, 'enabled', true);
    expect(
      tileCollisionControls(
        activeLayer(editor.status.snapshot),
        activeSceneSettings(editor.status.snapshot),
      ),
    ).toContain('1 merged collider in Preview');
    editor.update('Hide', (draft) => {
      activeLayer(draft).visible = false;
    });
    expect(
      tileCollisionControls(
        activeLayer(editor.status.snapshot),
        activeSceneSettings(editor.status.snapshot),
      ),
    ).toContain('Hidden layer: collision is inactive');
  });
  it.each([
    null,
    [],
    {},
    { enabled: 'yes', friction: 0.4, restitution: 0 },
    { enabled: true, friction: -1, restitution: 0 },
    { enabled: true, friction: 0.4, restitution: 2 },
  ])('rejects malformed saved collision settings', (value) => {
    const editor = store();
    const snapshot = editor.status.snapshot;
    Object.assign(activeLayer(snapshot), { tileCollision: value });
    expect(() => parseLevelProject(snapshot.document)).toThrow(
      'Invalid tile collision settings',
    );
  });
  it('keeps older projects non-colliding until enabled', () => {
    const editor = store();
    expect(() =>
      parseLevelProject(editor.status.snapshot.document),
    ).not.toThrow();
    expect(
      sceneTileColliders(activeSceneSettings(editor.status.snapshot)),
    ).toEqual([]);
  });
});
