import { Texture } from 'pixi.js';
import { bench, describe } from 'vitest';

import {
  FixedStepAccumulator,
  FlxBasic,
  FlxCamera,
  FlxContext,
  FlxEmitter,
  FlxEmitterRenderHandle,
  FlxG,
  FlxGroup,
  FlxGraphic,
  FlxObject,
  FlxPoint,
  FlxQuadTree,
  FlxRandom,
  FlxSprite,
  FlxTilemap,
  FlxTilemapRenderHandle,
  FlxTimer,
  Keyboard,
  Mouse,
  TimerManager,
  upstreamBaseline,
} from '../../src';
import {
  makeGraphicPixels,
  pixelsOverlap,
  replaceColorPixels,
  stampPixels,
} from '../../src/compat/pixel-buffer';

describe('Foundation benchmark reporting', () => {
  bench('read frozen upstream metadata', () => {
    void upstreamBaseline.commit;
  });
});

describe('Rendering risk-spike benchmarks', () => {
  bench('600 fixed simulation steps at 120 Hz display cadence', () => {
    const clock = new FixedStepAccumulator();
    let position = 0;

    for (let frame = 0; frame < 1_200; frame += 1) {
      clock.advance(1 / 120, (stepSeconds) => {
        position += 37 * stepSeconds;
      });
    }

    if (position === 0)
      throw new Error('Unexpected stationary benchmark object.');
  });

  bench('makeGraphic 256×256', () => {
    makeGraphicPixels(256, 256, 0x7bdff2ff);
  });

  bench('stamp 128×128 onto 256×256', () => {
    const destination = makeGraphicPixels(256, 256, 0x000000ff);
    const source = makeGraphicPixels(128, 128, 0x7bdff2ff);
    stampPixels(destination, source, 64, 64);
  });

  bench('replaceColor over 256×256', () => {
    const pixels = makeGraphicPixels(256, 256, 0x7bdff2ff);
    replaceColorPixels(pixels, 0x7bdff2ff, 0xff70a6ff);
  });

  bench('per-pixel overlap 256×256 worst-case miss', () => {
    const first = makeGraphicPixels(256, 256, 0x7bdff200);
    const second = makeGraphicPixels(256, 256, 0xff70a600);
    pixelsOverlap(first, second);
  });
});

describe('Headless-core benchmarks', () => {
  bench('generate 10,000 deterministic random values', () => {
    const random = new FlxRandom(0.5);
    for (let index = 0; index < 10_000; index += 1) random.next();
  });

  bench('recycle a bounded group 10,000 times', () => {
    const group = new FlxGroup<FlxBasic>(64);
    for (let index = 0; index < 10_000; index += 1) {
      const member = group.recycle(FlxBasic);
      member?.kill();
    }
  });
});

const collisionStressGroup = new FlxGroup<FlxObject>();
for (let index = 0; index < 2_000; index += 1) {
  const column = index % 50;
  const row = Math.trunc(index / 50);
  collisionStressGroup.add(new FlxObject(column * 8, row * 8, 4, 4));
}

describe('Collision benchmarks', () => {
  bench('broad-phase 2,000 sparse AABBs', () => {
    const tree = new FlxQuadTree(0, 0, 400, 320);
    tree.load(collisionStressGroup);
    tree.execute();
    tree.destroy();
  });

  bench('10,000 allocation-free X separations', () => {
    const mover = new FlxObject(6, 0, 5, 5);
    const wall = new FlxObject(10, 0, 5, 5);
    wall.immovable = true;
    for (let index = 0; index < 10_000; index += 1) {
      mover.x = 6;
      mover.last.x = 0;
      mover.velocity.x = 6;
      mover.touching = FlxObject.NONE;
      wall.touching = FlxObject.NONE;
      FlxObject.separateX(mover, wall);
    }
  });
});

const renderSyncSprite = new FlxSprite(20, 30).makeGraphic(16, 16, 0x7bdff2ff);
const renderSyncHandle = renderSyncSprite.createRenderHandle();

describe('Sprite adapter benchmarks', () => {
  bench('10,000 sprite render-handle synchronizations', () => {
    for (let index = 0; index < 10_000; index += 1) {
      renderSyncSprite.x = index & 255;
      renderSyncSprite.angle = index % 360;
      renderSyncHandle.sync();
    }
  });

  bench('create and destroy 1,000 transient sprite handles', () => {
    for (let index = 0; index < 1_000; index += 1) {
      renderSyncSprite.createRenderHandle().destroy();
    }
  });
});

const cameraStressTarget = new FlxObject(400, 220, 24, 32);
const cameraStress = new FlxCamera(20, 20, 360, 240, 1.25);
cameraStress.follow(cameraStressTarget, FlxCamera.STYLE_PLATFORMER);
cameraStress.setBounds(0, 0, 1_600, 900);
const worldPoint = new FlxPoint(720, 380);
const screenPoint = new FlxPoint();
const restoredPoint = new FlxPoint();

