import { Container, type Renderer } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FlxCamera,
  FlxCameraRenderer,
  FlxContext,
  FlxG,
  FlxGraphic,
  FlxGroup,
  FlxObject,
  FlxPoint,
  FlxTilemap,
  FlxTilemapBuffer,
  FlxTilemapRenderHandle,
  makeGraphicPixels,
} from '../../src';

function tileset(frameCount = 20, tileSize = 8): FlxGraphic {
  const pixels = makeGraphicPixels(frameCount * tileSize, tileSize, 0xffffffff);
  for (let frame = 0; frame < frameCount; frame += 1) {
    const color = (((frame * 37) & 0xff) << 24) | 0x55aaffff;
    for (let y = 0; y < tileSize; y += 1) {
      for (let x = 0; x < tileSize; x += 1) {
        pixels.data[y * pixels.width + frame * tileSize + x] = color >>> 0;
      }
    }
  }
  return FlxGraphic.fromPixels(pixels, 'tilemap-test');
}

let context: FlxContext;

beforeEach(() => {
  context = new FlxContext(64, 64, 0.5);
  FlxG.installContext(context);
});

afterEach(() => {
  FlxG.clearContext(context);
});

describe('Phase 6 tilemap data and autotiling', () => {
  it('parses, exports, queries, offsets, and mutates OFF maps', () => {
    const graphic = tileset();
    const map = new FlxTilemap();
    map.x = 10;
    map.y = 20;
    map.loadMap('0, 1, 2\r\n3, 1, 0\r\n', graphic, 8, 8);

    expect(map.getData()).toEqual([0, 1, 2, 3, 1, 0]);
    expect(map.getData(false)).toBe(map.getData(false));
    expect(map.getData(true)).toEqual([0, 1, 1, 1, 1, 0]);
    expect(map.widthInTiles).toBe(3);
    expect(map.heightInTiles).toBe(2);
    expect(map.getTile(1, 1)).toBe(1);
    expect(map.getTileByIndex(2)).toBe(2);
    expect(map.getTileInstances(1)).toEqual([1, 4]);
    expect(map.getTileCoords(1)?.[0]).toMatchObject({ x: 22, y: 24 });
    expect(map.getBounds()).toMatchObject({
      x: 10,
      y: 20,
      width: 24,
      height: 16,
    });
    expect(map.setTile(2, 1, 4)).toBe(true);
    expect(map.getTileByIndex(5)).toBe(4);
    expect(map.setTile(4, 1, 1)).toBe(false);
    expect(map.setTileByIndex(99, 1)).toBe(false);
    expect(FlxTilemap.arrayToCSV([0, 1, 1, 0], 2)).toBe('0, 1\n1, 0');
    expect(FlxTilemap.arrayToCSV([0, 1, 2, 0], 2, true)).toBe('1, 0\n2, 1');

    map.follow(context.camera, 0, true);
    expect(context.camera.bounds).toMatchObject({
      x: 10,
      y: 20,
      width: 24,
      height: 16,
    });
    expect(context.worldBounds).toMatchObject({
      x: 10,
      y: 20,
      width: 24,
      height: 16,
    });
    expect(() => map.loadMap('0,1\n1', graphic, 8, 8)).toThrow(/same width/);
    map.destroy();
    graphic.destroy();
  });

  it('matches pinned AUTO and ALT reference arrangements', () => {
    const graphic = tileset();
    const cross = new FlxTilemap().loadMap(
      '0,1,0\n1,1,1\n0,1,0',
      graphic,
      8,
      8,
      FlxTilemap.AUTO,
    );
    expect(cross.getData()).toEqual([0, 6, 0, 11, 16, 11, 0, 6, 0]);

    const filled = new FlxTilemap().loadMap(
      '1,1,1\n1,1,1\n1,1,1',
      graphic,
      8,
      8,
      FlxTilemap.AUTO,
    );
    expect(filled.getData()).toEqual(new Array(9).fill(16));

    const alternate = new FlxTilemap().loadMap(
      '1,1,1\n1,1,1\n0,1,1',
      graphic,
      8,
      8,
      FlxTilemap.ALT,
    );
    expect(alternate.getTile(1, 1)).toBe(2);
    cross.destroy();
    filled.destroy();
    alternate.destroy();
    graphic.destroy();
  });

  it('converts pixel buffers and retains the compatibility buffer contract', () => {
    const pixels = makeGraphicPixels(2, 1, 0xffffffff);
    pixels.data[0] = 0x000000ff;
    expect(FlxTilemap.bitmapToCSV(pixels)).toBe('1, 0');
    expect(FlxTilemap.bitmapToCSV(pixels, false, 2)).toBe(
      '1, 1, 0, 0\n1, 1, 0, 0',
    );
    const buffer = new FlxTilemapBuffer(8, 8, 20, 20, context.camera);
    expect(buffer.columns).toBe(9);
    expect(buffer.rows).toBe(9);
    buffer.fill(0x11223344);
    expect(buffer.pixels.data[0]).toBe(0x11223344);
    buffer.draw(context.camera, new FlxPoint(3, 4));
    expect(buffer).toMatchObject({ dirty: false, x: 3, y: 4 });
    buffer.destroy();
    expect(() => buffer.pixels).toThrow(/destroyed/);
  });

  it('rejects malformed load and conversion inputs at their public boundaries', () => {
    const graphic = tileset();
    expect(() => new FlxTilemap().loadMap('', graphic)).toThrow(/at least one/);
    expect(() => new FlxTilemap().loadMapData([0], 0, graphic)).toThrow(
      /positive integer/,
    );
    expect(() => new FlxTilemap().loadMapData([], 1, graphic)).toThrow(
      /whole number/,
    );
    expect(() => new FlxTilemap().loadMapData([0, 1, 0], 2, graphic)).toThrow(
      /whole number/,
    );
    expect(() => new FlxTilemap().loadMapData([-1], 1, graphic)).toThrow(
      /non-negative integers/,
    );
    expect(() => new FlxTilemap().loadMapData([0.5], 1, graphic)).toThrow(
      /non-negative integers/,
    );
    expect(() =>
      new FlxTilemap().loadMapData([0], 1, graphic, { autoTile: 99 }),
    ).toThrow(/OFF, AUTO, or ALT/);
    expect(() =>
      new FlxTilemap().loadMapData([0], 1, graphic, { tileWidth: -1 }),
    ).toThrow(/positive integers/);
    expect(() =>
      new FlxTilemap().loadMapData([0], 1, graphic, { tileHeight: 1.5 }),
    ).toThrow(/positive integers/);
    expect(() =>
      new FlxTilemap().loadMapData([99], 1, graphic, {
        tileHeight: 8,
        tileWidth: 8,
      }),
    ).toThrow(/no matching/);
    const noFrames = new FlxTilemap();
    expect(() =>
      noFrames.loadMapData([0], 1, graphic, {
        tileHeight: 16,
        tileWidth: graphic.width + 1,
      }),
    ).toThrow(/no frames/);
    noFrames.destroy();

    const defaults = new FlxTilemap().loadMapData([0], 1, graphic.texture);
    expect(defaults).toMatchObject({ height: 8, width: 8 });
    defaults.loadMapData([0], 1, graphic.texture);
    defaults.destroy();
    defaults.destroy();
    expect(() => new FlxTilemap().tileGraphic).toThrow(/not been loaded/);
    expect(() => FlxTilemap.arrayToCSV([0, 1], 0)).toThrow(/CSV width/);
    expect(() =>
      FlxTilemap.bitmapToCSV(makeGraphicPixels(1, 1, 0), false, 0),
    ).toThrow(/scale/);
    expect(() => new FlxTilemapBuffer(0, 8, 1, 1, context.camera)).toThrow(
      /positive/,
    );
    expect(() => new FlxTilemapBuffer(8, 0, 1, 1, context.camera)).toThrow(
      /positive/,
    );
    graphic.destroy();
  });

  it('covers missing queries, raw mutations, property ranges, and ALT edits', () => {
    const graphic = tileset();
    const map = new FlxTilemap().loadMap('0,1\n2,0', graphic, 8, 8);
    expect(map.getTile(-1, 0)).toBe(0);
    expect(map.getTileByIndex(-1)).toBe(0);
    expect(map.getTileByIndex(99)).toBe(0);
    expect(map.getTileInstances(19)).toBeNull();
    expect(map.getTileCoords(19)).toBeNull();
    expect(map.getTileCoords(1, false)?.[0]).toMatchObject({ x: 8, y: 0 });
    expect(map.setTileByIndex(0, 99)).toBe(false);
    expect(map.setTileByIndex(0, 2, false)).toBe(true);
    map.setTileProperties(2, FlxObject.NONE, null, null, 0);
    expect(() => map.setTileProperties(20)).toThrow(/outside/);
    expect(() =>
      map.setTileProperties(2, FlxObject.ANY, null, null, 30),
    ).toThrow(/outside/);
    map.setDirty(false);

    const alternate = new FlxTilemap().loadMap(
      '1,1,1\n1,1,1\n1,1,1',
      graphic,
      8,
      8,
      FlxTilemap.ALT,
    );
    expect(alternate.setTile(0, 0, 0)).toBe(true);
    expect(alternate.getTile(1, 1)).not.toBe(16);
    const hiddenStartingFrame = new FlxTilemap().loadMap(
      '0,1',
      graphic,
      8,
      8,
      FlxTilemap.OFF,
      1,
      0,
      1,
    );
    expect(hiddenStartingFrame.renderFrameAt(0)).toBeNull();
    expect(hiddenStartingFrame.renderFrameAt(99)).toBeNull();
    map.destroy();
    alternate.destroy();
    hiddenStartingFrame.destroy();
    graphic.destroy();
  });
});

