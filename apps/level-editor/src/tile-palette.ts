import type { AssetDefinition } from '@flixel-pixi/schemas';
import type { LevelEditorStatus, LevelEditorStore } from './editor-store';
import { activeLayer, activeSceneSettings, createId } from './model';
import { atlasFramesForAsset } from './atlas-assets';
import { icon } from './icons';
import { isTileTool, sameTile, starterTileset, type TileRegion } from './tiles';

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
  let assetId = '',
    anchor = 0;
  let renderKey = '';
  const render = ({ snapshot }: LevelEditorStatus): void => {
    const assets = snapshot.document.assets.filter(
      (asset) => asset.kind === 'image' && asset.metadata?.hidden !== true,
    );
    const brushAsset = snapshot.tileStamp?.tiles.find(Boolean)?.assetId;
    if (brushAsset && isTileTool(snapshot.tool)) assetId = brushAsset;
    let asset = assets.find((asset) => asset.id === assetId);
    if (!asset) {
      asset = assets.find(
        (asset) =>
          asset.metadata?.tileWidth !== undefined ||
          atlasFramesForAsset(asset).length > 0,
      );
      assetId = asset?.id ?? '';
    }
    const key = JSON.stringify([assets, assetId, snapshot.tileStamp]);
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
        const selected =
          snapshot.tileStamp?.tiles.some((selected) =>
            sameTile(selected, tile),
          ) ?? false;
        const label = frames[index]?.name ?? `Tile ${index + 1}`;
        return `<button type="button" class="palette-tile" data-tile-index="${index}" aria-label="${escapeHtml(label)}" aria-pressed="${selected}" title="${escapeHtml(label)} · ${tile.width} × ${tile.height}"><span style="aspect-ratio:${tile.width}/${tile.height}"><img alt="" draggable="false" src="${escapeHtml(asset?.src)}" style="width:${(Number(asset?.metadata?.width) / tile.width) * 100}%;height:${(Number(asset?.metadata?.height) / tile.height) * 100}%;left:${(-tile.x / tile.width) * 100}%;top:${(-tile.y / tile.height) * 100}%"/></span></button>`;
      })
      .join('');
    host.innerHTML = `<div class="panel-heading"><div><small>Tile painting</small><strong>Tilesets</strong></div><button class="small-icon" type="button" data-tile-upload aria-label="Import tileset" title="Import tileset image or image + atlas XML">${icon('add')}</button></div>
      <div class="tileset-content"><label class="tileset-label">Source image<select aria-label="Tileset" data-tileset><option value=""${!assetId ? ' selected' : ''} disabled>Choose an image…</option>${options}</select></label>${fields}
      ${asset ? `<div class="tile-palette-scroll"><div class="tile-palette" role="group" aria-label="Tile palette" style="grid-template-columns:repeat(${palette.columns}, 36px)">${cards}</div></div>${palette.tiles.length === 0 ? '<p class="field-help">No tiles fit these settings. Adjust the tile size, margin or spacing. Up to 4,096 tiles per sheet.</p>' : `<p class="tile-caption">${palette.tiles.length} tiles · ${snapshot.tileStamp?.width ?? 1} × ${snapshot.tileStamp?.height ?? 1} stamp</p><p class="field-help">Click a tile to paint. Shift-click another tile to select a rectangular stamp.</p>`}` : '<div class="tile-empty"><span class="tile-empty-icon">▦</span><strong>Build your world, tile by tile</strong><p>Choose an image above, import a tileset, or try the starter terrain.</p><button class="button primary full" type="button" data-starter-tiles>Use starter tiles</button></div>'}
      </div>`;
  };
  const click = (event: MouseEvent): void => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('button');
    if (!target) return;
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
          draft.tool === 'eyedropper'
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
    if (target.matches('[data-tileset]')) {
      assetId = target.value;
      anchor = 0;
      store.update(
        'Changed tileset',
        (draft) => {
          delete draft.tileStamp;
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
  host.addEventListener('click', click);
  host.addEventListener('change', change);
  const unsubscribe = store.subscribe(render);
  return () => {
    unsubscribe();
    host.removeEventListener('click', click);
    host.removeEventListener('change', change);
  };
}

export function tileContext(status: LevelEditorStatus): string {
  const snapshot = status.snapshot,
    layer = activeLayer(snapshot);
  const size =
    layer.tilemap?.tileSize ?? activeSceneSettings(snapshot).gridSize;
  if (layer.locked) return `${layer.name} is locked · unlock it to paint`;
  if (!layer.visible) return `${layer.name} is hidden · show it to paint`;
  if (!snapshot.tileStamp && !['eraser', 'eyedropper'].includes(snapshot.tool))
    return 'Choose a tile in Tilesets to start painting';
  return `${layer.name} · ${size} px cells · ${snapshot.tileStamp?.width ?? 1} × ${snapshot.tileStamp?.height ?? 1} stamp`;
}
