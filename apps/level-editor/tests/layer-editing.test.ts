import { confirmLayerDeletion } from '../src/layer-delete-dialog';
import { deleteLayer, layerDeletionSummary } from '../src/layer-editing';
import { describe, expect, it } from 'vitest';
import { LevelEditorStore } from '../src/editor-store';
import {
  activeLayer,
  activeScene,
  activeSceneSettings,
  createInitialProject,
  createSpriteEntity,
  entityProperties,
  layerForEntity,
  parseLevelProject,
  sceneLayers,
} from '../src/model';
import { duplicateLayer, moveLayer, orderedLayers } from '../src/layer-editing';
import { createBodyForEntity, createJoint } from '../src/physics-authoring';
import {
  addGameplayObject,
  changeCustomProperties,
} from '../src/gameplay-objects';
const editor = () =>
  new LevelEditorStore({
    document: createInitialProject(),
    selectedEntityIds: [],
    tool: 'select',
    snapToGrid: true,
  });
const ids = (store: LevelEditorStore) =>
  orderedLayers(store.status.snapshot).map((l) => l.id);

describe('layer editing', () => {
  it('moves one level at a time, preserves selection, and undoes/redoes the complete order', () => {
    const store = editor(),
      before = ids(store);
    const index = before.indexOf('layer-gameplay');
    expect(moveLayer(store, 'layer-gameplay', 'up')).toBe(true);
    expect(ids(store)[index - 1]).toBe('layer-gameplay');
    expect(activeLayer(store.status.snapshot).id).toBe('layer-gameplay');
    store.undo();
    expect(ids(store)).toEqual(before);
    store.redo();
    expect(ids(store)[index - 1]).toBe('layer-gameplay');
    expect(moveLayer(store, 'layer-gameplay', 'down')).toBe(true);
    expect(ids(store)).toEqual(before);
  });
  it('ignores boundaries, missing IDs and locked layers without history entries', () => {
    const store = editor();
    const top = ids(store)[0],
      bottom = ids(store).at(-1);
    if (!top || !bottom) throw new Error('Missing layers');
    expect(moveLayer(store, top, 'up')).toBe(false);
    expect(moveLayer(store, bottom, 'down')).toBe(false);
    expect(moveLayer(store, 'missing', 'up')).toBe(false);
    expect(duplicateLayer(store, 'missing')).toBeUndefined();
    store.update(
      'Lock',
      (draft) => {
        activeLayer(draft).locked = true;
      },
      false,
    );
    const revision = store.status.revision;
    expect(moveLayer(store, 'layer-gameplay', 'up')).toBe(false);
    expect(store.status.revision).toBe(revision);
    expect(store.status.canUndo).toBe(false);
  });
  it('duplicates tiles and collision settings without sharing nested state or moving content', () => {
    const store = editor();
    store.update(
      'Fixture',
      (draft) => {
        const layer = activeLayer(draft);
        layer.tilemap = {
          tileSize: 16,
          cells: {
            '3,4': {
              assetId: 'asset-flixel-mark',
              x: 0,
              y: 0,
              width: 16,
              height: 16,
              rotation: 1,
              flipX: true,
            },
          },
        };
        layer.tileCollision = {
          enabled: true,
          friction: 0.8,
          restitution: 0.2,
        };
        draft.tileSelection = {
          x: 3,
          y: 4,
          width: 1,
          height: 1,
          sceneId: activeScene(draft).id,
          layerId: layer.id,
        };
      },
      false,
    );
    const before = structuredClone(activeLayer(store.status.snapshot));
    const result = duplicateLayer(store, before.id);
    expect(result?.omittedJoints).toBe(0);
    const copy = activeLayer(store.status.snapshot);
    expect(copy.tilemap).toEqual(before.tilemap);
    expect(copy.tileCollision).toEqual(before.tileCollision);
    expect(copy.name).toBe('Gameplay copy');
    expect(ids(store).indexOf(copy.id) + 1).toBe(ids(store).indexOf(before.id));
    expect(store.status.snapshot.tileSelection).toBeUndefined();
    store.update('Edit copy', (draft) => {
      const layer = activeLayer(draft);
      if (layer.tilemap) layer.tilemap.cells = {};
    });
    expect(
      sceneLayers(store.status.snapshot).find((l) => l.id === before.id)
        ?.tilemap,
    ).toEqual(before.tilemap);
    store.undo();
    store.undo();
    expect(
      sceneLayers(store.status.snapshot).some((l) => l.id === copy.id),
    ).toBe(false);
    store.redo();
    expect(activeLayer(store.status.snapshot).id).toBe(copy.id);
  });
  it('copies hidden, locked object layers and all gameplay properties, assigning unique names', () => {
    const store = editor();
    addGameplayObject(store, 'spawn-point');
    changeCustomProperties(store, (p) =>
      p.push({ name: 'team', type: 'string', value: 'blue' }),
    );
    store.update(
      'Flags',
      (draft) => {
        activeLayer(draft).locked = true;
        activeLayer(draft).visible = false;
      },
      false,
    );
    const source = activeLayer(store.status.snapshot),
      entity = activeScene(store.status.snapshot).entities[0];
    const result = duplicateLayer(store, source.id);
    expect(result).toBeDefined();
    const copy = activeLayer(store.status.snapshot);
    expect(copy).toMatchObject({
      kind: 'objects',
      locked: true,
      visible: false,
    });
    const clone = activeScene(store.status.snapshot).entities[1];
    expect(clone?.position).toEqual(entity?.position);
    expect(clone?.properties?.customProperties).toEqual(
      entity?.properties?.customProperties,
    );
    expect(clone?.id).not.toBe(entity?.id);
    duplicateLayer(store, source.id);
    expect(activeLayer(store.status.snapshot).name).toBe(
      `${source.name} copy 2`,
    );
    expect(() =>
      parseLevelProject(
        JSON.parse(JSON.stringify(store.status.snapshot.document)),
      ),
    ).not.toThrow();
  });
  it('remaps body IDs and internal joints, leaving cross-layer connections on the originals', () => {
    const store = editor();
    const a = createSpriteEntity('asset-flixel-mark', 1),
      b = createSpriteEntity('asset-flixel-mark', 2),
      external = createSpriteEntity('asset-flixel-mark', 3);
    entityProperties(external).layerId = 'layer-background';
    const ba = createBodyForEntity(a),
      bb = createBodyForEntity(b),
      bc = createBodyForEntity(external);
    const internal = createJoint('distance', ba, bb, a, b),
      outbound = createJoint('weld', bb, bc, b, external);
    store.update(
      'Physics fixture',
      (draft) => {
        activeScene(draft).entities.push(a, b, external);
        const world = activeSceneSettings(draft).physics;
        world.bodies = [ba, bb, bc];
        world.joints = [internal, outbound];
      },
      false,
    );
    expect(duplicateLayer(store, 'layer-gameplay')?.omittedJoints).toBe(1);
    const snapshot = store.status.snapshot,
      world = activeSceneSettings(snapshot).physics;
    const copyEntities = activeScene(snapshot).entities.filter(
      (e) => entityProperties(e).layerId === activeLayer(snapshot).id,
    );
    expect(copyEntities).toHaveLength(2);
    expect(world.bodies).toHaveLength(5);
    expect(world.joints).toHaveLength(3);
    const bodyIds = world.bodies
      .filter((b) => copyEntities.some((e) => e.id === b.entityId))
      .map((b) => b.id);
    const joint = world.joints?.[2];
    expect(bodyIds).toContain(joint?.bodyA);
    expect(bodyIds).toContain(joint?.bodyB);
    expect(joint?.id).not.toBe(internal.id);
    expect(world.joints?.slice(0, 2)).toEqual([internal, outbound]);
    expect(() =>
      parseLevelProject(JSON.parse(JSON.stringify(snapshot.document))),
    ).not.toThrow();
    store.undo();
    expect(
      activeSceneSettings(store.status.snapshot).physics.bodies,
    ).toHaveLength(3);
    store.redo();
    expect(activeSceneSettings(store.status.snapshot).physics).toEqual(world);
  });
  it('materializes legacy layer membership and handles equal order values', () => {
    const store = editor();
    store.update(
      'Legacy',
      (draft) => {
        const entity = createSpriteEntity('asset-flixel-mark', 1);
        delete entityProperties(entity).layerId;
        activeScene(draft).entities.push(entity);
        for (const layer of sceneLayers(draft)) layer.order = 0;
      },
      false,
    );
    duplicateLayer(store, 'layer-gameplay');
    const snapshot = store.status.snapshot,
      original = activeScene(snapshot).entities[0];
    if (!original) throw new Error('Missing entity');
    expect(layerForEntity(snapshot, original).id).toBe('layer-gameplay');
    expect(new Set(sceneLayers(snapshot).map((l) => l.order)).size).toBe(
      sceneLayers(snapshot).length,
    );
  });
  it('duplicates a project without explicit layers without changing the shared fallback', () => {
    const store = editor();
    store.update(
      'Legacy',
      (draft) => {
        delete activeSceneSettings(draft).layers;
        const entity = createSpriteEntity('asset-flixel-mark', 1);
        delete entityProperties(entity).layerId;
        activeScene(draft).entities.push(entity);
      },
      false,
    );
    duplicateLayer(store, 'layer-gameplay');
    expect(sceneLayers(store.status.snapshot)).toHaveLength(2);
    expect(activeScene(store.status.snapshot).entities).toHaveLength(2);
    store.undo();
    expect(activeSceneSettings(store.status.snapshot).layers).toBeUndefined();
    expect(activeLayer(store.status.snapshot).name).toBe('Gameplay');
  });
});

