import { afterEach, describe, expect, it, vi } from 'vitest';
import { LevelEditorStore } from '../src/editor-store';
import { createInitialProject, activeLayer } from '../src/model';
import { mountTilePalette, tileContext } from '../src/tile-palette';
import { terrainSets } from '../src/terrain';

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing test fixture');
  return value;
}
let cleanup: () => void = vi.fn();
afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

describe('terrain rules dock', () => {
  it('adds a sample, edits corner assignments, renames and removes sets with undo', () => {
    const store = new LevelEditorStore({
      document: createInitialProject(),
      selectedEntityIds: [],
      tool: 'brush',
      snapToGrid: true,
    });
    const host = document.createElement('section');
    document.body.append(host);
    cleanup = mountTilePalette(host, store, vi.fn());
    const click = (selector: string) => {
      const button = host.querySelector<HTMLButtonElement>(selector);
      expect(button, selector).not.toBeNull();
      required(button).click();
    };
    click('[data-palette-mode="terrain"]');
    click('[data-terrain-sample]');
    const assetId = required(store.status.snapshot.terrain).assetId;
    const set = () =>
      required(
        terrainSets(
          required(
            store.status.snapshot.document.assets.find(
              (asset) => asset.id === assetId,
            ),
          ),
        )[0],
      );
    expect(set().rules).toHaveLength(15);
    expect(store.status.snapshot.tool).toBe('terrain');
    click('[data-tile-index="1"]');
    expect(
      host
        .querySelector('[data-terrain-corner="0"]')
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
    click('[data-terrain-clear]');
    expect(set().rules).toHaveLength(14);
    click('[data-terrain-assign]');
    expect(set().rules).toHaveLength(15);
    const input = required(
      host.querySelector<HTMLInputElement>('[data-terrain-name]'),
    );
    input.value = 'Meadow';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(set().name).toBe('Meadow');
    click('[data-terrain-remove]');
    expect(store.status.snapshot.terrain).toBeUndefined();
    store.undo();
    expect(set().name).toBe('Meadow');
    expect(
      host.querySelector('[data-terrain-name]')?.getAttribute('value'),
    ).toBe('Meadow');
  });
  it('creates a custom set and moves a tile assignment between patterns without ambiguity', () => {
    const store = new LevelEditorStore({
      document: createInitialProject(),
      selectedEntityIds: [],
      tool: 'terrain',
      snapToGrid: true,
    });
    const host = document.createElement('section');
    document.body.append(host);
    cleanup = mountTilePalette(host, store, vi.fn());
    const click = (selector: string) =>
      required(host.querySelector<HTMLButtonElement>(selector)).click();
    click('[data-terrain-sample]');
    click('[data-terrain-add]');
    click('[data-tile-index="1"]');
    click('[data-terrain-pattern="1"]');
    click('[data-terrain-assign]');
    click('[data-terrain-corner="1"]');
    click('[data-terrain-assign]');
    const snapshot = store.status.snapshot;
    const sets = terrainSets(
      required(
        snapshot.document.assets.find(
          (a) => a.id === required(snapshot.terrain).assetId,
        ),
      ),
    );
    expect(required(sets[1]).rules).toHaveLength(1);
    expect(required(required(sets[1]).rules[0]).mask).toBe(3);
    click('[data-palette-mode="tiles"]');
    expect(store.status.snapshot.tool).toBe('brush');
  });

  it('auto-assigns a contiguous source range to consecutive patterns', () => {
    const store = new LevelEditorStore({
      document: createInitialProject(),
      selectedEntityIds: [],
      tool: 'terrain',
      snapToGrid: true,
    });
    const host = document.createElement('section');
    document.body.append(host);
    cleanup = mountTilePalette(host, store, vi.fn());
    const click = (selector: string, shiftKey = false) =>
      required(host.querySelector<HTMLButtonElement>(selector)).dispatchEvent(
        new MouseEvent('click', { bubbles: true, shiftKey }),
      );
    click('[data-terrain-sample]');
    click('[data-terrain-add]');
    click('[data-terrain-pattern="3"]');
    click('[data-tile-index="4"]');
    click('[data-tile-index="6"]', true);
    expect(
      host.querySelector<HTMLButtonElement>('[data-terrain-auto-assign]')
        ?.textContent,
    ).toContain('Assign 3 selected tiles from pattern 3');
    click('[data-terrain-auto-assign]');
    const snapshot = store.status.snapshot,
      terrain = required(snapshot.terrain),
      asset = required(
        snapshot.document.assets.find((item) => item.id === terrain.assetId),
      ),
      custom = required(
        terrainSets(asset).find((set) => set.id === terrain.setId),
      );
    expect(custom.rules.map((rule) => rule.mask)).toEqual([3, 4, 5]);
    expect(custom.rules.map((rule) => rule.tile.x)).toEqual([128, 0, 32]);
    store.undo();
    expect(
      required(
        terrainSets(
          required(
            store.status.snapshot.document.assets.find(
              (item) => item.id === terrain.assetId,
            ),
          ),
        ).find((set) => set.id === terrain.setId),
      ).rules,
    ).toEqual([]);
  });
});

it('edits variant weights, removes and re-adds a variant with undo/redo', () => {
  const store = new LevelEditorStore({
    document: createInitialProject(),
    selectedEntityIds: [],
    tool: 'terrain',
    snapToGrid: true,
  });
  const host = document.createElement('section');
  document.body.append(host);
  cleanup = mountTilePalette(host, store, vi.fn());
  const click = (selector: string) =>
    required(host.querySelector<HTMLButtonElement>(selector)).click();
  click('[data-terrain-sample]');
  click('[data-terrain-pattern="15"]');
  const rule = () =>
    required(
      terrainSets(
        required(
          store.status.snapshot.document.assets.find(
            (a) => a.id === store.status.snapshot.terrain?.assetId,
          ),
        ),
      )[0]?.rules.find((r) => r.mask === 15),
    );
  const weight = required(
    host.querySelector<HTMLInputElement>('[data-terrain-weight="1"]'),
  );
  weight.value = '5';
  weight.dispatchEvent(new Event('change', { bubbles: true }));
  expect(rule().variants?.[0]?.weight).toBe(5);
  store.undo();
  expect(rule().variants?.[0]?.weight).toBe(1);
  store.redo();
  expect(rule().variants?.[0]?.weight).toBe(5);
  click('[data-terrain-variant-remove="0"]');
  expect(rule().variants).toHaveLength(2);
  click('[data-tile-index="4"]');
  click('[data-terrain-pattern="15"]');
  click('[data-terrain-variant-add]');
  expect(rule().variants).toHaveLength(3);
  store.undo();
  expect(rule().variants).toHaveLength(2);
});

it('names the active layer for painting, terrain erasing, selection and blocked layers', () => {
  const store = new LevelEditorStore({
    document: createInitialProject(),
    selectedEntityIds: [],
    tool: 'terrain-erase',
    snapToGrid: true,
  });
  expect(tileContext(store.status)).toContain('Layer: Gameplay');
  store.update(
    'Select',
    (draft) => {
      draft.tool = 'tile-select';
    },
    false,
  );
  expect(tileContext(store.status)).toContain('Layer: Gameplay');
  store.update('Lock', (draft) => {
    draft.tool = 'terrain';
    activeLayer(draft).locked = true;
  });
  expect(tileContext(store.status)).toContain('Layer: Gameplay · Locked');
});

it('adds a multi-terrain sample and switches the painting material', () => {
  const store = new LevelEditorStore({
    document: createInitialProject(),
    selectedEntityIds: [],
    tool: 'terrain',
    snapToGrid: true,
  });
  const host = document.createElement('section');
  document.body.append(host);
  cleanup = mountTilePalette(host, store, vi.fn());
  required(
    host.querySelector<HTMLButtonElement>('[data-terrain-multi-sample]'),
  ).click();
  const select = required(
    host.querySelector<HTMLSelectElement>('[data-terrain-brush]'),
  );
  expect([...select.options].map((o) => o.textContent)).toEqual([
    'Grass',
    'Dirt',
  ]);
  select.value = '2';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  expect(store.status.snapshot.terrain?.terrainIndex).toBe(2);
  expect(tileContext(store.status)).toContain('Dirt');
  const before = store.status.snapshot;
  required(
    host.querySelector<HTMLButtonElement>('[data-terrain-type-add]'),
  ).click();
  expect(
    host.querySelector<HTMLSelectElement>('[data-terrain-brush]')?.options,
  ).toHaveLength(3);
  store.undo();
  expect(store.status.snapshot).toEqual(before);
}, 15_000);

it('adds edge terrain sets and exposes cardinal road rules', () => {
  const store = new LevelEditorStore({
    document: createInitialProject(),
    selectedEntityIds: [],
    tool: 'terrain',
    snapToGrid: true,
  });
  const host = document.createElement('section');
  document.body.append(host);
  cleanup = mountTilePalette(host, store, vi.fn());
  required(
    host.querySelector<HTMLButtonElement>('[data-terrain-edge-sample]'),
  ).click();
  const choice = required(store.status.snapshot.terrain);
  const asset = () =>
    required(
      store.status.snapshot.document.assets.find(
        (item) => item.id === choice.assetId,
      ),
    );
  expect(required(terrainSets(asset())[0]).kind).toBe('edge');
  expect(host.textContent).toContain('Road · edge');
  const select = (selector: string, value: string) => {
    const node = required(host.querySelector<HTMLSelectElement>(selector));
    node.value = value;
    node.dispatchEvent(new Event('change', { bubbles: true }));
  };
  select('[data-terrain-edge-width]', '3');
  select('[data-terrain-edge-straight]', 'straight');
  select('[data-terrain-edge-ends]', 'junctions');
  const closed = required(
    host.querySelector<HTMLInputElement>('[data-terrain-edge-closed]'),
  );
  closed.checked = true;
  closed.dispatchEvent(new Event('change', { bubbles: true }));
  expect(store.status.snapshot.terrain).toMatchObject({
    edgeWidth: 3,
    edgeStraight: true,
    edgeEnds: 'junctions',
    edgeClosed: true,
  });
  expect(tileContext(store.status)).toContain(
    '3-cell straight loop · junction ends',
  );
  expect(
    host.querySelector('[data-terrain-corner="0"]')?.getAttribute('aria-label'),
  ).toBe('Top terrain edge');
  expect(host.querySelector('.terrain-panel')?.classList).toContain(
    'terrain-edge',
  );
  required(
    host.querySelector<HTMLButtonElement>('[data-terrain-pattern="1"]'),
  ).click();
  required(
    host.querySelector<HTMLButtonElement>('[data-terrain-clear]'),
  ).click();
  expect(
    host
      .querySelector('[data-terrain-pattern="1"]')
      ?.getAttribute('aria-label'),
  ).toBe('Pattern 1: derived');
  expect(host.textContent).toContain('14 assigned · 15/15 covered');
  expect(
    host.querySelector<HTMLButtonElement>('[data-terrain-diagnostic="derived"]')
      ?.textContent,
  ).toContain('1Derived');
  const rotation = required(
    host.querySelector<HTMLInputElement>('[data-terrain-allow-rotation]'),
  );
  rotation.checked = false;
  rotation.dispatchEvent(new Event('change', { bubbles: true }));
  expect(required(terrainSets(asset())[0]).allowRotation).toBe(false);
  expect(host.textContent).toContain('14 assigned · 14/15 covered');
  required(
    host.querySelector<HTMLButtonElement>(
      '[data-terrain-diagnostic="missing"]',
    ),
  ).click();
  expect(
    host
      .querySelector('[data-terrain-pattern="1"]')
      ?.getAttribute('aria-pressed'),
  ).toBe('true');
  store.undo();
  expect(required(terrainSets(asset())[0]).allowRotation).toBeUndefined();
  expect(host.textContent).toContain('14 assigned · 15/15 covered');

  required(
    host.querySelector<HTMLButtonElement>('[data-terrain-edge-add]'),
  ).click();
  expect(required(terrainSets(asset()).at(-1)).kind).toBe('edge');
  store.undo();
  expect(terrainSets(asset())).toHaveLength(1);
});
