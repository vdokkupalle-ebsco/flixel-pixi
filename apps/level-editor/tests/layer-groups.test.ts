import { describe, expect, it } from 'vitest';
import { LevelEditorStore } from '../src/editor-store';
import {
  activeLayer,
  activeScene,
  activeSceneSettings,
  createInitialProject,
  createSpriteEntity,
  effectiveActiveLayer,
  entityProperties,
  parseLevelProject,
  sceneLayers,
} from '../src/model';
import {
  canDeleteLayer,
  createLayerGroup,
  deleteLayer,
  duplicateLayer,
  layerDeletionSummary,
  moveLayer,
  moveLayerToGroup,
  orderedLayers,
} from '../src/layer-editing';
import { effectiveLayers, layerSubtree } from '../src/layer-groups';
import { addGameplayObject, objectEditable } from '../src/gameplay-objects';
import { createBodyForEntity, createJoint } from '../src/physics-authoring';
import { sceneTileColliders } from '../src/tile-collision';
const editor = () =>
  new LevelEditorStore({
    document: createInitialProject(),
    selectedEntityIds: [],
    tool: 'select',
    snapToGrid: true,
  });
const select = (store: LevelEditorStore, id: string) =>
  store.update(
    'Select',
    (draft) => {
      activeSceneSettings(draft).activeLayerId = id;
    },
    false,
  );