it('deletes layer contents and connected joints atomically, then restores everything through undo', () => {
  const store = editor(),
    a = createSpriteEntity('asset-flixel-mark', 1),
    b = createSpriteEntity('asset-flixel-mark', 2);
  entityProperties(b).layerId = 'layer-background';
  const ba = createBodyForEntity(a),
    bb = createBodyForEntity(b),
    joint = createJoint('distance', ba, bb, a, b);
  store.update(
    'Fixture',
    (draft) => {
      activeScene(draft).entities.push(a, b);
      const world = activeSceneSettings(draft).physics;
      world.bodies = [ba, bb];
      world.joints = [joint];
      activeLayer(draft).tilemap = {
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
      draft.selectedEntityIds = [a.id];
      draft.tool = 'paste';
      draft.tileSelection = {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        sceneId: activeScene(draft).id,
        layerId: 'layer-gameplay',
      };
    },
    false,
  );
  const before = store.status.snapshot;
  expect(layerDeletionSummary(before, 'layer-gameplay')).toMatchObject({
    tiles: 1,
    objects: 1,
    bodies: 1,
    joints: 1,
  });
  expect(deleteLayer(store, 'layer-gameplay')).toBe(true);
  expect(activeScene(store.status.snapshot).entities).toEqual([b]);
  expect(activeSceneSettings(store.status.snapshot).physics.bodies).toEqual([
    bb,
  ]);
  expect(activeSceneSettings(store.status.snapshot).physics.joints).toEqual([]);
  expect(store.status.snapshot.selectedEntityIds).toEqual([]);
  expect(store.status.snapshot.tileSelection).toBeUndefined();
  expect(store.status.snapshot.tool).toBe('tile-select');
  expect(activeLayer(store.status.snapshot).id).not.toBe('layer-gameplay');
  expect(() =>
    parseLevelProject(
      JSON.parse(JSON.stringify(store.status.snapshot.document)),
    ),
  ).not.toThrow();
  store.undo();
  expect(store.status.snapshot).toEqual(before);
  store.redo();
  expect(sceneLayers(store.status.snapshot)).toHaveLength(4);
});

it('protects locked and last remaining layers', () => {
  const store = editor();
  store.update(
    'Lock',
    (draft) => {
      activeLayer(draft).locked = true;
    },
    false,
  );
  expect(deleteLayer(store, 'layer-gameplay')).toBe(false);
  expect(deleteLayer(store, 'missing')).toBe(false);
  store.update(
    'Legacy single layer',
    (draft) => {
      delete activeSceneSettings(draft).layers;
    },
    false,
  );
  expect(deleteLayer(store, 'layer-gameplay')).toBe(false);
  expect(store.status.canUndo).toBe(false);
});

it('requires explicit confirmation, focuses Cancel, and supports cancellation and confirmed deletion', () => {
  const store = editor(),
    before = store.status.snapshot;
  let focusRestored = 0;
  const open = () =>
    confirmLayerDeletion(
      store,
      'layer-gameplay',
      () => undefined,
      () => {
        focusRestored++;
      },
    );
  open();
  expect(document.activeElement?.textContent).toBe('Cancel');
  expect(
    document.querySelector('#layer-delete-description')?.textContent,
  ).toContain('Gameplay');
  expect(store.status.snapshot).toEqual(before);
  document.querySelector<HTMLButtonElement>('[data-cancel]')?.click();
  expect(store.status.snapshot).toEqual(before);
  expect(focusRestored).toBe(1);
  open();
  document.querySelector<HTMLButtonElement>('[data-confirm]')?.click();
  expect(sceneLayers(store.status.snapshot)).toHaveLength(4);
  expect(document.querySelector('.layer-delete-dialog')).toBeNull();
  expect(focusRestored).toBe(2);
  store.undo();
  expect(store.status.snapshot).toEqual(before);
  const cleanup = open();
  document
    .querySelector('dialog')
    ?.dispatchEvent(new Event('cancel', { cancelable: true }));
  expect(store.status.snapshot).toEqual(before);
  cleanup();
});

it('does not delete changed contents under a stale confirmation', () => {
  const store = editor();
  const cleanup = confirmLayerDeletion(
    store,
    'layer-gameplay',
    () => undefined,
    () => undefined,
  );
  try {
    store.update('New object', (draft) => {
      activeScene(draft).entities.push(
        createSpriteEntity('asset-flixel-mark', 1),
      );
    });
    document.querySelector<HTMLButtonElement>('[data-confirm]')?.click();
    expect(sceneLayers(store.status.snapshot)).toHaveLength(5);
    expect(activeScene(store.status.snapshot).entities).toHaveLength(1);
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      'scene changed',
    );
  } finally {
    cleanup();
  }
});
