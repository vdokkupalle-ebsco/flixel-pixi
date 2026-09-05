import {
  DragDropManager,
  Draggable,
  Droppable,
  Feedback,
  PointerSensor,
  PointerActivationConstraints,
  type DragMoveEvent,
} from '@dnd-kit/dom';
import type { LevelEditorStore } from './editor-store';
import { dropLayer, layerDropPlan, type LayerDrop } from './layer-editing';
import { sceneLayers, type LevelEditorSnapshot } from './model';
import { layerSubtree } from './layer-groups';
import {
  canMoveObjectToLayer,
  objectsInLayer,
  reorderObject,
  moveObjectToLayer,
} from './object-layer-editing';

/** dnd-kit owns sensors, collision tracking, keyboard control and auto-scrolling. */
export function mountLayerDrag(
  host: HTMLElement,
  store: LevelEditorStore,
  onMoved: (id: string, drop: LayerDrop) => void,
  onObjectMoved?: (id: string, layerId: string) => void,
) {
  const manager = new DragDropManager({
    sensors: (defaults) => [
      ...defaults,
      PointerSensor.configure({
        activationConstraints: [
          new PointerActivationConstraints.Distance({ value: 4 }),
        ],
      }),
    ],
    plugins: (defaults) => [
      ...defaults,
      Feedback.configure({ dropAnimation: null }),
    ],
  });
  let entities: (Draggable | Droppable)[] = [];
  let snapshot: LevelEditorSnapshot | undefined;
  let revision = -1;
  let overlay: HTMLElement | undefined;
  let hint: HTMLElement | undefined;
  let sourceElement: HTMLElement | undefined;
  let lastKey = '';
  let selectedDrop: LayerDrop | undefined;
  let objectId: string | undefined;
  let objectLayerId: string | undefined;
  let objectOrder: { id: string; position: 'before' | 'after' } | undefined;
  let placeholder: HTMLElement | undefined;
  let placeholderTarget: Droppable | undefined;
  let destroyed = false;
  let suppressClick = false;
  let clickTimer: ReturnType<typeof setTimeout> | undefined;
  const floating = new Set<HTMLElement>();
  const clear = () => {
    placeholderTarget?.destroy();
    placeholderTarget = undefined;
    placeholder?.remove();
    placeholder = undefined;
    sourceElement?.classList.remove('layer-drag-source');
    sourceElement = undefined;
    host.classList.remove('dragging-layer', 'dragging-object');
    selectedDrop = undefined;
    objectId = undefined;
    objectLayerId = undefined;
    objectOrder = undefined;
    lastKey = '';
    snapshot = undefined;
  };
  const update = (operation: DragMoveEvent['operation']) => {
    if (!snapshot || !operation.source) return;
    const point = operation.position.current;

    const target = operation.target;
    let drop: LayerDrop | undefined;
    let element: HTMLElement | undefined;
    if (target?.id === 'layer-insertion-placeholder') return;
    if (objectId) {
      const element = target?.element;
      const layerId =
        element instanceof HTMLElement ? element.dataset.layerId : undefined;
      const sameLayer =
        layerId &&
        objectsInLayer(snapshot, layerId).some((e) => e.id === objectId);
      const rows =
        sameLayer && element instanceof HTMLElement
          ? [...element.querySelectorAll<HTMLElement>('.tree-row')].filter(
              (row) => row.dataset.entityId !== objectId,
            )
          : [];
      const row =
        rows.find((row) => point.y < row.getBoundingClientRect().bottom) ??
        rows.at(-1);
      const position =
        row &&
        point.y <
          row.getBoundingClientRect().top +
            row.getBoundingClientRect().height / 2
          ? 'before'
          : 'after';
      const order = row?.dataset.entityId
        ? ({ id: row.dataset.entityId, position } as const)
        : undefined;
      const siblings = layerId
        ? objectsInLayer(snapshot, layerId).map((e) => e.id)
        : [];
      const sourceIndex = siblings.indexOf(objectId);
      const targetIndex = order ? siblings.indexOf(order.id) : -1;
      const changesOrder =
        order &&
        (order.position === 'before'
          ? sourceIndex !== targetIndex - 1
          : sourceIndex !== targetIndex + 1);
      const valid =
        layerId &&
        (canMoveObjectToLayer(snapshot, objectId, layerId) || changesOrder);
      const key = valid
        ? `object:${layerId}:${order?.id ?? ''}:${order?.position ?? ''}`
        : '';
      if (key === lastKey) return;
      lastKey = key;
      placeholderTarget?.destroy();
      placeholderTarget = undefined;
      placeholder?.remove();
      placeholder = undefined;
      objectLayerId = valid ? layerId : undefined;
      objectOrder = order;
      if (objectLayerId && element instanceof HTMLElement) {
        const name =
          sourceElement?.querySelector('strong')?.textContent ?? 'Object';
        const layerName = element.getAttribute('aria-label') ?? 'layer';
        placeholder = document.createElement('div');
        placeholder.className = 'layer-drop-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.textContent = `${name} · Move to ${layerName}`;
        if (row && order) {
          placeholder.textContent = `${name} · Place ${position === 'before' ? 'above' : 'below'}`;
          if (position === 'before') row.before(placeholder);
          else row.after(placeholder);
        } else element.querySelector('.layer-row')?.after(placeholder);
        placeholderTarget = new Droppable(
          {
            id: 'layer-insertion-placeholder',
            element: placeholder,
            collisionPriority: 2,
          },
          manager,
        );
        if (hint) hint.textContent = `Move to ${layerName}`;
      } else if (hint)
        hint.textContent = 'Choose an unlocked content layer · Esc to cancel';
      return;
    }
    if (target?.id === 'scene-root-drop') {
      drop = { position: 'root' };
      element = target.element as HTMLElement;
    } else if (target?.element instanceof HTMLElement) {
      element = target.element;
      const id = element.dataset.layerId;
      const rect = element.getBoundingClientRect();
      const row = element.querySelector<HTMLElement>('.layer-row');
      const headerHeight = row?.getBoundingClientRect().height ?? rect.height;
      const group = element.hasAttribute('aria-expanded');
      const fraction =
        (point.y - rect.top) / (group ? headerHeight : rect.height);
      if (id)
        drop = {
          targetId: id,
          position:
            group && fraction >= 0.25 && fraction <= 0.75
              ? 'inside'
              : fraction < 0.5
                ? 'before'
                : 'after',
        };
    }
    const key = drop ? JSON.stringify(drop) : '';
    if (key === lastKey) return;
    lastKey = key;
    placeholderTarget?.destroy();
    placeholderTarget = undefined;
    placeholder?.remove();
    placeholder = undefined;
    selectedDrop =
      drop && layerDropPlan(snapshot, String(operation.source.id), drop)
        ? drop
        : undefined;
    if (selectedDrop && element) {
      placeholder = document.createElement('div');
      placeholder.className = 'layer-drop-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.dataset.dropPosition = selectedDrop.position;
      const name =
        sourceElement?.querySelector('strong')?.textContent ?? 'Layer';
      placeholder.textContent = `${name} · ${selectedDrop.position === 'inside' ? 'Move into group' : selectedDrop.position === 'root' ? 'Move to scene root' : 'Drop here'}`;
      const sections = [...host.querySelectorAll<HTMLElement>('.layer-group')];
      const level = Number(element.getAttribute('aria-level') ?? 1);
      placeholder.style.marginLeft = `${6 + (selectedDrop.position === 'inside' ? level : level - 1) * 16}px`;
      if (selectedDrop.position === 'before') element.before(placeholder);
      else if (selectedDrop.position === 'inside') element.after(placeholder);
      else if (selectedDrop.position === 'after') {
        const subtree = layerSubtree(
          selectedDrop.targetId,
          sceneLayers(snapshot),
        );
        const last = sections
          .filter((section) => subtree.has(section.dataset.layerId ?? ''))
          .at(-1);
        (last ?? element).after(placeholder);
      } else {
        placeholder.style.marginLeft = '6px';
        const last = sections.at(-1);
        if (last) last.after(placeholder);
        else element.after(placeholder);
      }
      // The inserted slot is itself a target, so hovering it does not collapse
      // the gap or switch to the row that moved beneath the pointer.
      placeholderTarget = new Droppable(
        {
          id: 'layer-insertion-placeholder',
          element: placeholder,
          collisionPriority: 2,
        },
        manager,
      );
    }
    if (hint)
      hint.textContent = selectedDrop
        ? selectedDrop.position === 'root'
          ? 'Move to scene root'
          : `${selectedDrop.position === 'inside' ? 'Move into' : selectedDrop.position === 'before' ? 'Place above' : 'Place below'} ${element?.getAttribute('aria-label') ?? 'layer'}`
        : 'Choose a destination · Esc to cancel';
  };
  manager.monitor.addEventListener('dragstart', ({ operation }) => {
    const element = operation.source?.element;
    if (!(element instanceof HTMLElement)) return;
    snapshot = store.status.snapshot;
    revision = store.status.revision;
    sourceElement = element;
    objectId = element.dataset.entityId;
    const rect = element.getBoundingClientRect();
    overlay = document.createElement('div');
    overlay.className = 'layer-drag-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.inert = true;
    overlay.style.width = `${rect.width}px`;
    const clone =
      element.querySelector('.layer-row')?.cloneNode(true) ??
      element.cloneNode(true);
    overlay.append(clone);
    hint = document.createElement('div');
    hint.className = 'layer-drag-hint';
    hint.textContent = 'Choose a destination · Esc to cancel';
    overlay.append(hint);
    document.body.append(overlay);
    const feedback = manager.registry.plugins.get(Feedback);
    if (feedback) feedback.overlay = overlay;
    floating.add(overlay);
    sourceElement.classList.add('layer-drag-source');
    host.classList.add(objectId ? 'dragging-object' : 'dragging-layer');
    update(operation);
  });
  manager.monitor.addEventListener('dragmove', ({ operation }) =>
    update(operation),
  );
  manager.monitor.addEventListener('dragover', ({ operation }) =>
    update(operation),
  );
  manager.monitor.addEventListener('dragend', ({ operation, canceled }) => {
    update(operation);
    const id = operation.source?.id,
      drop = selectedDrop,
      movedObjectId = objectId,
      destinationLayerId = objectLayerId,
      destinationOrder = objectOrder,
      ghost = overlay,
      oldElement = sourceElement;
    const ghostRect = ghost?.getBoundingClientRect();
    const valid = !canceled && revision === store.status.revision;
    const feedback = manager.registry.plugins.get(Feedback);
    if (feedback) feedback.overlay = undefined;
    overlay = undefined;
    hint = undefined;
    clear();
    suppressClick = true;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      suppressClick = false;
    }, 0);
    // Let dnd-kit finish its operation before the store replaces the hierarchy DOM.
    queueMicrotask(() => {
      if (destroyed) {
        ghost?.remove();
        return;
      }
      const objectMoved =
        valid &&
        movedObjectId &&
        destinationLayerId &&
        (destinationOrder
          ? reorderObject(
              store,
              movedObjectId,
              destinationOrder.id,
              destinationOrder.position,
            )
          : moveObjectToLayer(store, movedObjectId, destinationLayerId));
      if (objectMoved) onObjectMoved?.(movedObjectId, destinationLayerId);
      const moved =
        !movedObjectId &&
        id !== undefined &&
        drop &&
        valid &&
        dropLayer(store, String(id), drop);
      if (moved && drop) onMoved(String(id), drop);
      const destination = movedObjectId
        ? host.querySelector<HTMLElement>(
            `.tree-row[data-entity-id="${CSS.escape(movedObjectId)}"]`,
          )
        : id !== undefined
          ? host.querySelector<HTMLElement>(
              `.layer-group[data-layer-id="${CSS.escape(String(id))}"]`,
            )
          : oldElement;
      const rect = destination?.getBoundingClientRect();
      const remove = () => {
        ghost?.remove();
        if (ghost) floating.delete(ghost);
      };
      if (ghost && ghostRect) {
        ghost.style.cssText = `position:fixed;left:0;top:0;width:${ghostRect.width}px;transform:translate3d(${ghostRect.left}px,${ghostRect.top}px,0)`;
      }
      if (
        ghost &&
        rect &&
        typeof ghost.animate === 'function' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        const animation = ghost.animate(
          [
            { transform: ghost.style.transform, opacity: 1 },
            {
              transform: `translate3d(${rect.left}px, ${rect.top}px, 0)`,
              opacity: 0,
            },
          ],
          { duration: 140, easing: 'cubic-bezier(.2,.8,.2,1)' },
        );
        animation.finished.then(remove, remove);
      } else remove();
    });
  });
  const refresh = () => {
    if (snapshot) manager.actions.stop({ canceled: true });
    for (const entity of entities) entity.destroy();
    entities = [];
    for (const element of host.querySelectorAll<HTMLElement>('.layer-group')) {
      const id = element.dataset.layerId,
        handle = element.querySelector<HTMLElement>('.layer-main');
      if (!id || !handle) continue;
      entities.push(
        new Draggable(
          {
            id,
            element: handle.closest<HTMLElement>('.layer-row') ?? element,
            handle,
            disabled: handle.dataset.layerDraggable !== 'true',
          },
          manager,
        ),
      );
      entities.push(
        new Droppable(
          {
            id,
            element,
            accept: (source) => {
              const current = snapshot ?? store.status.snapshot;
              const entityId = source.data.entityId as string | undefined;
              if (entityId)
                return (
                  canMoveObjectToLayer(current, entityId, id) ||
                  (objectsInLayer(current, id).length > 1 &&
                    objectsInLayer(current, id).some((e) => e.id === entityId))
                );
              return (['before', 'after', 'inside'] as const).some((position) =>
                layerDropPlan(current, String(source.id), {
                  targetId: id,
                  position,
                }),
              );
            },
          },
          manager,
        ),
      );
    }
    for (const element of host.querySelectorAll<HTMLElement>(
      '.tree-row[data-entity-id]',
    )) {
      const handle = element.querySelector<HTMLElement>('.tree-main');
      if (!handle) continue;
      entities.push(
        new Draggable(
          {
            id: `object:${element.dataset.entityId}`,
            data: { entityId: element.dataset.entityId },
            element,
            handle,
            disabled: handle.dataset.objectDraggable !== 'true',
          },
          manager,
        ),
      );
    }
    const root = host.querySelector<HTMLElement>('[data-layer-root-drop]');
    if (root)
      entities.push(
        new Droppable(
          {
            id: 'scene-root-drop',
            element: root,
            accept: (source) =>
              !source.data.entityId &&
              !!layerDropPlan(
                snapshot ?? store.status.snapshot,
                String(source.id),
                { position: 'root' },
              ),
          },
          manager,
        ),
      );
  };
  const click = (event: MouseEvent) => {
    if (suppressClick) {
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressClick = false;
    }
  };
  host.addEventListener('click', click, true);
  const unsubscribe = store.subscribe((status) => {
    if (snapshot && revision !== status.revision)
      manager.actions.stop({ canceled: true });
  });
  refresh();
  return {
    refresh,
    destroy: () => {
      destroyed = true;
      unsubscribe();
      manager.destroy();
      clear();
      clearTimeout(clickTimer);
      for (const node of floating) node.remove();
      floating.clear();
      host.removeEventListener('click', click, true);
    },
  };
}
