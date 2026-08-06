import { Container, Rectangle, Sprite } from 'pixi.js';

import type { FlxCamera } from '../core/flx-camera';
import type { FlxTilemap, FlxTilemapChange } from '../tilemap/flx-tilemap';

import type { FlxRenderHandle } from './flx-render-handle';

interface TileChunk {
  readonly column: number;
  readonly row: number;
  readonly view: Container;
}

/** Pixi sprite chunks synchronized from one authoritative tilemap. @public */
export class FlxTilemapRenderHandle implements FlxRenderHandle {
  readonly view: Container;
  readonly chunkSizeInTiles: number;

  readonly #owner: FlxTilemap;
  readonly #chunks = new Map<string, TileChunk>();
  readonly #dirtyChunks = new Set<string>();
  readonly #unsubscribe: () => void;
  #destroyed = false;
  #rebuildCount = 0;
  #lastRebuiltChunks: string[] = [];

  constructor(owner: FlxTilemap, chunkSizeInTiles = 16) {
    if (!Number.isInteger(chunkSizeInTiles) || chunkSizeInTiles <= 0) {
      throw new RangeError('Tilemap chunk size must be a positive integer.');
    }
    this.#owner = owner;
    this.chunkSizeInTiles = chunkSizeInTiles;
    this.view = new Container({ label: 'FlxTilemap' });
    this.view.boundsArea = new Rectangle(0, 0, owner.width, owner.height);
    this.#markAllDirty();
    this.#unsubscribe = owner.onTilesChanged((change) => {
      this.#markDirty(change);
    });
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  /** Total chunk rebuilds since construction. @public */
  get rebuildCount(): number {
    return this.#rebuildCount;
  }

  /** Chunk keys rebuilt by the most recent synchronization. @public */
  get lastRebuiltChunks(): readonly string[] {
    return this.#lastRebuiltChunks;
  }

  /** Number of chunks materialized so far. @public */
  get allocatedChunkCount(): number {
    return this.#chunks.size;
  }

  /** Number of chunks visible in the most recent camera pass. @public */
  get visibleChunkCount(): number {
    if (!this.view.visible) return 0;
    let count = 0;
    for (const chunk of this.#chunks.values()) {
      if (chunk.view.visible) count += 1;
    }
    return count;
  }

  sync(camera?: FlxCamera): void {
    if (this.#destroyed) return;
    this.#lastRebuiltChunks = [];
    const owner = this.#owner;
    this.view.visible = owner.exists && owner.visible;
    if (!this.view.visible) return;

    const columnCount = Math.ceil(owner.widthInTiles / this.chunkSizeInTiles);
    const rowCount = Math.ceil(owner.heightInTiles / this.chunkSizeInTiles);
    let firstColumn = 0;
    let lastColumn = columnCount - 1;
    let firstRow = 0;
    let lastRow = rowCount - 1;
    if (camera !== undefined) {
      const chunkWidth = owner.tileWidth * this.chunkSizeInTiles;
      const chunkHeight = owner.tileHeight * this.chunkSizeInTiles;
      const localLeft =
        camera.scroll.x * owner.scrollFactor.x -
        owner.x +
        camera.width * 0.5 -
        camera.width / (2 * camera.zoom);
      const localTop =
        camera.scroll.y * owner.scrollFactor.y -
        owner.y +
        camera.height * 0.5 -
        camera.height / (2 * camera.zoom);
      firstColumn = Math.max(0, Math.floor(localLeft / chunkWidth));
      firstRow = Math.max(0, Math.floor(localTop / chunkHeight));
      lastColumn = Math.min(
        columnCount - 1,
        Math.floor((localLeft + camera.width / camera.zoom) / chunkWidth),
      );
      lastRow = Math.min(
        rowCount - 1,
        Math.floor((localTop + camera.height / camera.zoom) / chunkHeight),
      );
    }

    for (const chunk of this.#chunks.values()) chunk.view.visible = false;
    if (
      firstColumn > lastColumn ||
      firstRow > lastRow ||
      lastColumn < 0 ||
      lastRow < 0
    ) {
      return;
    }
    for (let row = firstRow; row <= lastRow; row += 1) {
      for (let column = firstColumn; column <= lastColumn; column += 1) {
        const key = FlxTilemapRenderHandle.#key(column, row);
        const chunk = this.#getOrCreateChunk(column, row);
        chunk.view.visible = true;
        if (this.#dirtyChunks.has(key)) this.#rebuildChunk(chunk, key);
      }
    }
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#unsubscribe();
    this.#dirtyChunks.clear();
    this.#chunks.clear();
    this.view.destroy({ children: true });
  }

  #getOrCreateChunk(column: number, row: number): TileChunk {
    const key = FlxTilemapRenderHandle.#key(column, row);
    const existing = this.#chunks.get(key);
    if (existing !== undefined) return existing;
    const view = new Container({ label: `FlxTileChunk:${key}` });
    view.position.set(
      column * this.chunkSizeInTiles * this.#owner.tileWidth,
      row * this.chunkSizeInTiles * this.#owner.tileHeight,
    );
    view.boundsArea = new Rectangle(
      0,
      0,
      this.chunkSizeInTiles * this.#owner.tileWidth,
      this.chunkSizeInTiles * this.#owner.tileHeight,
    );
    const chunk = { column, row, view };
    this.#chunks.set(key, chunk);
    this.view.addChild(view);
    return chunk;
  }

  #rebuildChunk(chunk: TileChunk, key: string): void {
    const removed = chunk.view.removeChildren();
    for (const child of removed) child.destroy();
    const owner = this.#owner;
    const startColumn = chunk.column * this.chunkSizeInTiles;
    const startRow = chunk.row * this.chunkSizeInTiles;
    const endColumn = Math.min(
      owner.widthInTiles,
      startColumn + this.chunkSizeInTiles,
    );
    const endRow = Math.min(
      owner.heightInTiles,
      startRow + this.chunkSizeInTiles,
    );
    for (let row = startRow; row < endRow; row += 1) {
      for (let column = startColumn; column < endColumn; column += 1) {
        const mapIndex = row * owner.widthInTiles + column;
        const frame = owner.renderFrameAt(mapIndex);
        if (frame === null) continue;
        const sprite = new Sprite({
          texture: owner.tileGraphic.frameTexture(
            frame,
            owner.tileWidth,
            owner.tileHeight,
          ),
        });
        sprite.position.set(
          (column - startColumn) * owner.tileWidth,
          (row - startRow) * owner.tileHeight,
        );
        sprite.roundPixels = true;
        chunk.view.addChild(sprite);
      }
    }
    this.#dirtyChunks.delete(key);
    this.#rebuildCount += 1;
    this.#lastRebuiltChunks.push(key);
  }

  #markDirty(change: FlxTilemapChange): void {
    if (change === null) {
      this.#markAllDirty();
      return;
    }
    for (const mapIndex of change) {
      const column = Math.floor(
        (mapIndex % this.#owner.widthInTiles) / this.chunkSizeInTiles,
      );
      const row = Math.floor(
        Math.floor(mapIndex / this.#owner.widthInTiles) / this.chunkSizeInTiles,
      );
      this.#dirtyChunks.add(FlxTilemapRenderHandle.#key(column, row));
    }
  }

  #markAllDirty(): void {
    const columns = Math.ceil(this.#owner.widthInTiles / this.chunkSizeInTiles);
    const rows = Math.ceil(this.#owner.heightInTiles / this.chunkSizeInTiles);
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        this.#dirtyChunks.add(FlxTilemapRenderHandle.#key(column, row));
      }
    }
  }

  static #key(column: number, row: number): string {
    return `${column}:${row}`;
  }
}
