import { Application } from 'pixi.js';

import {
  FixedStepAccumulator,
  FlxCamera,
  FlxCameraRenderer,
  FlxContext,
  FlxG,
  FlxPoint,
  FlxSprite,
  FlxText,
} from '../../src';

export type PhaseFiveCameraName = 'follow' | 'overview';

export interface PhaseFiveResizeEvidence {
  canvasPixelHeight: number;
  canvasPixelWidth: number;
  followTargetPixelHeight: number;
  followTargetPixelWidth: number;
  overviewTargetPixelHeight: number;
  overviewTargetPixelWidth: number;
  resolution: number;
}

export interface PhaseFiveAnimationState {
  cameraScrollX: number;
  cameraScrollY: number;
  paused: boolean;
  simulationSeconds: number;
  targetX: number;
  targetY: number;
}

export interface PhaseFiveMetrics {
  cameraCount: number;
  coordinateRoundTrip: boolean;
  effectsIndependent: boolean;
  followExclusiveVisible: boolean;
  followTargetPixelHeight: number;
  followTargetPixelWidth: number;
  overviewExclusiveVisible: boolean;
  overviewTargetPixelHeight: number;
  overviewTargetPixelWidth: number;
  registeredObjects: number;
  renderTransformMatchesCoordinates: boolean;
  renderTargetBytes: number;
  renderer: string;
  singleMultiCoordinatesStable: boolean;
  temporaryTargetDestroyed: boolean;
}

export interface PhaseFiveApplication {
  readonly metrics: PhaseFiveMetrics;
  advanceAnimation(steps: number): PhaseFiveAnimationState;
  animationState(): PhaseFiveAnimationState;
  destroy(): void;
  pauseAnimation(): void;
  pointerToWorld(camera: PhaseFiveCameraName, x: number, y: number): FlxPoint;
  resize(
    width: number,
    height: number,
    resolution: number,
  ): PhaseFiveResizeEvidence;
  resumeAnimation(): void;
  seekAnimation(seconds: number): PhaseFiveAnimationState;
}

const FOLLOW_COLOR = [255, 112, 166, 255] as const;
const OVERVIEW_COLOR = [255, 209, 102, 255] as const;
const PATH_DURATION_SECONDS = 8;
const PATH_START_PHASE = Math.asin(120 / 220);

function hasColor(
  pixels: Uint8ClampedArray,
  color: readonly [number, number, number, number],
): boolean {
  for (let index = 0; index < pixels.length; index += 4) {
    if (
      pixels[index] === color[0] &&
      pixels[index + 1] === color[1] &&
      pixels[index + 2] === color[2] &&
      pixels[index + 3] === color[3]
    ) {
      return true;
    }
  }
  return false;
}

function targetSize(renderer: FlxCameraRenderer, camera: FlxCamera) {
  const target = renderer.getCameraView(camera)?.target;
  if (target === undefined) throw new Error('Camera render target is missing.');
  return {
    height: target.source.pixelHeight,
    width: target.source.pixelWidth,
  };
}

