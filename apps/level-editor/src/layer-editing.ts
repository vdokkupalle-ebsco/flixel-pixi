import { effectiveLayer, flattenLayers, layerSubtree } from './layer-groups';
import type { LevelEditorStore } from './editor-store';
import {
  activeScene,
  activeSceneSettings,
  createId,
  entityProperties,
  layerForEntity,
  sceneLayers,
  type LevelEditorSnapshot,
  type SceneLayerDefinition,
} from './model';

/** Hierarchy order: topmost rendered layer first. */
export function orderedLayers(
  snapshot: LevelEditorSnapshot,
): SceneLayerDefinition[] {
  return flattenLayers(sceneLayers(snapshot));
}
function editableLayers(snapshot: LevelEditorSnapshot): SceneLayerDefinition[] {
  // Preserve legacy entity membership before changing array order or adding a
  // second gameplay-purpose layer. Never mutate the shared fallback layer.
  for (const entity of activeScene(snapshot).entities)
    entityProperties(entity).layerId = layerForEntity(snapshot, entity).id;
  return structuredClone(orderedLayers(snapshot));
}
function saveOrder(
  snapshot: LevelEditorSnapshot,
  layers: SceneLayerDefinition[],
): void {
  layers.forEach((layer, index) => {
    layer.order = (layers.length - index) * 100;
  });
  activeSceneSettings(snapshot).layers = layers;
}
export function moveLayer(
  store: LevelEditorStore,
  layerId: string,
  direction: 'up' | 'down',
): boolean {
  const layers = orderedLayers(store.status.snapshot);
  const source = layers.find((l) => l.id === layerId);
  if (!source || effectiveLayer(source, layers).locked) return false;
  const siblings = layers.filter((l) => l.parentId === source.parentId);
  const index = siblings.findIndex((l) => l.id === layerId);
  const adjacent = siblings[index + (direction === 'up' ? -1 : 1)];
  if (!adjacent) return false;
  store.update(`Moved layer ${direction}`, (draft) => {
    const ordered = editableLayers(draft);
    const moving = layerSubtree(layerId, ordered);
    const block = ordered.filter((l) => moving.has(l.id));
    const remaining = ordered.filter((l) => !moving.has(l.id));
    const target = layerSubtree(adjacent.id, remaining);
    const targetIndices = remaining.flatMap((l, i) =>
      target.has(l.id) ? [i] : [],
    );
    const destination =
      direction === 'up'
        ? Math.min(...targetIndices)
        : Math.max(...targetIndices) + 1;
    remaining.splice(destination, 0, ...block);
    saveOrder(draft, remaining);
  });
  return true;
}
export interface DuplicateLayerResult {
  layerId: string;
  omittedJoints: number;
}
export function duplicateLayer(
  store: LevelEditorStore,
  layerId: string,
): DuplicateLayerResult | undefined {
  if (!sceneLayers(store.status.snapshot).some((l) => l.id === layerId))
    return undefined;
  let result: DuplicateLayerResult | undefined;
  store.update('Duplicated layer', (draft) => {
    const layers = editableLayers(draft),
      index = layers.findIndex((l) => l.id === layerId),
      source = layers[index];
    if (!source) return;
    const copy = structuredClone(source);
    copy.id = createId('layer');
    const names = new Set(layers.map((l) => l.name));
    const base = `${source.name} copy`;
    let name = base,
      suffix = 2;
    while (names.has(name)) name = `${base} ${suffix++}`;
    copy.name = name;
    const subtree = layerSubtree(layerId, layers);
    const copies = layers
      .filter((l) => subtree.has(l.id))
      .map((l) =>
        l.id === layerId
          ? copy
          : { ...structuredClone(l), id: createId('layer') },
      );
    const layerIds = new Map(
      layers
        .filter((l) => subtree.has(l.id))
        .map((l, i) => [l.id, copies[i]?.id ?? copy.id]),
    );
    for (const child of copies)
      if (child.parentId && layerIds.has(child.parentId))
        child.parentId = layerIds.get(child.parentId) ?? child.parentId;

    const scene = activeScene(draft),
      world = activeSceneSettings(draft).physics;
    const entityIds = new Map<string, string>(),
      bodyIds = new Map<string, string>();
    const entities = scene.entities
      .filter((e) => subtree.has(String(entityProperties(e).layerId)))
      .map((entity) => {
        const clone = structuredClone(entity);
        clone.id = createId('entity');
        entityIds.set(entity.id, clone.id);
        entityProperties(clone).layerId =
          layerIds.get(String(entityProperties(entity).layerId)) ?? copy.id;
        return clone;
      });
    for (const body of [...world.bodies]) {
      const entityId = entityIds.get(body.entityId);
      if (!entityId) continue;
      const clone = structuredClone(body);
      clone.id = createId('body');
      clone.entityId = entityId;
      bodyIds.set(body.id, clone.id);
      world.bodies.push(clone);
    }
    let omittedJoints = 0;
    for (const joint of [...(world.joints ?? [])]) {
      const bodyA = bodyIds.get(joint.bodyA),
        bodyB = bodyIds.get(joint.bodyB);
      if (!bodyA || !bodyB) {
        if (bodyA || bodyB) omittedJoints++;
        continue;
      }
      (world.joints ??= []).push({
        ...structuredClone(joint),
        id: createId('joint'),
        bodyA,
        bodyB,
      });
    }
    scene.entities.push(...entities);
    layers.splice(index, 0, ...copies);
    saveOrder(draft, layers);
    activeSceneSettings(draft).activeLayerId = copy.id;
    draft.selectedEntityIds = [];
    delete draft.tileSelection;
    if (draft.tool === 'paste') draft.tool = 'tile-select';
    result = { layerId: copy.id, omittedJoints };
  });
  return result;
}

