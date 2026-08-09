import { Application, Graphics } from 'pixi.js';

import {
  FlxAssets,
  FlxContext,
  FlxG,
  FlxGraphic,
  FlxObject,
  FlxSprite,
  FlxText,
  makeGraphicPixels,
} from '../../src';

export interface SpritesTextMetrics {
  animationCallbacks: number;
  assetCacheShared: boolean;
  cachedFrameTextures: number;
  recoveredFailedAlias: boolean;
  renderer: string;
  rendererResolution: number;
  retainedHandles: number;
  textResolution: number;
}

export interface SpritesTextApplication {
  readonly metrics: SpritesTextMetrics;
  destroy(): void;
}

function createSheet(): FlxGraphic {
  const frameSize = 16;
  const pixels = makeGraphicPixels(frameSize * 4, frameSize, 0);
  const colors = [0xff4d6dff, 0xffd166ff, 0x06d6a0ff, 0x4cc9f0ff];

  for (let frame = 0; frame < 4; frame += 1) {
    for (let y = 1; y < frameSize - 1; y += 1) {
      for (let x = 1; x < frameSize - 1; x += 1) {
        const edge =
          x === 1 || x === frameSize - 2 || y === 1 || y === frameSize - 2;
        const eye = y === 5 && (x === 5 || x === 11);
        const color = eye
          ? 0x10131aff
          : edge
            ? 0xffffffff
            : (colors[frame] ?? 0);
        pixels.data[y * pixels.width + frame * frameSize + x] = color;
      }
    }
  }
  return FlxGraphic.fromPixels(pixels, 'sprites-text-sheet');
}

export async function createSpritesTextApplication(
  host: HTMLElement,
): Promise<SpritesTextApplication> {
  const app = new Application();
  await app.init({
    antialias: false,
    autoDensity: true,
    autoStart: false,
    background: 0x111722,
    height: 240,
    preference: 'webgl',
    resolution: Math.min(window.devicePixelRatio, 2),
    width: 480,
  });
  host.append(app.canvas);

  const context = new FlxContext(480, 240, 0.5);
  FlxG.installContext(context);
  const assets = new FlxAssets().install(context);
  await assets.init({ skipDetections: true });
  const sharedDescriptor = {
    alias: 'sprites-text-config',
    parser: 'json',
    src: 'data:application/json,%7B%22phase%22%3A4%7D',
  };
  assets.add(sharedDescriptor);
  const firstConfig = await assets.load(sharedDescriptor);
  const secondConfig = await assets.load('sprites-text-config');

  let recoveredFailedAlias = false;
  assets.add({
    alias: 'recoverable-config',
    parser: 'json',
    src: 'data:application/json,not-json',
  });
  try {
    await assets.load('recoverable-config');
  } catch {
    assets.add({
      alias: 'recovered-config',
      parser: 'json',
      src: 'data:application/json,%7B%22recovered%22%3Atrue%7D',
    });
    const recovered = await assets.load<{ recovered: boolean }>(
      'recovered-config',
    );
    recoveredFailedAlias = recovered.recovered;
  }

  const background = new Graphics()
    .roundRect(12, 12, 456, 216, 12)
    .fill(0x1b2333)
    .rect(20, 150, 440, 1)
    .fill(0x35435e);
  app.stage.addChild(background);

  const sheet = createSheet();
  let animationCallbacks = 0;
  const hero = new FlxSprite(72, 58).loadGraphic(sheet, true, true, 16, 16);
  hero.scale.make(4, 4);
  hero.angle = -8;
  hero.alpha = 0.92;
  hero.addAnimation('pulse', [0, 1, 2, 3], 10, true);
  hero.addAnimationCallback(() => {
    animationCallbacks += 1;
  });
  hero.play('pulse');
  FlxG.elapsed = 0.11;
  hero.postUpdate();
  hero.postUpdate();
  hero.pauseAnimation();
  hero.facing = FlxObject.LEFT;
  hero.drawFrame(true);

  const partner = new FlxSprite(238, 64).loadGraphic(
    sheet,
    true,
    false,
    16,
    16,
  );
  partner.frame = 3;
  partner.scale.make(3.5, 3.5);
  partner.angle = 7;
  partner.color = 0xc8e7ff;

  const title = new FlxText(24, 163, 432, 'Sprites and text · sprites + text')
    .setFormat('Arial', 20, 0xf6f8ff, 'center', 0x000000)
    .setBorderStyle(0x26334a, 1);
  const subtitle = new FlxText(
    24,
    199,
    432,
    'nearest pixels · shared frames · explicit assets',
    true,
    'text',
  ).setFormat('Arial', 11, 0x8fe3ff, 'center');

  const heroHandle = hero.createRenderHandle();
  const partnerHandle = partner.createRenderHandle();
  const titleHandle = title.createRenderHandle();
  const subtitleHandle = subtitle.createRenderHandle();
  app.stage.addChild(
    heroHandle.view,
    partnerHandle.view,
    titleHandle.view,
    subtitleHandle.view,
  );

  for (let index = 0; index < 32; index += 1) {
    const transient = hero.createRenderHandle();
    transient.destroy();
  }
  for (let frame = 0; frame < 4; frame += 1) {
    sheet.frameTexture(frame, 16, 16);
  }
  hero.syncRenderHandles();
  partner.syncRenderHandles();
  title.syncRenderHandles();
  subtitle.syncRenderHandles();
  app.render();

  const metrics: SpritesTextMetrics = {
    animationCallbacks,
    assetCacheShared: firstConfig === secondConfig,
    cachedFrameTextures: sheet.cachedFrameCount,
    recoveredFailedAlias,
    renderer: app.renderer.type === 1 ? 'webgl' : 'webgpu',
    rendererResolution: app.renderer.resolution,
    retainedHandles:
      hero.renderHandleCount +
      partner.renderHandleCount +
      title.renderHandleCount +
      subtitle.renderHandleCount,
    textResolution: titleHandle.textNode.resolution,
  };

  let destroyed = false;
  return {
    metrics,
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      hero.destroy();
      partner.destroy();
      title.destroy();
      subtitle.destroy();
      sheet.destroy();
      app.destroy(true, { children: true });
      FlxG.clearContext(context);
    },
  };
}