describe('Phase 6 tile collision, callbacks, rays, and paths', () => {
  it('supports collision properties, one-way tiles, and callback map indices', () => {
    const graphic = tileset();
    const map = new FlxTilemap().loadMap('0,0,0\n0,1,0\n0,0,0', graphic, 8, 8);
    const callback = vi.fn();
    map.setTileProperties(1, FlxObject.UP, callback);

    const falling = new FlxObject(9, 4, 6, 6);
    falling.last.y = 0;
    falling.velocity.y = 100;
    expect(FlxG.collide(map, falling)).toBe(true);
    expect(falling.y).toBe(2);
    expect(falling.isTouching(FlxObject.DOWN)).toBe(true);
    expect(callback).toHaveBeenCalledOnce();
    expect(callback.mock.calls[0]?.[0]).toMatchObject({
      index: 1,
      mapIndex: 4,
    });

    const rising = new FlxObject(9, 10, 6, 6);
    rising.last.y = 16;
    rising.velocity.y = -100;
    expect(FlxG.collide(map, rising)).toBe(false);
    map.destroy();
    graphic.destroy();
  });

  it('reports ray impacts and returns traversable simplified paths', () => {
    const graphic = tileset();
    const map = new FlxTilemap().loadMap(
      '0,0,1,0,0\n0,0,1,0,0\n0,0,0,0,0\n0,0,1,0,0\n0,0,1,0,0',
      graphic,
      8,
      8,
    );
    const impact = new FlxPoint();
    expect(map.ray(new FlxPoint(4, 4), new FlxPoint(36, 4), impact)).toBe(
      false,
    );
    expect(impact.x).toBeGreaterThanOrEqual(16);
    expect(map.ray(new FlxPoint(4, 20), new FlxPoint(36, 20))).toBe(true);

    const path = map.findPath(
      new FlxPoint(4, 4),
      new FlxPoint(36, 36),
      true,
      true,
    );
    expect(path).not.toBeNull();
    expect(path?.head()).toMatchObject({ x: 4, y: 4 });
    expect(path?.tail()).toMatchObject({ x: 36, y: 36 });
    if (path !== null) {
      for (let index = 1; index < path.nodes.length; index += 1) {
        expect(
          map.ray(
            path.nodes[index - 1] as FlxPoint,
            path.nodes[index] as FlxPoint,
          ),
        ).toBe(true);
      }
    }
    expect(map.findPath(new FlxPoint(20, 4), new FlxPoint(36, 36))).toBeNull();
    map.destroy();
    graphic.destroy();
  });

  it('handles same-cell, unreachable, unsimplified, group, filter, and flipped cases', () => {
    class FilteredObject extends FlxObject {}
    const graphic = tileset();
    const simple = new FlxTilemap().loadMap('0,0', graphic, 8, 8);
    expect(
      simple.findPath(new FlxPoint(1, 1), new FlxPoint(2, 2))?.nodes,
    ).toHaveLength(2);
    expect(
      simple.findPath(new FlxPoint(1, 1), new FlxPoint(12, 1), false, false)
        ?.nodes,
    ).toHaveLength(2);
    expect(
      simple.findPath(new FlxPoint(1, 1), new FlxPoint(12, 1), true, true)
        ?.nodes,
    ).toHaveLength(2);

    const blocked = new FlxTilemap().loadMap(
      '0,1,0\n0,1,0\n0,1,0',
      graphic,
      8,
      8,
    );
    expect(
      blocked.findPath(new FlxPoint(1, 1), new FlxPoint(17, 1)),
    ).toBeNull();
    expect(
      blocked.findPath(new FlxPoint(-1, 1), new FlxPoint(1, 1)),
    ).toBeNull();
    expect(() =>
      blocked.ray(new FlxPoint(0, 0), new FlxPoint(1, 1), null, 0),
    ).toThrow(/resolution/);
    expect(blocked.ray(new FlxPoint(9, 1), new FlxPoint(9, 1))).toBe(false);

    const callback = vi.fn();
    simple.setTile(0, 0, 1);
    simple.setTileProperties(1, FlxObject.NONE, callback, FilteredObject);
    const plain = new FlxObject(1, 1, 2, 2);
    const filtered = new FilteredObject(1, 1, 2, 2);
    expect(simple.overlapsWithCallback(plain)).toBe(false);
    expect(callback).not.toHaveBeenCalled();
    expect(simple.overlapsWithCallback(filtered)).toBe(false);
    expect(callback).toHaveBeenCalledOnce();

    simple.setTileProperties(1, FlxObject.ANY);
    let flipped = false;
    expect(
      simple.overlapsWithCallback(
        filtered,
        (first, second) => {
          flipped = first === filtered && second !== filtered;
          return first.overlaps(second);
        },
        true,
      ),
    ).toBe(true);
    expect(flipped).toBe(true);
    const group = new FlxGroup<FlxObject>();
    group.add(filtered);
    expect(simple.overlaps(group)).toBe(true);
    expect(simple.overlapsAt(0, 0, group)).toBe(true);
    expect(simple.overlaps(new FlxGroup())).toBe(false);
    expect(simple.overlapsPoint(new FlxPoint(-1, -1))).toBe(false);

    const inverted = makeGraphicPixels(2, 1, 0x000000ff);
    inverted.data[1] = 0xffffffff;
    expect(FlxTilemap.bitmapToCSV(inverted, true)).toBe('0, 1');
    simple.destroy();
    blocked.destroy();
    graphic.destroy();
  });
});