describe('Camera benchmarks', () => {
  bench('10,000 bounded platformer follow updates', () => {
    for (let index = 0; index < 10_000; index += 1) {
      cameraStressTarget.x = 400 + (index % 800);
      cameraStressTarget.y = 220 + (index % 400);
      cameraStress.updateWithElapsed(1 / 60);
    }
  });

  bench('10,000 allocation-free coordinate round trips', () => {
    for (let index = 0; index < 10_000; index += 1) {
      worldPoint.x = 720 + (index & 31);
      cameraStress.worldToScreen(worldPoint, screenPoint);
      cameraStress.screenToWorld(screenPoint, restoredPoint);
    }
  });
});

const tilemapStressGraphic = FlxGraphic.fromPixels(
  makeGraphicPixels(16, 8, 0x476986ff),
  'tilemaps-benchmark-tiles',
);
const tilemapStressData = new Array<number>(128 * 128).fill(0);
for (let x = 0; x < 128; x += 1) {
  tilemapStressData[127 * 128 + x] = 1;
}
const tilemapStress = new FlxTilemap().loadMapData(
  tilemapStressData,
  128,
  tilemapStressGraphic,
  { tileHeight: 8, tileWidth: 8 },
);
const tilemapStressHandle = new FlxTilemapRenderHandle(tilemapStress, 16);
const tilemapStressCamera = new FlxCamera(0, 0, 320, 240);
tilemapStressHandle.sync(tilemapStressCamera);

describe('Tilemap benchmarks', () => {
  bench('1,000 targeted dirty-chunk tile mutations', () => {
    for (let index = 0; index < 1_000; index += 1) {
      tilemapStress.setTile(index & 15, 0, index & 1);
      tilemapStressHandle.sync(tilemapStressCamera);
    }
  });

  bench('128×128 open-map pathfinding with simplification', () => {
    const path = tilemapStress.findPath(
      new FlxPoint(4, 4),
      new FlxPoint(1_012, 996),
      true,
      true,
    );
    if (path === null) throw new Error('Expected benchmark path.');
    path.destroy();
  });
});

const inputStressKeys = new Keyboard();
const inputStressContext = new FlxContext(800, 450);
const inputStressMouse = new Mouse(inputStressContext);

describe('Input benchmarks', () => {
  bench('10,000 queued keyboard press/release step pairs', () => {
    for (let index = 0; index < 10_000; index += 1) {
      inputStressKeys.handleKeyDown({ code: 'KeyA' });
      inputStressKeys.handleKeyUp({ code: 'KeyA' });
      inputStressKeys.update();
      inputStressKeys.update();
    }
  });

  bench('10,000 pointer updates with camera conversion', () => {
    for (let index = 0; index < 10_000; index += 1) {
      inputStressMouse.handlePointerMove({
        x: index % 800,
        y: index % 450,
      });
      inputStressMouse.update();
    }
  });
});

const effectsStressContext = new FlxContext(800, 450, 0.375);
FlxG.installContext(effectsStressContext);
effectsStressContext.addPlugin(new TimerManager());
const effectsStressEmitter = new FlxEmitter(400, 200, 256);
effectsStressEmitter.makeParticles(Texture.WHITE, 256, 0, false, 0);
effectsStressEmitter.setSize(32, 8);
effectsStressEmitter.setXSpeed(-80, 80);
effectsStressEmitter.setYSpeed(-120, 20);
effectsStressEmitter.gravity = 100;
const effectsStressHandle = new FlxEmitterRenderHandle(effectsStressEmitter, {
  optimized: true,
});

describe('Effects benchmarks', () => {
  bench('3,600 fixed steps through a stable 256-particle pool', () => {
    FlxG.globalSeed = 0.375;
    for (const particle of effectsStressEmitter.members) particle?.kill();
    effectsStressEmitter.start(false, 0.5, 0.005, 0);
    for (let step = 0; step < 3_600; step += 1) {
      FlxG.elapsed = 1 / 60;
      effectsStressEmitter.update();
    }
    if (effectsStressEmitter.length !== 256) {
      throw new Error('Particle pool escaped its allocation plateau.');
    }
  });

  bench('1,000 optimized 256-particle projection synchronizations', () => {
    for (let index = 0; index < 1_000; index += 1) {
      effectsStressHandle.sync(effectsStressContext.camera);
    }
  });

  bench('1,000 deterministic timer callbacks in one catch-up step', () => {
    let callbacks = 0;
    const timer = new FlxTimer().start(1, 1_000, () => {
      callbacks += 1;
    });
    FlxG.elapsed = 1_000;
    effectsStressContext.updatePlugins();
    if (callbacks !== 1_000) throw new Error('Timer catch-up lost callbacks.');
    timer.destroy();
  });
});
