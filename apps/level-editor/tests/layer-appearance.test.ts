import { expect, it } from 'vitest';
import { LevelEditorStore } from '../src/editor-store';
import {
  activeScene,
  activeSceneSettings,
  createInitialProject,
  createSpriteEntity,
  parseLevelProject,
  sceneLayers,
} from '../src/model';
import { effectiveLayer, validateLayerGroups } from '../src/layer-groups';
import { createLayerGroup, moveLayerToGroup } from '../src/layer-editing';
import { layerAppearanceControls, worldEntity } from '../src/layer-appearance';
import { sceneTileColliders } from '../src/tile-collision';
import { alignObjects } from '../src/object-alignment';

function setup() {
  return new LevelEditorStore({
    document: createInitialProject(),
    selectedEntityIds: [],
    tool: 'select',
    snapToGrid: true,
  });
}
function required<T>(v: T | undefined): T {
  if (v === undefined) throw new Error('Missing fixture');
  return v;
}

it('adds nested offsets, multiplies opacity, preserves local data and round-trips', () => {
  const store = setup();
  const outer = createLayerGroup(store),
    inner = createLayerGroup(store);
  moveLayerToGroup(store, inner, outer);
  moveLayerToGroup(store, 'layer-gameplay', inner);
  const before = store.status.snapshot;
  store.update('Appearance', (draft) => {
    const layers = sceneLayers(draft);
    Object.assign(required(layers.find((l) => l.id === outer)), {
      offsetX: 20,
      offsetY: -10,
      opacity: 0.5,
    });
    Object.assign(required(layers.find((l) => l.id === inner)), {
      offsetX: -5,
      offsetY: 30,
      opacity: 0.5,
    });
    Object.assign(required(layers.find((l) => l.id === 'layer-gameplay')), {
      offsetX: 10,
      offsetY: 5,
      opacity: 0.8,
    });
    activeSceneSettings(draft).activeLayerId = 'layer-gameplay';
  });
  const snapshot = store.status.snapshot,
    layers = sceneLayers(snapshot);
  const raw = required(layers.find((l) => l.id === 'layer-gameplay'));
  expect(effectiveLayer(raw, layers)).toMatchObject({
    offsetX: 25,
    offsetY: 25,
    opacity: 0.2,
  });
  expect(raw).toMatchObject({ offsetX: 10, offsetY: 5, opacity: 0.8 });
  const e = createSpriteEntity('asset-flixel-mark', 1);
  e.properties = { ...e.properties, layerId: raw.id };
  expect(worldEntity(snapshot, e).position).toEqual({
    x: e.position.x + 25,
    y: e.position.y + 25,
  });
  expect(layerAppearanceControls(snapshot)).toContain('value="80"');
  expect(
    parseLevelProject(JSON.parse(JSON.stringify(snapshot.document))),
  ).toEqual(snapshot.document);
  store.undo();
  expect(store.status.snapshot).toEqual(before);
  store.redo();
  expect(store.status.snapshot).toEqual(snapshot);
});
it('rejects invalid appearance metadata', () => {
  const layers = sceneLayers(setup().status.snapshot),
    layer = required(layers[0]);
  for (const opacity of [-1, 2, NaN, Infinity]) {
    layer.opacity = opacity;
    expect(() => validateLayerGroups(layers)).toThrow(/opacity/);
  }
  layer.opacity = 1;
  for (const offsetX of [NaN, Infinity, 1000001]) {
    layer.offsetX = offsetX;
    expect(() => validateLayerGroups(layers)).toThrow(/offsets/);
  }
});
it('offsets merged collision bodies even at zero opacity', () => {
  const store = setup();
  store.update('Collision', (draft) => {
    const layer = required(
      sceneLayers(draft).find((l) => l.id === 'layer-gameplay'),
    );
    Object.assign(layer, {
      offsetX: 30,
      offsetY: -20,
      opacity: 0,
      tileCollision: { enabled: true, friction: 0.4, restitution: 0 },
    });
    layer.tilemap = {
      tileSize: 16,
      cells: {
        '0,0': {
          assetId: 'asset-flixel-mark',
          x: 0,
          y: 0,
          width: 16,
          height: 16,
        },
      },
    };
  });
  expect(
    sceneTileColliders(activeSceneSettings(store.status.snapshot))[0],
  ).toMatchObject({ x: 30, y: -20, width: 16, height: 16 });
});
it('aligns world bounds across different layer offsets while retaining local coordinates', () => {
  const store = setup();
  store.update('Objects', (draft) => {
    const a = createSpriteEntity('asset-flixel-mark', 1),
      b = createSpriteEntity('asset-flixel-mark', 2);
    a.position = { x: 100, y: 100 };
    b.position = { x: 100, y: 100 };
    a.properties = { ...a.properties, layerId: 'layer-gameplay' };
    b.properties = { ...b.properties, layerId: 'layer-background' };
    required(
      sceneLayers(draft).find((l) => l.id === 'layer-gameplay'),
    ).offsetX = 50;
    activeScene(draft).entities = [a, b];
    draft.selectedEntityIds = [a.id, b.id];
  });
  expect(alignObjects(store, 'left')).toBe(true);
  const snapshot = store.status.snapshot;
  expect(
    activeScene(snapshot).entities.map(
      (e) => worldEntity(snapshot, e).position.x,
    ),
  ).toEqual([100, 100]);
  expect(activeScene(snapshot).entities.map((e) => e.position.x)).toEqual([
    50, 100,
  ]);
});
