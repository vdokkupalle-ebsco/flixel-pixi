import type { LevelEditorStore } from './editor-store';
import {
  activeLayer,
  activeSceneSettings,
  sceneLayers,
  type SceneEditorSettings,
  type SceneLayerDefinition,
} from './model';
import { DEFAULT_TILE_COLLISION, layerTileColliders } from './tile-collision';

export function tileCollisionControls(
  layer: SceneLayerDefinition,
  settings: SceneEditorSettings,
): string {
  const collision = layer.tileCollision ?? DEFAULT_TILE_COLLISION;
  const count = layerTileColliders(layer, settings).length;
  return `<fieldset class="tile-collision-settings"><legend>Tile collision</legend>
    <label class="collision-checkbox"><input type="checkbox" data-tile-collision="enabled" ${collision.enabled ? 'checked' : ''} ${layer.locked ? 'disabled' : ''}/>Enable collision</label>
    <p class="field-help">Every painted cell is a solid box, including transparent tile edges. Adjacent cells merge; gaps stay open.</p>
    ${collision.enabled ? `<div class="field-pair"><label>Friction<input aria-label="Tile friction" type="number" min="0" max="1" step="0.05" data-tile-collision="friction" value="${collision.friction}" ${layer.locked ? 'disabled' : ''}/></label><label>Bounce<input aria-label="Tile bounce" type="number" min="0" max="1" step="0.05" data-tile-collision="restitution" value="${collision.restitution}" ${layer.locked ? 'disabled' : ''}/></label></div><p class="collision-summary">${!layer.visible ? 'Hidden layer: collision is inactive in Preview.' : count ? `${count} merged collider${count === 1 ? '' : 's'} in Preview` : 'Paint tiles to create collision.'}</p>` : ''}
    ${layer.locked ? '<p class="field-help">Unlock this layer to change collision settings.</p>' : ''}
  </fieldset>`;
}

export function updateTileCollision(
  store: LevelEditorStore,
  field: string,
  value: string | boolean,
): void {
  if (!['enabled', 'friction', 'restitution'].includes(field)) return;
  if (activeLayer(store.status.snapshot).locked)
    throw new Error('Unlock this layer to change collision settings.');
  if (
    field === 'enabled'
      ? typeof value !== 'boolean'
      : typeof value !== 'string' ||
        value.trim() === '' ||
        !Number.isFinite(Number(value)) ||
        Number(value) < 0 ||
        Number(value) > 1
  )
    throw new Error('Enter a value between 0 and 1 for friction or bounce.');
  store.update('Changed tile collision', (draft) => {
    const settings = activeSceneSettings(draft);
    settings.layers ??= sceneLayers(draft).map((layer) => ({ ...layer }));
    const layer = activeLayer(draft);
    const collision = (layer.tileCollision ??= { ...DEFAULT_TILE_COLLISION });
    if (field === 'enabled') {
      collision.enabled = value as boolean;
      if (collision.enabled) draft.showTileCollisions = true;
    } else collision[field as 'friction' | 'restitution'] = Number(value);
  });
}
