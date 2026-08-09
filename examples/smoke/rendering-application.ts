import {
  Application,
  Container,
  Graphics,
  RenderTexture,
  Sprite,
  Text,
} from 'pixi.js';

import { FixedStepAccumulator } from '../../src';

const CAMERA_WIDTH = 390;
const CAMERA_HEIGHT = 240;

interface CameraSpec {
  readonly background: number;
  readonly id: 'follow' | 'overview';
  readonly outputAlpha: number;
  readonly rotation: number;
  readonly tint: number;
  readonly viewportX: number;
  readonly worldX: number;
  readonly worldY: number;
  readonly zoom: number;
}

interface RenderEntry {
  readonly cameras: ReadonlySet<CameraSpec['id']>;
  readonly handle: Graphics;
  readonly scrollFactorX: number;
  readonly scrollFactorY: number;
  x: number;
  y: number;
}

interface CameraOutput {
  readonly fade: Graphics;
  readonly target: RenderTexture;
  readonly viewport: Container;
}

export interface RenderingMetrics {
  readonly cameraPassesPerFrame: number;
  readonly canvasReadbackMilliseconds: number;
  readonly directPassMilliseconds: number;
  readonly renderTargetBytes: number;
  readonly renderTexturePassMilliseconds: number;
  readonly renderer: string;
  readonly sharedHandleParentCount: number;
  readonly visualEvidence: RenderingVisualEvidence;
}

export interface RenderingColorCounts {
  readonly cameraOnly: number;
  readonly forbiddenCameraOnly: number;
  readonly shared: number;
}

export interface RenderingVisualEvidence {
  readonly compositeGap: readonly [number, number, number, number];
  readonly follow: RenderingColorCounts;
  readonly isolated: boolean;
  readonly overview: RenderingColorCounts;
}

export interface RenderingResizeEvidence {
  readonly canvasPixelHeight: number;
  readonly canvasPixelWidth: number;
  readonly logicalHeight: number;
  readonly logicalWidth: number;
  readonly overviewViewportY: number;
  readonly renderTargetBytes: number;
  readonly renderTargetPixelHeight: number;
  readonly renderTargetPixelWidth: number;
  readonly resolution: number;
}

export interface RenderingApplication {
  readonly app: Application;
  readonly metrics: RenderingMetrics;
  destroy(): void;
  resize(
    width: number,
    height: number,
    resolution: number,
  ): RenderingResizeEvidence;
}

function countColor(
  pixels: Uint8ClampedArray,
  red: number,
  green: number,
  blue: number,
  tolerance = 2,
): number {
  let count = 0;

  for (let offset = 0; offset < pixels.length; offset += 4) {
    if (
      Math.abs((pixels[offset] ?? 0) - red) <= tolerance &&
      Math.abs((pixels[offset + 1] ?? 0) - green) <= tolerance &&
      Math.abs((pixels[offset + 2] ?? 0) - blue) <= tolerance &&
      (pixels[offset + 3] ?? 0) >= 250
    ) {
      count += 1;
    }
  }

  return count;
}

function readWebGlPixel(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  resolution: number,
): readonly [number, number, number, number] {
  const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');

  if (context === null) {
    return [0, 0, 0, 0];
  }

  const pixel = new Uint8Array(4);
  const pixelX = Math.floor(x * resolution);
  const pixelY = context.drawingBufferHeight - 1 - Math.floor(y * resolution);
  context.readPixels(
    pixelX,
    pixelY,
    1,
    1,
    context.RGBA,
    context.UNSIGNED_BYTE,
    pixel,
  );
  return [pixel[0] ?? 0, pixel[1] ?? 0, pixel[2] ?? 0, pixel[3] ?? 0];
}

function createGrid(): Graphics {
  const grid = new Graphics();

  for (let coordinate = -400; coordinate <= 400; coordinate += 40) {
    grid.moveTo(coordinate, -240).lineTo(coordinate, 240);
    grid.moveTo(-400, coordinate).lineTo(400, coordinate);
  }

  grid.stroke({ alpha: 0.18, color: 0xffffff, width: 1 });
  grid.rect(-360, -180, 720, 360).stroke({ color: 0x65708a, width: 3 });
  return grid;
}

