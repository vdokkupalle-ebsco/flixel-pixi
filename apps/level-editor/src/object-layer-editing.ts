import type { LevelEditorStore } from './editor-store';
import { objectEditable } from './gameplay-objects';
import { effectiveLayer } from './layer-groups';
import {
  activeScene,
  activeSceneSettings,
  entityProperties,
  layerForEntity,
  sceneLayers,
  type LevelEditorSnapshot,
} from './model';

export function canMoveObjectToLayer(
  snapshot: LevelEditorSnapshot,
  entityId: string,
  layerId: string,
): boolean {
  const entity = activeScene(snapshot).entities.find((e) => e.id === entityId);
  const layers = sceneLayers(snapshot);
  const target = layers.find((l) => l.id === layerId);
  return !!(
    entity &&
    target &&
    target.kind !== 'group' &&
    objectEditable(snapshot, entity) &&
    !effectiveLayer(target, layers).locked &&
    layerForEntity(snapshot, entity).id !== layerId
  );
}

/** Change membership only; geometry, physics references and object IDs stay intact. */
export function moveObjectToLayer(
  store: LevelEditorStore,
  entityId: string,
  layerId: string,
): boolean {
  if (!canMoveObjectToLayer(store.status.snapshot, entityId, layerId))
    return false;
  store.update('Moved object to layer', (draft) => {
    const entity = activeScene(draft).entities.find((e) => e.id === entityId);
    if (!entity) return;
    entityProperties(entity).layerId = layerId;
    activeSceneSettings(draft).activeLayerId = layerId;
    draft.selectedEntityIds = [entityId];
  });
  return true;
}

/** Topmost first, matching the hierarchy. */
export function objectsInLayer(snapshot: LevelEditorSnapshot, layerId: string) {
  return activeScene(snapshot)
    .entities.filter((e) => layerForEntity(snapshot, e).id === layerId)
    .reverse()
    .sort(
      (a, b) =>
        Number(entityProperties(b).zIndex ?? 0) -
        Number(entityProperties(a).zIndex ?? 0),
    );
}

export function reorderObject(
  store: LevelEditorStore,
  id: string,
  targetId: string,
  position: 'before' | 'after',
): boolean {
  const snapshot = store.status.snapshot;
  const source = activeScene(snapshot).entities.find((e) => e.id === id);
  if (!source || !objectEditable(snapshot, source)) return false;
  const layerId = layerForEntity(snapshot, source).id;
  const original = objectsInLayer(snapshot, layerId).map((e) => e.id);
  if (id === targetId || !original.includes(targetId)) return false;
  const order = original.filter((e) => e !== id);
  order.splice(order.indexOf(targetId) + (position === 'after' ? 1 : 0), 0, id);
  if (order.every((e, i) => e === original[i])) return false;
  store.update('Changed object order', (draft) => {
    for (const entity of activeScene(draft).entities) {
      const index = order.indexOf(entity.id);
      if (index >= 0) entityProperties(entity).zIndex = order.length - index;
    }
  });
  return true;
}

export function stepObjectOrder(
  store: LevelEditorStore,
  id: string,
  direction: -1 | 1,
): boolean {
  const snapshot = store.status.snapshot;
  const source = activeScene(snapshot).entities.find((e) => e.id === id);
  if (!source) return false;
  const siblings = objectsInLayer(
    snapshot,
    layerForEntity(snapshot, source).id,
  );
  const index = siblings.findIndex((e) => e.id === id);
  const target = siblings[index - direction];
  return (
    !!target &&
    reorderObject(store, id, target.id, direction > 0 ? 'before' : 'after')
  );
}