export function layerDeletionSummary(
  snapshot: LevelEditorSnapshot,
  layerId: string,
) {
  const layer = sceneLayers(snapshot).find((l) => l.id === layerId);
  if (!layer) return undefined;
  const subtree = layerSubtree(layerId, sceneLayers(snapshot));
  const entities = new Set(
    activeScene(snapshot)
      .entities.filter((e) => subtree.has(layerForEntity(snapshot, e).id))
      .map((e) => e.id),
  );
  const world = activeSceneSettings(snapshot).physics;
  const bodies = new Set(
    world.bodies.filter((b) => entities.has(b.entityId)).map((b) => b.id),
  );
  return {
    name: layer.name,
    layers: subtree.size,
    tiles: sceneLayers(snapshot)
      .filter((l) => subtree.has(l.id))
      .reduce((n, l) => n + Object.keys(l.tilemap?.cells ?? {}).length, 0),
    objects: entities.size,
    bodies: bodies.size,
    joints: (world.joints ?? []).filter(
      (j) => bodies.has(j.bodyA) || bodies.has(j.bodyB),
    ).length,
  };
}

/** Caller must obtain confirmation before invoking this destructive, undoable edit. */
export function deleteLayer(store: LevelEditorStore, layerId: string): boolean {
  const snapshot = store.status.snapshot,
    layers = sceneLayers(snapshot),
    source = layers.find((l) => l.id === layerId);
  if (!source || !canDeleteLayer(snapshot, layerId)) return false;
  const subtree = layerSubtree(layerId, layers);
  store.update('Deleted layer', (draft) => {
    const ordered = editableLayers(draft),
      index = ordered.findIndex((l) => l.id === layerId);
    const scene = activeScene(draft),
      settings = activeSceneSettings(draft),
      world = settings.physics;
    const entityIds = new Set(
      scene.entities
        .filter((e) => subtree.has(String(entityProperties(e).layerId)))
        .map((e) => e.id),
    );
    const bodyIds = new Set(
      world.bodies.filter((b) => entityIds.has(b.entityId)).map((b) => b.id),
    );
    world.bodies = world.bodies.filter((b) => !bodyIds.has(b.id));
    if (world.joints)
      world.joints = world.joints.filter(
        (j) => !bodyIds.has(j.bodyA) && !bodyIds.has(j.bodyB),
      );
    scene.entities = scene.entities.filter((e) => !entityIds.has(e.id));
    for (let i = ordered.length - 1; i >= 0; i--)
      if (subtree.has(ordered[i]?.id ?? '')) ordered.splice(i, 1);
    saveOrder(draft, ordered);
    if (
      subtree.has(settings.activeLayerId ?? '') ||
      !ordered.some((l) => l.id === settings.activeLayerId)
    ) {
      const next = ordered[Math.min(index, ordered.length - 1)] ?? ordered[0];
      if (next) settings.activeLayerId = next.id;
      else delete settings.activeLayerId;
      if (draft.tool === 'paste') draft.tool = 'tile-select';
    }
    draft.selectedEntityIds = draft.selectedEntityIds.filter(
      (id) => !entityIds.has(id),
    );
    if (draft.tileSelection && subtree.has(draft.tileSelection.layerId))
      delete draft.tileSelection;
  });
  return true;
}

