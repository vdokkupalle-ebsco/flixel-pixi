import type { EntityDefinition } from '@flixel-pixi/schemas';
import type { LevelEditorStore } from './editor-store';
import { objectEditable } from './gameplay-objects';
import {
  activeScene,
  entityProperties,
  type LevelEditorSnapshot,
} from './model';

export const alignmentActions = {
  left: 'Align left',
  center: 'Align horizontal centers',
  right: 'Align right',
  top: 'Align top',
  middle: 'Align vertical centers',
  bottom: 'Align bottom',
  horizontal: 'Distribute horizontal centers',
  vertical: 'Distribute vertical centers',
} as const;
export type AlignmentAction = keyof typeof alignmentActions;

/** Axis-aligned bounds after scale, origin and rotation. Spawn points are positions. */
export function objectBounds(entity: EntityDefinition) {
  const p = entityProperties(entity);
  const width =
    entity.type === 'spawn-point'
      ? 0
      : Number(p.width ?? 64) * (entity.scale?.x ?? 1);
  const height =
    entity.type === 'spawn-point'
      ? 0
      : Number(p.height ?? 64) * (entity.scale?.y ?? 1);
  const left = -width * Number(p.originX ?? 0.5);
  const top = -height * Number(p.originY ?? 0.5);
  const c = Math.cos(entity.rotation ?? 0),
    s = Math.sin(entity.rotation ?? 0);
  const points = [
    [left, top],
    [left + width, top],
    [left + width, top + height],
    [left, top + height],
  ].map(([x = 0, y = 0]) => ({
    x: entity.position.x + x * c - y * s,
    y: entity.position.y + x * s + y * c,
  }));
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  return {
    left: minX,
    right: maxX,
    top: minY,
    bottom: maxY,
    center: (minX + maxX) / 2,
    middle: (minY + maxY) / 2,
  };
}

export function alignmentSelection(snapshot: LevelEditorSnapshot) {
  return activeScene(snapshot).entities.filter((e) =>
    snapshot.selectedEntityIds.includes(e.id),
  );
}

export function alignObjects(
  store: LevelEditorStore,
  action: AlignmentAction,
): boolean {
  const snapshot = store.status.snapshot;
  const selected = alignmentSelection(snapshot);
  const distribution = action === 'horizontal' || action === 'vertical';
  if (
    selected.length < (distribution ? 3 : 2) ||
    selected.some((e) => !objectEditable(snapshot, e))
  )
    return false;
  const entries = selected.map((entity) => ({
    entity,
    bounds: objectBounds(entity),
  }));
  const moves = new Map<string, { x: number; y: number }>();
  if (distribution) {
    const key = action === 'horizontal' ? 'center' : 'middle';
    const axis = action === 'horizontal' ? 'x' : 'y';
    entries.sort((a, b) => a.bounds[key] - b.bounds[key]);
    const first = entries[0],
      last = entries.at(-1);
    if (!first || !last) return false;
    const step = (last.bounds[key] - first.bounds[key]) / (entries.length - 1);
    entries.forEach((entry, i) => {
      moves.set(entry.entity.id, {
        ...entry.entity.position,
        [axis]:
          entry.entity.position[axis] +
          first.bounds[key] +
          step * i -
          entry.bounds[key],
      });
    });
  } else {
    const horizontal =
      action === 'left' || action === 'center' || action === 'right';
    const axis = horizontal ? 'x' : 'y';
    const min = Math.min(
      ...entries.map((e) => (horizontal ? e.bounds.left : e.bounds.top)),
    );
    const max = Math.max(
      ...entries.map((e) => (horizontal ? e.bounds.right : e.bounds.bottom)),
    );
    const target =
      action === 'left' || action === 'top'
        ? min
        : action === 'right' || action === 'bottom'
          ? max
          : (min + max) / 2;
    entries.forEach((entry) =>
      moves.set(entry.entity.id, {
        ...entry.entity.position,
        [axis]: entry.entity.position[axis] + target - entry.bounds[action],
      }),
    );
  }
  const changed = selected.some((e) => {
    const p = moves.get(e.id);
    return (
      p &&
      (Math.abs(p.x - e.position.x) > 1e-8 ||
        Math.abs(p.y - e.position.y) > 1e-8)
    );
  });
  if (!changed) return false;
  store.update(alignmentActions[action], (draft) => {
    for (const entity of activeScene(draft).entities) {
      const position = moves.get(entity.id);
      if (position) entity.position = position;
    }
  });
  return true;
}

export function alignmentControls(snapshot: LevelEditorSnapshot): string {
  const selected = alignmentSelection(snapshot);
  if (selected.length < 2) return '';
  const locked = selected.some((e) => !objectEditable(snapshot, e));
  const labels: Record<AlignmentAction, string> = {
    left: 'Left',
    center: 'Center',
    right: 'Right',
    top: 'Top',
    middle: 'Middle',
    bottom: 'Bottom',
    horizontal: 'Horizontal',
    vertical: 'Vertical',
  };
  const button = (action: AlignmentAction, minimum: number) =>
    `<button type="button" class="button ghost" data-action="align-objects" data-alignment="${action}" aria-label="${alignmentActions[action]}" title="${locked ? 'Unlock all selected objects and their layers to arrange them' : selected.length < minimum ? `Select at least ${minimum} objects` : alignmentActions[action]}" ${locked || selected.length < minimum ? 'disabled' : ''}>${labels[action]}</button>`;
  return `<fieldset class="selection-arrange"><legend>${selected.length} objects selected</legend><p class="field-help">${locked ? 'Unlock all selected objects and their layers to arrange them.' : 'Align to selection bounds. Distribute centers between the outermost objects.'}</p><div class="alignment-grid" role="group" aria-label="Align selected objects">${(['left', 'center', 'right', 'top', 'middle', 'bottom'] as const).map((a) => button(a, 2)).join('')}</div><div class="distribution-grid" role="group" aria-label="Distribute selected objects">${button('horizontal', 3)}${button('vertical', 3)}</div>${selected.length < 3 ? '<p class="field-help">Select at least 3 objects to distribute.</p>' : ''}<p class="field-help">Properties below apply to the last selected object.</p></fieldset>`;
}
