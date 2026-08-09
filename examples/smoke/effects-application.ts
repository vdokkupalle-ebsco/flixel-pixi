import { Application } from 'pixi.js';

import {
  DebugPathDisplay,
  FixedStepAccumulator,
  FlxBasic,
  FlxCameraRenderer,
  FlxContext,
  FlxEmitter,
  FlxEmitterRenderHandle,
  FlxG,
  FlxGraphic,
  FlxObject,
  FlxParticle,
  FlxPath,
  FlxPoint,
  FlxRandom,
  FlxSprite,
  FlxText,
  FlxTimer,
  TimerManager,
  makeGraphicPixels,
} from '../../src';

export interface EffectsMetrics {
  allocationPlateau: boolean;
  debugPathLayer: boolean;
  optimizedProjection: boolean;
  pluginRemovalSafe: boolean;
  renderer: string;
  seededRepeatability: boolean;
  timerCatchUp: boolean;
}

export interface EffectsState {
  activeBurstParticles: number;
  activeStreamParticles: number;
  allocatedParticles: number;
  burstCycles: number;
  projectedParticles: number;
  simulationSteps: number;
  timerCallbacks: number;
}

export interface EffectsApplication {
  readonly metrics: EffectsMetrics;
  advance(steps: number): EffectsState;
  destroy(): void;
  pause(): void;
  reset(): EffectsState;
  resume(): void;
  state(): EffectsState;
}

class DemoParticle extends FlxParticle {
  override onEmit(): void {
    this.alpha = 1;
    this.scale.make(1, 1);
  }

  override update(): void {
    super.update();
    if (this.exists && this.lifespan > 0) {
      this.alpha = Math.min(1, this.lifespan * 1.8);
      const scale = 0.55 + Math.min(0.75, this.lifespan * 0.45);
      this.scale.make(scale, scale);
    }
  }
}

function verifyPluginRemoval(context: FlxContext): boolean {
  const trace: string[] = [];
  class SelfRemovingPlugin extends FlxBasic {
    override update(): void {
      trace.push('remove');
      context.removePlugin(this);
    }
  }
  class WitnessPlugin extends FlxBasic {
    override update(): void {
      trace.push('witness');
    }
  }
  const removing = context.addPlugin(new SelfRemovingPlugin());
  const witness = context.addPlugin(new WitnessPlugin());
  context.updatePlugins();
  context.removePlugin(removing);
  context.removePlugin(witness);
  return trace.join('/') === 'remove/witness';
}

function verifySeed(): boolean {
  const first = new FlxRandom(0.375);
  const second = new FlxRandom(0.375);
  return Array.from({ length: 12 }, () => first.next()).every((value) => {
    return value === second.next();
  });
}

