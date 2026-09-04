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
  return [...sceneLayers(snapshot)].sort((a, b) => b.order - a.order);
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
  const layers = orderedLayers(store.status.snapshot),
    index = layers.findIndex((l) => l.id === layerId);
  const source = layers[index],
    destination = index + (direction === 'up' ? -1 : 1);
  if (
    !source ||
    source.locked ||
    destination < 0 ||
    destination >= layers.length
  )
    return false;
  store.update(`Moved layer ${direction}`, (draft) => {
    const ordered = editableLayers(draft);
    const [layer] = ordered.splice(index, 1);
    if (!layer) return;
    ordered.splice(destination, 0, layer);
    saveOrder(draft, ordered);
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
    const scene = activeScene(draft),
      world = activeSceneSettings(draft).physics;
    const entityIds = new Map<string, string>(),
      bodyIds = new Map<string, string>();
    const entities = scene.entities
      .filter((e) => entityProperties(e).layerId === layerId)
      .map((entity) => {
        const clone = structuredClone(entity);
        clone.id = createId('entity');
        entityIds.set(entity.id, clone.id);
        entityProperties(clone).layerId = copy.id;
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
    layers.splice(index, 0, copy);
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
  const entities = new Set(
    activeScene(snapshot)
      .entities.filter((e) => layerForEntity(snapshot, e).id === layerId)
      .map((e) => e.id),
  );
  const world = activeSceneSettings(snapshot).physics;
  const bodies = new Set(
    world.bodies.filter((b) => entities.has(b.entityId)).map((b) => b.id),
  );
  return {
    name: layer.name,
    tiles: Object.keys(layer.tilemap?.cells ?? {}).length,
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
  if (!source || source.locked || layers.length <= 1) return false;
  store.update('Deleted layer', (draft) => {
    const ordered = editableLayers(draft),
      index = ordered.findIndex((l) => l.id === layerId);
    const scene = activeScene(draft),
      settings = activeSceneSettings(draft),
      world = settings.physics;
    const entityIds = new Set(
      scene.entities
        .filter((e) => entityProperties(e).layerId === layerId)
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
    ordered.splice(index, 1);
    saveOrder(draft, ordered);
    if (
      settings.activeLayerId === layerId ||
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
    if (draft.tileSelection?.layerId === layerId) delete draft.tileSelection;
  });
  return true;
}
