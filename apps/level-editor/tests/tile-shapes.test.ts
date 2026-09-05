import { describe, expect, it, afterEach, vi } from 'vitest';
import {
  activeLayer,
  createInitialProject,
  parseLevelProject,
} from '../src/model';
import { LevelEditorStore } from '../src/editor-store';
import { starterTileset, type TileRegion } from '../src/tiles';
import {
  setTileShapes,
  validateShapes,
  validateTileShapes,
  transformedShape,
  type TileShape,
} from '../src/tile-shapes';
import { layerTileColliders } from '../src/tile-collision';
import { openTileShapeEditor } from '../src/tile-shape-editor';
import { FlxObject, FlxPhysicsWorld, FlxState } from 'flixel-pixi';
import { createPlanckPhysicsBackend } from '@flixel-pixi/physics-planck';
import { addTileCollisionBodies } from '../src/tile-collision-runtime';

const tile: TileRegion = {
  assetId: 'source',
  x: 0,
  y: 0,
  width: 16,
  height: 32,
};
const slope: TileShape = {
  kind: 'polygon',
  points: [
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ],
};
const half: TileShape = {
  kind: 'rectangle',
  x: 0,
  y: 0.5,
  width: 1,
  height: 0.5,
};
const asset = () => ({ ...starterTileset(), id: 'source' });
afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

it('validates convex shapes and rejects degenerate, concave, crossed and malformed polygons', () => {
  expect(() => validateShapes([half, slope])).not.toThrow();
  for (const points of [
    [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: 1, y: 0 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0.5, y: 0.2 },
      { x: 0, y: 1 },
    ],
    [
      { x: 0, y: 0 },
      { x: 0.5, y: 0 },
      { x: 1, y: 0 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 2 },
    ],
  ])
    expect(() => validateShapes([{ kind: 'polygon', points }])).toThrow();
  for (const value of [
    null,
    [{ kind: 'circle' }],
    [{ ...half, width: 0 }],
    [{ kind: 'polygon', points: null }],
    Array(17).fill(half),
  ])
    expect(() => validateShapes(value)).toThrow();
});

it('transforms every flip/rotation without changing shape area or leaving the cell', () => {
  for (const rotation of [0, 1, 2, 3] as const)
    for (const flipX of [false, true]) {
      const points = transformedShape(
        slope,
        { ...tile, rotation, flipX },
        32,
        64,
        96,
      );
      expect(
        points.every((p) => p.x >= 64 && p.x <= 96 && p.y >= 96 && p.y <= 128),
      ).toBe(true);
      const area = Math.abs(
        points.reduce((sum, p, i) => {
          const q = points[(i + 1) % points.length];
          if (!q) throw new Error('Missing vertex');
          return sum + p.x * q.y - q.x * p.y;
        }, 0) / 2,
      );
      expect(area).toBe(512);
    }
  expect(
    transformedShape(slope, { ...tile, flipX: true, rotation: 1 }, 16, 0, 0),
  ).toEqual([
    { x: 0, y: 16 },
    { x: 16, y: 0 },
    { x: 0, y: 0 },
  ]);
});

it('overrides only the exact source region, preserves fallback merging and skips explicit empty shapes', () => {
  const source = asset();
  setTileShapes(source, tile, [half]);
  const empty = { ...tile, x: 16 };
  setTileShapes(source, empty, []);
  const other = { ...tile, x: 32 };
  const layer = {
    id: 'ground',
    order: 0,
    name: 'Ground',
    purpose: 'gameplay' as const,
    visible: true,
    locked: false,
    tileCollision: { enabled: true, friction: 0.4, restitution: 0 },
    tilemap: {
      tileSize: 32,
      cells: { '0,0': tile, '1,0': empty, '2,0': other, '3,0': other },
    },
  };
  const colliders = layerTileColliders(
    layer,
    { width: 128, height: 64 },
    layer.tilemap,
    [source],
  );
  expect(colliders).toHaveLength(2);
  expect(colliders[0]).toMatchObject({ x: 64, y: 0, width: 64, height: 32 });
  expect(colliders[1]).toMatchObject({ x: 0, y: 16, width: 32, height: 16 });
  setTileShapes(source, tile, undefined);
  expect(
    layerTileColliders(layer, { width: 128, height: 64 }, layer.tilemap, [
      source,
    ]),
  ).toHaveLength(2);
  expect(() => validateTileShapes([source])).not.toThrow();
});

