import type { EntityDefinition } from '@flixel-pixi/schemas';
import {
  activeLayer,
  effectiveActiveLayer,
  layerForEntity,
  type LevelEditorSnapshot,
} from './model';

export function worldEntity(
  snapshot: LevelEditorSnapshot,
  entity: EntityDefinition,
): EntityDefinition {
  const layer = layerForEntity(snapshot, entity);
  return {
    ...entity,
    position: {
      x: entity.position.x + (layer.offsetX ?? 0),
      y: entity.position.y + (layer.offsetY ?? 0),
    },
  };
}

export function layerAppearanceControls(snapshot: LevelEditorSnapshot): string {
  const layer = activeLayer(snapshot),
    effective = effectiveActiveLayer(snapshot);
  return `<fieldset ${effective.locked ? 'disabled' : ''}><legend>Layer appearance</legend><label>Opacity (%)<input type="number" data-layer-field="opacity" min="0" max="100" step="1" value="${(layer.opacity ?? 1) * 100}" /></label><div class="field-pair"><label>Offset X<input type="number" data-layer-field="offsetX" min="-1000000" max="1000000" step="1" value="${layer.offsetX ?? 0}" /></label><label>Offset Y<input type="number" data-layer-field="offsetY" min="-1000000" max="1000000" step="1" value="${layer.offsetY ?? 0}" /></label></div><p class="field-help">Offsets are in pixels. Group offsets add to child offsets; opacity multiplies. Object positions and tile cells stay local to the layer.</p>${layer.parentId ? `<p class="field-help">Including groups: ${Math.round((effective.opacity ?? 1) * 100)}% opacity · offset ${effective.offsetX ?? 0}, ${effective.offsetY ?? 0}.</p>` : ''}</fieldset>`;
}
