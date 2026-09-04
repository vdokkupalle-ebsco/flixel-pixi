import { expect, it } from 'vitest';
import { LevelEditorStore } from '../src/editor-store';
import {
  activeScene,
  createInitialProject,
  createSpriteEntity,
  entityProperties,
  sceneLayers,
} from '../src/model';
import {
  alignObjects,
  objectBounds,
  alignmentControls,
  type AlignmentAction,
} from '../src/object-alignment';
import { createLayerGroup, moveLayerToGroup } from '../src/layer-editing';

function setup() {
  const document = createInitialProject();
  const entities = [0, 1, 2].map((i) => {
    const e = createSpriteEntity('asset-flixel-mark', i + 1);
    e.id = `object-${i}`;
    e.position = { x: [50, 90, 300][i] ?? 0, y: [70, 110, 400][i] ?? 0 };
    e.properties = {
      ...e.properties,
      width: 40 + i * 20,
      height: 20 + i * 10,
      layerId: 'layer-gameplay',
      originX: i === 1 ? 0 : 0.5,
      originY: 0.5,
    };
    return e;
  });
  const store = new LevelEditorStore({
    document,
    selectedEntityIds: [],
    tool: 'select',
    snapToGrid: true,
  });
  store.update('Setup', (draft) => {
    activeScene(draft).entities = entities;
    draft.selectedEntityIds = entities.map((e) => e.id);
  });
  return store;
}
const positions = (store: LevelEditorStore) =>
  activeScene(store.status.snapshot).entities.map(objectBounds);

it.each(['left', 'center', 'right', 'top', 'middle', 'bottom'] as const)(
  'aligns %s by transformed bounds and supports one-step undo/redo',
  (action) => {
    const store = setup();
    store.update('Transform', (draft) => {
      const e = activeScene(draft).entities[1];
      if (!e) throw new Error('Missing fixture');
      e.rotation = Math.PI / 4;
      e.scale = { x: 2, y: 0.5 };
    });
    const before = store.status.snapshot;
    expect(alignObjects(store, action)).toBe(true);
    const bounds = positions(store);
    for (const bound of bounds)
      expect(bound[action]).toBeCloseTo(bounds[0]?.[action] ?? NaN);
    expect(store.status.snapshot.selectedEntityIds).toEqual(
      before.selectedEntityIds,
    );
    const after = store.status.snapshot;
    store.undo();
    expect(store.status.snapshot).toEqual(before);
    store.redo();
    expect(store.status.snapshot).toEqual(after);
    const revision = store.status.revision;
    expect(alignObjects(store, action)).toBe(false);
    expect(store.status.revision).toBe(revision);
  },
);

it.each(['horizontal', 'vertical'] as const)(
  'distributes %s centers with endpoints fixed',
  (action) => {
    const store = setup();
    const before = activeScene(store.status.snapshot).entities;
    expect(alignObjects(store, action)).toBe(true);
    const key = action === 'horizontal' ? 'center' : 'middle';
    const centers = positions(store).map((b) => b[key]);
    expect((centers[1] ?? 0) - (centers[0] ?? 0)).toBeCloseTo(
      (centers[2] ?? 0) - (centers[1] ?? 0),
    );
    const after = activeScene(store.status.snapshot).entities;
    expect(after[0]).toEqual(before[0]);
    expect(after[2]).toEqual(before[2]);
    store.undo();
    expect(activeScene(store.status.snapshot).entities).toEqual(before);
  },
);

it('rejects small selections and inherited locks without moving any object', () => {
  const store = setup();
  store.update(
    'Select two',
    (draft) => {
      draft.selectedEntityIds = ['object-0', 'object-1'];
    },
    false,
  );
  expect(alignObjects(store, 'horizontal')).toBe(false);
  const group = createLayerGroup(store);
  moveLayerToGroup(store, 'layer-gameplay', group);
  store.update('Lock group', (draft) => {
    draft.selectedEntityIds = ['object-0', 'object-1'];
    const layer = sceneLayers(draft).find((l) => l.id === group);
    if (layer) layer.locked = true;
  });
  const before = store.status.snapshot;
  expect(alignObjects(store, 'left')).toBe(false);
  expect(store.status.snapshot).toEqual(before);
  expect(alignmentControls(before)).toContain('Unlock all selected objects');
});

it('shows disabled distribution for two objects and hides controls for one', () => {
  const store = setup();
  store.update(
    'Two',
    (draft) => {
      draft.selectedEntityIds = ['object-0', 'object-1'];
    },
    false,
  );
  const host = document.createElement('div');
  host.innerHTML = alignmentControls(store.status.snapshot);
  expect(
    host.querySelector<HTMLButtonElement>('[data-alignment="horizontal"]')
      ?.disabled,
  ).toBe(true);
  expect(
    host.querySelector<HTMLButtonElement>('[data-alignment="left"]')?.disabled,
  ).toBe(false);
  store.update(
    'One',
    (draft) => {
      draft.selectedEntityIds = ['object-0'];
    },
    false,
  );
  expect(alignmentControls(store.status.snapshot)).toBe('');
});

it('aligns spawn points as positions and preserves object metadata', () => {
  const store = setup();
  store.update('Spawn', (draft) => {
    for (const e of activeScene(draft).entities) {
      e.type = 'spawn-point';
      entityProperties(e).gameplayClass = 'SpawnPoint';
    }
  });
  const before = activeScene(store.status.snapshot).entities;
  expect(alignObjects(store, 'left' as AlignmentAction)).toBe(true);
  for (const [i, e] of activeScene(store.status.snapshot).entities.entries()) {
    expect(e.position.x).toBe(50);
    expect(e.properties).toEqual(before[i]?.properties);
  }
});
