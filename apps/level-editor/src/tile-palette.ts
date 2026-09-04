import { openTileShapeEditor } from './tile-shape-editor';
import type { AssetDefinition } from '@flixel-pixi/schemas';
import type { LevelEditorStatus, LevelEditorStore } from './editor-store';
import { activeLayer, activeSceneSettings, createId } from './model';
import { atlasFramesForAsset } from './atlas-assets';
import { activeTileSelection } from './tile-editing';
import { icon } from './icons';
import { isTileTool, sameTile, starterTileset, type TileRegion } from './tiles';
import { terrainPanel } from './terrain-panel';
import {
  terrainSets,
  setTerrainSets,
  starterTerrainTileset,
  selectedTerrain,
  type TerrainSet,
} from './terrain';

const escapeHtml = (value: unknown): string =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export function paletteTiles(asset: AssetDefinition): {
  tiles: TileRegion[];
  columns: number;
} {
  const frames = atlasFramesForAsset(asset);
  if (frames.length > 0)
    return {
      tiles: frames.map((frame) => ({
        assetId: asset.id,
        x: frame.x,
        y: frame.y,
        width: frame.width,
        height: frame.height,
      })),
      columns: 4,
    };
  const width = Number(asset.metadata?.tileWidth ?? 16),
    height = Number(asset.metadata?.tileHeight ?? 16);
  const margin = Number(asset.metadata?.tileMargin ?? 0),
    spacing = Number(asset.metadata?.tileSpacing ?? 0);
  if (
    ![width, height, margin, spacing].every(Number.isSafeInteger) ||
    width < 1 ||
    height < 1 ||
    margin < 0 ||
    spacing < 0
  )
    return { tiles: [], columns: 1 };
  const columns = Math.max(
    0,
    Math.floor(
      (Number(asset.metadata?.width ?? 0) - 2 * margin + spacing) /
        (width + spacing),
    ),
  );
  const rows = Math.max(
    0,
    Math.floor(
      (Number(asset.metadata?.height ?? 0) - 2 * margin + spacing) /
        (height + spacing),
    ),
  );
  if (columns * rows > 4096 || columns === 0 || rows === 0)
    return { tiles: [], columns: 1 };
  return {
    columns,
    tiles: Array.from({ length: rows * columns }, (_, index) => ({
      assetId: asset.id,
      x: margin + (index % columns) * (width + spacing),
      y: margin + Math.floor(index / columns) * (height + spacing),
      width,
      height,
    })),
  };
}