describe('layer groups', () => {
  it('moves nested subtrees between groups and root with complete undo/redo', () => {
    const store = editor(),
      outer = createLayerGroup(store),
      inner = createLayerGroup(store);
    expect(moveLayerToGroup(store, inner, outer)).toBe(true);
    expect(moveLayerToGroup(store, 'layer-gameplay', inner)).toBe(true);
    const before = store.status.snapshot;
    expect(
      orderedLayers(before)
        .slice(0, 3)
        .map((l) => l.id),
    ).toEqual([outer, inner, 'layer-gameplay']);
    expect(moveLayerToGroup(store, inner)).toBe(true);
    expect(
      orderedLayers(store.status.snapshot)
        .slice(0, 2)
        .map((l) => l.id),
    ).toEqual([inner, 'layer-gameplay']);
    store.undo();
    expect(store.status.snapshot).toEqual(before);
    store.redo();
    expect(
      sceneLayers(store.status.snapshot).find((l) => l.id === inner)?.parentId,
    ).toBeUndefined();
  });
  it('rejects cycles, invalid targets and inherited locking without history changes', () => {
    const store = editor(),
      outer = createLayerGroup(store),
      inner = createLayerGroup(store);
    moveLayerToGroup(store, inner, outer);
    moveLayerToGroup(store, 'layer-gameplay', inner);
    const revision = store.status.revision;
    for (const target of [outer, inner, 'layer-gameplay', 'missing'])
      expect(moveLayerToGroup(store, outer, target)).toBe(false);
    expect(store.status.revision).toBe(revision);
    select(store, outer);
    store.update('Lock', (draft) => {
      activeLayer(draft).locked = true;
    });
    const lockedRevision = store.status.revision;
    expect(moveLayerToGroup(store, 'layer-gameplay')).toBe(false);
    expect(moveLayer(store, inner, 'down')).toBe(false);
    expect(deleteLayer(store, inner)).toBe(false);
    expect(store.status.revision).toBe(lockedRevision);
  });
  it('moves groups as a contiguous sibling stack without moving children independently', () => {
    const store = editor(),
      group = createLayerGroup(store);
    moveLayerToGroup(store, 'layer-gameplay', group);
    moveLayerToGroup(store, 'layer-background', group);
    const block = [group, 'layer-background', 'layer-gameplay'];
    expect(
      orderedLayers(store.status.snapshot)
        .slice(0, 3)
        .map((l) => l.id),
    ).toEqual(block);
    expect(moveLayer(store, 'layer-background', 'up')).toBe(false);
    expect(moveLayer(store, group, 'down')).toBe(true);
    expect(
      orderedLayers(store.status.snapshot)
        .slice(1, 4)
        .map((l) => l.id),
    ).toEqual(block);
    expect(moveLayer(store, 'layer-gameplay', 'up')).toBe(true);
    expect(
      orderedLayers(store.status.snapshot)
        .slice(1, 4)
        .map((l) => l.id),
    ).toEqual([group, 'layer-gameplay', 'layer-background']);
  });
  it('preserves local flags while inherited flags disable objects and collision', () => {
    const store = editor(),
      group = createLayerGroup(store);
    moveLayerToGroup(store, 'layer-gameplay', group);
    const entity = createSpriteEntity('asset-flixel-mark', 1);
    store.update('Content', (draft) => {
      activeScene(draft).entities.push(entity);
      const layer = sceneLayers(draft).find((l) => l.id === 'layer-gameplay');
      if (!layer) throw new Error('Missing gameplay layer');
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
      layer.tileCollision = { enabled: true, friction: 0.3, restitution: 0 };
    });
    const colliders = () =>
      sceneTileColliders(
        activeSceneSettings(store.status.snapshot),
        store.status.snapshot.document.assets,
      );
    expect(colliders().length).toBeGreaterThan(0);
    select(store, group);
    store.update('Hide and lock group', (draft) => {
      activeLayer(draft).visible = false;
      activeLayer(draft).locked = true;
    });
    select(store, 'layer-gameplay');
    expect(activeLayer(store.status.snapshot)).toMatchObject({
      visible: true,
      locked: false,
    });
    expect(effectiveActiveLayer(store.status.snapshot)).toMatchObject({
      visible: false,
      locked: true,
    });
    expect(objectEditable(store.status.snapshot, entity)).toBe(false);
    expect(colliders()).toEqual([]);
    select(store, group);
    store.update('Restore group', (draft) => {
      activeLayer(draft).visible = true;
      activeLayer(draft).locked = false;
    });
    expect(objectEditable(store.status.snapshot, entity)).toBe(true);
    expect(colliders().length).toBeGreaterThan(0);
  });
  it('duplicates a subtree with cross-child joints remapped and deletes it atomically', () => {
    const store = editor(),
      group = createLayerGroup(store),
      nested = createLayerGroup(store);
    moveLayerToGroup(store, nested, group);
    moveLayerToGroup(store, 'layer-gameplay', nested);
    moveLayerToGroup(store, 'layer-background', group);
    const a = createSpriteEntity('asset-flixel-mark', 1),
      b = createSpriteEntity('asset-flixel-mark', 2);
    entityProperties(b).layerId = 'layer-background';
    const ba = createBodyForEntity(a),
      bb = createBodyForEntity(b);
    store.update('Bodies', (draft) => {
      activeScene(draft).entities.push(a, b);
      const world = activeSceneSettings(draft).physics;
      world.bodies.push(ba, bb);
      world.joints = [createJoint('distance', ba, bb, a, b)];
    });
    const result = duplicateLayer(store, group);
    if (!result) throw new Error('Missing duplicate');
    expect(result.omittedJoints).toBe(0);
    expect(
      layerSubtree(result.layerId, sceneLayers(store.status.snapshot)).size,
    ).toBe(4);
    expect(
      layerDeletionSummary(store.status.snapshot, result.layerId),
    ).toMatchObject({ layers: 4, objects: 2, bodies: 2, joints: 1 });
    const world = activeSceneSettings(store.status.snapshot).physics;
    expect(world.bodies).toHaveLength(4);
    expect(world.joints).toHaveLength(2);
    expect(world.joints?.[1]?.bodyA).not.toBe(ba.id);
    expect(world.joints?.[1]?.bodyB).not.toBe(bb.id);
    const before = store.status.snapshot;
    expect(deleteLayer(store, result.layerId)).toBe(true);
    expect(activeScene(store.status.snapshot).entities).toHaveLength(2);
    expect(
      activeSceneSettings(store.status.snapshot).physics.joints,
    ).toHaveLength(1);
    store.undo();
    expect(store.status.snapshot).toEqual(before);
    store.redo();
    expect(
      sceneLayers(store.status.snapshot).some((l) => l.id === result.layerId),
    ).toBe(false);
    expect(() =>
      parseLevelProject(JSON.parse(JSON.stringify(before.document))),
    ).not.toThrow();
  });
  it('protects the last content layer even when empty groups remain', () => {
    const store = editor(),
      group = createLayerGroup(store),
      empty = createLayerGroup(store);
    for (const l of sceneLayers(store.status.snapshot).filter(
      (l) => l.kind !== 'group',
    ))
      moveLayerToGroup(store, l.id, group);
    expect(canDeleteLayer(store.status.snapshot, group)).toBe(false);
    expect(deleteLayer(store, group)).toBe(false);
    expect(deleteLayer(store, empty)).toBe(true);
  });
  it('adds gameplay objects in a content layer under the selected group', () => {
    const store = editor(),
      group = createLayerGroup(store);
    addGameplayObject(store, 'spawn-point');
    expect(activeLayer(store.status.snapshot)).toMatchObject({
      kind: 'objects',
      parentId: group,
    });
    expect(
      activeScene(store.status.snapshot).entities[0]?.properties?.layerId,
    ).toBe(activeLayer(store.status.snapshot).id);
  });
  it('rejects malformed imported hierarchy and keeps legacy flat scenes valid', () => {
    const store = editor(),
      group = createLayerGroup(store);
    const snapshot = store.status.snapshot;
    const checks = [
      (layers: ReturnType<typeof sceneLayers>) => {
        const l = layers[0];
        if (l) l.parentId = group;
      },
      (layers: ReturnType<typeof sceneLayers>) => {
        const l = layers[0];
        if (l) l.parentId = 'missing';
      },
      (layers: ReturnType<typeof sceneLayers>) => {
        const l = layers[0];
        if (l) l.tilemap = { tileSize: 16, cells: {} };
      },
      (layers: ReturnType<typeof sceneLayers>) => {
        layers.push(structuredClone(layers[0] as (typeof layers)[number]));
      },
    ];
    for (const change of checks) {
      const draft = structuredClone(snapshot);
      change(sceneLayers(draft));
      expect(() => parseLevelProject(draft.document)).toThrow();
    }
    expect(() => parseLevelProject(createInitialProject())).not.toThrow();
    expect(
      effectiveLayers(sceneLayers(snapshot)).filter((l) => l.kind !== 'group'),
    ).toHaveLength(5);
  });
});
