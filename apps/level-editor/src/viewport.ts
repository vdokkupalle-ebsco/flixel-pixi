import { TOOL_CURSORS } from './tool-cursors';

import type { EntityDefinition } from '@flixel-pixi/schemas';

import type { LevelEditorStatus, LevelEditorStore } from './editor-store';
import {
  activeLayer,
  sceneLayers,
  activeScene,
  activeSceneSettings,
  entityProperties,
  layerForEntity,
  type LevelEditorSnapshot,
} from './model';
import {
  cellKey,
  fillPattern,
  floodCells,
  inBounds,
  isTileTool,
  lineCells,
  paintStamp,
  rectangleCells,
  tileBounds,
  type Cell,
  type TileBounds,
  type TileMap,
  type TileStamp,
  type TileTool,
  type TileRegion,
} from './tiles';
import { activeTileSelection } from './tile-editing';
import { paintTerrain, selectedTerrain, type TerrainSet } from './terrain';
import { layerTileColliders, type TileCollider } from './tile-collision';
import { insideSelection, type TileSelection } from './tiles';
import { bodyForEntity, updateBodyShape } from './physics-authoring';

interface ViewTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
}

interface EntityPointerInteraction {
  entityId: string;
  kind: 'move' | 'rotate' | 'scale';
  original: EntityDefinition;
  pointerId: number;
  startWorldX: number;
  startWorldY: number;
}

interface PanPointerInteraction {
  kind: 'pan';
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startPanX: number;
  startPanY: number;
}

interface TileInteraction {
  terrain?: TerrainSet;
  selection: TileSelection | undefined;
  kind: 'tiles';
  pointerId: number;
  layerId: string;
  tool: TileTool | 'capture';
  map: TileMap;
  original: TileMap;
  start: Cell;
  last: Cell;
  bounds: TileBounds;
  stamp: TileStamp | undefined;
}
type PointerInteraction =
  EntityPointerInteraction | PanPointerInteraction | TileInteraction;

