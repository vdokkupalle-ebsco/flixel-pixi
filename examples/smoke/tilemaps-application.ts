import { Application } from 'pixi.js';

import {
  FixedStepAccumulator,
  FlxCamera,
  FlxCameraRenderer,
  FlxContext,
  FlxG,
  FlxGraphic,
  FlxPoint,
  FlxSprite,
  FlxText,
  FlxTilemap,
  makeGraphicPixels,
} from '../../src';
import type { FlxTilemapRenderHandle } from '../../src';

export interface TilemapsState {
  cameraScrollX: number;
  cameraScrollY: number;
  rebuildCount: number;
  simulationSeconds: number;
  targetX: number;
  targetY: number;
}

export interface TilemapsMetrics {
  allocatedChunks: number;
  cameraCount: number;
  dirtyMutationRebuilds: number;
  mapHeightInTiles: number;
  mapWidthInTiles: number;
  pathFound: boolean;
  pathSegmentsRaySafe: boolean;
  renderer: string;
  sharedMapHandles: number;
  visibleChunks: number;
}

export interface TilemapsApplication {
  readonly metrics: TilemapsMetrics;
  advance(steps: number): TilemapsState;
  destroy(): void;
  seek(seconds: number): TilemapsState;
  state(): TilemapsState;
}

const TILE_SIZE = 16;
const MAP_WIDTH = 96;
const MAP_HEIGHT = 48;
const PATH_DURATION = 12;

function makeTileset(): FlxGraphic {
  const colors = [0x26364fff, 0x344c68ff, 0x476986ff, 0x5d82a2ff, 0x6c92b1ff];
  const pixels = makeGraphicPixels(
    TILE_SIZE * colors.length,
    TILE_SIZE,
    0x00000000,
  );
  for (let frame = 0; frame < colors.length; frame += 1) {
    for (let y = 0; y < TILE_SIZE; y += 1) {
      for (let x = 0; x < TILE_SIZE; x += 1) {
        const edge =
          x === 0 || y === 0 || x === TILE_SIZE - 1 || y === TILE_SIZE - 1;
        const highlight = y === 2 && x > 2 && x < TILE_SIZE - 2;
        const base = colors[frame] as number;
        pixels.data[y * pixels.width + frame * TILE_SIZE + x] = edge
          ? 0x182234ff
          : highlight
            ? 0x7bdff2ff
            : base;
      }
    }
  }
  return FlxGraphic.fromPixels(pixels, 'tilemaps-tiles');
}

function makeMapData(): number[] {
  const data = new Array<number>(MAP_WIDTH * MAP_HEIGHT).fill(0);
  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      const boundary =
        x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1;
      const floor = y >= MAP_HEIGHT - 4;
      const platform =
        (y === 34 && x >= 8 && x < 28) ||
        (y === 28 && x >= 34 && x < 54) ||
        (y === 35 && x >= 61 && x < 88) ||
        (y === 20 && x >= 73 && x < 91);
      const pillar =
        (x === 30 && y >= 35) || (x === 57 && y >= 29) || (x === 70 && y >= 36);
      if (boundary || floor || platform || pillar) {
        data[y * MAP_WIDTH + x] = 1 + ((x + y) % 4);
      }
    }
  }
  return data;
}