export function mountTilePalette(
  host: HTMLElement,
  store: LevelEditorStore,
  upload: () => void,
): () => void {
  let closeShapeEditor: (() => void) | undefined;
  let assetId = '',
    anchor = 0;
  let renderKey = '';
  let terrainMode = false,
    ruleMask = 15,
    ruleTileIndex = 0,
    editingRules = false;
  const render = ({ snapshot }: LevelEditorStatus): void => {
    const assets = snapshot.document.assets.filter(
      (asset) => asset.kind === 'image' && asset.metadata?.hidden !== true,
    );
    const brushAsset = snapshot.tileStamp?.tiles.find(Boolean)?.assetId;
    terrainMode = snapshot.tool.startsWith('terrain');
    if (terrainMode && snapshot.terrain) assetId = snapshot.terrain.assetId;
    else if (!terrainMode && brushAsset && isTileTool(snapshot.tool))
      assetId = brushAsset;
    let asset = assets.find((asset) => asset.id === assetId);
    if (!asset) {
      asset = assets.find(
        (asset) =>
          asset.metadata?.tileWidth !== undefined ||
          atlasFramesForAsset(asset).length > 0,
      );
      assetId = asset?.id ?? '';
    }
    const key = JSON.stringify([
      assets,
      assetId,
      snapshot.tileStamp,
      snapshot.terrain,
      snapshot.tool,
      ruleMask,
      ruleTileIndex,
      editingRules,
    ]);
    if (renderKey === key) return;
    renderKey = key;
    const palette = asset ? paletteTiles(asset) : { tiles: [], columns: 1 };
    const options = assets
      .map(
        (asset) =>
          `<option value="${escapeHtml(asset.id)}"${asset.id === assetId ? ' selected' : ''}>${escapeHtml(asset.metadata?.fileName ?? asset.id)}</option>`,
      )
      .join('');
    const frames = asset ? atlasFramesForAsset(asset) : [];
    const fields =
      asset && frames.length === 0
        ? `<details class="tileset-settings"><summary>Slice settings</summary><div class="field-pair">${[
            ['tileWidth', 'Tile width', 16, 1],
            ['tileHeight', 'Tile height', 16, 1],
            ['tileMargin', 'Margin', 0, 0],
            ['tileSpacing', 'Spacing', 0, 0],
          ]
            .map(
              ([field, label, fallback, min]) =>
                `<label>${label}<input aria-label="${label}" type="number" min="${min}" max="4096" step="1" data-slice="${field}" value="${Number(asset?.metadata?.[String(field)] ?? fallback)}" /></label>`,
            )
            .join('')}</div></details>`
        : '';
    const cards = palette.tiles
      .map((tile, index) => {
        const selected = terrainMode
          ? index === ruleTileIndex
          : (snapshot.tileStamp?.tiles.some((selected) =>
              sameTile(
                selected ? { ...selected, rotation: 0, flipX: false } : null,
                tile,
              ),
            ) ?? false);
        const label = frames[index]?.name ?? `Tile ${index + 1}`;
        return `<button type="button" class="palette-tile" data-tile-index="${index}" aria-label="${escapeHtml(label)}" aria-pressed="${selected}" title="${escapeHtml(label)} · ${tile.width} × ${tile.height}"><span style="aspect-ratio:${tile.width}/${tile.height}"><img alt="" draggable="false" src="${escapeHtml(asset?.src)}" style="width:${(Number(asset?.metadata?.width) / tile.width) * 100}%;height:${(Number(asset?.metadata?.height) / tile.height) * 100}%;left:${(-tile.x / tile.width) * 100}%;top:${(-tile.y / tile.height) * 100}%"/></span></button>`;
      })
      .join('');
    const stamp = snapshot.tileStamp;
    const stampPreview = stamp
      ? `<div class="stamp-section"><div class="stamp-heading"><strong>Active stamp</strong><span>${stamp.width} × ${stamp.height}</span></div>
      <div class="stamp-transforms" role="toolbar" aria-label="Stamp transforms"><button type="button" data-action="tile-flip-horizontal" aria-label="Flip stamp horizontally" title="Flip horizontally (X)">↔ <kbd>X</kbd></button><button type="button" data-action="tile-flip-vertical" aria-label="Flip stamp vertically" title="Flip vertically (Y)">↕ <kbd>Y</kbd></button><button type="button" data-action="tile-rotate-ccw" aria-label="Rotate stamp counterclockwise" title="Rotate counterclockwise (Shift+Z)">${icon('undo')}</button><button type="button" data-action="tile-rotate-cw" aria-label="Rotate stamp clockwise" title="Rotate clockwise (Z)">${icon('redo')}<kbd>Z</kbd></button></div>
<div class="stamp-scroll"><div class="stamp-preview" aria-label="Active stamp preview" style="grid-template-columns:repeat(${stamp.width}, 24px)">${stamp.tiles
          .map((tile) => {
            const source = assets.find((asset) => asset.id === tile?.assetId);
            if (!tile || !source) return '<span class="stamp-cell"></span>';
            return `<span class="stamp-cell"><span class="stamp-art" style="transform:rotate(${(tile.rotation ?? 0) * 90}deg) scaleX(${tile.flipX ? -1 : 1})"><img alt="" src="${escapeHtml(source.src)}" style="width:${(Number(source.metadata?.width) / tile.width) * 100}%;height:${(Number(source.metadata?.height) / tile.height) * 100}%;left:${(-tile.x / tile.width) * 100}%;top:${(-tile.y / tile.height) * 100}%" /></span></span>`;
          })
          .join('')}</div></div>
      </div>`
      : '';
    const paletteMarkup = asset
      ? `<div class="tile-palette-scroll"><div class="tile-palette" role="group" aria-label="Tile palette" style="grid-template-columns:repeat(${palette.columns}, 36px)">${cards}</div></div>${palette.tiles.length === 0 ? '<p class="field-help">No tiles fit these settings. Adjust the tile size, margin or spacing. Up to 4,096 tiles per sheet.</p>' : `<p class="tile-caption">${palette.tiles.length} source tiles${terrainMode ? '' : ` · ${snapshot.tileStamp?.width ?? 1} × ${snapshot.tileStamp?.height ?? 1} stamp`}</p><p class="field-help">${terrainMode ? 'Select a tile to assign its terrain corners.' : 'Shift-click selects a multi-tile stamp.'}</p>`}`
      : '<div class="tile-empty"><span class="tile-empty-icon">▦</span><strong>Build your world, tile by tile</strong><p>Choose an image above, import a tileset, or try the starter terrain.</p><button class="button primary full" type="button" data-starter-tiles>Use starter tiles</button></div>';
    host.innerHTML = `<div class="panel-heading"><div><small>Tile painting</small><strong>Tilesets</strong></div><button class="small-icon" type="button" data-tile-upload aria-label="Import tileset" title="Import tileset image or image + atlas XML">${icon('add')}</button></div>
      <div class="tileset-content"><div class="tileset-modes" role="group" aria-label="Tileset mode"><button type="button" data-palette-mode="tiles" aria-pressed="${!terrainMode}">Tiles</button><button type="button" data-palette-mode="terrain" aria-pressed="${terrainMode}">Terrains</button></div><label class="tileset-label">Source image<select aria-label="Tileset" data-tileset><option value=""${!assetId ? ' selected' : ''} disabled>Choose an image…</option>${options}</select></label>${terrainMode ? '' : fields}
      ${terrainMode ? '' : paletteMarkup}
      ${asset && palette.tiles.length ? '<button type="button" class="button full" data-edit-collision>Edit tile collision shapes</button>' : ''}
      ${terrainMode ? terrainPanel(asset, snapshot, ruleMask, palette.tiles[ruleTileIndex], editingRules, fields + paletteMarkup) : stampPreview}</div>`;
  };
  const updateSet = (
    label: string,
    change: (set: TerrainSet) => void,
  ): void => {
    store.update(label, (draft) => {
      const set = selectedTerrain(draft.document.assets, draft.terrain);
      if (set) change(set);
    });
  };
  const click = (event: MouseEvent): void => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('button');
    if (!target) return;
    if (target.hasAttribute('data-edit-collision')) {
      const asset = store.status.snapshot.document.assets.find(
        (a) => a.id === assetId,
      );
      const tile = terrainMode
        ? asset && paletteTiles(asset).tiles[ruleTileIndex]
        : store.status.snapshot.tileStamp?.tiles.find(
            (t) => t?.assetId === assetId,
          );
      const selected = tile ?? (asset && paletteTiles(asset).tiles[0]);
      if (selected) {
        closeShapeEditor?.();
        closeShapeEditor = openTileShapeEditor(store, selected);
      }
      return;
    }
    if (target.dataset.paletteMode) {
      store.update(
        'Changed tileset mode',
        (draft) => {
          draft.tool =
            target.dataset.paletteMode === 'terrain' ? 'terrain' : 'brush';
          const asset = draft.document.assets.find(
            (asset) => asset.id === assetId,
          );
          if (asset && !selectedTerrain(draft.document.assets, draft.terrain)) {
            const set = terrainSets(asset)[0];
            if (set) draft.terrain = { assetId, setId: set.id };
          }
        },
        false,
      );
      return;
    }
    if (target.hasAttribute('data-terrain-sample')) {
      const starter = starterTerrainTileset(createId('terrain'));
      assetId = starter.id;
      ruleTileIndex = 15;
      editingRules = false;
      store.update('Added sample terrain', (draft) => {
        draft.document.assets.push(starter);
        draft.terrain = { assetId, setId: 'grass' };
        draft.tool = 'terrain';
        draft.selectedEntityIds = [];
      });
      host.scrollTop = 0;
      return;
    }
    if (target.hasAttribute('data-terrain-add')) {
      editingRules = true;
      store.update('Added corner terrain set', (draft) => {
        const asset = draft.document.assets.find(
          (asset) => asset.id === assetId,
        );
        if (!asset || terrainSets(asset).length >= 64) return;
        const set: TerrainSet = {
          id: createId('terrain-set'),
          name: `Terrain ${terrainSets(asset).length + 1}`,
          kind: 'corner',
          color: '#72a854',
          rules: [],
        };
        setTerrainSets(asset, [...terrainSets(asset), set]);
        draft.terrain = { assetId, setId: set.id };
        draft.tool = 'terrain';
      });
      return;
    }
    if (
      target.dataset.terrainCorner !== undefined ||
      target.dataset.terrainPattern !== undefined
    ) {
      editingRules = true;
      ruleMask =
        target.dataset.terrainCorner !== undefined
          ? ruleMask ^ (1 << Number(target.dataset.terrainCorner))
          : Number(target.dataset.terrainPattern);
      render(store.status);
      host
        .querySelector<HTMLButtonElement>(
          target.dataset.terrainCorner !== undefined
            ? `[data-terrain-corner="${target.dataset.terrainCorner}"]`
            : `[data-terrain-pattern="${ruleMask}"]`,
        )
        ?.focus();
      return;
    }
    if (target.hasAttribute('data-terrain-assign')) {
      editingRules = true;
      const asset = store.status.snapshot.document.assets.find(
        (asset) => asset.id === assetId,
      );
      const tile = asset && paletteTiles(asset).tiles[ruleTileIndex];
      if (tile && ruleMask > 0)
        updateSet('Assigned terrain pattern', (set) => {
          set.rules = set.rules.filter(
            (rule) => rule.mask !== ruleMask && !sameTile(rule.tile, tile),
          );
          set.rules.push({ mask: ruleMask, tile });
          set.rules.sort((a, b) => a.mask - b.mask);
        });
      return;
    }
    if (target.hasAttribute('data-terrain-clear')) {
      editingRules = true;
      updateSet('Cleared terrain pattern', (set) => {
        set.rules = set.rules.filter((rule) => rule.mask !== ruleMask);
      });
      return;
    }
    if (target.hasAttribute('data-terrain-remove')) {
      store.update('Removed terrain set (tiles preserved)', (draft) => {
        const asset = draft.document.assets.find(
          (asset) => asset.id === assetId,
        );
        if (asset)
          setTerrainSets(
            asset,
            terrainSets(asset).filter((set) => set.id !== draft.terrain?.setId),
          );
        delete draft.terrain;
      });
      return;
    }
    if (target.hasAttribute('data-tile-upload')) {
      upload();
      return;
    }
    if (target.hasAttribute('data-starter-tiles')) {
      const starter = starterTileset();
      if (
        store.status.snapshot.document.assets.some(
          (asset) => asset.id === starter.id,
        )
      )
        starter.id = createId('tiles');
      assetId = starter.id;
      store.update('Added starter tileset', (draft) => {
        draft.document.assets.push(starter);
        draft.tileStamp = {
          width: 1,
          height: 1,
          tiles: [paletteTiles(starter).tiles[0] ?? null],
        };
        draft.tool = 'brush';
        draft.selectedEntityIds = [];
      });
      return;
    }
    if (target.dataset.tileIndex === undefined) return;
    const asset = store.status.snapshot.document.assets.find(
      (asset) => asset.id === assetId,
    );
    if (!asset) return;
    const { tiles, columns } = paletteTiles(asset);
    const index = Number(target.dataset.tileIndex);
    if (terrainMode) {
      editingRules = true;
      ruleTileIndex = index;
      const set = selectedTerrain(
        store.status.snapshot.document.assets,
        store.status.snapshot.terrain,
      );
      const rule = set?.rules.find((rule) => sameTile(rule.tile, tiles[index]));
      if (rule) ruleMask = rule.mask;
      render(store.status);
      host
        .querySelector<HTMLButtonElement>(`[data-tile-index="${index}"]`)
        ?.focus();
      return;
    }
    if (!event.shiftKey) anchor = index;
    const left = Math.min(anchor % columns, index % columns),
      right = Math.max(anchor % columns, index % columns);
    const top = Math.min(
        Math.floor(anchor / columns),
        Math.floor(index / columns),
      ),
      bottom = Math.max(
        Math.floor(anchor / columns),
        Math.floor(index / columns),
      );
    store.update(
      'Selected tile stamp',
      (draft) => {
        draft.tileStamp = {
          width: right - left + 1,
          height: bottom - top + 1,
          tiles: [],
        };
        for (let y = top; y <= bottom; y++)
          for (let x = left; x <= right; x++)
            draft.tileStamp.tiles.push(tiles[y * columns + x] ?? null);
        if (
          !isTileTool(draft.tool) ||
          draft.tool === 'eraser' ||
          draft.tool === 'eyedropper' ||
          draft.tool === 'tile-select' ||
          draft.tool === 'paste'
        )
          draft.tool = 'brush';
        draft.selectedEntityIds = [];
      },
      false,
    );
    // Keep focus in the palette: Shift-click and keyboard selection remain usable.
    host
      .querySelector<HTMLButtonElement>(`[data-tile-index="${index}"]`)
      ?.focus();
  };
  const change = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    if (target.hasAttribute('data-terrain-set')) {
      store.update(
        'Selected terrain',
        (draft) => {
          draft.terrain = { assetId, setId: target.value };
          draft.tool = 'terrain';
          draft.selectedEntityIds = [];
        },
        false,
      );
    } else if (target.hasAttribute('data-terrain-name')) {
      editingRules = true;
      updateSet('Renamed terrain', (set) => {
        set.name = target.value.trim().slice(0, 80) || set.name;
      });
    } else if (target.hasAttribute('data-terrain-color')) {
      editingRules = true;
      updateSet('Changed terrain color', (set) => {
        set.color = target.value;
      });
    } else if (target.matches('[data-tileset]')) {
      assetId = target.value;
      anchor = 0;
      store.update(
        'Changed tileset',
        (draft) => {
          delete draft.tileStamp;
          delete draft.terrain;
          ruleTileIndex = 0;
          const asset = draft.document.assets.find(
            (asset) => asset.id === assetId,
          );
          const set = asset && terrainSets(asset)[0];
          if (set) draft.terrain = { assetId, setId: set.id };
        },
        false,
      );
      render(store.status);
    } else if (target.dataset.slice) {
      const value = Number(target.value),
        field = target.dataset.slice;
      if (
        !Number.isSafeInteger(value) ||
        value < (field === 'tileWidth' || field === 'tileHeight' ? 1 : 0) ||
        value > 4096
      ) {
        renderKey = '';
        render(store.status);
        return;
      }
      anchor = 0;
      store.update('Changed tileset slicing', (draft) => {
        const asset = draft.document.assets.find(
          (asset) => asset.id === assetId,
        );
        if (asset) (asset.metadata ??= {})[field] = value;
        delete draft.tileStamp;
      });
    }
  };
  const toggleRules = (event: Event): void => {
    if (
      event.target instanceof HTMLDetailsElement &&
      event.target.classList.contains('terrain-rules')
    )
      editingRules = event.target.open;
  };
  host.addEventListener('toggle', toggleRules, true);
  host.addEventListener('click', click);
  host.addEventListener('change', change);
  const unsubscribe = store.subscribe(render);
  return () => {
    closeShapeEditor?.();
    unsubscribe();
    host.removeEventListener('toggle', toggleRules, true);
    host.removeEventListener('click', click);
    host.removeEventListener('change', change);
  };
}

