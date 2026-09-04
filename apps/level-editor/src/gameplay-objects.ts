import type { EntityDefinition, ProjectDocumentV1 } from '@flixel-pixi/schemas';
import type { LevelEditorStore } from './editor-store';
import {
  activeLayer,
  activeScene,
  activeSceneSettings,
  createId,
  entityProperties,
  layerForEntity,
  sceneLayers,
  type LevelEditorSnapshot,
  type SceneLayerDefinition,
} from './model';

export type GameplayObjectKind = 'spawn-point' | 'trigger' | 'region';
export interface CustomProperty {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'color';
  value: string | number | boolean;
}
export const isGameplayObject = (entity: EntityDefinition): boolean =>
  ['spawn-point', 'trigger', 'region'].includes(entity.type);
export const objectEditable = (
  snapshot: LevelEditorSnapshot,
  entity: EntityDefinition,
): boolean =>
  !layerForEntity(snapshot, entity).locked &&
  entityProperties(entity).locked !== true;
export function customProperties(entity: EntityDefinition): CustomProperty[] {
  return (entity.properties?.customProperties ??
    []) as unknown as CustomProperty[];
}
export function validateCustomProperties(
  value: unknown,
): asserts value is CustomProperty[] {
  if (!Array.isArray(value) || value.length > 64)
    throw new Error('Use up to 64 custom properties.');
  const names = new Set<string>();
  for (const property of value) {
    if (
      !property ||
      typeof property.name !== 'string' ||
      !/^[a-zA-Z_][a-zA-Z0-9_ .-]{0,63}$/.test(property.name) ||
      names.has(property.name)
    )
      throw new Error(
        'Property names must be unique, start with a letter or underscore, and contain up to 64 characters.',
      );
    names.add(property.name);
    const valid =
      property.type === 'string'
        ? typeof property.value === 'string' && property.value.length <= 4096
        : property.type === 'number'
          ? typeof property.value === 'number' &&
            Number.isFinite(property.value)
          : property.type === 'boolean'
            ? typeof property.value === 'boolean'
            : property.type === 'color'
              ? typeof property.value === 'string' &&
                /^#[0-9a-f]{6}$/i.test(property.value)
              : false;
    if (!valid)
      throw new Error(
        'Property value does not match its type. Use finite numbers, true/false booleans, or #RRGGBB colors.',
      );
  }
}
export function validateGameplayObjects(document: ProjectDocumentV1): void {
  for (const scene of document.scenes)
    for (const entity of scene.entities) {
      const p = entity.properties ?? {};
      if (p.customProperties !== undefined)
        validateCustomProperties(p.customProperties);
      if (
        p.gameplayClass !== undefined &&
        (typeof p.gameplayClass !== 'string' || p.gameplayClass.length > 80)
      )
        throw new Error('Object class must be at most 80 characters.');
      if (!isGameplayObject(entity)) continue;
      if (
        entity.type !== 'spawn-point' &&
        ![p.width, p.height].every(
          (n) => typeof n === 'number' && Number.isFinite(n) && n > 0,
        )
      )
        throw new Error('Regions need positive width and height.');
      if (
        entity.scale &&
        (!Number.isFinite(entity.scale.x) ||
          !Number.isFinite(entity.scale.y) ||
          entity.scale.x <= 0 ||
          entity.scale.y <= 0)
      )
        throw new Error('Object scale must be positive.');
    }
}
export function addObjectLayer(
  snapshot: LevelEditorSnapshot,
): SceneLayerDefinition {
  const settings = activeSceneSettings(snapshot);
  const layers = (settings.layers ??= [...sceneLayers(snapshot)]);
  const layer: SceneLayerDefinition = {
    id: createId('objects'),
    kind: 'objects',
    name: `Objects ${layers.filter((l) => l.kind === 'objects').length + 1}`,
    purpose: 'gameplay',
    order: Math.max(0, ...layers.map((l) => l.order)) + 100,
    locked: false,
    visible: true,
  };
  layers.push(layer);
  settings.activeLayerId = layer.id;
  snapshot.selectedEntityIds = [];
  snapshot.tool = 'select';
  return layer;
}
export function addGameplayObject(
  store: LevelEditorStore,
  kind: GameplayObjectKind,
): void {
  const current = activeLayer(store.status.snapshot);
  if (current.locked || !current.visible)
    throw new Error('Unlock and show the active layer before adding objects.');
  store.update(`Added ${kind}`, (draft) => {
    let layer = activeLayer(draft);
    if (layer.kind !== 'objects')
      layer =
        sceneLayers(draft).find(
          (l) => l.kind === 'objects' && !l.locked && l.visible,
        ) ?? addObjectLayer(draft);
    activeSceneSettings(draft).activeLayerId = layer.id;
    const settings = activeSceneSettings(draft);
    const entity: EntityDefinition = {
      id: createId(kind),
      type: kind,
      name:
        kind === 'spawn-point'
          ? 'Spawn point'
          : kind === 'trigger'
            ? 'Trigger region'
            : 'Region',
      position: {
        x:
          Math.round(settings.width / 2 / settings.gridSize) *
          settings.gridSize,
        y:
          Math.round(settings.height / 2 / settings.gridSize) *
          settings.gridSize,
      },
      rotation: 0,
      scale: { x: 1, y: 1 },
      properties: {
        layerId: layer.id,
        visible: true,
        locked: false,
        originX: 0.5,
        originY: 0.5,
        gameplayClass:
          kind === 'spawn-point'
            ? 'SpawnPoint'
            : kind === 'trigger'
              ? 'Trigger'
              : 'Region',
        customProperties: [],
        ...(kind === 'spawn-point' ? {} : { width: 128, height: 80 }),
      },
    };
    activeScene(draft).entities.push(entity);
    draft.selectedEntityIds = [entity.id];
    draft.tool = 'move';
  });
}
export function changeCustomProperties(
  store: LevelEditorStore,
  change: (properties: CustomProperty[]) => void,
): void {
  const snapshot = store.status.snapshot;
  const entity = activeScene(snapshot).entities.find(
    (e) => e.id === snapshot.selectedEntityIds.at(-1),
  );
  if (!entity) return;
  if (!objectEditable(snapshot, entity))
    throw new Error('Unlock the object and its layer to edit properties.');
  const properties = structuredClone(customProperties(entity));
  change(properties);
  validateCustomProperties(properties);
  store.update('Changed custom properties', (draft) => {
    const target = activeScene(draft).entities.find((e) => e.id === entity.id);
    if (target)
      entityProperties(target).customProperties = JSON.parse(
        JSON.stringify(properties),
      );
  });
}
export function parseCustomValue(
  type: CustomProperty['type'],
  input: string,
): string | number | boolean {
  if (type === 'number') {
    if (!input.trim() || !Number.isFinite(Number(input)))
      throw new Error('Enter a finite number.');
    return Number(input);
  }
  if (type === 'boolean') {
    if (!['true', 'false'].includes(input))
      throw new Error('Choose true or false.');
    return input === 'true';
  }
  return input;
}