export function canDeleteLayer(
  snapshot: LevelEditorSnapshot,
  id: string,
): boolean {
  const layers = sceneLayers(snapshot),
    subtree = layerSubtree(id, layers);
  return (
    subtree.size > 0 &&
    !layers.some(
      (l) => subtree.has(l.id) && effectiveLayer(l, layers).locked,
    ) &&
    layers.some((l) => !subtree.has(l.id) && l.kind !== 'group')
  );
}

export function createLayerGroup(store: LevelEditorStore): string {
  const id = createId('group');
  store.update('Added layer group', (draft) => {
    const layers = editableLayers(draft);
    layers.unshift({
      id,
      name: `Group ${layers.filter((l) => l.kind === 'group').length + 1}`,
      kind: 'group',
      locked: false,
      visible: true,
      purpose: 'gameplay',
      order: 0,
    });
    saveOrder(draft, layers);
    activeSceneSettings(draft).activeLayerId = id;
    draft.selectedEntityIds = [];
    delete draft.tileSelection;
  });
  return id;
}

export function moveLayerToGroup(
  store: LevelEditorStore,
  id: string,
  parentId?: string,
): boolean {
  const layers = sceneLayers(store.status.snapshot),
    source = layers.find((l) => l.id === id),
    parent = layers.find((l) => l.id === parentId);
  const subtree = layerSubtree(id, layers);
  if (
    !source ||
    effectiveLayer(source, layers).locked ||
    source.parentId === parentId ||
    (parentId !== undefined &&
      (!parent ||
        parent.kind !== 'group' ||
        subtree.has(parentId) ||
        effectiveLayer(parent, layers).locked))
  )
    return false;
  store.update('Changed layer group', (draft) => {
    const ordered = editableLayers(draft),
      layer = ordered.find((l) => l.id === id);
    if (!layer) return;
    if (parentId === undefined) delete layer.parentId;
    else layer.parentId = parentId;
    layer.order = Math.max(...ordered.map((l) => l.order)) + 100;
    saveOrder(draft, flattenLayers(ordered));
  });
  return true;
}

export type LayerDrop =
  | { targetId: string; position: 'before' | 'after' | 'inside' }
  | { position: 'root' };

/** Resolve a drop without mutating the document; also used for drop feedback. */
export function layerDropPlan(
  snapshot: LevelEditorSnapshot,
  id: string,
  drop: LayerDrop,
): { parentId?: string; order: string[] } | undefined {
  const layers = orderedLayers(snapshot),
    source = layers.find((l) => l.id === id);
  if (!source || effectiveLayer(source, layers).locked) return;
  const subtree = layerSubtree(id, layers);
  const target =
    drop.position === 'root'
      ? undefined
      : layers.find((l) => l.id === drop.targetId);
  if (drop.position !== 'root' && (!target || subtree.has(target.id))) return;
  const parentId = drop.position === 'inside' ? target?.id : target?.parentId;
  const parent = layers.find((l) => l.id === parentId);
  if (drop.position === 'inside' && target?.kind !== 'group') return;
  if (parent && effectiveLayer(parent, layers).locked) return;
  const remaining = layers.filter((l) => !subtree.has(l.id));
  let index = remaining.length;
  if (target) {
    index = remaining.findIndex((l) => l.id === target.id);
    if (drop.position === 'inside') index++;
    else if (drop.position === 'after') {
      const targetTree = layerSubtree(target.id, remaining);
      while (
        index < remaining.length &&
        targetTree.has(remaining[index]?.id ?? '')
      )
        index++;
    }
  }
  const order = remaining.map((l) => l.id);
  order.splice(
    index,
    0,
    ...layers.filter((l) => subtree.has(l.id)).map((l) => l.id),
  );
  if (source.parentId === parentId && layers.every((l, i) => l.id === order[i]))
    return;
  return { ...(parentId ? { parentId } : {}), order };
}

export function dropLayer(
  store: LevelEditorStore,
  id: string,
  drop: LayerDrop,
): boolean {
  const plan = layerDropPlan(store.status.snapshot, id, drop);
  if (!plan) return false;
  store.update('Moved layer', (draft) => {
    const layers = editableLayers(draft),
      source = layers.find((l) => l.id === id);
    if (!source) return;
    if (plan.parentId) source.parentId = plan.parentId;
    else delete source.parentId;
    const byId = new Map(layers.map((l) => [l.id, l]));
    saveOrder(
      draft,
      plan.order.flatMap((key) => {
        const l = byId.get(key);
        return l ? [l] : [];
      }),
    );
  });
  return true;
}