describe('Phase 6 dirty chunk rendering', () => {
  it('rebuilds only visible dirty chunks across camera passes', () => {
    const graphic = tileset();
    const map = new FlxTilemap().loadMap(
      FlxTilemap.arrayToCSV(new Array(64).fill(1), 8),
      graphic,
      8,
      8,
    );
    const handle = new FlxTilemapRenderHandle(map, 2);
    const firstCamera = new FlxCamera(0, 0, 31, 31);
    handle.sync(firstCamera);
    expect(handle.visibleChunkCount).toBe(4);
    expect(handle.rebuildCount).toBe(4);

    expect(map.setTile(0, 0, 0)).toBe(true);
    handle.sync(firstCamera);
    expect(handle.lastRebuiltChunks).toEqual(['0:0']);
    const rebuilds = handle.rebuildCount;

    expect(map.setTile(7, 7, 0)).toBe(true);
    handle.sync(firstCamera);
    expect(handle.rebuildCount).toBe(rebuilds);
    const secondCamera = new FlxCamera(0, 0, 31, 31);
    secondCamera.scroll.make(33, 33);
    handle.sync(secondCamera);
    expect(handle.lastRebuiltChunks).toContain('3:3');
    expect(handle.allocatedChunkCount).toBeLessThanOrEqual(8);

    handle.destroy();
    map.setTile(1, 1, 0);
    expect(handle.destroyed).toBe(true);
    firstCamera.destroy();
    secondCamera.destroy();
    map.destroy();
    graphic.destroy();
  });

  it('registers one tilemap handle for multiple camera render targets', () => {
    const graphic = tileset();
    const map = new FlxTilemap().loadMap('1,1\n1,1', graphic, 8, 8);
    const secondary = context.addCamera(new FlxCamera(70, 0, 32, 32));
    const calls: unknown[] = [];
    const renderer = {
      render(options: unknown): void {
        calls.push(options);
      },
      resolution: 1,
    } as unknown as Renderer;
    const output = new Container();
    const cameraRenderer = new FlxCameraRenderer(renderer, output, context);
    const handle = cameraRenderer.add(map);
    expect(cameraRenderer.add(map)).toBe(handle);
    cameraRenderer.render();
    expect(cameraRenderer.registeredObjectCount).toBe(1);
    expect(calls).toHaveLength(3);
    cameraRenderer.destroy();
    secondary.destroy();
    map.destroy();
    graphic.destroy();
    output.destroy({ children: true });
  });

  it('handles full sync, hidden/offscreen maps, invalid chunks, and repeat teardown', () => {
    const graphic = tileset();
    const map = new FlxTilemap().loadMap(
      '1,1,1,1\n1,1,1,1\n1,1,1,1\n1,1,1,1',
      graphic,
      8,
      8,
    );
    expect(() => new FlxTilemapRenderHandle(map, 0)).toThrow(
      /positive integer/,
    );
    expect(() => new FlxTilemapRenderHandle(map, 1.5)).toThrow(
      /positive integer/,
    );
    const handle = new FlxTilemapRenderHandle(map, 2);
    handle.sync();
    expect(handle.visibleChunkCount).toBe(4);
    map.setDirty();
    handle.sync();
    expect(handle.lastRebuiltChunks).toHaveLength(4);
    map.visible = false;
    handle.sync(context.camera);
    expect(handle.visibleChunkCount).toBe(0);
    map.visible = true;
    context.camera.scroll.make(1_000, 1_000);
    handle.sync(context.camera);
    expect(handle.visibleChunkCount).toBe(0);
    handle.destroy();
    handle.destroy();
    handle.sync(context.camera);
    map.destroy();
    graphic.destroy();
  });
});
