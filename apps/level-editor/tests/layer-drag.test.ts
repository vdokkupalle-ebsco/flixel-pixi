import { describe, expect, it, vi } from 'vitest';
import { LevelEditorStore } from '../src/editor-store';
import {
  createInitialProject,
  activeLayer,
  activeScene,
  activeSceneSettings,
  sceneLayers,
} from '../src/model';
import {
  createLayerGroup,
  dropLayer,
  layerDropPlan,
  moveLayerToGroup,
  orderedLayers,
} from '../src/layer-editing';
const dnd = vi.hoisted(() => ({
  events: new Map<
    string,
    (event: {
      operation: {
        source: { id: string; element: HTMLElement };
        target: { id: string; element: HTMLElement };
        position: { current: { x: number; y: number } };
      };
      canceled?: boolean;
    }) => void
  >(),
  stop: vi.fn(),
}));
vi.mock('@dnd-kit/dom', () => ({
  DragDropManager: class {
    monitor = {
      addEventListener: (
        name: string,
        callback: (event: {
          operation: {
            source: { id: string; element: HTMLElement };
            target: { id: string; element: HTMLElement };
            position: { current: { x: number; y: number } };
          };
          canceled?: boolean;
        }) => void,
      ) => dnd.events.set(name, callback),
    };
    actions = { stop: dnd.stop };
    registry = { plugins: { get: () => ({ overlay: undefined }) } };
    destroy = vi.fn();
  },
  Draggable: class {
    destroy = vi.fn();
  },
  Droppable: class {
    destroy = vi.fn();
  },
  Feedback: { configure: vi.fn() },
  PointerSensor: { configure: vi.fn() },
  PointerActivationConstraints: {
    Distance: class {
      value = 4;
    },
  },
}));
import { mountLayerDrag } from '../src/layer-drag';
import { addGameplayObject } from '../src/gameplay-objects';
const editor = () =>
  new LevelEditorStore({
    document: createInitialProject(),
    selectedEntityIds: [],
    tool: 'select',
    snapToGrid: true,
  });
const ids = (store: LevelEditorStore) =>
  orderedLayers(store.status.snapshot).map((l) => l.id);

describe('layer drop operations', () => {
  it('reorders before/after siblings and preserves undo/redo', () => {
    const store = editor(),
      before = store.status.snapshot;
    expect(
      dropLayer(store, 'layer-background', {
        targetId: 'layer-gameplay',
        position: 'before',
      }),
    ).toBe(true);
    const order = ids(store);
    expect(order.indexOf('layer-background') + 1).toBe(
      order.indexOf('layer-gameplay'),
    );
    store.undo();
    expect(store.status.snapshot).toEqual(before);
    store.redo();
    expect(ids(store)).toEqual(order);
    expect(
      dropLayer(store, 'layer-background', {
        targetId: 'layer-gameplay',
        position: 'after',
      }),
    ).toBe(true);
    expect(ids(store)).toEqual(orderedLayers(before).map((l) => l.id));
  });
  it('moves into, between and out of nested groups in one undo step', () => {
    const store = editor(),
      outer = createLayerGroup(store),
      inner = createLayerGroup(store);
    moveLayerToGroup(store, inner, outer);
    expect(
      dropLayer(store, 'layer-gameplay', {
        targetId: inner,
        position: 'inside',
      }),
    ).toBe(true);
    expect(
      sceneLayers(store.status.snapshot).find((l) => l.id === 'layer-gameplay')
        ?.parentId,
    ).toBe(inner);
    const before = store.status.snapshot;
    expect(dropLayer(store, inner, { position: 'root' })).toBe(true);
    expect(ids(store).slice(-2)).toEqual([inner, 'layer-gameplay']);
    store.undo();
    expect(store.status.snapshot).toEqual(before);
    expect(
      dropLayer(store, 'layer-gameplay', {
        targetId: inner,
        position: 'after',
      }),
    ).toBe(true);
    expect(
      sceneLayers(store.status.snapshot).find((l) => l.id === 'layer-gameplay')
        ?.parentId,
    ).toBe(outer);
    expect(dropLayer(store, 'layer-gameplay', { position: 'root' })).toBe(true);
    expect(
      sceneLayers(store.status.snapshot).find((l) => l.id === 'layer-gameplay')
        ?.parentId,
    ).toBeUndefined();
  });
  it('rejects cycles, invalid groups, locked sources/parents and no-op drops', () => {
    const store = editor(),
      group = createLayerGroup(store);
    moveLayerToGroup(store, 'layer-gameplay', group);
    const revision = store.status.revision;
    expect(
      dropLayer(store, group, {
        targetId: 'layer-gameplay',
        position: 'before',
      }),
    ).toBe(false);
    expect(
      dropLayer(store, group, { targetId: group, position: 'inside' }),
    ).toBe(false);
    expect(
      dropLayer(store, 'layer-background', {
        targetId: 'layer-gameplay',
        position: 'inside',
      }),
    ).toBe(false);
    expect(dropLayer(store, 'missing', { position: 'root' })).toBe(false);
    expect(dropLayer(store, 'layer-background', { position: 'root' })).toBe(
      false,
    );
    expect(store.status.revision).toBe(revision);
    store.update('Lock group', (draft) => {
      activeLayer(draft).locked = true;
    });
    expect(
      layerDropPlan(store.status.snapshot, 'layer-background', {
        targetId: group,
        position: 'inside',
      }),
    ).toBeUndefined();
    expect(
      layerDropPlan(store.status.snapshot, 'layer-gameplay', {
        position: 'root',
      }),
    ).toBeUndefined();
    expect(
      layerDropPlan(store.status.snapshot, 'layer-background', {
        targetId: 'layer-gameplay',
        position: 'after',
      }),
    ).toBeUndefined();
  });
});

