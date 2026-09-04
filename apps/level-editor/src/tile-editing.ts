import { effectiveActiveLayer } from './model';
import type { LevelEditorStore } from './editor-store';
import {
  activeLayer,
  activeScene,
  activeSceneSettings,
  type LevelEditorSnapshot,
} from './model';
import {
  captureStamp,
  insideSelection,
  tileBounds,
  transformStamp,
  type TileSelection,
  type TileStamp,
  type StampTransform,
} from './tiles';

export function activeTileSelection(
  snapshot: LevelEditorSnapshot,
): TileSelection | undefined {
  const selection = snapshot.tileSelection;
  if (
    !selection ||
    selection.layerId !== effectiveActiveLayer(snapshot).id ||
    selection.sceneId !== activeScene(snapshot).id
  )
    return undefined;
  const settings = activeSceneSettings(snapshot),
    size =
      effectiveActiveLayer(snapshot).tilemap?.tileSize ?? settings.gridSize;
  const bounds = tileBounds(settings.width, settings.height, size);
  const width = Math.min(selection.width, bounds.columns - selection.x),
    height = Math.min(selection.height, bounds.rows - selection.y);
  return width > 0 && height > 0 ? { ...selection, width, height } : undefined;
}

/** Clipboard stays local to this editor session and is independent of undo history. */
export class TileEditing {
  #clipboard: TileStamp | undefined;
  #clipboardSources = new Map<string, string>();
  constructor(
    private readonly store: LevelEditorStore,
    private readonly announce: (message: string) => void,
  ) {}
  get canPaste(): boolean {
    return this.#clipboard !== undefined;
  }

  copy(cut = false): void {
    const snapshot = this.store.status.snapshot,
      selection = activeTileSelection(snapshot),
      layer = effectiveActiveLayer(snapshot);
    if (!selection) {
      this.announce('Select a tile area first (R).');
      return;
    }
    if (cut && (layer.kind !== undefined || layer.locked || !layer.visible)) {
      this.announce('Choose an unlocked, visible tile layer to cut tiles.');
      return;
    }
    try {
      const stamp = captureStamp(
        layer.tilemap ?? { tileSize: 16, cells: {} },
        selection,
      );
      if (!stamp.tiles.some(Boolean)) {
        this.announce('The selected area contains no tiles.');
        return;
      }
      this.#clipboard = stamp;
      this.#clipboardSources = new Map(
        snapshot.document.assets.map((asset) => [asset.id, asset.src]),
      );
      if (cut) this.deleteSelection();
      this.announce(
        `${cut ? 'Cut' : 'Copied'} ${stamp.width} × ${stamp.height} tiles. Paste with Command/Ctrl+V.`,
      );
    } catch (error) {
      this.announce(error instanceof Error ? error.message : String(error));
    }
  }

  paste(): void {
    const stamp = this.#clipboard;
    if (!stamp) {
      this.announce('Copy a tile selection first.');
      return;
    }
    const snapshot = this.store.status.snapshot,
      layer = effectiveActiveLayer(snapshot);
    if (layer.kind !== undefined || layer.locked || !layer.visible) {
      this.announce('Choose an unlocked, visible tile layer to paste tiles.');
      return;
    }
    const assets = new Map(
      snapshot.document.assets.map((asset) => [asset.id, asset.src]),
    );
    if (
      stamp.tiles.some(
        (tile) =>
          tile &&
          (!assets.has(tile.assetId) ||
            assets.get(tile.assetId) !==
              this.#clipboardSources.get(tile.assetId)),
      )
    ) {
      this.announce(
        'This clipboard uses images that are missing or different in the current project.',
      );
      return;
    }
    this.store.update(
      'Click the map to place copied tiles; Escape cancels',
      (draft) => {
        draft.tileStamp = structuredClone(stamp);
        draft.tool = 'paste';
        draft.selectedEntityIds = [];
        delete draft.tileSelection;
      },
      false,
    );
  }

  deleteSelection(): void {
    const snapshot = this.store.status.snapshot,
      selection = activeTileSelection(snapshot),
      layer = effectiveActiveLayer(snapshot);
    if (!selection) return;
    if (layer.kind !== undefined || layer.locked || !layer.visible) {
      this.announce('Choose an unlocked, visible tile layer to delete tiles.');
      return;
    }
    this.store.update('Deleted selected tiles', (draft) => {
      const map = activeLayer(draft).tilemap;
      if (!map) return;
      for (const key of Object.keys(map.cells)) {
        const [x = 0, y = 0] = key.split(',').map(Number);
        if (insideSelection({ x, y }, selection))
          Reflect.deleteProperty(map.cells, key);
      }
    });
  }

  selectAll(): void {
    this.store.update(
      'Selected all tile cells',
      (draft) => {
        const settings = activeSceneSettings(draft),
          layer = activeLayer(draft);
        const bounds = tileBounds(
          settings.width,
          settings.height,
          layer.tilemap?.tileSize ?? settings.gridSize,
        );
        draft.tileSelection = {
          x: 0,
          y: 0,
          width: bounds.columns,
          height: bounds.rows,
          sceneId: activeScene(draft).id,
          layerId: layer.id,
        };
        draft.tool = 'tile-select';
        draft.selectedEntityIds = [];
      },
      false,
    );
  }

  deselect(): void {
    this.store.update(
      'Cleared tile selection',
      (draft) => {
        delete draft.tileSelection;
        if (draft.tool === 'paste') draft.tool = 'tile-select';
      },
      false,
    );
  }

  transform(operation: StampTransform): void {
    if (!this.store.status.snapshot.tileStamp) {
      this.announce('Choose or copy a tile stamp first.');
      return;
    }
    this.store.update(
      'Transformed tile stamp',
      (draft) => {
        if (draft.tileStamp)
          draft.tileStamp = transformStamp(draft.tileStamp, operation);
      },
      false,
    );
  }
}