export async function createTilemapsApplication(
  host: HTMLElement,
): Promise<TilemapsApplication> {
  const app = new Application();
  await app.init({
    antialias: false,
    autoDensity: true,
    autoStart: false,
    background: 0x10131a,
    height: 300,
    preference: 'webgl',
    resolution: Math.min(window.devicePixelRatio, 2),
    width: 800,
  });
  host.append(app.canvas);

  const context = new FlxContext(800, 300, 0.5);
  FlxG.installContext(context);
  const follow = context.camera;
  follow.x = 16;
  follow.y = 18;
  follow.resize(500, 264);
  follow.bgColor = 0xff121d2b;
  const overview = context.addCamera(new FlxCamera(524, 18, 260, 264, 0.18));
  overview.bgColor = 0xff1b1627;
  overview.focusOn({
    x: (MAP_WIDTH * TILE_SIZE) / 2,
    y: (MAP_HEIGHT * TILE_SIZE) / 2,
  });

  const renderer = new FlxCameraRenderer(app.renderer, app.stage, context);
  const graphic = makeTileset();
  const map = new FlxTilemap().loadMapData(makeMapData(), MAP_WIDTH, graphic, {
    tileHeight: TILE_SIZE,
    tileWidth: TILE_SIZE,
  });
  map.follow(follow, 0, true);
  const mapHandle = renderer.add(map) as FlxTilemapRenderHandle;

  const target = new FlxSprite(150, 500).makeGraphic(20, 28, 0xff70a6ff, true);
  const pathMarker = new FlxSprite(0, 0).makeGraphic(10, 10, 0xffd166ff, true);
  pathMarker.cameras = [overview];
  const followLabel = new FlxText(
    12,
    10,
    320,
    'CHUNKED TILEMAP · FOLLOW CAMERA',
  )
    .setFormat('Arial', 13, 0xf6f8ff)
    .setBorderStyle(0x10131a, 1);
  followLabel.scrollFactor.make(0, 0);
  followLabel.cameras = [follow];
  const overviewLabel = new FlxText(10, 10, 220, 'SHARED MAP · OVERVIEW')
    .setFormat('Arial', 13, 0xf6f8ff)
    .setBorderStyle(0x10131a, 1);
  overviewLabel.scrollFactor.make(0, 0);
  overviewLabel.cameras = [overview];
  for (const object of [target, pathMarker, followLabel, overviewLabel]) {
    renderer.add(object);
  }
  follow.follow(target, FlxCamera.STYLE_PLATFORMER);

  const path = map.findPath(
    new FlxPoint(3 * TILE_SIZE + 8, 40 * TILE_SIZE + 8),
    new FlxPoint(91 * TILE_SIZE + 8, 17 * TILE_SIZE + 8),
    true,
    true,
  );
  let pathSegmentsRaySafe = path !== null;
  if (path !== null) {
    for (let index = 1; index < path.nodes.length; index += 1) {
      if (
        !map.ray(
          path.nodes[index - 1] as FlxPoint,
          path.nodes[index] as FlxPoint,
        )
      ) {
        pathSegmentsRaySafe = false;
      }
    }
    const midpoint = path.nodes[Math.floor(path.nodes.length / 2)];
    if (midpoint !== undefined)
      pathMarker.reset(midpoint.x - 5, midpoint.y - 5);
  }

  follow.updateWithElapsed(0);
  renderer.render();
  const beforeMutation = mapHandle.rebuildCount;
  map.setTile(12, 34, 0);
  renderer.render();
  const dirtyMutationRebuilds = mapHandle.rebuildCount - beforeMutation;
  map.setTile(12, 34, 3);

  let destroyed = false;
  let simulationSeconds = 0;
  let previousMilliseconds = performance.now();
  let animationFrame = 0;
  let mutationSecond = -1;
  const clock = new FixedStepAccumulator();

  const applyPath = (): void => {
    const radians = (simulationSeconds / PATH_DURATION) * Math.PI * 2;
    target.x =
      120 + ((simulationSeconds % PATH_DURATION) / PATH_DURATION) * 1_250;
    target.y = 500 + Math.sin(radians * 2) * 46;
  };

  const update = (stepSeconds: number): void => {
    simulationSeconds += stepSeconds;
    applyPath();
    const nextMutationSecond = Math.floor(simulationSeconds);
    if (nextMutationSecond !== mutationSecond) {
      mutationSecond = nextMutationSecond;
      const tileX = 18 + (nextMutationSecond % 10);
      map.setTile(tileX, 34, nextMutationSecond % 2 === 0 ? 0 : 2);
    }
    FlxG.elapsed = stepSeconds;
    follow.updateWithElapsed(stepSeconds);
    overview.updateWithElapsed(stepSeconds);
  };

  const readState = (): TilemapsState => ({
    cameraScrollX: follow.scroll.x,
    cameraScrollY: follow.scroll.y,
    rebuildCount: mapHandle.rebuildCount,
    simulationSeconds,
    targetX: target.x,
    targetY: target.y,
  });

  const renderFrame = (milliseconds: number): void => {
    if (destroyed) return;
    const elapsed = Math.max(0, (milliseconds - previousMilliseconds) / 1_000);
    previousMilliseconds = milliseconds;
    clock.advance(elapsed, update);
    renderer.render();
    animationFrame = requestAnimationFrame(renderFrame);
  };
  animationFrame = requestAnimationFrame(renderFrame);

  const metrics: TilemapsMetrics = {
    allocatedChunks: mapHandle.allocatedChunkCount,
    cameraCount: renderer.cameraCount,
    dirtyMutationRebuilds,
    mapHeightInTiles: map.heightInTiles,
    mapWidthInTiles: map.widthInTiles,
    pathFound: path !== null,
    pathSegmentsRaySafe,
    renderer: app.renderer.type === 1 ? 'webgl' : 'webgpu',
    sharedMapHandles: 1,
    visibleChunks: mapHandle.visibleChunkCount,
  };

  const seek = (seconds: number): TilemapsState => {
    if (!Number.isFinite(seconds) || seconds < 0) {
      throw new RangeError('Animation time must be non-negative and finite.');
    }
    clock.setPaused(true);
    simulationSeconds = seconds;
    mutationSecond = Math.floor(seconds);
    applyPath();
    follow.scroll.make();
    follow.updateWithElapsed(0);
    overview.updateWithElapsed(0);
    renderer.render();
    return readState();
  };

  return {
    metrics,
    advance(steps): TilemapsState {
      if (!Number.isInteger(steps) || steps < 0) {
        throw new RangeError('Step count must be a non-negative integer.');
      }
      clock.setPaused(true);
      for (let index = 0; index < steps; index += 1) update(clock.stepSeconds);
      renderer.render();
      return readState();
    },
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(animationFrame);
      renderer.destroy();
      target.destroy();
      pathMarker.destroy();
      followLabel.destroy();
      overviewLabel.destroy();
      map.destroy();
      graphic.destroy();
      path?.destroy();
      for (const camera of [...context.cameras]) camera.destroy();
      app.destroy(true, { children: true });
      FlxG.clearContext(context);
    },
    seek,
    state: readState,
  };
}