export async function createPhaseFiveApplication(
  host: HTMLElement,
): Promise<PhaseFiveApplication> {
  const app = new Application();
  await app.init({
    antialias: false,
    autoDensity: true,
    autoStart: false,
    background: 0x10131a,
    height: 280,
    preference: 'webgl',
    resolution: Math.min(window.devicePixelRatio, 2),
    width: 800,
  });
  host.append(app.canvas);

  const context = new FlxContext(800, 450, 0.5);
  FlxG.installContext(context);

  const follow = context.camera;
  follow.x = 20;
  follow.y = 20;
  follow.resize(360, 240);
  follow.bgColor = 0xff172235;
  follow.zoom = 1.1;
  follow.setBounds(0, 0, 800, 450);

  const renderer = new FlxCameraRenderer(app.renderer, app.stage, context);
  const coordinateProbe = new FlxPoint(520, 224);
  const singleCameraPoint = follow.worldToScreen(coordinateProbe);

  const overview = new FlxCamera(420, 20, 360, 240, 0.72);
  overview.bgColor = 0xff241a36;
  overview.color = 0xe8ddff;
  overview.angle = 2;
  overview.focusOn({ x: 400, y: 225 });
  context.addCamera(overview);
  const multiCameraPoint = follow.worldToScreen(coordinateProbe);

  const backdrop = new FlxSprite(0, 0).makeGraphic(800, 450, 0x1b2a41ff, true);
  const horizon = new FlxSprite(0, 286).makeGraphic(800, 164, 0x25364fff, true);
  const platform = new FlxSprite(250, 265).makeGraphic(
    360,
    16,
    0x6c7a89ff,
    true,
  );
  const shared = new FlxSprite(520, 205).makeGraphic(30, 30, 0x7bdff2ff, true);
  const followOnly = new FlxSprite(470, 205).makeGraphic(
    30,
    30,
    0xff70a6ff,
    true,
  );
  followOnly.cameras = [follow];
  const overviewOnly = new FlxSprite(470, 205).makeGraphic(
    30,
    30,
    0xffd166ff,
    true,
  );
  overviewOnly.cameras = [overview];
  const parallaxOne = new FlxSprite(130, 82).makeGraphic(
    120,
    20,
    0x354f75ff,
    true,
  );
  parallaxOne.scrollFactor.make(0.35, 0.35);
  const parallaxTwo = new FlxSprite(590, 116).makeGraphic(
    90,
    24,
    0x405d85ff,
    true,
  );
  parallaxTwo.scrollFactor.make(0.55, 0.55);
  const hudLeft = new FlxText(12, 10, 230, 'FOLLOW · PLATFORMER')
    .setFormat('Arial', 13, 0xf6f8ff)
    .setBorderStyle(0x111722, 1);
  hudLeft.scrollFactor.make(0, 0);
  hudLeft.cameras = [follow];
  const hudRight = new FlxText(12, 10, 230, 'OVERVIEW · ROTATED')
    .setFormat('Arial', 13, 0xf6f8ff)
    .setBorderStyle(0x111722, 1);
  hudRight.scrollFactor.make(0, 0);
  hudRight.cameras = [overview];

  const objects: FlxSprite[] = [
    backdrop,
    parallaxOne,
    parallaxTwo,
    horizon,
    platform,
    shared,
    followOnly,
    overviewOnly,
    hudLeft,
    hudRight,
  ];
  for (const object of objects) renderer.add(object);

  follow.follow(shared, FlxCamera.STYLE_PLATFORMER);
  follow.updateWithElapsed(0);
  renderer.render();

  const followTarget = renderer.getCameraView(follow)?.target;
  const overviewTarget = renderer.getCameraView(overview)?.target;
  if (followTarget === undefined || overviewTarget === undefined) {
    throw new Error('Phase 5 camera targets were not created.');
  }
  const followPixels = app.renderer.extract.pixels(followTarget).pixels;
  const overviewPixels = app.renderer.extract.pixels(overviewTarget).pixels;
  const followExclusiveVisible =
    hasColor(followPixels, FOLLOW_COLOR) &&
    !hasColor(followPixels, OVERVIEW_COLOR);
  const overviewExclusiveVisible =
    hasColor(overviewPixels, OVERVIEW_COLOR) &&
    !hasColor(overviewPixels, FOLLOW_COLOR);

  const screenProbe = overview.worldToScreen(coordinateProbe);
  const restoredProbe = overview.screenToWorld(screenProbe);
  const coordinateRoundTrip =
    Math.abs(restoredProbe.x - coordinateProbe.x) < 0.000001 &&
    Math.abs(restoredProbe.y - coordinateProbe.y) < 0.000001;
  const renderedProbe = renderer.getCameraView(overview)?.output.toGlobal({
    x:
      (coordinateProbe.x - overview.scroll.x - overview.width * 0.5) *
      overview.zoom,
    y:
      (coordinateProbe.y - overview.scroll.y - overview.height * 0.5) *
      overview.zoom,
  });
  const renderTransformMatchesCoordinates =
    renderedProbe !== undefined &&
    Math.abs(renderedProbe.x - screenProbe.x) < 0.000001 &&
    Math.abs(renderedProbe.y - screenProbe.y) < 0.000001;

  const temporary = new FlxCamera(0, 0, 64, 64);
  context.addCamera(temporary);
  const temporaryTarget = renderer.getCameraView(temporary)?.target;
  if (temporaryTarget === undefined) {
    throw new Error('Temporary camera target was not created.');
  }
  context.removeCamera(temporary);
  const temporaryTargetDestroyed = temporaryTarget.destroyed;

  follow.flash(0x88ffffff, 0.7);
  follow.shake(0.018, 0.8, null, true, FlxCamera.SHAKE_HORIZONTAL_ONLY);
  overview.fade(0x550d0618, 1.8);
  follow.updateWithElapsed(0.12);
  overview.updateWithElapsed(0.35);
  renderer.render();

  const followSize = targetSize(renderer, follow);
  const overviewSize = targetSize(renderer, overview);
  const metrics: PhaseFiveMetrics = {
    cameraCount: renderer.cameraCount,
    coordinateRoundTrip,
    effectsIndependent: follow.flashAlpha > 0 && overview.fadeAlpha > 0,
    followExclusiveVisible,
    followTargetPixelHeight: followSize.height,
    followTargetPixelWidth: followSize.width,
    overviewExclusiveVisible,
    overviewTargetPixelHeight: overviewSize.height,
    overviewTargetPixelWidth: overviewSize.width,
    registeredObjects: renderer.registeredObjectCount,
    renderTransformMatchesCoordinates,
    renderTargetBytes: renderer.renderTargetBytes,
    renderer: app.renderer.type === 1 ? 'webgl' : 'webgpu',
    singleMultiCoordinatesStable:
      Math.abs(singleCameraPoint.x - multiCameraPoint.x) < 0.000001 &&
      Math.abs(singleCameraPoint.y - multiCameraPoint.y) < 0.000001,
    temporaryTargetDestroyed,
  };

  let destroyed = false;
  let animationPaused = false;
  let simulationSeconds = 0;
  let currentEffectCycle = 0;
  let overviewFadeCleared = false;
  let previousFrameMilliseconds = performance.now();
  let animationFrame = 0;
  const clock = new FixedStepAccumulator();

  const applyTargetPath = (): void => {
    const radians = (simulationSeconds / PATH_DURATION_SECONDS) * Math.PI * 2;
    shared.x = 400 + Math.sin(radians + PATH_START_PHASE) * 220;
    shared.y = 205 + Math.sin(radians * 2) * 28;
  };

  const beginEffectCycle = (): void => {
    follow.flash(0x88ffffff, 0.7, null, true);
    follow.shake(0.018, 0.8, null, true, FlxCamera.SHAKE_HORIZONTAL_ONLY);
    overview.stopFX();
    overview.fade(0x550d0618, 1.8, null, true);
    overviewFadeCleared = false;
  };

  const updateSimulation = (stepSeconds: number): void => {
    simulationSeconds += stepSeconds;
    const effectCycle = Math.floor(simulationSeconds / PATH_DURATION_SECONDS);
    if (effectCycle !== currentEffectCycle) {
      currentEffectCycle = effectCycle;
      beginEffectCycle();
    }
    if (
      !overviewFadeCleared &&
      simulationSeconds % PATH_DURATION_SECONDS >= 2.25
    ) {
      overview.stopFX();
      overviewFadeCleared = true;
    }
    applyTargetPath();
    FlxG.elapsed = stepSeconds;
    follow.updateWithElapsed(stepSeconds);
    overview.updateWithElapsed(stepSeconds);
  };

  const readAnimationState = (): PhaseFiveAnimationState => ({
    cameraScrollX: follow.scroll.x,
    cameraScrollY: follow.scroll.y,
    paused: animationPaused,
    simulationSeconds,
    targetX: shared.x,
    targetY: shared.y,
  });

  const renderFrame = (milliseconds: number): void => {
    if (destroyed) return;
    const elapsedSeconds = Math.max(
      0,
      (milliseconds - previousFrameMilliseconds) / 1_000,
    );
    previousFrameMilliseconds = milliseconds;
    if (!animationPaused) clock.advance(elapsedSeconds, updateSimulation);
    renderer.render();
    animationFrame = requestAnimationFrame(renderFrame);
  };

  const handleVisibilityChange = (): void => {
    const hidden = document.visibilityState === 'hidden';
    clock.setPaused(hidden || animationPaused);
    previousFrameMilliseconds = performance.now();
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  animationFrame = requestAnimationFrame(renderFrame);

  return {
    metrics,
    advanceAnimation(steps): PhaseFiveAnimationState {
      if (!Number.isInteger(steps) || steps < 0) {
        throw new RangeError('Animation steps must be a non-negative integer.');
      }
      animationPaused = true;
      clock.setPaused(true);
      for (let index = 0; index < steps; index += 1) {
        updateSimulation(clock.stepSeconds);
      }
      renderer.render();
      return readAnimationState();
    },
    animationState: readAnimationState,
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(animationFrame);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      renderer.destroy();
      for (const object of objects) object.destroy();
      for (const camera of [...context.cameras]) camera.destroy();
      app.destroy(true, { children: true });
      FlxG.clearContext(context);
    },
    pauseAnimation(): void {
      animationPaused = true;
      clock.setPaused(true);
    },
    pointerToWorld(cameraName, x, y): FlxPoint {
      return (cameraName === 'follow' ? follow : overview).screenToWorld({
        x,
        y,
      });
    },
    resize(width, height, resolution): PhaseFiveResizeEvidence {
      app.renderer.resize(width, height, resolution);
      renderer.resize(resolution);
      renderer.render();
      const resizedFollow = targetSize(renderer, follow);
      const resizedOverview = targetSize(renderer, overview);
      return {
        canvasPixelHeight: app.canvas.height,
        canvasPixelWidth: app.canvas.width,
        followTargetPixelHeight: resizedFollow.height,
        followTargetPixelWidth: resizedFollow.width,
        overviewTargetPixelHeight: resizedOverview.height,
        overviewTargetPixelWidth: resizedOverview.width,
        resolution: app.renderer.resolution,
      };
    },
    resumeAnimation(): void {
      animationPaused = false;
      clock.setPaused(document.visibilityState === 'hidden');
      previousFrameMilliseconds = performance.now();
    },
    seekAnimation(seconds): PhaseFiveAnimationState {
      if (!Number.isFinite(seconds) || seconds < 0) {
        throw new RangeError('Animation time must be non-negative and finite.');
      }
      animationPaused = true;
      clock.setPaused(true);
      simulationSeconds = seconds;
      currentEffectCycle = Math.floor(
        simulationSeconds / PATH_DURATION_SECONDS,
      );
      overviewFadeCleared = true;
      follow.stopFX();
      overview.stopFX();
      applyTargetPath();
      follow.scroll.make();
      follow.updateWithElapsed(0);
      renderer.render();
      return readAnimationState();
    },
  };
}
