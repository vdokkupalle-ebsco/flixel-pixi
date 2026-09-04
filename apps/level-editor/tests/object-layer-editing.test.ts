import { expect, it } from 'vitest';
import { LevelEditorStore } from '../src/editor-store';
import {
  activeScene,
  createInitialProject,
  entityProperties,
  sceneLayers,
  parseLevelProject,
} from '../src/model';
import { addGameplayObject } from '../src/gameplay-objects';
import { createLayerGroup, moveLayerToGroup } from '../src/layer-editing';
import {
  canMoveObjectToLayer,
  objectsInLayer,
  stepObjectOrder,
  reorderObject,
  moveObjectToLayer,
} from '../src/object-layer-editing';

function setup() {
  const store = new LevelEditorStore({
    document: createInitialProject(),
    selectedEntityIds: [],
    tool: 'select',
    snapToGrid: true,
  });
  addGameplayObject(store, 'spawn-point');
  return {
    store,
    id: required(activeScene(store.status.snapshot).entities[0]).id,
  };
}
it('moves membership without changing geometry or metadata, round trips and undoes atomically', () => {
  const { store, id } = setup();
  const before = store.status.snapshot;
  const original = required(activeScene(before).entities[0]);
  expect(moveObjectToLayer(store, id, 'layer-background')).toBe(true);
  const after = store.status.snapshot;
  expect(activeScene(after).entities[0]).toEqual({
    ...original,
    properties: { ...original.properties, layerId: 'layer-background' },
  });
  expect(after.selectedEntityIds).toEqual([id]);
  expect(parseLevelProject(JSON.parse(JSON.stringify(after.document)))).toEqual(
    after.document,
  );
  store.undo();
  expect(store.status.snapshot).toEqual(before);
  store.redo();
  expect(store.status.snapshot).toEqual(after);
  const revision = store.status.revision;
  expect(moveObjectToLayer(store, id, 'layer-background')).toBe(false);
  expect(moveObjectToLayer(store, id, 'missing')).toBe(false);
  expect(moveObjectToLayer(store, 'missing', 'layer-gameplay')).toBe(false);
  expect(store.status.revision).toBe(revision);
});
it('rejects groups and locked objects, source layers and destination ancestors', () => {
  const { store, id } = setup();
  const group = createLayerGroup(store);
  expect(canMoveObjectToLayer(store.status.snapshot, id, group)).toBe(false);
  moveLayerToGroup(store, 'layer-background', group);
  store.update('Lock group', (draft) => {
    required(sceneLayers(draft).find((l) => l.id === group)).locked = true;
  });
  expect(moveObjectToLayer(store, id, 'layer-background')).toBe(false);
  store.update('Lock object', (draft) => {
    entityProperties(required(activeScene(draft).entities[0])).locked = true;
  });
  expect(moveObjectToLayer(store, id, 'layer-gameplay')).toBe(false);
  store.undo();
  store.update('Lock source', (draft) => {
    const source = String(
      entityProperties(required(activeScene(draft).entities[0])).layerId,
    );
    required(sceneLayers(draft).find((l) => l.id === source)).locked = true;
  });
  expect(moveObjectToLayer(store, id, 'layer-gameplay')).toBe(false);
});

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing test fixture');
  return value;
}

it('moves exactly one slot for ties and sparse order values and preserves undo', () => {
  const { store, id } = setup();
  store.update('Objects', (draft) => {
    const source = required(activeScene(draft).entities[0]);
    activeScene(draft).entities.push(
      { ...structuredClone(source), id: 'second' },
      { ...structuredClone(source), id: 'third' },
    );
    entityProperties(source).zIndex = 100;
  });
  const before = store.status.snapshot;
  const layerId = String(
    required(activeScene(before).entities[0]).properties?.layerId,
  );
  const order = () =>
    objectsInLayer(store.status.snapshot, layerId).map((e) => e.id);
  expect(order()).toEqual([id, 'third', 'second']);
  expect(stepObjectOrder(store, id, -1)).toBe(true);
  expect(order()).toEqual(['third', id, 'second']);
  expect(stepObjectOrder(store, id, 1)).toBe(true);
  expect(order()).toEqual([id, 'third', 'second']);
  expect(stepObjectOrder(store, id, 1)).toBe(false);
  expect(reorderObject(store, id, 'second', 'after')).toBe(true);
  expect(order()).toEqual(['third', 'second', id]);
  store.undo();
  store.undo();
  store.undo();
  expect(store.status.snapshot).toEqual(before);
});