function createCameraOutput(
  target: RenderTexture,
  x: number,
  title: string,
): CameraOutput {
  const viewport = new Container();
  viewport.position.set(x, 70);

  const output = new Sprite(target);
  const fade = new Graphics()
    .rect(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT)
    .fill(0x000000);
  const mask = new Graphics()
    .roundRect(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT, 12)
    .fill(0xffffff);
  const border = new Graphics()
    .roundRect(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT, 12)
    .stroke({ color: 0x6f7d9b, width: 2 });
  const label = new Text({
    style: { fill: 0xdde6fa, fontFamily: 'sans-serif', fontSize: 15 },
    text: title,
  });
  label.position.set(10, -28);
  output.mask = mask;
  fade.mask = mask;
  fade.alpha = 0;
  viewport.addChild(output, fade, mask, border, label);
  return { fade, target, viewport };
}

function measureCanvasReadback(): number {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (context === null) {
    return Number.NaN;
  }

  context.fillStyle = '#7bdff2';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const started = performance.now();
  let checksum = 0;

  for (let sample = 0; sample < 20; sample += 1) {
    checksum +=
      context.getImageData(0, 0, canvas.width, canvas.height).data[0] ?? 0;
  }

  if (checksum === -1) {
    throw new Error('Unreachable readback checksum.');
  }

  return (performance.now() - started) / 20;
}