export async function createEffectsApplication(
  host: HTMLElement,
): Promise<EffectsApplication> {
  const app = new Application();
  await app.init({
    antialias: false,
    autoDensity: true,
    autoStart: false,
    background: 0x0b1020,
    height: 420,
    preference: 'webgl',
    resolution: Math.min(window.devicePixelRatio, 2),
    width: 800,
  });
  host.append(app.canvas);
  app.canvas.setAttribute('aria-label', 'Effects deterministic effects lab');

  const context = new FlxContext(800, 420, 0.5);
  FlxG.installContext(context);
  const debugPaths = context.addPlugin(new DebugPathDisplay());
  const timers = context.addPlugin(new TimerManager());
  FlxG.visualDebug = true;
  context.camera.bgColor = 0xff0b1020;
  const renderer = new FlxCameraRenderer(app.renderer, app.stage, context);

  const pluginRemovalSafe = verifyPluginRemoval(context);
  let catchUpCallbacks = 0;
  const catchUpTimer = new FlxTimer().start(0.1, 3, () => {
    catchUpCallbacks += 1;
  });
  FlxG.elapsed = 0.35;
  context.updatePlugins();
  catchUpTimer.destroy();
  FlxG.elapsed = 0;

  const panel = new FlxSprite(28, 24).makeGraphic(744, 372, 0x141d33ff);
  const divider = new FlxSprite(399, 134).makeGraphic(2, 220, 0x31405fff);
  const burstPad = new FlxSprite(76, 246).makeGraphic(270, 86, 0x1b2945ff);
  const streamPad = new FlxSprite(454, 246).makeGraphic(270, 86, 0x1b2945ff);
  const title = new FlxText(54, 46, 500, 'DETERMINISTIC EFFECTS LAB')
    .setFormat('Arial', 20, 0xf5f7ff)
    .setBorderStyle(0x0b1020, 1);
  const subtitle = new FlxText(
    54,
    78,
    680,
    'GROUP POOL → FIXED STEP → OPT-IN PIXI PARTICLECONTAINER',
  ).setFormat('Arial', 11, 0x92a7ca);
  const burstLabel = new FlxText(78, 142, 260, 'SEEDED BURST / TIMER')
    .setFormat('Arial', 12, 0x7bdff2)
    .setBorderStyle(0x0b1020, 1);
  const streamLabel = new FlxText(456, 142, 260, 'RECYCLED STREAM / GRAVITY')
    .setFormat('Arial', 12, 0xffcf70)
    .setBorderStyle(0x0b1020, 1);
  const liveLabel = new FlxText(54, 360, 690, '').setFormat(
    'Arial',
    11,
    0xd9e3f5,
  );

  const burstGraphic = FlxGraphic.fromPixels(
    makeGraphicPixels(7, 7, 0x7bdff2ff),
    'effects-burst',
  );
  const streamGraphic = FlxGraphic.fromPixels(
    makeGraphicPixels(6, 6, 0xffcf70ff),
    'effects-stream',
  );
  const burst = new FlxEmitter(211, 268, 96);
  burst.particleClass = DemoParticle;
  burst.makeParticles(burstGraphic, 96, 0, false, 0);
  burst.setSize(4, 4);
  burst.setXSpeed(-115, 115);
  burst.setYSpeed(-125, 35);
  burst.setRotation(-220, 220);
  burst.gravity = 90;
  const stream = new FlxEmitter(585, 178, 128);
  stream.particleClass = DemoParticle;
  stream.makeParticles(streamGraphic, 128, 0, false, 0);
  stream.setSize(52, 4);
  stream.setXSpeed(-24, 24);
  stream.setYSpeed(24, 62);
  stream.setRotation(-90, 90);
  stream.particleDrag.make(8, 0);

  const guide = new FlxPath([
    new FlxPoint(94, 214),
    new FlxPoint(176, 182),
    new FlxPoint(260, 210),
    new FlxPoint(338, 178),
  ]);
  guide.debugColor = 0x6f84aa;
  const probe = new FlxSprite(88, 208).makeGraphic(10, 10, 0xff70a6ff);
  probe.followPath(guide, 70, FlxObject.PATH_YOYO, false);

  for (const object of [
    panel,
    divider,
    burstPad,
    streamPad,
    title,
    subtitle,
    burstLabel,
    streamLabel,
    liveLabel,
    probe,
  ]) {
    renderer.add(object);
  }
  const burstHandle = renderer.add(burst, { optimized: true });
  const streamHandle = renderer.add(stream, { optimized: true });
  if (
    !(burstHandle instanceof FlxEmitterRenderHandle) ||
    !(streamHandle instanceof FlxEmitterRenderHandle)
  ) {
    throw new Error('Emitter render handles were not created.');
  }

  let simulationSteps = 0;
  let burstCycles = 0;
  let timerCallbacks = 0;
  let destroyed = false;
  let animationFrame = 0;
  let previousMilliseconds = performance.now();
  const clock = new FixedStepAccumulator();
  const burstTimer = new FlxTimer();

  const activeParticles = (emitter: FlxEmitter): number => {
    return emitter.members.reduce((count, particle) => {
      return count + (particle?.exists ? 1 : 0);
    }, 0);
  };

  const readState = (): EffectsState => ({
    activeBurstParticles: activeParticles(burst),
    activeStreamParticles: activeParticles(stream),
    allocatedParticles: burst.length + stream.length,
    burstCycles,
    projectedParticles:
      burstHandle.projectedParticleCount + streamHandle.projectedParticleCount,
    simulationSteps,
    timerCallbacks,
  });

  const resetScene = (): void => {
    FlxG.globalSeed = 0.375;
    simulationSteps = 0;
    burstCycles = 1;
    timerCallbacks = 0;
    burstTimer.stop();
    for (const emitter of [burst, stream]) {
      emitter.on = false;
      for (const particle of emitter.members) particle?.kill();
      emitter.revive();
    }
    probe.reset(88, 208);
    probe.followPath(guide, 70, FlxObject.PATH_YOYO, false);
    burst.start(true, 1.15, 0.1, 42);
    stream.start(false, 1.7, 0.035, 0);
    burstTimer.start(0.75, 0, () => {
      timerCallbacks += 1;
      burstCycles += 1;
      burst.start(true, 1.15, 0.1, 42);
    });
    liveLabel.text = 'STEP 0000   ACTIVE 000   POOL 224   TIMER ARMED';
  };

  const update = (stepSeconds: number): void => {
    FlxG.elapsed = stepSeconds;
    context.updatePlugins();
    probe.preUpdate();
    probe.update();
    probe.postUpdate();
    burst.update();
    stream.update();
    context.updateCameras();
    simulationSteps += 1;
    if (simulationSteps % 6 === 0) {
      const state = readState();
      const active = state.activeBurstParticles + state.activeStreamParticles;
      liveLabel.text = `STEP ${String(simulationSteps).padStart(4, '0')}   ACTIVE ${String(active).padStart(3, '0')}   POOL ${state.allocatedParticles}   TIMER ${timerCallbacks}`;
    }
  };

  resetScene();
  update(clock.stepSeconds);
  renderer.render();
  const metrics: EffectsMetrics = {
    allocationPlateau: burst.length === 96 && stream.length === 128,
    debugPathLayer: debugPaths.pathCount === 1 && FlxG.visualDebug,
    optimizedProjection:
      burstHandle.optimized &&
      streamHandle.optimized &&
      burstHandle.projectedParticleCount +
        streamHandle.projectedParticleCount ===
        224,
    pluginRemovalSafe,
    renderer: app.renderer.type === 1 ? 'webgl' : 'webgpu',
    seededRepeatability: verifySeed(),
    timerCatchUp: catchUpCallbacks === 3 && timers.timerCount === 1,
  };

  const renderFrame = (milliseconds: number): void => {
    if (destroyed) return;
    const elapsed = Math.max(0, (milliseconds - previousMilliseconds) / 1_000);
    previousMilliseconds = milliseconds;
    clock.advance(elapsed, update);
    renderer.render();
    animationFrame = requestAnimationFrame(renderFrame);
  };
  animationFrame = requestAnimationFrame(renderFrame);

  return {
    metrics,
    advance(steps): EffectsState {
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
      burstTimer.destroy();
      renderer.destroy();
      for (const object of [
        panel,
        divider,
        burstPad,
        streamPad,
        title,
        subtitle,
        burstLabel,
        streamLabel,
        liveLabel,
        probe,
        burst,
        stream,
      ]) {
        object.destroy();
      }
      burstGraphic.destroy();
      streamGraphic.destroy();
      context.destroyPlugins();
      for (const camera of context.cameras) camera.destroy();
      app.destroy(true, { children: true });
      FlxG.clearContext(context);
    },
    pause(): void {
      clock.setPaused(true);
    },
    reset(): EffectsState {
      clock.setPaused(true);
      resetScene();
      update(clock.stepSeconds);
      renderer.render();
      return readState();
    },
    resume(): void {
      previousMilliseconds = performance.now();
      clock.setPaused(false);
    },
    state: readState,
  };
}