it('bridges dnd-kit events to one undoable move and cleans up visual feedback', async () => {
  const store = editor(),
    group = createLayerGroup(store);
  const host = document.createElement('div');
  host.innerHTML = `<section class="layer-group" data-layer-id="layer-gameplay" aria-label="Gameplay"><div class="layer-row"><button class="layer-main" data-layer-draggable="true">Gameplay</button></div></section><section class="layer-group" data-layer-id="${group}" aria-label="Group" aria-expanded="false"><div class="layer-row">Group</div></section><div data-layer-root-drop>Scene root</div>`;
  document.body.append(host);
  const sourceElement = host.querySelector<HTMLElement>('.layer-group'),
    targetElement = host.querySelector<HTMLElement>('[aria-label="Group"]');
  if (!sourceElement || !targetElement) throw new Error('Missing fixture');
  vi.spyOn(targetElement, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 200, 40),
  );
  const row = targetElement.querySelector<HTMLElement>('.layer-row');
  if (!row) throw new Error('Missing row');
  vi.spyOn(row, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 200, 40),
  );
  const moved = vi.fn(),
    controller = mountLayerDrag(host, store, moved);
  const operation = {
    source: { id: 'layer-gameplay', element: sourceElement },
    target: { id: group, element: targetElement },
    position: { current: { x: 40, y: 20 } },
  };
  dnd.events.get('dragstart')?.({ operation });
  expect(document.querySelector('.layer-drag-overlay')).not.toBeNull();
  const placeholder = host.querySelector<HTMLElement>(
    '.layer-drop-placeholder',
  );
  expect(placeholder?.dataset.dropPosition).toBe('inside');
  expect(targetElement.nextElementSibling).toBe(placeholder);
  expect(targetElement.dataset.layerDrop).toBeUndefined();
  if (!placeholder) throw new Error('Missing insertion placeholder');
  const slotOperation = {
    ...operation,
    target: { id: 'layer-insertion-placeholder', element: placeholder },
  };
  dnd.events.get('dragover')?.({ operation: slotOperation });
  expect(host.querySelector('.layer-drop-placeholder')).toBe(placeholder);
  dnd.events.get('dragend')?.({ operation: slotOperation, canceled: false });
  expect(host.querySelector('.layer-drop-placeholder')).toBeNull();
  await Promise.resolve();
  expect(moved).toHaveBeenCalledOnce();
  expect(
    sceneLayers(store.status.snapshot).find((l) => l.id === 'layer-gameplay')
      ?.parentId,
  ).toBe(group);
  expect(host.classList.contains('dragging-layer')).toBe(false);
  store.undo();
  expect(
    sceneLayers(store.status.snapshot).find((l) => l.id === 'layer-gameplay')
      ?.parentId,
  ).toBeUndefined();
  dnd.events.get('dragstart')?.({ operation });
  dnd.events.get('dragend')?.({ operation, canceled: true });
  await Promise.resolve();
  expect(moved).toHaveBeenCalledOnce();
  dnd.events.get('dragstart')?.({ operation });
  store.update('Other edit', (draft) => {
    activeSceneSettings(draft).background = '#112233';
  });
  expect(dnd.stop).toHaveBeenCalledWith({ canceled: true });
  controller.destroy();
  host.remove();
  vi.restoreAllMocks();
  expect(document.querySelector('.layer-drag-overlay')).toBeNull();
});