interface EntityVisual {
  entity: EntityDefinition;
  height: number;
  width: number;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

function numberProperty(
  properties: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = properties[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function cloneEntity(entity: EntityDefinition): EntityDefinition {
  return structuredClone(entity);
}

export class SceneViewport {
  readonly #canvas: HTMLCanvasElement;
  readonly #context: CanvasRenderingContext2D;
  readonly #store: LevelEditorStore;
  readonly #images = new Map<string, HTMLImageElement>();
  readonly #resizeObserver: ResizeObserver;
  #status: LevelEditorStatus;
  #interaction: PointerInteraction | undefined;
  #previewEntity: EntityDefinition | undefined;
  #hoverCell: Cell | undefined;
  #terrainPreviewCells: Cell[] = [];
  #terrainPreviewBlocked = false;
  #lastBrushCell: Cell | undefined;
  #unsubscribe: () => void;
  #zoom = 1;
  #panX = 0;
  #panY = 0;
  #spacePressed = false;
  #altPressed = false;
  #pointerPosition: { clientX: number; clientY: number } | undefined;
  #animationFrame = 0;
  #resizeFrame = 0;

  constructor(canvas: HTMLCanvasElement, store: LevelEditorStore) {
    const context = canvas.getContext('2d');
    if (context === null) throw new Error('Canvas 2D is not available.');
    this.#canvas = canvas;
    this.#context = context;
    this.#store = store;
    this.#status = store.status;
    this.#resizeObserver = new ResizeObserver(() => this.#scheduleResize());
    this.#resizeObserver.observe(canvas);
    canvas.addEventListener('blur', this.#onWindowBlur);
    canvas.addEventListener('pointerdown', this.#onPointerDown);
    canvas.addEventListener('pointermove', this.#onPointerMove);
    canvas.addEventListener('pointerup', this.#onPointerUp);
    canvas.addEventListener('pointercancel', this.#cancelInteraction);
    canvas.addEventListener('pointerleave', this.#onPointerLeave);
    canvas.addEventListener('contextmenu', this.#onContextMenu);
    canvas.addEventListener('wheel', this.#onWheel, { passive: false });
    window.addEventListener('keydown', this.#onWindowKeyDown);
    window.addEventListener('keyup', this.#onWindowKeyUp);
    window.addEventListener('blur', this.#onWindowBlur);
    this.#unsubscribe = store.subscribe((status) => {
      this.#cancelInteraction();
      if (
        activeLayer(this.#status.snapshot).id !==
          activeLayer(status.snapshot).id ||
        this.#status.snapshot.document.project.id !==
          status.snapshot.document.project.id
      )
        this.#lastBrushCell = undefined;
      this.#status = status;
      this.#queueRender();
    });
    this.#resize();
  }

  destroy(): void {
    this.#unsubscribe();
    this.#canvas.removeEventListener('blur', this.#onWindowBlur);
    this.#canvas.style.removeProperty('cursor');
    this.#resizeObserver.disconnect();
    this.#canvas.removeEventListener('pointerleave', this.#onPointerLeave);
    this.#canvas.removeEventListener('contextmenu', this.#onContextMenu);
    cancelAnimationFrame(this.#animationFrame);
    cancelAnimationFrame(this.#resizeFrame);
    this.#canvas.removeEventListener('pointerdown', this.#onPointerDown);
    this.#canvas.removeEventListener('pointermove', this.#onPointerMove);
    this.#canvas.removeEventListener('pointerup', this.#onPointerUp);
    this.#canvas.removeEventListener('pointercancel', this.#cancelInteraction);
    this.#canvas.removeEventListener('wheel', this.#onWheel);
    window.removeEventListener('keydown', this.#onWindowKeyDown);
    window.removeEventListener('keyup', this.#onWindowKeyUp);
    window.removeEventListener('blur', this.#onWindowBlur);
  }

  get zoom(): number {
    return this.#zoom;
  }

  setZoom(value: number): void {
    this.#zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
    this.#queueRender();
  }

  focusSelection(): void {
    this.#zoom = 1;
    this.#panX = 0;
    this.#panY = 0;
    this.#queueRender();
  }

  render(): void {
    const context = this.#context;
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = this.#canvas.width / dpr;
    const canvasHeight = this.#canvas.height / dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    const snapshot = this.#status.snapshot;
    const settings = activeSceneSettings(snapshot);
    const transform = this.#viewTransform(snapshot);
    context.save();
    context.translate(transform.offsetX, transform.offsetY);
    context.scale(transform.scale, transform.scale);
    context.fillStyle = settings.background;
    context.fillRect(0, 0, settings.width, settings.height);
    context.imageSmoothingEnabled = false;

    const scene = activeScene(snapshot);
    const entities = [...scene.entities]
      .filter((entity) => layerForEntity(snapshot, entity).visible)
      .sort(
        (a, b) =>
          layerForEntity(snapshot, a).order -
            layerForEntity(snapshot, b).order ||
          numberProperty(entityProperties(a), 'zIndex', 0) -
            numberProperty(entityProperties(b), 'zIndex', 0),
      );
    const terrainPreview = this.#terrainHoverPreview();
    const activeLayerId = activeLayer(snapshot).id;
    const tileColliders: TileCollider[] = [];
    for (const layer of [...sceneLayers(snapshot)].sort(
      (a, b) => a.order - b.order,
    )) {
      if (!layer.visible) continue;
      const interaction = this.#interaction;
      const map =
        interaction?.kind === 'tiles' && interaction.layerId === layer.id
          ? interaction.map
          : layer.id === activeLayerId && terrainPreview
            ? terrainPreview
            : layer.tilemap;
      if (snapshot.showTileCollisions !== false)
        tileColliders.push(...layerTileColliders(layer, settings, map));
      if (map)
        for (const [key, tile] of Object.entries(map.cells)) {
          const [x = 0, y = 0] = key.split(',').map(Number);
          if (
            (x + 1) * map.tileSize > settings.width ||
            (y + 1) * map.tileSize > settings.height
          )
            continue;
          this.#drawTile(
            tile,
            x * map.tileSize,
            y * map.tileSize,
            map.tileSize,
          );
        }
      for (const entity of entities.filter(
        (entity) => layerForEntity(snapshot, entity).id === layer.id,
      )) {
        this.#drawEntity(
          this.#previewEntity?.id === entity.id ? this.#previewEntity : entity,
          snapshot,
        );
      }
    }
    this.#drawGrid(snapshot);
    this.#drawTileCollisions(tileColliders, activeLayerId);
    this.#drawTileSelection();
    this.#drawTileCursor();
    this.#drawPhysics(snapshot);
    context.restore();
  }

  #drawTileCollisions(
    colliders: readonly TileCollider[],
    activeLayerId: string,
  ): void {
    const context = this.#context;
    const scale = this.#viewTransform(this.#status.snapshot).scale;
    context.save();
    context.lineWidth = 1.5 / scale;
    context.setLineDash([6 / scale, 3 / scale]);
    for (const collider of colliders) {
      context.strokeStyle =
        collider.layerId === activeLayerId ? '#ffbd66' : '#b38752';
      context.fillStyle = 'rgba(255, 189, 102, 0.08)';
      context.fillRect(collider.x, collider.y, collider.width, collider.height);
      context.strokeRect(
        collider.x,
        collider.y,
        collider.width,
        collider.height,
      );
    }
    context.restore();
  }

  #resize(): void {
    const rect = this.#canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (this.#canvas.width !== width || this.#canvas.height !== height) {
      this.#canvas.width = width;
      this.#canvas.height = height;
    }
    this.#queueRender();
  }

  #scheduleResize(): void {
    cancelAnimationFrame(this.#resizeFrame);
    this.#resizeFrame = requestAnimationFrame(() => this.#resize());
  }

  #updateCursor(): void {
    const snapshot = this.#status.snapshot;
    const interaction = this.#interaction;
    let cursor: string;
    if (interaction) {
      cursor =
        interaction.kind === 'pan'
          ? 'grabbing'
          : TOOL_CURSORS[
              interaction.kind === 'tiles' ? interaction.tool : interaction.kind
            ];
    } else if (this.#spacePressed || snapshot.tool === 'pan') {
      cursor = 'grab';
    } else if (isTileTool(snapshot.tool)) {
      const tool = this.#altPressed ? 'eyedropper' : snapshot.tool;
      const layer = activeLayer(snapshot);
      const settings = activeSceneSettings(snapshot);
      const size =
        layer.tilemap?.tileSize ??
        Math.min(1024, Math.max(1, Math.round(settings.gridSize)));
      const point = this.#pointerPosition
        ? this.#worldPoint(this.#pointerPosition)
        : undefined;
      const outside =
        point &&
        !inBounds(
          { x: Math.floor(point.x / size), y: Math.floor(point.y / size) },
          tileBounds(settings.width, settings.height, size),
        );
      const editing = tool !== 'eyedropper' && tool !== 'tile-select';
      const missingSource = tool.startsWith('terrain')
        ? !selectedTerrain(snapshot.document.assets, snapshot.terrain)
        : tool !== 'eraser' && !snapshot.tileStamp;
      cursor =
        outside ||
        (editing && (layer.locked || !layer.visible || missingSource))
          ? 'not-allowed'
          : TOOL_CURSORS[tool];
    } else {
      const point = this.#pointerPosition
        ? this.#worldPoint(this.#pointerPosition)
        : undefined;
      const entity = point ? this.#hitTest(point.x, point.y) : undefined;
      cursor =
        entity && point
          ? TOOL_CURSORS[this.#interactionKind(entity, point.x, point.y)]
          : point && this.#hitTest(point.x, point.y, true)
            ? 'not-allowed'
            : TOOL_CURSORS[snapshot.tool];
    }
    this.#canvas.style.cursor = cursor;
  }

  #queueRender(): void {
    this.#updateCursor();
    cancelAnimationFrame(this.#animationFrame);
    this.#animationFrame = requestAnimationFrame(() => this.render());
  }

  #viewTransform(snapshot: LevelEditorSnapshot): ViewTransform {
    const settings = activeSceneSettings(snapshot);
    const rect = this.#canvas.getBoundingClientRect();
    const padding = 48;
    const fit = Math.min(
      (rect.width - padding * 2) / settings.width,
      (rect.height - padding * 2) / settings.height,
    );
    const scale = Math.max(0.05, fit) * this.#zoom;
    return {
      offsetX: (rect.width - settings.width * scale) / 2 + this.#panX,
      offsetY: (rect.height - settings.height * scale) / 2 + this.#panY,
      scale,
    };
  }

  #drawGrid(snapshot: LevelEditorSnapshot): void {
    if (snapshot.showGrid === false) return;
    const settings = activeSceneSettings(snapshot);
    const gridSize = isTileTool(snapshot.tool)
      ? (activeLayer(snapshot).tilemap?.tileSize ?? settings.gridSize)
      : settings.gridSize;
    const context = this.#context;
    context.beginPath();
    context.strokeStyle = 'rgba(177, 189, 202, 0.12)';
    context.lineWidth = 1 / this.#viewTransform(snapshot).scale;
    for (let x = 0; x <= settings.width; x += gridSize) {
      context.moveTo(x, 0);
      context.lineTo(x, settings.height);
    }
    for (let y = 0; y <= settings.height; y += gridSize) {
      context.moveTo(0, y);
      context.lineTo(settings.width, y);
    }
    context.stroke();
  }

  #visual(entity: EntityDefinition): EntityVisual {
    const properties = entityProperties(entity);
    const scale = entity.scale ?? { x: 1, y: 1 };
    return {
      entity,
      height: numberProperty(properties, 'height', 64) * scale.y,
      width: numberProperty(properties, 'width', 64) * scale.x,
    };
  }

  #drawTile(tile: TileRegion, x: number, y: number, size: number): void {
    const asset = this.#status.snapshot.document.assets.find(
      (asset) => asset.id === tile.assetId,
    );
    if (!asset) return;
    const image = this.#getImage(asset.id, asset.src);
    if (image.complete && image.naturalWidth > 0) {
      const context = this.#context;
      context.save();
      context.translate(x + size / 2, y + size / 2);
      context.rotate(((tile.rotation ?? 0) * Math.PI) / 2);
      context.scale(tile.flipX ? -1 : 1, 1);
      context.drawImage(
        image,
        tile.x,
        tile.y,
        tile.width,
        tile.height,
        -size / 2,
        -size / 2,
        size,
        size,
      );
      context.restore();
    }
  }

  #drawTileSelection(): void {
    const snapshot = this.#status.snapshot,
      selection = activeTileSelection(snapshot);
    if (!selection || !isTileTool(snapshot.tool)) return;
    const size =
      activeLayer(snapshot).tilemap?.tileSize ??
      activeSceneSettings(snapshot).gridSize;
    const context = this.#context,
      scale = this.#viewTransform(snapshot).scale;
    context.save();
    context.fillStyle = 'rgba(29, 232, 241, 0.10)';
    context.fillRect(
      selection.x * size,
      selection.y * size,
      selection.width * size,
      selection.height * size,
    );
    context.lineWidth = 2 / scale;
    context.strokeStyle = '#07131b';
    context.strokeRect(
      selection.x * size,
      selection.y * size,
      selection.width * size,
      selection.height * size,
    );
    context.setLineDash([5 / scale, 4 / scale]);
    context.strokeStyle = '#9dfaff';
    context.strokeRect(
      selection.x * size,
      selection.y * size,
      selection.width * size,
      selection.height * size,
    );
    context.restore();
  }

  #terrainHoverPreview(): TileMap | undefined {
    this.#terrainPreviewCells = [];
    this.#terrainPreviewBlocked = false;
    const snapshot = this.#status.snapshot,
      cell = this.#hoverCell;
    if (
      this.#interaction ||
      this.#spacePressed ||
      !cell ||
      !snapshot.tool.startsWith('terrain')
    )
      return;
    const layer = activeLayer(snapshot),
      settings = activeSceneSettings(snapshot);
    if (layer.locked || !layer.visible) return;
    const original = layer.tilemap ?? {
      tileSize: settings.gridSize,
      cells: {},
    };
    const bounds = tileBounds(
      settings.width,
      settings.height,
      original.tileSize,
    );
    if (!inBounds(cell, bounds)) return;
    const terrain = selectedTerrain(snapshot.document.assets, snapshot.terrain);
    if (!terrain) {
      this.#terrainPreviewBlocked = true;
      return;
    }
    const preview: TileMap = {
      tileSize: original.tileSize,
      cells: { ...original.cells },
    };
    try {
      paintTerrain(
        preview,
        terrain,
        [cell],
        bounds,
        snapshot.tool === 'terrain-erase',
        activeTileSelection(snapshot),
      );
      for (
        let y = Math.max(0, cell.y - 1);
        y <= Math.min(bounds.rows - 1, cell.y + 1);
        y++
      )
        for (
          let x = Math.max(0, cell.x - 1);
          x <= Math.min(bounds.columns - 1, cell.x + 1);
          x++
        ) {
          const key = cellKey({ x, y });
          if (
            JSON.stringify(preview.cells[key]) !==
            JSON.stringify(original.cells[key])
          )
            this.#terrainPreviewCells.push({ x, y });
        }
      return preview;
    } catch {
      this.#terrainPreviewBlocked = true;
      return;
    }
  }

  #drawTileCursor(): void {
    const snapshot = this.#status.snapshot;
    if (!isTileTool(snapshot.tool) || !this.#hoverCell || this.#spacePressed)
      return;
    const layer = activeLayer(snapshot),
      settings = activeSceneSettings(snapshot);
    const size = layer.tilemap?.tileSize ?? settings.gridSize;
    const cell = this.#hoverCell,
      bounds = tileBounds(settings.width, settings.height, size);
    if (!inBounds(cell, bounds)) return;
    const context = this.#context,
      interaction = this.#interaction;
    const stamp = snapshot.tileStamp;
    const selection = activeTileSelection(snapshot);
    context.save();
    context.beginPath();
    context.rect(0, 0, bounds.columns * size, bounds.rows * size);
    context.clip();
    for (const at of this.#terrainPreviewCells) {
      context.strokeStyle = '#9ddc7a';
      context.lineWidth = 1 / this.#viewTransform(snapshot).scale;
      context.strokeRect(at.x * size, at.y * size, size, size);
    }
    if (
      !interaction &&
      stamp &&
      (snapshot.tool === 'brush' || snapshot.tool === 'paste') &&
      layer.visible &&
      !layer.locked
    ) {
      context.globalAlpha = 0.55;
      stamp.tiles.forEach((tile, index) => {
        if (
          tile &&
          (snapshot.tool === 'paste' ||
            insideSelection(
              {
                x: cell.x + (index % stamp.width),
                y: cell.y + Math.floor(index / stamp.width),
              },
              selection,
            ))
        )
          this.#drawTile(
            tile,
            (cell.x + (index % stamp.width)) * size,
            (cell.y + Math.floor(index / stamp.width)) * size,
            size,
          );
      });
      context.globalAlpha = 1;
    }
    context.strokeStyle =
      this.#terrainPreviewBlocked ||
      layer.locked ||
      !layer.visible ||
      snapshot.tool === 'eraser' ||
      snapshot.tool === 'terrain-erase'
        ? '#ff647c'
        : '#1de8f1';
    context.lineWidth = 1.5 / this.#viewTransform(snapshot).scale;
    if (
      interaction?.kind === 'tiles' &&
      (interaction.tool === 'rectangle' ||
        interaction.tool === 'capture' ||
        interaction.tool === 'tile-select')
    ) {
      context.strokeRect(
        Math.min(interaction.start.x, cell.x) * size,
        Math.min(interaction.start.y, cell.y) * size,
        (Math.abs(interaction.start.x - cell.x) + 1) * size,
        (Math.abs(interaction.start.y - cell.y) + 1) * size,
      );
    } else
      context.strokeRect(
        cell.x * size,
        cell.y * size,
        size *
          (['brush', 'paste'].includes(snapshot.tool)
            ? (stamp?.width ?? 1)
            : 1),
        size *
          (['brush', 'paste'].includes(snapshot.tool)
            ? (stamp?.height ?? 1)
            : 1),
      );
    context.restore();
  }

  #beginTiles(event: PointerEvent): void {
    if (event.button !== 0 && event.button !== 2) return;
    event.preventDefault();
    const snapshot = this.#status.snapshot,
      layer = activeLayer(snapshot),
      settings = activeSceneSettings(snapshot);
    const size =
      layer.tilemap?.tileSize ??
      Math.min(1024, Math.max(1, Math.round(settings.gridSize)));
    const point = this.#worldPoint(event),
      cell = { x: Math.floor(point.x / size), y: Math.floor(point.y / size) };
    const bounds = tileBounds(settings.width, settings.height, size);
    if (!inBounds(cell, bounds)) return;
    this.#hoverCell = cell;
    const tool =
      event.button === 2
        ? 'capture'
        : event.altKey
          ? 'eyedropper'
          : snapshot.tool;
    if (!isTileTool(tool) && tool !== 'capture') return;
    if (tool === 'eyedropper') {
      const tile = layer.tilemap?.cells[cellKey(cell)];
      if (tile)
        this.#store.update(
          'Picked tile',
          (draft) => {
            draft.tileStamp = { width: 1, height: 1, tiles: [{ ...tile }] };
            draft.tool = 'brush';
          },
          false,
        );
      return;
    }
    if (
      tool !== 'capture' &&
      tool !== 'tile-select' &&
      (layer.locked || !layer.visible)
    ) {
      this.#tileMessage('Unlock and show the active layer to paint.');
      return;
    }
    if (
      !snapshot.tileStamp &&
      !tool.startsWith('terrain') &&
      tool !== 'eraser' &&
      tool !== 'capture' &&
      tool !== 'tile-select'
    ) {
      this.#tileMessage('Choose a tile in the Tilesets panel first.');
      return;
    }
    const terrain = selectedTerrain(snapshot.document.assets, snapshot.terrain);
    if (tool.startsWith('terrain') && !terrain) {
      this.#tileMessage(
        'Choose a terrain set in Tilesets, or add the sample terrain.',
      );
      return;
    }
    const original = structuredClone(
      layer.tilemap ?? { tileSize: size, cells: {} },
    );
    const interaction: TileInteraction = {
      kind: 'tiles',
      selection: activeTileSelection(snapshot),
      pointerId: event.pointerId,
      layerId: layer.id,
      tool,
      original,
      map: structuredClone(original),
      start: cell,
      last: cell,
      bounds,
      stamp: snapshot.tileStamp,
      ...(terrain ? { terrain } : {}),
    };
    this.#interaction = interaction;
    this.#canvas.setPointerCapture(event.pointerId);
    try {
      if (tool === 'fill' && interaction.stamp)
        fillPattern(
          interaction.map,
          interaction.stamp,
          floodCells(original, cell, bounds, interaction.selection),
          cell,
          interaction.selection,
        );
      else {
        if (tool === 'brush' && event.shiftKey && this.#lastBrushCell)
          interaction.last = this.#lastBrushCell;
        this.#updateTiles(interaction, cell);
      }
    } catch (error) {
      this.#tileMessage(error instanceof Error ? error.message : String(error));
      this.#cancelInteraction();
    }
    this.#queueRender();
  }

  #updateTiles(interaction: TileInteraction, cell: Cell): void {
    // Clamp captured movement so a drag outside the canvas cannot create unbounded work.
    cell = {
      x: Math.max(0, Math.min(interaction.bounds.columns - 1, cell.x)),
      y: Math.max(0, Math.min(interaction.bounds.rows - 1, cell.y)),
    };
    if (interaction.tool.startsWith('terrain') && interaction.terrain) {
      try {
        paintTerrain(
          interaction.map,
          interaction.terrain,
          lineCells(interaction.last, cell),
          interaction.bounds,
          interaction.tool === 'terrain-erase',
          interaction.selection,
        );
      } catch (error) {
        this.#tileMessage(
          error instanceof Error ? error.message : String(error),
        );
        this.#cancelInteraction();
        return;
      }
    } else if (interaction.tool === 'paste' && interaction.stamp) {
      interaction.map = structuredClone(interaction.original);
      paintStamp(
        interaction.map,
        interaction.stamp,
        cell,
        interaction.bounds,
        undefined,
        true,
      );
    } else if (interaction.tool === 'rectangle' && interaction.stamp) {
      interaction.map = structuredClone(interaction.original);
      const origin = {
        x: Math.min(interaction.start.x, cell.x),
        y: Math.min(interaction.start.y, cell.y),
      };
      if (
        (Math.abs(interaction.start.x - cell.x) + 1) *
          (Math.abs(interaction.start.y - cell.y) + 1) >
        262144
      ) {
        this.#tileMessage('A rectangle can contain up to 262,144 cells.');
        return;
      }
      fillPattern(
        interaction.map,
        interaction.stamp,
        rectangleCells(interaction.start, cell, interaction.bounds),
        origin,
        interaction.selection,
      );
    } else if (interaction.tool === 'brush' || interaction.tool === 'eraser') {
      for (const at of lineCells(interaction.last, cell)) {
        if (interaction.tool === 'eraser') {
          if (insideSelection(at, interaction.selection))
            Reflect.deleteProperty(interaction.map.cells, cellKey(at));
        } else if (interaction.stamp)
          paintStamp(
            interaction.map,
            interaction.stamp,
            at,
            interaction.bounds,
            interaction.selection,
          );
      }
    }
    interaction.last = cell;
    this.#queueRender();
  }

  #finishTiles(interaction: TileInteraction): void {
    this.#cancelInteraction();
    if (interaction.tool === 'tile-select') {
      this.#store.update(
        'Selected tile area',
        (draft) => {
          draft.tileSelection = {
            x: Math.min(interaction.start.x, interaction.last.x),
            y: Math.min(interaction.start.y, interaction.last.y),
            width: Math.abs(interaction.start.x - interaction.last.x) + 1,
            height: Math.abs(interaction.start.y - interaction.last.y) + 1,
            layerId: interaction.layerId,
            sceneId: activeScene(draft).id,
          };
          draft.selectedEntityIds = [];
        },
        false,
      );
      return;
    }
    if (interaction.tool === 'capture') {
      const area =
        (Math.abs(interaction.start.x - interaction.last.x) + 1) *
        (Math.abs(interaction.start.y - interaction.last.y) + 1);
      if (area > 4096) {
        this.#tileMessage('Select a stamp of up to 4,096 tiles.');
        return;
      }
      const cells = rectangleCells(
        interaction.start,
        interaction.last,
        interaction.bounds,
      );
      if (cells.length === 0) {
        this.#tileMessage('Select a stamp of up to 4,096 tiles.');
        return;
      }
      const tiles = cells.map(
        (cell) => interaction.original.cells[cellKey(cell)] ?? null,
      );
      if (!tiles.some(Boolean)) return;
      this.#store.update(
        'Captured tile stamp',
        (draft) => {
          draft.tileStamp = {
            width: Math.abs(interaction.start.x - interaction.last.x) + 1,
            height: Math.abs(interaction.start.y - interaction.last.y) + 1,
            tiles,
          };
          draft.tool = 'brush';
          draft.selectedEntityIds = [];
        },
        false,
      );
      return;
    }
    if (interaction.tool === 'brush') this.#lastBrushCell = interaction.last;
    const changed =
      JSON.stringify(interaction.map.cells) !==
      JSON.stringify(interaction.original.cells);
    if (!changed && interaction.tool !== 'paste') return;
    this.#store.update(
      interaction.tool === 'terrain'
        ? 'Painted terrain'
        : interaction.tool === 'terrain-erase'
          ? 'Erased terrain'
          : interaction.tool === 'eraser'
            ? 'Erased tiles'
            : interaction.tool === 'paste'
              ? 'Pasted tiles'
              : 'Painted tiles',
      (draft) => {
        const settings = activeSceneSettings(draft);
        settings.layers ??= sceneLayers(draft).map((layer) => ({ ...layer }));
        const layer = settings.layers.find(
          (layer) => layer.id === interaction.layerId,
        );
        if (!layer || layer.locked || !layer.visible) return;
        layer.tilemap = interaction.map;
        if (interaction.tool === 'paste' && interaction.stamp) {
          draft.tileSelection = {
            ...interaction.last,
            width: Math.min(
              interaction.stamp.width,
              interaction.bounds.columns - interaction.last.x,
            ),
            height: Math.min(
              interaction.stamp.height,
              interaction.bounds.rows - interaction.last.y,
            ),
            sceneId: activeScene(draft).id,
            layerId: layer.id,
          };
          draft.tool = 'tile-select';
        }
      },
      changed,
    );
  }

  #tileMessage(message: string): void {
    this.#canvas.dispatchEvent(
      new CustomEvent('tile-message', { detail: message }),
    );
  }
  #onPointerLeave = (): void => {
    this.#hoverCell = undefined;
    this.#pointerPosition = undefined;
    this.#queueRender();
  };
  #onContextMenu = (event: Event): void => {
    if (isTileTool(this.#status.snapshot.tool)) event.preventDefault();
  };

  #drawEntity(entity: EntityDefinition, snapshot: LevelEditorSnapshot): void {
    const context = this.#context;
    const properties = entityProperties(entity);
    if (properties.visible === false) return;
    const { width, height } = this.#visual(entity);
    const originX = numberProperty(properties, 'originX', 0.5);
    const originY = numberProperty(properties, 'originY', 0.5);
    const left = -width * originX;
    const top = -height * originY;
    context.save();
    context.translate(entity.position.x, entity.position.y);
    context.rotate(entity.rotation ?? 0);

    const assetId =
      typeof properties.assetId === 'string' ? properties.assetId : '';
    const asset = snapshot.document.assets.find(
      (candidate) => candidate.id === assetId,
    );
    if (entity.type === 'particle-effect') {
      const gradient = context.createRadialGradient(0, 0, 2, 0, 0, width / 2);
      gradient.addColorStop(0, 'rgba(255, 225, 120, 0.95)');
      gradient.addColorStop(0.35, 'rgba(255, 57, 126, 0.75)');
      gradient.addColorStop(1, 'rgba(255, 57, 126, 0)');
      context.fillStyle = gradient;
      context.fillRect(left, top, width, height);
    } else if (asset !== undefined) {
      const image = this.#getImage(asset.id, asset.src);
      if (image.complete && image.naturalWidth > 0) {
        const frameWidth = Math.floor(
          numberProperty(properties, 'frameWidth', 0),
        );
        const frameHeight = Math.floor(
          numberProperty(properties, 'frameHeight', 0),
        );
        if (frameWidth > 0 && frameHeight > 0) {
          const exactRegion =
            typeof properties.frameX === 'number' ||
            typeof properties.frameY === 'number';
          const sourceX = Math.min(
            Math.max(0, image.naturalWidth - frameWidth),
            exactRegion
              ? Math.max(0, Math.floor(numberProperty(properties, 'frameX', 0)))
              : Math.max(
                  0,
                  Math.floor(numberProperty(properties, 'frameColumn', 0)),
                ) * frameWidth,
          );
          const sourceY = Math.min(
            Math.max(0, image.naturalHeight - frameHeight),
            exactRegion
              ? Math.max(0, Math.floor(numberProperty(properties, 'frameY', 0)))
              : Math.max(
                  0,
                  Math.floor(numberProperty(properties, 'frameRow', 0)),
                ) * frameHeight,
          );
          context.drawImage(
            image,
            sourceX,
            sourceY,
            Math.min(frameWidth, image.naturalWidth),
            Math.min(frameHeight, image.naturalHeight),
            left,
            top,
            width,
            height,
          );
        } else context.drawImage(image, left, top, width, height);
      } else {
        this.#drawPlaceholder(left, top, width, height);
      }
    } else {
      this.#drawPlaceholder(left, top, width, height);
    }

    if (snapshot.selectedEntityIds.includes(entity.id)) {
      const scale = this.#viewTransform(snapshot).scale;
      context.strokeStyle = '#1de8f1';
      context.lineWidth = 2 / scale;
      context.setLineDash([7 / scale, 4 / scale]);
      context.strokeRect(left, top, width, height);
      context.setLineDash([]);
      const handle = 8 / scale;
      context.fillStyle = '#f7f9fc';
      context.strokeStyle = '#087f8c';
      context.lineWidth = 1 / scale;
      context.fillRect(
        left + width - handle / 2,
        top + height - handle / 2,
        handle,
        handle,
      );
      context.strokeRect(
        left + width - handle / 2,
        top + height - handle / 2,
        handle,
        handle,
      );
      context.beginPath();
      context.moveTo(0, top);
      context.lineTo(0, top - 24 / scale);
      context.stroke();
      context.beginPath();
      context.arc(0, top - 28 / scale, 5 / scale, 0, Math.PI * 2);
      context.fillStyle = '#ff397e';
      context.fill();
    }
    context.restore();
  }

  #drawPlaceholder(
    left: number,
    top: number,
    width: number,
    height: number,
  ): void {
    const context = this.#context;
    context.fillStyle = '#172132';
    context.fillRect(left, top, width, height);
    context.strokeStyle = '#7f8d9d';
    context.beginPath();
    context.moveTo(left, top);
    context.lineTo(left + width, top + height);
    context.moveTo(left + width, top);
    context.lineTo(left, top + height);
    context.stroke();
  }

  #drawPhysics(snapshot: LevelEditorSnapshot): void {
    const context = this.#context;
    const scene = activeScene(snapshot);
    const world = activeSceneSettings(snapshot).physics;
    const entityByBodyId = new Map(
      world.bodies.map((body) => [
        body.id,
        scene.entities.find((entity) => entity.id === body.entityId),
      ]),
    );
    const lineWidth = 1.5 / this.#viewTransform(snapshot).scale;
    context.save();
    context.strokeStyle = 'rgba(255, 57, 126, 0.9)';
    context.fillStyle = 'rgba(255, 57, 126, 0.12)';
    context.lineWidth = lineWidth;
    context.setLineDash([
      5 / this.#viewTransform(snapshot).scale,
      3 / this.#viewTransform(snapshot).scale,
    ]);
    for (const body of world.bodies) {
      const entity = scene.entities.find(
        (candidate) => candidate.id === body.entityId,
      );
      if (
        entity === undefined ||
        !snapshot.selectedEntityIds.includes(entity.id)
      )
        continue;
      context.save();
      context.translate(entity.position.x, entity.position.y);
      context.rotate(entity.rotation ?? 0);
      for (const shape of body.shapes) {
        const offset = shape.offset ?? { x: 0, y: 0 };
        if (shape.kind === 'box') {
          context.fillRect(
            offset.x - shape.width / 2,
            offset.y - shape.height / 2,
            shape.width,
            shape.height,
          );
          context.strokeRect(
            offset.x - shape.width / 2,
            offset.y - shape.height / 2,
            shape.width,
            shape.height,
          );
        } else if (shape.kind === 'circle') {
          context.beginPath();
          context.arc(offset.x, offset.y, shape.radius, 0, Math.PI * 2);
          context.fill();
          context.stroke();
        } else if (shape.kind === 'capsule') {
          const width = shape.axis === 'y' ? shape.radius * 2 : shape.length;
          const height = shape.axis === 'y' ? shape.length : shape.radius * 2;
          context.roundRect(
            offset.x - width / 2,
            offset.y - height / 2,
            width,
            height,
            shape.radius,
          );
          context.fill();
          context.stroke();
        }
      }
      context.restore();
    }
    context.setLineDash([]);
    context.strokeStyle = '#a78bfa';
    context.fillStyle = '#a78bfa';
    for (const joint of world.joints ?? []) {
      const entityA = entityByBodyId.get(joint.bodyA);
      const entityB = entityByBodyId.get(joint.bodyB);
      if (entityA === undefined || entityB === undefined) continue;
      context.beginPath();
      context.moveTo(entityA.position.x, entityA.position.y);
      context.lineTo(entityB.position.x, entityB.position.y);
      context.stroke();
      const anchor =
        joint.type === 'distance'
          ? {
              x: (joint.anchorA.x + joint.anchorB.x) / 2,
              y: (joint.anchorA.y + joint.anchorB.y) / 2,
            }
          : joint.anchor;
      context.beginPath();
      context.arc(
        anchor.x,
        anchor.y,
        4 / this.#viewTransform(snapshot).scale,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    context.restore();
  }

  #getImage(assetId: string, src: string): HTMLImageElement {
    const cached = this.#images.get(assetId);
    if (cached !== undefined && cached.src === src) return cached;
    const image = new Image();
    image.decoding = 'async';
    image.addEventListener('load', () => this.#queueRender(), { once: true });
    image.src = src;
    this.#images.set(assetId, image);
    return image;
  }

  #worldPoint(event: Pick<PointerEvent, 'clientX' | 'clientY'>): {
    x: number;
    y: number;
  } {
    const rect = this.#canvas.getBoundingClientRect();
    const transform = this.#viewTransform(this.#status.snapshot);
    return {
      x: (event.clientX - rect.left - transform.offsetX) / transform.scale,
      y: (event.clientY - rect.top - transform.offsetY) / transform.scale,
    };
  }

  #hitTest(
    x: number,
    y: number,
    includeLocked = false,
  ): EntityDefinition | undefined {
    const scene = activeScene(this.#status.snapshot);
    return [...scene.entities]
      .sort(
        (a, b) =>
          numberProperty(entityProperties(b), 'zIndex', 0) -
          numberProperty(entityProperties(a), 'zIndex', 0),
      )
      .find((entity) => {
        const properties = entityProperties(entity);
        const layer = layerForEntity(this.#status.snapshot, entity);
        if (
          properties.visible === false ||
          (!includeLocked && properties.locked === true) ||
          !layer.visible ||
          (!includeLocked && layer.locked)
        )
          return false;
        const { width, height } = this.#visual(entity);
        const dx = x - entity.position.x;
        const dy = y - entity.position.y;
        const angle = -(entity.rotation ?? 0);
        const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
        const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
        const originX = numberProperty(properties, 'originX', 0.5);
        const originY = numberProperty(properties, 'originY', 0.5);
        return (
          localX >= -width * originX &&
          localX <= width * (1 - originX) &&
          localY >= -height * originY &&
          localY <= height * (1 - originY)
        );
      });
  }

  #interactionKind(
    entity: EntityDefinition,
    x: number,
    y: number,
  ): EntityPointerInteraction['kind'] {
    const tool = this.#status.snapshot.tool;
    if (tool === 'rotate') return 'rotate';
    if (tool === 'scale') return 'scale';
    const visual = this.#visual(entity);
    const distanceFromCorner = Math.hypot(
      x - (entity.position.x + visual.width / 2),
      y - (entity.position.y + visual.height / 2),
    );
    if (
      distanceFromCorner <
      18 / this.#viewTransform(this.#status.snapshot).scale
    )
      return 'scale';
    return 'move';
  }

  #onPointerDown = (event: PointerEvent): void => {
    if (this.#interaction) return;
    this.#pointerPosition = { clientX: event.clientX, clientY: event.clientY };
    this.#altPressed = event.altKey;
    this.#canvas.focus();
    const shouldPan =
      event.button === 1 ||
      (event.button === 0 &&
        (this.#spacePressed || this.#status.snapshot.tool === 'pan'));
    if (shouldPan) {
      event.preventDefault();
      this.#interaction = {
        kind: 'pan',
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startPanX: this.#panX,
        startPanY: this.#panY,
      };
      this.#updateCursor();
      this.#canvas.setPointerCapture(event.pointerId);
      return;
    }
    if (isTileTool(this.#status.snapshot.tool)) {
      this.#beginTiles(event);
      this.#updateCursor();
      return;
    }
    if (event.button !== 0) return;
    const point = this.#worldPoint(event);
    const entity = this.#hitTest(point.x, point.y);
    if (entity === undefined) {
      this.#store.update(
        'Cleared selection',
        (draft) => {
          draft.selectedEntityIds = [];
        },
        false,
      );
      return;
    }
    const additive = event.shiftKey;
    this.#store.update(
      'Selected entity',
      (draft) => {
        draft.selectedEntityIds = additive
          ? [...new Set([...draft.selectedEntityIds, entity.id])]
          : [entity.id];
      },
      false,
    );
    this.#interaction = {
      entityId: entity.id,
      kind: this.#interactionKind(entity, point.x, point.y),
      original: cloneEntity(entity),
      pointerId: event.pointerId,
      startWorldX: point.x,
      startWorldY: point.y,
    };
    this.#previewEntity = cloneEntity(entity);
    this.#updateCursor();
    this.#canvas.setPointerCapture(event.pointerId);
  };

  #onPointerMove = (event: PointerEvent): void => {
    this.#pointerPosition = { clientX: event.clientX, clientY: event.clientY };
    this.#altPressed = event.altKey;
    this.#updateCursor();
    const tileSize =
      activeLayer(this.#status.snapshot).tilemap?.tileSize ??
      activeSceneSettings(this.#status.snapshot).gridSize;
    const world = this.#worldPoint(event);
    this.#hoverCell = {
      x: Math.floor(world.x / tileSize),
      y: Math.floor(world.y / tileSize),
    };
    this.#canvas.dispatchEvent(
      new CustomEvent('tile-hover', { detail: this.#hoverCell }),
    );
    if (isTileTool(this.#status.snapshot.tool)) this.#queueRender();
    const interaction = this.#interaction;
    if (interaction === undefined || interaction.pointerId !== event.pointerId)
      return;
    if (interaction.kind === 'tiles') {
      this.#updateTiles(interaction, this.#hoverCell);
      return;
    }
    if (interaction.kind === 'pan') {
      this.#panX =
        interaction.startPanX + event.clientX - interaction.startClientX;
      this.#panY =
        interaction.startPanY + event.clientY - interaction.startClientY;
      this.#queueRender();
      return;
    }
    const point = this.#worldPoint(event);
    const preview = cloneEntity(interaction.original);
    const dx = point.x - interaction.startWorldX;
    const dy = point.y - interaction.startWorldY;
    if (interaction.kind === 'move') {
      preview.position.x += dx;
      preview.position.y += dy;
      if (this.#status.snapshot.snapToGrid && !event.altKey) {
        const grid = activeSceneSettings(this.#status.snapshot).gridSize;
        preview.position.x = Math.round(preview.position.x / grid) * grid;
        preview.position.y = Math.round(preview.position.y / grid) * grid;
      }
    } else if (interaction.kind === 'rotate') {
      const startAngle = Math.atan2(
        interaction.startWorldY - preview.position.y,
        interaction.startWorldX - preview.position.x,
      );
      const currentAngle = Math.atan2(
        point.y - preview.position.y,
        point.x - preview.position.x,
      );
      preview.rotation =
        (interaction.original.rotation ?? 0) + currentAngle - startAngle;
      if (event.shiftKey)
        preview.rotation =
          Math.round(preview.rotation / (Math.PI / 12)) * (Math.PI / 12);
    } else {
      const startDistance = Math.max(
        1,
        Math.hypot(
          interaction.startWorldX - preview.position.x,
          interaction.startWorldY - preview.position.y,
        ),
      );
      const scale = Math.max(
        0.05,
        Math.hypot(point.x - preview.position.x, point.y - preview.position.y) /
          startDistance,
      );
      preview.scale = {
        x:
          interaction.original.scale?.x === undefined
            ? scale
            : interaction.original.scale.x * scale,
        y:
          interaction.original.scale?.y === undefined
            ? scale
            : interaction.original.scale.y * scale,
      };
    }
    this.#previewEntity = preview;
    this.#queueRender();
  };

  #onPointerUp = (event: PointerEvent): void => {
    const interaction = this.#interaction;
    if (
      interaction?.kind === 'tiles' &&
      interaction.pointerId === event.pointerId
    ) {
      const point = this.#worldPoint(event);
      this.#updateTiles(interaction, {
        x: Math.floor(point.x / interaction.map.tileSize),
        y: Math.floor(point.y / interaction.map.tileSize),
      });
      if (this.#interaction !== interaction) return;
      this.#finishTiles(interaction);
      return;
    }
    if (
      interaction?.kind === 'pan' &&
      interaction.pointerId === event.pointerId
    ) {
      this.#canvas.releasePointerCapture(event.pointerId);
      this.#interaction = undefined;
      this.#updateCursor();
      return;
    }
    const preview = this.#previewEntity;
    if (
      interaction === undefined ||
      interaction.kind === 'pan' ||
      interaction.kind === 'tiles' ||
      preview === undefined ||
      interaction.pointerId !== event.pointerId
    )
      return;
    this.#store.update(`Changed ${interaction.kind}`, (draft) => {
      const entity = activeScene(draft).entities.find(
        (candidate) => candidate.id === interaction.entityId,
      );
      if (entity === undefined) return;
      entity.position = { ...preview.position };
      if (preview.rotation === undefined) delete entity.rotation;
      else entity.rotation = preview.rotation;
      if (preview.scale === undefined) delete entity.scale;
      else entity.scale = { ...preview.scale };
      const body = bodyForEntity(activeSceneSettings(draft).physics, entity.id);
      const shape = body?.shapes[0];
      if (
        body !== undefined &&
        shape !== undefined &&
        (shape.kind === 'box' ||
          shape.kind === 'circle' ||
          shape.kind === 'capsule')
      ) {
        const properties = entityProperties(entity);
        updateBodyShape(
          body,
          shape.kind,
          numberProperty(properties, 'width', 64) * (entity.scale?.x ?? 1),
          numberProperty(properties, 'height', 64) * (entity.scale?.y ?? 1),
        );
      }
    });
    this.#canvas.releasePointerCapture(event.pointerId);
    this.#interaction = undefined;
    this.#previewEntity = undefined;
    this.#queueRender();
  };

  #cancelInteraction = (): void => {
    if (
      this.#interaction &&
      this.#canvas.hasPointerCapture(this.#interaction.pointerId)
    )
      this.#canvas.releasePointerCapture(this.#interaction.pointerId);
    this.#interaction = undefined;
    this.#previewEntity = undefined;
    this.#queueRender();
  };

  #onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      this.setZoom(this.#zoom * (event.deltaY < 0 ? 1.1 : 0.9));
      return;
    }
    this.#panX -= event.shiftKey ? event.deltaY : event.deltaX;
    this.#panY -= event.shiftKey ? 0 : event.deltaY;
    this.#queueRender();
  };

  #onWindowKeyDown = (event: KeyboardEvent): void => {
    if (event.target instanceof Element && event.target.closest('dialog'))
      return;
    if (event.key === 'Alt' && event.target === this.#canvas) {
      this.#altPressed = true;
      this.#updateCursor();
    }
    if (event.key === 'Escape') {
      const interacting = this.#interaction !== undefined;
      this.#cancelInteraction();
      if (
        !interacting &&
        isTileTool(this.#status.snapshot.tool) &&
        !(event.target instanceof HTMLInputElement)
      )
        this.#store.update(
          'Cancelled tile selection or paste',
          (draft) => {
            delete draft.tileSelection;
            if (draft.tool === 'paste') draft.tool = 'tile-select';
          },
          false,
        );
      return;
    }
    if (event.code !== 'Space' || event.repeat || event.target !== this.#canvas)
      return;
    event.preventDefault();
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    )
      return;
    this.#spacePressed = true;
    this.#updateCursor();
  };

  #onWindowBlur = (): void => {
    this.#spacePressed = false;
    this.#altPressed = false;
    this.#cancelInteraction();
  };

  #onWindowKeyUp = (event: KeyboardEvent): void => {
    if (event.key === 'Alt') this.#altPressed = false;
    if (event.code === 'Space') this.#spacePressed = false;
    this.#updateCursor();
  };
}