export async function createRenderingApplication(
  host: HTMLElement,
): Promise<RenderingApplication> {
  const app = new Application();
  await app.init({
    antialias: false,
    autoStart: false,
    background: '#111722',
    height: 380,
    preference: 'webgl',
    resolution: Math.min(window.devicePixelRatio, 2),
    sharedTicker: false,
    width: 900,
  });
  host.append(app.canvas);
  const initialResolution = app.renderer.resolution;

  const screen = app.stage;
  const cameraPass = new Container();
  const background = new Graphics();
  const world = new Container();
  cameraPass.addChild(background, world);

  const grid = createGrid();
  world.addChild(grid);

  const sharedHandle = new Graphics().circle(0, 0, 18).fill(0x7bdff2);
  const followOnly = new Graphics().regularPoly(0, 0, 18, 3).fill(0x9bf6a3);
  const overviewOnly = new Graphics().star(0, 0, 5, 20, 9).fill(0xff70a6);
  const hudHandle = new Graphics().roundRect(-38, -8, 76, 16, 4).fill(0xffd166);
  world.addChild(sharedHandle, followOnly, overviewOnly, hudHandle);

  const sharedEntry: RenderEntry = {
    cameras: new Set(['follow', 'overview']),
    handle: sharedHandle,
    scrollFactorX: 1,
    scrollFactorY: 1,
    x: -100,
    y: 0,
  };
  const entries: RenderEntry[] = [
    sharedEntry,
    {
      cameras: new Set(['follow']),
      handle: followOnly,
      scrollFactorX: 1,
      scrollFactorY: 1,
      x: -40,
      y: -80,
    },
    {
      cameras: new Set(['overview']),
      handle: overviewOnly,
      scrollFactorX: 1,
      scrollFactorY: 1,
      x: 150,
      y: 90,
    },
    {
      cameras: new Set(['follow', 'overview']),
      handle: hudHandle,
      scrollFactorX: 0,
      scrollFactorY: 0,
      x: -135,
      y: -92,
    },
  ];

  const targets = [
    RenderTexture.create({
      dynamic: true,
      height: CAMERA_HEIGHT,
      resolution: initialResolution,
      width: CAMERA_WIDTH,
    }),
    RenderTexture.create({
      dynamic: true,
      height: CAMERA_HEIGHT,
      resolution: initialResolution,
      width: CAMERA_WIDTH,
    }),
  ] as const;
  const outputs = [
    createCameraOutput(targets[0], 35, 'Follow camera · zoom 1.25×'),
    createCameraOutput(targets[1], 475, 'Overview · rotated · filtered'),
  ] as const;
  screen.addChild(outputs[0].viewport, outputs[1].viewport);

  let followViewportX = 35;
  let overviewViewportX = 475;
  let overviewViewportY = 70;

  const layoutViewports = (width: number): void => {
    if (width >= 860) {
      const firstX = (width - (CAMERA_WIDTH * 2 + 50)) / 2;
      followViewportX = firstX;
      overviewViewportX = firstX + CAMERA_WIDTH + 50;
      overviewViewportY = 70;
      outputs[0].viewport.position.y = 70;
    } else {
      followViewportX = (width - CAMERA_WIDTH) / 2;
      overviewViewportX = followViewportX;
      overviewViewportY = 360;
      outputs[0].viewport.position.y = 70;
    }

    outputs[0].viewport.position.x = followViewportX;
    outputs[1].viewport.position.set(overviewViewportX, overviewViewportY);
  };
  layoutViewports(app.screen.width);

  const clock = new FixedStepAccumulator();
  let previousX = -100;
  let currentX = -100;
  let velocityX = 90;
  let simulationTime = 0;
  let lastTime = performance.now();
  let animationFrame = 0;
  let destroyed = false;

  const update = (stepSeconds: number): void => {
    previousX = currentX;
    currentX += velocityX * stepSeconds;
    simulationTime += stepSeconds;

    if (currentX >= 300 || currentX <= -300) {
      currentX = Math.max(-300, Math.min(300, currentX));
      velocityX *= -1;
    }
  };

  const renderCamera = (camera: CameraSpec, output: CameraOutput): void => {
    background
      .clear()
      .rect(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT)
      .fill(camera.background);

    for (const entry of entries) {
      entry.handle.visible = entry.cameras.has(camera.id);
      entry.handle.position.set(
        entry.x + camera.worldX * (1 - entry.scrollFactorX),
        entry.y + camera.worldY * (1 - entry.scrollFactorY),
      );
    }

    world.pivot.set(camera.worldX, camera.worldY);
    world.position.set(CAMERA_WIDTH / 2, CAMERA_HEIGHT / 2);
    world.scale.set(camera.zoom);
    world.rotation = camera.rotation;

    app.renderer.render({
      clear: true,
      container: cameraPass,
      target: output.target,
    });
    const outputSprite = output.viewport.children[0];

    if (outputSprite instanceof Sprite) {
      outputSprite.alpha = camera.outputAlpha;
      outputSprite.tint = camera.tint;
    }
  };

  const render = (alpha: number): void => {
    const interpolatedX = previousX + (currentX - previousX) * alpha;
    sharedEntry.x = interpolatedX;
    const followX = Math.max(-210, Math.min(210, interpolatedX));
    const followCamera: CameraSpec = {
      background: 0x192337,
      id: 'follow',
      outputAlpha: 1,
      rotation: 0,
      tint: 0xffffff,
      viewportX: followViewportX,
      worldX: followX,
      worldY: 0,
      zoom: 1.25,
    };
    const overviewCamera: CameraSpec = {
      background: 0x241a31,
      id: 'overview',
      outputAlpha: 0.92,
      rotation: 0.08,
      tint: 0xffe5f0,
      viewportX: overviewViewportX,
      worldX: 40,
      worldY: 10,
      zoom: 0.72,
    };

    renderCamera(followCamera, outputs[0]);
    renderCamera(overviewCamera, outputs[1]);

    outputs[0].fade
      .clear()
      .rect(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT)
      .fill(0xffffff);
    outputs[0].fade.alpha = Math.max(0, 1 - (simulationTime % 4) * 3);
    outputs[1].fade
      .clear()
      .rect(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT)
      .fill(0x000000);
    outputs[1].fade.alpha = 0.08 + (Math.sin(simulationTime * 1.2) + 1) * 0.11;
    outputs[0].viewport.position.x =
      followCamera.viewportX + Math.sin(simulationTime * 37) * 1.5;
    outputs[1].viewport.position.x = overviewCamera.viewportX;

    app.renderer.render({ clear: true, container: screen });
  };

  const benchmarkCamera: CameraSpec = {
    background: 0x192337,
    id: 'follow',
    outputAlpha: 1,
    rotation: 0,
    tint: 0xffffff,
    viewportX: 35,
    worldX: 0,
    worldY: 0,
    zoom: 1,
  };
  const benchmarkSamples = 30;
  renderCamera(benchmarkCamera, outputs[0]);
  app.renderer.render({ clear: true, container: cameraPass });

  const directStarted = performance.now();
  for (let sample = 0; sample < benchmarkSamples; sample += 1) {
    app.renderer.render({ clear: true, container: cameraPass });
  }
  const directPassMilliseconds =
    (performance.now() - directStarted) / benchmarkSamples;

  const textureStarted = performance.now();
  for (let sample = 0; sample < benchmarkSamples; sample += 1) {
    renderCamera(benchmarkCamera, outputs[0]);
  }
  const renderTexturePassMilliseconds =
    (performance.now() - textureStarted) / benchmarkSamples;

  const onVisibilityChange = (): void => {
    clock.setPaused(document.visibilityState !== 'visible');
    lastTime = performance.now();
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  const frame = (now: number): void => {
    if (destroyed) {
      return;
    }

    // Some embedded browser surfaces expose rAF and performance timestamps from
    // slightly different origins on the first callback.
    const elapsedSeconds = Math.max(0, (now - lastTime) / 1_000);
    const result = clock.advance(elapsedSeconds, update);
    lastTime = now;
    render(result.alpha);
    animationFrame = window.requestAnimationFrame(frame);
  };
  render(0);
  animationFrame = window.requestAnimationFrame(frame);

  const followPixels = app.renderer.extract.pixels(targets[0]).pixels;
  const overviewPixels = app.renderer.extract.pixels(targets[1]).pixels;
  const followCounts: RenderingColorCounts = {
    cameraOnly: countColor(followPixels, 0x9b, 0xf6, 0xa3),
    forbiddenCameraOnly: countColor(followPixels, 0xff, 0x70, 0xa6),
    shared: countColor(followPixels, 0x7b, 0xdf, 0xf2),
  };
  const overviewCounts: RenderingColorCounts = {
    cameraOnly: countColor(overviewPixels, 0xff, 0x70, 0xa6),
    forbiddenCameraOnly: countColor(overviewPixels, 0x9b, 0xf6, 0xa3),
    shared: countColor(overviewPixels, 0x7b, 0xdf, 0xf2),
  };

  // Extraction binds each render texture, so composite again before sampling
  // the default framebuffer gap between the two masked viewports.
  render(0);
  const compositeGap = readWebGlPixel(
    app.canvas,
    app.screen.width / 2,
    190,
    initialResolution,
  );
  const visualEvidence: RenderingVisualEvidence = {
    compositeGap,
    follow: followCounts,
    isolated:
      followCounts.shared > 100 &&
      followCounts.cameraOnly > 100 &&
      followCounts.forbiddenCameraOnly === 0 &&
      overviewCounts.shared > 100 &&
      overviewCounts.cameraOnly > 100 &&
      overviewCounts.forbiddenCameraOnly === 0 &&
      Math.abs(compositeGap[0] - 0x11) <= 2 &&
      Math.abs(compositeGap[1] - 0x17) <= 2 &&
      Math.abs(compositeGap[2] - 0x22) <= 2 &&
      compositeGap[3] >= 250,
    overview: overviewCounts,
  };

  const getRenderTargetBytes = (): number =>
    targets.reduce(
      (total, target) =>
        total + target.source.pixelWidth * target.source.pixelHeight * 4,
      0,
    );

  const resize = (
    width: number,
    height: number,
    resolution: number,
  ): RenderingResizeEvidence => {
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      !Number.isFinite(resolution) ||
      width < CAMERA_WIDTH + 20 ||
      height < 340 ||
      resolution <= 0
    ) {
      throw new RangeError(
        'Resize dimensions and resolution are outside the spike limits.',
      );
    }

    app.renderer.resize(width, height, resolution);
    targets[0].resize(CAMERA_WIDTH, CAMERA_HEIGHT, resolution);
    targets[1].resize(CAMERA_WIDTH, CAMERA_HEIGHT, resolution);
    layoutViewports(width);
    render(clock.alpha);

    return {
      canvasPixelHeight: app.canvas.height,
      canvasPixelWidth: app.canvas.width,
      logicalHeight: app.screen.height,
      logicalWidth: app.screen.width,
      overviewViewportY,
      renderTargetBytes: getRenderTargetBytes(),
      renderTargetPixelHeight: targets[0].source.pixelHeight,
      renderTargetPixelWidth: targets[0].source.pixelWidth,
      resolution: app.renderer.resolution,
    };
  };

  const metrics: RenderingMetrics = {
    cameraPassesPerFrame: 2,
    canvasReadbackMilliseconds: measureCanvasReadback(),
    directPassMilliseconds,
    renderTargetBytes: getRenderTargetBytes(),
    renderTexturePassMilliseconds,
    renderer: app.renderer.name,
    sharedHandleParentCount: sharedHandle.parent === world ? 1 : 0,
    visualEvidence,
  };

  return {
    app,
    metrics,
    destroy(): void {
      if (destroyed) {
        return;
      }

      destroyed = true;
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      screen.removeChild(outputs[0].viewport, outputs[1].viewport);
      outputs[0].viewport.destroy({ children: true });
      outputs[1].viewport.destroy({ children: true });
      cameraPass.destroy({ children: true });
      targets[0].destroy(true);
      targets[1].destroy(true);
      app.destroy(
        { removeView: true, releaseGlobalResources: true },
        { children: true },
      );
    },
    resize,
  };
}