it('previews object destinations, drops through the placeholder, and cancels without mutation', async () => {
  const store = editor();
  addGameplayObject(store, 'spawn-point');
  const id = required(activeScene(store.status.snapshot).entities[0]).id;
  const host = document.createElement('div');
  host.innerHTML = `<div class="tree-row" data-entity-id="${id}"><button class="tree-main" data-object-draggable="true"><strong>Spawn</strong></button></div><section class="layer-group" data-layer-id="layer-background" aria-label="Background"><div class="layer-row"><button class="layer-main">Background</button></div></section>`;
  document.body.append(host);
  const moved = vi.fn();
  const controller = mountLayerDrag(host, store, vi.fn(), moved);
  const operation = {
    source: {
      id: `object:${id}`,
      element: required(host.querySelector<HTMLElement>('.tree-row')),
    },
    target: {
      id: 'layer-background',
      element: required(host.querySelector<HTMLElement>('.layer-group')),
    },
    position: { current: { x: 40, y: 20 } },
  };
  const before = store.status.snapshot;
  dnd.events.get('dragstart')?.({ operation });
  const placeholder = required(
    host.querySelector<HTMLElement>('.layer-drop-placeholder'),
  );
  expect(placeholder.textContent).toContain('Move to Background');
  expect(placeholder.parentElement).toBe(operation.target.element);
  dnd.events.get('dragend')?.({ operation, canceled: true });
  await Promise.resolve();
  expect(store.status.snapshot).toEqual(before);
  expect(host.querySelector('.layer-drop-placeholder')).toBeNull();
  dnd.events.get('dragstart')?.({ operation });
  const slot = required(
    host.querySelector<HTMLElement>('.layer-drop-placeholder'),
  );
  const drop = {
    ...operation,
    target: { id: 'layer-insertion-placeholder', element: slot },
  };
  dnd.events.get('dragover')?.({ operation: drop });
  expect(host.querySelector('.layer-drop-placeholder')).toBe(slot);
  dnd.events.get('dragend')?.({ operation: drop });
  await Promise.resolve();
  expect(moved).toHaveBeenCalledWith(id, 'layer-background');
  expect(
    required(activeScene(store.status.snapshot).entities[0]).properties
      ?.layerId,
  ).toBe('layer-background');
  store.undo();
  expect(store.status.snapshot).toEqual(before);
  dnd.events.get('dragstart')?.({ operation });
  store.update('Other edit', (draft) => {
    activeSceneSettings(draft).background = '#112233';
  });
  dnd.events.get('dragend')?.({ operation });
  await Promise.resolve();
  expect(moved).toHaveBeenCalledTimes(1);
  controller.destroy();
  host.remove();
  expect(document.querySelector('.layer-drag-overlay')).toBeNull();
});

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing test fixture');
  return value;
}
