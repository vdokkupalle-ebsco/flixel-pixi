import type { Texture } from 'pixi.js';

import { FlxGraphic } from '../assets/flx-graphic';
import type { FlxBasic } from '../core/flx-basic';
import { FlxG } from '../core/flx-g';
import { FlxGroup } from '../core/flx-group';
import type { FlxCamera } from '../core/flx-camera';
import { FlxPoint } from '../math/flx-point';
import { FlxRect } from '../math/flx-rect';
import { FlxObject } from '../objects/flx-object';
import { FlxPath } from '../objects/flx-path';

import { FlxTile, type FlxTileCallback, type FlxTileFilter } from './flx-tile';

/** Callback used while testing a tile proxy against an object. @public */
export type FlxTilemapOverlapCallback = (
  first: FlxObject,
  second: FlxObject,
) => boolean;

/** `null` means every rendered tile changed. @internal */
export type FlxTilemapChange = readonly number[] | null;

type FlxTilemapChangeListener = (change: FlxTilemapChange) => void;

/** Options for loading a numeric tile array. @public */
export interface FlxTilemapLoadOptions {
  readonly autoTile: number;
  readonly collideIndex: number;
  readonly drawIndex: number;
  readonly startingIndex: number;
  readonly tileHeight: number;
  readonly tileWidth: number;
}

interface PathCandidate {
  readonly distance: number;
  readonly index: number;
  readonly order: number;
  readonly score: number;
}

function pathCandidateBefore(
  first: PathCandidate,
  second: PathCandidate,
): boolean {
  return (
    first.score < second.score ||
    (first.score === second.score && first.order < second.order)
  );
}

function pushPathCandidate(
  heap: PathCandidate[],
  candidate: PathCandidate,
): void {
  heap.push(candidate);
  let index = heap.length - 1;
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2);
    if (!pathCandidateBefore(candidate, heap[parent] as PathCandidate)) break;
    heap[index] = heap[parent] as PathCandidate;
    index = parent;
  }
  heap[index] = candidate;
}

function popPathCandidate(heap: PathCandidate[]): PathCandidate {
  const result = heap[0] as PathCandidate;
  const tail = heap.pop() as PathCandidate;
  if (heap.length === 0) return result;
  let index = 0;
  while (true) {
    const left = index * 2 + 1;
    const right = left + 1;
    if (left >= heap.length) break;
    let child = left;
    if (
      right < heap.length &&
      pathCandidateBefore(
        heap[right] as PathCandidate,
        heap[left] as PathCandidate,
      )
    ) {
      child = right;
    }
    if (!pathCandidateBefore(heap[child] as PathCandidate, tail)) break;
    heap[index] = heap[child] as PathCandidate;
    index = child;
  }
  heap[index] = tail;
  return result;
}

/** Renderer-neutral tile data, collision, ray, and pathfinding object. @public */
export class FlxTilemap extends FlxObject {
  static readonly OFF = 0;
  static readonly AUTO = 1;
  static readonly ALT = 2;

  auto = FlxTilemap.OFF;
  widthInTiles = 0;
  heightInTiles = 0;
  totalTiles = 0;

  readonly #changeListeners = new Set<FlxTilemapChangeListener>();
  #data: number[] = [];
  #tileObjects: FlxTile[] = [];
  #graphic: FlxGraphic | null = null;
  #ownsGraphicWrapper = false;
  #tileWidth = 0;
  #tileHeight = 0;
  #startingIndex = 0;
  #destroyed = false;

  constructor() {
    super();
    this.immovable = true;
    this.moves = false;
  }