export function tileContext(status: LevelEditorStatus): string {
  const snapshot = status.snapshot,
    layer = activeLayer(snapshot);
  const size =
    layer.tilemap?.tileSize ?? activeSceneSettings(snapshot).gridSize;
  if (layer.kind === 'objects')
    return 'Object layer · Select a tile layer to paint, or use the object tools above the hierarchy';
  if (snapshot.tool === 'tile-select')
    return 'Drag to select a rectangular area · Copy, cut, paste or delete tiles';
  if (snapshot.tool === 'paste')
    return 'Click to place copied tiles · Empty cells replace destination tiles · Escape cancels';
  const selection = activeTileSelection(snapshot);
  if (selection)
    return `${layer.name} · Editing inside ${selection.width} × ${selection.height} selection · Escape clears`;
  if (layer.locked) return `${layer.name} is locked · unlock it to paint`;
  if (!layer.visible) return `${layer.name} is hidden · show it to paint`;
  if (snapshot.tool.startsWith('terrain')) {
    const terrain = selectedTerrain(snapshot.document.assets, snapshot.terrain);
    return terrain
      ? `${terrain.name} · ${terrain.rules.length}/15 patterns · ${snapshot.tool === 'terrain-erase' ? 'Erase' : 'Paint'} terrain and update neighbors`
      : 'Choose a terrain set in Tilesets, or add the sample terrain';
  }
  if (!snapshot.tileStamp && !['eraser', 'eyedropper'].includes(snapshot.tool))
    return 'Choose a tile in Tilesets to start painting';
  return `${layer.name} · ${size} px cells · ${snapshot.tileStamp?.width ?? 1} × ${snapshot.tileStamp?.height ?? 1} stamp`;
}