it('rejects malformed shape metadata during project loading', () => {
  const doc = createInitialProject();
  const source = asset();
  doc.assets.push(source);
  (source.metadata ??= {}).tileCollisionShapes = [
    {
      x: 0,
      y: 0,
      width: 16,
      height: 16,
      shapes: [{ kind: 'polygon', points: [] }],
    },
  ];
  expect(() => parseLevelProject(doc)).toThrow();
});

it('creates real partial tile bodies: one object lands while a neighboring object falls through', () => {
  const source = asset();
  setTileShapes(source, tile, [half]);
  setTileShapes(source, { ...tile, x: 16 }, []);
  const layer = {
    id: 'ground',
    order: 0,
    name: 'Ground',
    purpose: 'gameplay' as const,
    visible: true,
    locked: false,
    tileCollision: { enabled: true, friction: 0.8, restitution: 0 },
    tilemap: {
      tileSize: 64,
      cells: { '0,2': tile, '1,2': { ...tile, x: 16 } },
    },
  };
  const world = new FlxPhysicsWorld(createPlanckPhysicsBackend(), {
    gravity: { x: 0, y: 900 },
  });
  const state = new FlxState();
  state.setPhysicsWorld(world);
  try {
    const colliders = layerTileColliders(
      layer,
      { width: 256, height: 256 },
      layer.tilemap,
      [source],
    );
    for (const object of addTileCollisionBodies(world, colliders))
      state.add(object);
    const landed = new FlxObject(24, 0, 16, 16),
      falling = new FlxObject(88, 0, 16, 16);
    for (const object of [landed, falling]) {
      state.add(object);
      world.addBody(object, {
        type: 'dynamic',
        fixedRotation: true,
        shapes: [{ kind: 'box', width: 16, height: 16 }],
      });
    }
    for (let i = 0; i < 120; i++) world.step(1 / 60);
    expect(landed.y + 16).toBeGreaterThan(157);
    expect(landed.y + 16).toBeLessThan(161);
    expect(falling.y).toBeGreaterThan(400);
  } finally {
    state.destroy();
  }
  expect(world.bodyCount).toBe(0);
});

describe('collision shape editor', () => {
  function setup() {
    const doc = createInitialProject();
    doc.assets.push(asset());
    const store = new LevelEditorStore({
      document: doc,
      selectedEntityIds: [],
      snapToGrid: true,
      tool: 'brush',
    });
    openTileShapeEditor(store, tile);
    const click = (selector: string) =>
      document.querySelector<HTMLButtonElement>(selector)?.click();
    return { store, click };
  }
  it('applies a shape draft as one undoable edit and preserves it in serialized project metadata', () => {
    const { store, click } = setup();
    click('[data-preset="up"]');
    expect(store.status.canUndo).toBe(false);
    click('[data-apply]');
    const saved = JSON.parse(JSON.stringify(store.status.snapshot.document));
    expect(
      saved.assets.find((a: { id: string }) => a.id === 'source').metadata
        .tileCollisionShapes[0].shapes,
    ).toEqual([slope]);
    expect(() => parseLevelProject(saved)).not.toThrow();
    store.undo();
    expect(
      store.status.snapshot.document.assets.at(-1)?.metadata
        ?.tileCollisionShapes,
    ).toBeUndefined();
    store.redo();
    expect(
      store.status.snapshot.document.assets.at(-1)?.metadata
        ?.tileCollisionShapes,
    ).toBeDefined();
    expect(activeLayer(store.status.snapshot).tileCollision).toBeUndefined();
  });
  it('discards Cancel, saves explicit empty collision, and restores the layer default', () => {
    const { store, click } = setup();
    click('[data-preset="half"]');
    click('[data-close]');
    expect(store.status.canUndo).toBe(false);
    openTileShapeEditor(store, tile);
    click('[data-empty]');
    click('[data-apply]');
    expect(
      store.status.snapshot.document.assets.at(-1)?.metadata
        ?.tileCollisionShapes,
    ).toMatchObject([{ shapes: [] }]);
    openTileShapeEditor(store, tile);
    click('[data-default]');
    click('[data-apply]');
    expect(
      store.status.snapshot.document.assets.at(-1)?.metadata
        ?.tileCollisionShapes,
    ).toEqual([]);
  });
  it('rejects invalid numeric edits without saving corrupt geometry', () => {
    const { store, click } = setup();
    click('[data-preset="half"]');
    const input = document.querySelector<HTMLInputElement>(
      '[data-field="width"]',
    );
    if (!input) throw new Error('Missing width field');
    input.value = '-1';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      'positive',
    );
    click('[data-apply]');
    expect(
      store.status.snapshot.document.assets.at(-1)?.metadata
        ?.tileCollisionShapes,
    ).toMatchObject([{ shapes: [half] }]);
  });
});

