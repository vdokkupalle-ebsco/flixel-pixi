import { afterEach, expect, it, vi } from 'vitest';
import { LevelEditorStore } from '../src/editor-store';
import {
  activeLayer,
  activeScene,
  activeSceneSettings,
  createInitialProject,
  parseLevelProject,
  sceneLayers,
  type LevelEditorSnapshot,
} from '../src/model';
import {
  addGameplayObject,
  addObjectLayer,
  changeCustomProperties,
  customProperties,
  parseCustomValue,
  validateCustomProperties,
} from '../src/gameplay-objects';
import {
  customPropertyInspector,
  gameplayInspector,
  mountCustomProperties,
} from '../src/gameplay-inspector';
const entityOf = (snapshot: LevelEditorSnapshot) => {
  const entity = activeScene(snapshot).entities[0];
  if (!entity) throw new Error('Missing entity');
  return entity;
};
const storeForTest = () =>
  new LevelEditorStore({
    document: createInitialProject(),
    selectedEntityIds: [],
    tool: 'select',
    snapToGrid: true,
  });
afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

it('creates an object layer with a spawn point, reuses it, and undoes atomically', () => {
  const store = storeForTest();
  const original = sceneLayers(store.status.snapshot).length;
  addGameplayObject(store, 'spawn-point');
  expect(activeLayer(store.status.snapshot).kind).toBe('objects');
  expect(activeScene(store.status.snapshot).entities[0]).toMatchObject({
    type: 'spawn-point',
    properties: { gameplayClass: 'SpawnPoint' },
  });
  expect(sceneLayers(store.status.snapshot)).toHaveLength(original + 1);
  store.undo();
  expect(activeScene(store.status.snapshot).entities).toHaveLength(0);
  expect(sceneLayers(store.status.snapshot)).toHaveLength(original);
  store.redo();
  store.update(
    'Choose mixed layer',
    (draft) => {
      activeSceneSettings(draft).activeLayerId = 'layer-gameplay';
    },
    false,
  );
  addGameplayObject(store, 'trigger');
  expect(sceneLayers(store.status.snapshot)).toHaveLength(original + 1);
  expect(activeScene(store.status.snapshot).entities[1]).toMatchObject({
    type: 'trigger',
    properties: { width: 128, height: 80 },
  });
  const parsed = parseLevelProject(
    JSON.parse(JSON.stringify(store.status.snapshot.document)),
  );
  expect(parsed.scenes[0]?.entities).toHaveLength(2);
});

it('preserves typed properties through save/load and undo, and rejects invalid or duplicate values', () => {
  const store = storeForTest();
  addGameplayObject(store, 'region');
  changeCustomProperties(store, (p) =>
    p.push(
      { name: 'team', type: 'string', value: 'blue' },
      { name: 'damage', type: 'number', value: 12.5 },
      { name: 'once', type: 'boolean', value: true },
      { name: 'tint', type: 'color', value: '#aa00ff' },
    ),
  );
  const saved = JSON.parse(JSON.stringify(store.status.snapshot.document));
  expect(() => parseLevelProject(saved)).not.toThrow();
  store.undo();
  expect(customProperties(entityOf(store.status.snapshot))).toEqual([]);
  store.redo();
  const before = store.status.revision;
  expect(() =>
    changeCustomProperties(store, (p) =>
      p.push({ name: 'damage', type: 'number', value: 3 }),
    ),
  ).toThrow('unique');
  expect(store.status.revision).toBe(before);
  for (const invalid of [NaN, Infinity, '3'])
    expect(() =>
      validateCustomProperties([
        { name: 'damage', type: 'number', value: invalid },
      ]),
    ).toThrow();
  expect(() => parseCustomValue('number', '')).toThrow();
  expect(() => parseCustomValue('boolean', 'yes')).toThrow();
  saved.scenes[0].entities[0].properties.customProperties[0].type = 'script';
  expect(() => parseLevelProject(saved)).toThrow();
});

it('blocks creation and property edits on locked layers and rejects tile-filled object layers', () => {
  const store = storeForTest();
  addGameplayObject(store, 'region');
  store.update('Lock', (draft) => {
    activeLayer(draft).locked = true;
  });
  expect(() => addGameplayObject(store, 'spawn-point')).toThrow('Unlock');
  expect(() =>
    changeCustomProperties(store, (p) =>
      p.push({ name: 'x', type: 'number', value: 1 }),
    ),
  ).toThrow('Unlock');
  const snapshot = store.status.snapshot;
  const entity = entityOf(snapshot);
  expect(gameplayInspector(snapshot, entity)).toContain('<fieldset disabled>');
  expect(customPropertyInspector(snapshot, entity)).toContain('disabled');
  const doc = JSON.parse(JSON.stringify(snapshot.document));
  const editableStore = storeForTest();
  editableStore.update('Object layer', addObjectLayer);
  expect(() =>
    editableStore.update('Invalid tiles', (draft) => {
      activeLayer(draft).tilemap = {
        tileSize: 16,
        cells: {
          '0,0': {
            assetId: 'asset-flixel-mark',
            x: 0,
            y: 0,
            width: 16,
            height: 16,
          },
        },
      };
    }),
  ).toThrow('cannot contain tiles');
  expect(() => parseLevelProject(doc)).not.toThrow();
});

it('edits typed properties through inspector events and restores invalid input', () => {
  const store = storeForTest();
  addGameplayObject(store, 'spawn-point');
  const host = document.createElement('div');
  document.body.append(host);
  const unsubscribe = store.subscribe(({ snapshot }) => {
    host.innerHTML = customPropertyInspector(snapshot, entityOf(snapshot));
  });
  const announce = vi.fn(),
    unmount = mountCustomProperties(host, store, announce);
  const input = (selector: string) => {
    const node = host.querySelector<HTMLInputElement>(selector);
    if (!node) throw new Error('Missing input');
    return node;
  };
  try {
    input('[data-custom-new-name]').value = 'count';
    input('[data-custom-new-type]').value = 'number';
    host.querySelector<HTMLButtonElement>('[data-custom-add]')?.click();
    input('[data-custom-value]').value = '42';
    input('[data-custom-value]').dispatchEvent(
      new Event('change', { bubbles: true }),
    );
    expect(customProperties(entityOf(store.status.snapshot))[0]?.value).toBe(
      42,
    );
    input('[data-custom-value]').value = '';
    input('[data-custom-value]').dispatchEvent(
      new Event('change', { bubbles: true }),
    );
    expect(announce).toHaveBeenCalledWith('Enter a finite number.');
    expect(input('[data-custom-value]').value).toBe('42');
    host.querySelector<HTMLButtonElement>('[data-custom-delete]')?.click();
    expect(customProperties(entityOf(store.status.snapshot))).toEqual([]);
  } finally {
    unsubscribe();
    unmount();
  }
});