  override destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#changeListeners.clear();
    for (const tile of this.#tileObjects) tile.destroy();
    this.#tileObjects.length = 0;
    this.#data.length = 0;
    if (this.#ownsGraphicWrapper) this.#graphic?.destroy();
    this.#graphic = null;
    super.destroy();
  }

  loadMap(
    mapData: string,
    tileGraphic: FlxGraphic | Texture,
    tileWidth = 0,
    tileHeight = 0,
    autoTile = FlxTilemap.OFF,
    startingIndex = 0,
    drawIndex = 1,
    collideIndex = 1,
  ): this {
    const rows = mapData
      .split(/\r?\n/u)
      .map((row) => row.trim())
      .filter((row) => row.length > 0)
      .map((row) => row.split(',').map((value) => Number(value.trim())));
    if (rows.length === 0 || rows[0]?.length === 0) {
      throw new RangeError('Map data must contain at least one tile.');
    }
    const width = (rows[0] as number[]).length;
    if (rows.some((row) => row.length !== width)) {
      throw new RangeError('Every tilemap row must have the same width.');
    }
    const data = rows.flat();
    return this.loadMapData(data, width, tileGraphic, {
      autoTile,
      collideIndex,
      drawIndex,
      startingIndex,
      tileHeight,
      tileWidth,
    });
  }

  loadMapData(
    data: readonly number[],
    widthInTiles: number,
    tileGraphic: FlxGraphic | Texture,
    options: Partial<FlxTilemapLoadOptions> = {},
  ): this {
    if (!Number.isInteger(widthInTiles) || widthInTiles <= 0) {
      throw new RangeError('widthInTiles must be a positive integer.');
    }
    if (data.length === 0 || data.length % widthInTiles !== 0) {
      throw new RangeError('Tile data must fill a whole number of rows.');
    }
    if (
      data.some(
        (value) =>
          !Number.isInteger(value) || !Number.isFinite(value) || value < 0,
      )
    ) {
      throw new RangeError('Tile data must contain non-negative integers.');
    }

    for (const tile of this.#tileObjects) tile.destroy();
    this.#tileObjects.length = 0;
    if (this.#ownsGraphicWrapper) this.#graphic?.destroy();
    this.#graphic =
      tileGraphic instanceof FlxGraphic
        ? tileGraphic
        : new FlxGraphic(tileGraphic);
    this.#ownsGraphicWrapper = !(tileGraphic instanceof FlxGraphic);

    this.auto = options.autoTile ?? FlxTilemap.OFF;
    if (
      ![FlxTilemap.OFF, FlxTilemap.AUTO, FlxTilemap.ALT].includes(this.auto)
    ) {
      throw new RangeError('autoTile must be OFF, AUTO, or ALT.');
    }
    this.widthInTiles = widthInTiles;
    this.heightInTiles = data.length / widthInTiles;
    this.totalTiles = data.length;
    this.#data = [...data];

    let drawIndex = options.drawIndex ?? 1;
    let collideIndex = options.collideIndex ?? 1;
    this.#startingIndex = options.startingIndex ?? 0;
    if (this.auto !== FlxTilemap.OFF) {
      this.#startingIndex = 1;
      drawIndex = 1;
      collideIndex = 1;
      for (let index = 0; index < this.totalTiles; index += 1) {
        this.#autoTile(index);
      }
    }

    const graphic = this.#graphic;
    let resolvedWidth = options.tileWidth ?? 0;
    if (resolvedWidth === 0) resolvedWidth = graphic.height;
    let resolvedHeight = options.tileHeight ?? 0;
    if (resolvedHeight === 0) resolvedHeight = resolvedWidth;
    if (
      !Number.isInteger(resolvedWidth) ||
      !Number.isInteger(resolvedHeight) ||
      resolvedWidth <= 0 ||
      resolvedHeight <= 0
    ) {
      throw new RangeError('Tile dimensions must be positive integers.');
    }
    this.#tileWidth = resolvedWidth;
    this.#tileHeight = resolvedHeight;
    const frameCount =
      Math.floor(graphic.width / resolvedWidth) *
      Math.floor(graphic.height / resolvedHeight);
    const tileTypeCount = frameCount + (this.auto === FlxTilemap.OFF ? 0 : 1);
    if (tileTypeCount <= 0) throw new RangeError('Tile graphic has no frames.');
    const maximumTile = Math.max(...this.#data);
    if (maximumTile >= tileTypeCount) {
      throw new RangeError(
        `Tile ${maximumTile} has no matching graphic frame or tile type.`,
      );
    }
    for (let index = 0; index < tileTypeCount; index += 1) {
      this.#tileObjects.push(
        new FlxTile(
          this,
          index,
          resolvedWidth,
          resolvedHeight,
          index >= drawIndex,
          index >= collideIndex ? this.allowCollisions : FlxObject.NONE,
        ),
      );
    }
    this.width = this.widthInTiles * resolvedWidth;
    this.height = this.heightInTiles * resolvedHeight;
    this.#emitChange(null);
    return this;
  }

  getData(simple = false): number[] {
    if (!simple) return this.#data;
    return this.#data.map((value) =>
      (this.#tileObjects[value]?.allowCollisions ?? 0) > 0 ? 1 : 0,
    );
  }

  setDirty(dirty = true): void {
    if (dirty) this.#emitChange(null);
  }

  findPath(
    start: Readonly<FlxPoint>,
    end: Readonly<FlxPoint>,
    simplify = true,
    raySimplify = false,
  ): FlxPath | null {
    const startIndex = this.#worldIndex(start.x, start.y);
    const endIndex = this.#worldIndex(end.x, end.y);
    if (
      startIndex < 0 ||
      endIndex < 0 ||
      this.#isSolidIndex(startIndex) ||
      this.#isSolidIndex(endIndex)
    ) {
      return null;
    }
    if (startIndex === endIndex) {
      return new FlxPath([
        new FlxPoint(start.x, start.y),
        new FlxPoint(end.x, end.y),
      ]);
    }

    const distances = new Int32Array(this.totalTiles);
    distances.fill(0x7fffffff);
    distances[startIndex] = 0;
    const cameFrom = new Int32Array(this.totalTiles);
    cameFrom.fill(-1);
    const directions = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
      [1, -1],
      [1, 1],
      [-1, 1],
      [-1, -1],
    ] as const;
    const endX = endIndex % this.widthInTiles;
    const endY = Math.floor(endIndex / this.widthInTiles);
    const open: PathCandidate[] = [];
    let insertionOrder = 0;
    pushPathCandidate(open, {
      distance: 0,
      index: startIndex,
      order: insertionOrder++,
      score: Math.max(
        Math.abs((startIndex % this.widthInTiles) - endX),
        Math.abs(Math.floor(startIndex / this.widthInTiles) - endY),
      ),
    });
    while (open.length > 0) {
      const candidate = popPathCandidate(open);
      const current = candidate.index;
      if (candidate.distance !== distances[current]) continue;
      if (current === endIndex) break;
      const currentX = current % this.widthInTiles;
      const currentY = Math.floor(current / this.widthInTiles);
      for (const [dx, dy] of directions) {
        const nextX = currentX + dx;
        const nextY = currentY + dy;
        if (
          nextX < 0 ||
          nextY < 0 ||
          nextX >= this.widthInTiles ||
          nextY >= this.heightInTiles
        ) {
          continue;
        }
        const next = nextY * this.widthInTiles + nextX;
        if (this.#isSolidIndex(next)) continue;
        if (
          dx !== 0 &&
          dy !== 0 &&
          (this.#isSolidTile(currentX + dx, currentY) ||
            this.#isSolidTile(currentX, currentY + dy))
        ) {
          continue;
        }
        const nextDistance = candidate.distance + 1;
        if (nextDistance >= (distances[next] as number)) continue;
        distances[next] = nextDistance;
        cameFrom[next] = current;
        const heuristic = Math.max(
          Math.abs(nextX - endX),
          Math.abs(nextY - endY),
        );
        pushPathCandidate(open, {
          distance: nextDistance,
          index: next,
          order: insertionOrder++,
          score: nextDistance + heuristic,
        });
      }
    }
    if ((cameFrom[endIndex] as number) < 0) return null;

    const reversed: FlxPoint[] = [new FlxPoint(end.x, end.y)];
    let current = endIndex;
    while (current !== startIndex) {
      const next = cameFrom[current] as number;
      if (next < 0) return null;
      current = next;
      if (current !== startIndex) reversed.push(this.#tileMidpoint(current));
    }
    reversed.push(new FlxPoint(start.x, start.y));
    let points = reversed.reverse();
    if (simplify) points = FlxTilemap.#simplifyCollinear(points);
    if (raySimplify) points = this.#simplifyByRay(points);
    return new FlxPath(points);
  }

  override overlaps(objectOrGroup: FlxBasic): boolean {
    if (objectOrGroup instanceof FlxGroup) {
      let result = false;
      for (const member of objectOrGroup.members.slice(
        0,
        objectOrGroup.length,
      )) {
        if (member !== null && this.overlaps(member)) result = true;
      }
      return result;
    }
    return objectOrGroup instanceof FlxObject
      ? this.overlapsWithCallback(objectOrGroup)
      : false;
  }

  override overlapsAt(x: number, y: number, objectOrGroup: FlxBasic): boolean {
    if (objectOrGroup instanceof FlxGroup) {
      let result = false;
      for (const member of objectOrGroup.members.slice(
        0,
        objectOrGroup.length,
      )) {
        if (member !== null && this.overlapsAt(x, y, member)) result = true;
      }
      return result;
    }
    return objectOrGroup instanceof FlxObject
      ? this.overlapsWithCallback(
          objectOrGroup,
          null,
          false,
          new FlxPoint(x, y),
        )
      : false;
  }

  overlapsWithCallback(
    object: FlxObject,
    callback: FlxTilemapOverlapCallback | null = null,
    flipCallbackParams = false,
    position: Readonly<FlxPoint> | null = null,
  ): boolean {
    const mapX = position?.x ?? this.x;
    const mapY = position?.y ?? this.y;
    const startX = Math.max(0, Math.floor((object.x - mapX) / this.#tileWidth));
    const startY = Math.max(
      0,
      Math.floor((object.y - mapY) / this.#tileHeight),
    );
    const endX = Math.min(
      this.widthInTiles,
      startX + Math.ceil(object.width / this.#tileWidth) + 1,
    );
    const endY = Math.min(
      this.heightInTiles,
      startY + Math.ceil(object.height / this.#tileHeight) + 1,
    );
    let result = false;
    const deltaX = mapX - this.last.x;
    const deltaY = mapY - this.last.y;
    for (let row = startY; row < endY; row += 1) {
      for (let column = startX; column < endX; column += 1) {
        const mapIndex = row * this.widthInTiles + column;
        const tile = this.#tileObjects[this.#data[mapIndex] as number];
        if (tile === undefined) continue;
        tile.x = mapX + column * this.#tileWidth;
        tile.y = mapY + row * this.#tileHeight;
        tile.last.make(tile.x - deltaX, tile.y - deltaY);
        const geometricallyOverlaps =
          object.x + object.width > tile.x &&
          object.x < tile.x + tile.width &&
          object.y + object.height > tile.y &&
          object.y < tile.y + tile.height;
        if (tile.allowCollisions !== FlxObject.NONE) {
          const accepted =
            callback === null
              ? geometricallyOverlaps
              : flipCallbackParams
                ? callback(object, tile)
                : callback(tile, object);
          if (accepted) result = true;
        }
        if (
          geometricallyOverlaps &&
          tile.callback !== null &&
          (tile.filter === null || object instanceof tile.filter)
        ) {
          tile.mapIndex = mapIndex;
          tile.callback(tile, object);
        }
      }
    }
    return result;
  }

  override overlapsPoint(point: Readonly<FlxPoint>): boolean {
    const index = this.#worldIndex(point.x, point.y);
    return index >= 0 && this.#isSolidIndex(index);
  }

  getTile(x: number, y: number): number {
    if (!this.#validTileCoordinate(x, y)) return 0;
    return this.#data[y * this.widthInTiles + x] ?? 0;
  }

  getTileByIndex(index: number): number {
    return Number.isInteger(index) && index >= 0 && index < this.totalTiles
      ? (this.#data[index] ?? 0)
      : 0;
  }

  getTileInstances(index: number): number[] | null {
    const matches: number[] = [];
    for (let mapIndex = 0; mapIndex < this.totalTiles; mapIndex += 1) {
      if (this.#data[mapIndex] === index) matches.push(mapIndex);
    }
    return matches.length === 0 ? null : matches;
  }

  getTileCoords(index: number, midpoint = true): FlxPoint[] | null {
    const instances = this.getTileInstances(index);
    if (instances === null) return null;
    return instances.map((mapIndex) => {
      const point = new FlxPoint(
        this.x + (mapIndex % this.widthInTiles) * this.#tileWidth,
        this.y + Math.floor(mapIndex / this.widthInTiles) * this.#tileHeight,
      );
      if (midpoint) {
        point.x += this.#tileWidth * 0.5;
        point.y += this.#tileHeight * 0.5;
      }
      return point;
    });
  }

  setTile(x: number, y: number, tile: number, updateGraphics = true): boolean {
    if (!this.#validTileCoordinate(x, y)) return false;
    return this.setTileByIndex(y * this.widthInTiles + x, tile, updateGraphics);
  }

  setTileByIndex(index: number, tile: number, updateGraphics = true): boolean {
    if (!Number.isInteger(index) || index < 0 || index >= this.totalTiles) {
      return false;
    }
    if (
      !Number.isInteger(tile) ||
      tile < 0 ||
      tile >= this.#tileObjects.length
    ) {
      return false;
    }
    this.#data[index] = tile;
    if (!updateGraphics) return true;
    if (this.auto === FlxTilemap.OFF) {
      this.#emitChange([index]);
      return true;
    }
    const changed: number[] = [];
    const centerX = index % this.widthInTiles;
    const centerY = Math.floor(index / this.widthInTiles);
    for (let row = centerY - 1; row <= centerY + 1; row += 1) {
      for (let column = centerX - 1; column <= centerX + 1; column += 1) {
        if (!this.#validTileCoordinate(column, row)) continue;
        const changedIndex = row * this.widthInTiles + column;
        this.#autoTile(changedIndex);
        changed.push(changedIndex);
      }
    }
    this.#emitChange(changed);
    return true;
  }

  setTileProperties(
    tileIndex: number,
    allowCollisions = FlxObject.ANY,
    callback: FlxTileCallback | null = null,
    callbackFilter: FlxTileFilter | null = null,
    range = 1,
  ): void {
    const resolvedRange = Math.max(1, Math.trunc(range));
    if (
      !Number.isInteger(tileIndex) ||
      tileIndex < 0 ||
      tileIndex + resolvedRange > this.#tileObjects.length
    ) {
      throw new RangeError('Tile property range is outside the tileset.');
    }
    for (let index = tileIndex; index < tileIndex + resolvedRange; index += 1) {
      const tile = this.#tileObjects[index] as FlxTile;
      tile.allowCollisions = allowCollisions;
      tile.callback = callback;
      tile.filter = callbackFilter;
    }
  }

  follow(
    camera: FlxCamera = FlxG.camera,
    border = 0,
    updateWorld = true,
  ): void {
    camera.setBounds(
      this.x + border * this.#tileWidth,
      this.y + border * this.#tileHeight,
      this.width - border * this.#tileWidth * 2,
      this.height - border * this.#tileHeight * 2,
      updateWorld,
    );
  }

  getBounds(bounds: FlxRect = new FlxRect()): FlxRect {
    return bounds.make(this.x, this.y, this.width, this.height);
  }

  ray(
    start: Readonly<FlxPoint>,
    end: Readonly<FlxPoint>,
    result: FlxPoint | null = null,
    resolution = 1,
  ): boolean {
    if (!Number.isFinite(resolution) || resolution <= 0) {
      throw new RangeError('Ray resolution must be positive.');
    }
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const distance = Math.hypot(deltaX, deltaY);
    const step = Math.min(this.#tileWidth, this.#tileHeight) / resolution;
    const steps = Math.max(1, Math.ceil(distance / step));
    for (let index = 0; index <= steps; index += 1) {
      const ratio = index / steps;
      const x = start.x + deltaX * ratio;
      const y = start.y + deltaY * ratio;
      const tileIndex = this.#worldIndex(x, y);
      if (tileIndex >= 0 && this.#isSolidIndex(tileIndex)) {
        if (result !== null) result.make(x, y);
        return false;
      }
    }
    return true;
  }

  static arrayToCSV(
    data: readonly number[],
    width: number,
    invert = false,
  ): string {
    if (!Number.isInteger(width) || width <= 0 || data.length % width !== 0) {
      throw new RangeError('CSV width must divide the data length.');
    }
    const rows: string[] = [];
    for (let offset = 0; offset < data.length; offset += width) {
      rows.push(
        data
          .slice(offset, offset + width)
          .map((value) =>
            invert && (value === 0 || value === 1) ? 1 - value : value,
          )
          .join(', '),
      );
    }
    return rows.join('\n');
  }

  static bitmapToCSV(
    bitmap: {
      readonly width: number;
      readonly height: number;
      readonly data: Uint32Array;
    },
    invert = false,
    scale = 1,
  ): string {
    if (!Number.isInteger(scale) || scale < 1) {
      throw new RangeError('Bitmap CSV scale must be a positive integer.');
    }
    const data: number[] = [];
    const outputWidth = bitmap.width * scale;
    for (let y = 0; y < bitmap.height; y += 1) {
      const row: number[] = [];
      for (let x = 0; x < bitmap.width; x += 1) {
        const rgb = (bitmap.data[y * bitmap.width + x] ?? 0) >>> 8;
        const solid = invert ? rgb > 0 : rgb === 0;
        for (let repeat = 0; repeat < scale; repeat += 1)
          row.push(solid ? 1 : 0);
      }
      for (let repeat = 0; repeat < scale; repeat += 1) data.push(...row);
    }
    return FlxTilemap.arrayToCSV(data, outputWidth);
  }

  /** Subscribe a renderer adapter to targeted tile changes. @internal */
  onTilesChanged(listener: FlxTilemapChangeListener): () => void {
    this.#changeListeners.add(listener);
    return () => this.#changeListeners.delete(listener);
  }

  /** Graphic used by renderer adapters. @internal */
  get tileGraphic(): FlxGraphic {
    if (this.#graphic === null) throw new Error('Tilemap has not been loaded.');
    return this.#graphic;
  }

  /** Width of one tile in pixels. @public */
  get tileWidth(): number {
    return this.#tileWidth;
  }

  /** Height of one tile in pixels. @public */
  get tileHeight(): number {
    return this.#tileHeight;
  }

  /** Tileset frame for a map index, or null when it should not draw. @internal */
  renderFrameAt(mapIndex: number): number | null {
    const value = this.#data[mapIndex];
    if (value === undefined || !this.#tileObjects[value]?.visible) return null;
    const frame = value - this.#startingIndex;
    return frame >= 0 ? frame : null;
  }

  #autoTile(index: number): void {
    if (this.#data[index] === 0) return;
    let value = 0;
    if (
      index - this.widthInTiles < 0 ||
      (this.#data[index - this.widthInTiles] as number) > 0
    )
      value += 1;
    if (
      index % this.widthInTiles >= this.widthInTiles - 1 ||
      (this.#data[index + 1] as number) > 0
    )
      value += 2;
    if (
      index + this.widthInTiles >= this.totalTiles ||
      (this.#data[index + this.widthInTiles] as number) > 0
    )
      value += 4;
    if (index % this.widthInTiles <= 0 || (this.#data[index - 1] as number) > 0)
      value += 8;
    if (this.auto === FlxTilemap.ALT && value === 15) {
      if (
        index % this.widthInTiles > 0 &&
        index + this.widthInTiles < this.totalTiles &&
        (this.#data[index + this.widthInTiles - 1] as number) <= 0
      )
        value = 1;
      if (
        index % this.widthInTiles > 0 &&
        index - this.widthInTiles >= 0 &&
        (this.#data[index - this.widthInTiles - 1] as number) <= 0
      )
        value = 2;
      if (
        index % this.widthInTiles < this.widthInTiles - 1 &&
        index - this.widthInTiles >= 0 &&
        (this.#data[index - this.widthInTiles + 1] as number) <= 0
      )
        value = 4;
      if (
        index % this.widthInTiles < this.widthInTiles - 1 &&
        index + this.widthInTiles < this.totalTiles &&
        (this.#data[index + this.widthInTiles + 1] as number) <= 0
      )
        value = 8;
    }
    this.#data[index] = value + 1;
  }

  #emitChange(change: FlxTilemapChange): void {
    for (const listener of this.#changeListeners) listener(change);
  }

  #isSolidIndex(index: number): boolean {
    const value = this.#data[index];
    return (
      value !== undefined &&
      (this.#tileObjects[value]?.allowCollisions ?? 0) > 0
    );
  }

  #isSolidTile(x: number, y: number): boolean {
    return (
      this.#validTileCoordinate(x, y) &&
      this.#isSolidIndex(y * this.widthInTiles + x)
    );
  }

  #validTileCoordinate(x: number, y: number): boolean {
    return (
      Number.isInteger(x) &&
      Number.isInteger(y) &&
      x >= 0 &&
      y >= 0 &&
      x < this.widthInTiles &&
      y < this.heightInTiles
    );
  }

  #worldIndex(x: number, y: number): number {
    const tileX = Math.floor((x - this.x) / this.#tileWidth);
    const tileY = Math.floor((y - this.y) / this.#tileHeight);
    return this.#validTileCoordinate(tileX, tileY)
      ? tileY * this.widthInTiles + tileX
      : -1;
  }

  #tileMidpoint(index: number): FlxPoint {
    return new FlxPoint(
      this.x +
        (index % this.widthInTiles) * this.#tileWidth +
        this.#tileWidth * 0.5,
      this.y +
        Math.floor(index / this.widthInTiles) * this.#tileHeight +
        this.#tileHeight * 0.5,
    );
  }

  static #simplifyCollinear(points: readonly FlxPoint[]): FlxPoint[] {
    if (points.length <= 2) return [...points];
    const result = [points[0] as FlxPoint];
    for (let index = 1; index < points.length - 1; index += 1) {
      const previous = result[result.length - 1] as FlxPoint;
      const current = points[index] as FlxPoint;
      const next = points[index + 1] as FlxPoint;
      const cross =
        (current.x - previous.x) * (next.y - current.y) -
        (current.y - previous.y) * (next.x - current.x);
      if (Math.abs(cross) > 1e-9) result.push(current);
    }
    result.push(points[points.length - 1] as FlxPoint);
    return result;
  }

  #simplifyByRay(points: readonly FlxPoint[]): FlxPoint[] {
    if (points.length <= 2) return [...points];
    const result: FlxPoint[] = [points[0] as FlxPoint];
    let source = 0;
    while (source < points.length - 1) {
      let destination = points.length - 1;
      while (
        destination > source + 1 &&
        !this.ray(points[source] as FlxPoint, points[destination] as FlxPoint)
      ) {
        destination -= 1;
      }
      result.push(points[destination] as FlxPoint);
      source = destination;
    }
    return result;
  }
}
