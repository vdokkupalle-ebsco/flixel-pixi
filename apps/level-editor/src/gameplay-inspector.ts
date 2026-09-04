import type { EntityDefinition } from '@flixel-pixi/schemas';
import type { LevelEditorStore } from './editor-store';
import {
  activeScene,
  sceneLayers,
  layerForEntity,
  entityProperties,
  type LevelEditorSnapshot,
} from './model';
import {
  changeCustomProperties,
  customProperties,
  objectEditable,
  parseCustomValue,
  type CustomProperty,
} from './gameplay-objects';
const esc = (v: unknown): string =>
  String(v)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
export function customPropertyInspector(
  snapshot: LevelEditorSnapshot,
  entity: EntityDefinition,
): string {
  const locked = !objectEditable(snapshot, entity);
  return `<fieldset class="custom-properties" ${locked ? 'disabled' : ''}><legend>Custom properties</legend>${
    customProperties(entity)
      .map(
        (p, i) =>
          `<div class="custom-property-row"><label>Name<input aria-label="Property ${i + 1} name" data-custom-name="${i}" value="${esc(p.name)}"/></label><label>${esc(p.type)}${p.type === 'boolean' ? `<select aria-label="${esc(p.name)} value" data-custom-value="${i}"><option value="false" ${p.value === false ? 'selected' : ''}>false</option><option value="true" ${p.value === true ? 'selected' : ''}>true</option></select>` : `<input aria-label="${esc(p.name)} value" data-custom-value="${i}" type="${p.type === 'number' ? 'number' : p.type === 'color' ? 'color' : 'text'}" step="any" value="${esc(p.value)}"/>`}</label><button type="button" data-custom-delete="${i}" aria-label="Remove ${esc(p.name)} property">×</button></div>`,
      )
      .join('') ||
    '<p class="field-help">Add gameplay data such as team, destination, or damage.</p>'
  }<div class="field-pair"><label>New property name<input aria-label="New property name" data-custom-new-name placeholder="e.g. team" maxlength="64"/></label><label>Type<select aria-label="New property type" data-custom-new-type><option value="string">String</option><option value="number">Number</option><option value="boolean">Boolean</option><option value="color">Color</option></select></label></div><button type="button" class="button full" data-custom-add>Add property</button></fieldset>${locked ? '<p class="field-help">Unlock the object and its layer to edit properties.</p>' : ''}`;
}
export function gameplayInspector(
  snapshot: LevelEditorSnapshot,
  entity: EntityDefinition,
): string {
  const p = entityProperties(entity),
    point = entity.type === 'spawn-point',
    locked = !objectEditable(snapshot, entity);
  const field = (label: string, key: string, value: unknown, type = 'number') =>
    `<label>${label}<input aria-label="${label}" data-entity-field="${key}" type="${type}" value="${esc(value)}"/></label>`;
  return `<fieldset ${locked ? 'disabled' : ''}><legend>${point ? 'Spawn point' : entity.type === 'trigger' ? 'Trigger region' : 'Region'}</legend>${field('Name', 'name', entity.name ?? '', 'text')}${field('Class', 'gameplayClass', p.gameplayClass ?? '', 'text')}<label>Object layer<select data-entity-field="layerId">${sceneLayers(
    snapshot,
  )
    .map(
      (l) =>
        `<option value="${esc(l.id)}" ${l.id === layerForEntity(snapshot, entity).id ? 'selected' : ''} ${l.locked ? 'disabled' : ''}>${esc(l.name)}</option>`,
    )
    .join(
      '',
    )}</select></label><div class="field-pair">${field('X', 'x', entity.position.x)}${field('Y', 'y', entity.position.y)}</div>${point ? '' : `<div class="field-pair">${field('Width', 'width', p.width)}${field('Height', 'height', p.height)}</div>${field('Rotation °', 'rotation', ((entity.rotation ?? 0) * 180) / Math.PI)}<div class="field-pair">${field('Scale X', 'scaleX', entity.scale?.x ?? 1)}${field('Scale Y', 'scaleY', entity.scale?.y ?? 1)}</div>`}<p class="field-help">${point ? 'Position marks the spawn location.' : 'Position is the center of this rectangular region.'} Drag to move; use arrow keys for precise placement.</p><button type="button" class="button full" data-action="duplicate">Duplicate object</button></fieldset><div class="segmented"><button type="button" data-action="toggle-visible" data-entity-id="${esc(entity.id)}" aria-pressed="${p.visible !== false}">Visible</button><button type="button" data-action="toggle-locked" data-entity-id="${esc(entity.id)}" aria-pressed="${p.locked === true}">Locked</button></div><p class="field-help">Gameplay metadata: exported for your game to interpret. Preview does not run spawn or trigger logic.</p>${customPropertyInspector(snapshot, entity)}`;
}
export function mountCustomProperties(
  host: HTMLElement,
  store: LevelEditorStore,
  announce: (message: string) => void,
): () => void {
  const apply = (change: (properties: CustomProperty[]) => void) => {
    try {
      changeCustomProperties(store, change);
    } catch (e) {
      const snapshot = store.status.snapshot;
      const entity = activeScene(snapshot).entities.find(
        (e) => e.id === snapshot.selectedEntityIds.at(-1),
      );
      const panel = host.querySelector('.custom-properties');
      if (entity && panel)
        panel.outerHTML = customPropertyInspector(snapshot, entity);
      announce(e instanceof Error ? e.message : String(e));
    }
  };
  const click = (event: MouseEvent) => {
    const button = (event.target as Element).closest<HTMLButtonElement>(
      'button',
    );
    if (!button) return;
    if (button.hasAttribute('data-custom-add')) {
      const name =
        host
          .querySelector<HTMLInputElement>('[data-custom-new-name]')
          ?.value.trim() ?? '';
      const type = host.querySelector<HTMLSelectElement>(
        '[data-custom-new-type]',
      )?.value as CustomProperty['type'];
      apply((properties) => {
        properties.push({
          name,
          type,
          value:
            type === 'number'
              ? 0
              : type === 'boolean'
                ? false
                : type === 'color'
                  ? '#ffffff'
                  : '',
        });
      });
    } else if (button.dataset.customDelete !== undefined)
      apply((properties) => {
        properties.splice(Number(button.dataset.customDelete), 1);
      });
  };
  const change = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const index = input.dataset.customName ?? input.dataset.customValue;
    if (index === undefined) return;
    apply((properties) => {
      const p = properties[Number(index)];
      if (!p) return;
      if (input.dataset.customName !== undefined) p.name = input.value.trim();
      else p.value = parseCustomValue(p.type, input.value);
    });
  };
  host.addEventListener('click', click);
  host.addEventListener('change', change);
  return () => {
    host.removeEventListener('click', click);
    host.removeEventListener('change', change);
  };
}