it('uses the sloped surface in Planck instead of its bounding box', () => {
  const source = asset();
  setTileShapes(source, tile, [slope]);
  const layer = {
    id: 'slope',
    order: 0,
    name: 'Slope',
    purpose: 'gameplay' as const,
    visible: true,
    locked: false,
    tileCollision: { enabled: true, friction: 0.4, restitution: 0 },
    tilemap: { tileSize: 128, cells: { '0,1': tile } },
  };
  const world = new FlxPhysicsWorld(createPlanckPhysicsBackend(), {
    gravity: { x: 0, y: 900 },
  });
  const state = new FlxState();
  state.setPhysicsWorld(world);
  try {
    for (const object of addTileCollisionBodies(
      world,
      layerTileColliders(layer, { width: 256, height: 256 }, layer.tilemap, [
        source,
      ]),
    ))
      state.add(object);
    const object = new FlxObject(48, 0, 16, 16);
    state.add(object);
    world.addBody(object, {
      type: 'dynamic',
      fixedRotation: true,
      shapes: [{ kind: 'box', width: 16, height: 16 }],
    });
    for (let i = 0; i < 45; i++) world.step(1 / 60);
    expect(object.y + 16).toBeGreaterThan(180);
    expect(object.y + 16).toBeLessThan(255);
    expect(object.x).toBeLessThan(48);
  } finally {
    state.destroy();
  }
});

it('draws pixel-snapped rectangles and polygons and cancels interrupted drags', () => {
  const doc = createInitialProject();
  doc.assets.push(asset());
  const store = new LevelEditorStore({
    document: doc,
    selectedEntityIds: [],
    snapToGrid: true,
    tool: 'brush',
  });
  openTileShapeEditor(store, tile);
  const svg = document.querySelector('svg');
  if (!svg) throw new Error('Missing drawing surface');
  vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 160, 320),
  );
  svg.setPointerCapture = vi.fn();
  svg.hasPointerCapture = () => true;
  svg.releasePointerCapture = vi.fn();
  const pointer = (type: string, x: number, y: number) =>
    svg.dispatchEvent(
      new PointerEvent(type, {
        button: 0,
        pointerId: 1,
        clientX: x,
        clientY: y,
      }),
    );
  pointer('pointerdown', 0, 160);
  pointer('pointermove', 160, 320);
  pointer('pointerup', 160, 320);
  pointer('pointerdown', 0, 0);
  pointer('pointermove', 80, 80);
  pointer('pointercancel', 80, 80);
  document.querySelector<HTMLButtonElement>('[data-tool="polygon"]')?.click();
  pointer('pointerdown', 0, 320);
  pointer('pointerdown', 160, 0);
  pointer('pointerdown', 160, 320);
  document.querySelector<HTMLButtonElement>('[data-finish]')?.click();
  expect(store.status.canUndo).toBe(false);
  document.querySelector<HTMLButtonElement>('[data-apply]')?.click();
  expect(
    store.status.snapshot.document.assets.at(-1)?.metadata?.tileCollisionShapes,
  ).toMatchObject([{ shapes: [half, slope] }]);
});
