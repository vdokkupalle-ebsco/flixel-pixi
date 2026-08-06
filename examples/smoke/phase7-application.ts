import { Application } from 'pixi.js';

import {
  FixedStepAccumulator,
  FlxButton,
  FlxCameraRenderer,
  FlxContext,
  FlxG,
  FlxInputManager,
  FlxPoint,
  FlxSprite,
  FlxText,
  Keyboard,
} from '../../src';

export interface PhaseSevenMetrics {
  aliasesMapped: boolean;
  cameraRoundTrip: boolean;
  pointerCapture: boolean;
  renderer: string;
  replayParity: boolean;
  transitionSteps: string;
}

export interface PhaseSevenState {
  buttonActivations: number;
  buttonOn: boolean;
  buttonScreenX: number;
  buttonScreenY: number;
  cancelledSteps: number;
  keyDownSteps: number;
  keyUpSteps: number;
  keysPressed: boolean;
  playerX: number;
  playerY: number;
  pointerX: number;
  pointerY: number;
  simulationSteps: number;
}

export interface PhaseSevenApplication {
  readonly metrics: PhaseSevenMetrics;
  advance(steps: number): PhaseSevenState;
  destroy(): void;
  pause(): void;
  reset(): PhaseSevenState;
  resume(): void;
  state(): PhaseSevenState;
}

function verifyInputContracts(): Pick<
  PhaseSevenMetrics,
  'aliasesMapped' | 'replayParity' | 'transitionSteps'
> {
  const keys = new Keyboard();
  keys.handleKeyDown({ code: 'KeyA' });
  keys.handleKeyUp({ code: 'KeyA' });
  keys.update();
  const first = keys.justPressed('A') ? 'press' : 'missing';
  const record = keys.record();
  keys.update();
  const second = keys.justReleased('A') ? 'release' : 'missing';
  keys.reset();
  keys.playback(record);
  const replayParity = keys.justPressed('A');
  const aliasesMapped =
    keys.getKeyCode('CTRL') === keys.getKeyCode('CONTROL') &&
    keys.getKeyCode('RETURN') === keys.getKeyCode('ENTER');
  keys.destroy();
  return { aliasesMapped, replayParity, transitionSteps: `${first}/${second}` };
}

export async function createPhaseSevenApplication(
  host: HTMLElement,
): Promise<PhaseSevenApplication> {
  const app = new Application();
  await app.init({
    antialias: false,
    autoDensity: true,
    autoStart: false,
    background: 0x10131a,
    height: 420,
    preference: 'webgl',
    resolution: Math.min(window.devicePixelRatio, 2),
    width: 800,
  });
  host.append(app.canvas);
  app.canvas.tabIndex = 0;
  app.canvas.style.touchAction = 'none';
  app.canvas.setAttribute('aria-label', 'Phase 7 keyboard and pointer demo');

  const context = new FlxContext(800, 420, 0.5);
  FlxG.installContext(context);
  const camera = context.camera;
  camera.x = 16;
  camera.y = 12;
  camera.resize(768, 396);
  camera.scroll.make(96, 42);
  camera.zoom = 1.04;
  camera.scale.make(0.98, 0.98);
  camera.bgColor = 0xff111a28;

  const renderer = new FlxCameraRenderer(app.renderer, app.stage, context);
  const input = new FlxInputManager(context, {
    keyboardTarget: window,
    pointerTarget: app.canvas,
  });

  const panel = new FlxSprite(112, 58).makeGraphic(736, 356, 0x182336ff);
  const lane = new FlxSprite(142, 190).makeGraphic(676, 72, 0x22344dff);
  const player = new FlxSprite(230, 207).makeGraphic(30, 38, 0xff7bdff2);
  const pointer = new FlxSprite(0, 0).makeGraphic(9, 9, 0xffffd166);
  pointer.visible = false;
  const title = new FlxText(140, 80, 560, 'DETERMINISTIC INPUT LAB')
    .setFormat('Arial', 18, 0xf6f8ff)
    .setBorderStyle(0x10131a, 1);
  const instructions = new FlxText(
    140,
    112,
    590,
    'MOVE: WASD / ARROWS   ·   POINTER: GOLD PROBE   ·   CLICK: TOGGLE',
  ).setFormat('Arial', 11, 0xaab8cf);
  const transitionLabel = new FlxText(
    140,
    278,
    370,
    'QUEUED EVENTS → FIXED STEP → GAMEPLAY',
  ).setFormat('Arial', 12, 0x7bdff2);
  const liveLabel = new FlxText(140, 308, 380, '').setFormat(
    'Arial',
    11,
    0xd9e1ee,
  );
  const toggleButton = new FlxButton(674, 292, 'INPUT: ON');
  const resetButton = new FlxButton(674, 330, 'RESET');
  const toggleLabel = toggleButton.label;
  if (toggleLabel === null) throw new Error('Toggle button label is missing.');
  toggleButton.on = true;
  for (const object of [
    panel,
    lane,
    player,
    pointer,
    title,
    instructions,
    transitionLabel,
    liveLabel,
    toggleButton,
    resetButton,
  ]) {
    renderer.add(object);
  }

  let simulationSteps = 0;
  let keyDownSteps = 0;
  let keyUpSteps = 0;
  let cancelledSteps = 0;
  let buttonActivations = 0;
  let destroyed = false;
  let animationFrame = 0;
  let previousMilliseconds = performance.now();
  const clock = new FixedStepAccumulator();

  toggleButton.onUp = () => {
    buttonActivations += 1;
    toggleButton.on = !toggleButton.on;
    toggleLabel.text = toggleButton.on ? 'INPUT: ON' : 'INPUT: OFF';
  };

  const resetScene = (): void => {
    player.x = 230;
    player.y = 207;
    pointer.visible = false;
    toggleButton.on = true;
    toggleLabel.text = 'INPUT: ON';
    simulationSteps = 0;
    keyDownSteps = 0;
    keyUpSteps = 0;
    cancelledSteps = 0;
    buttonActivations = 0;
    input.resetInput();
    liveLabel.text = 'STEP 0000   KEY IDLE   POINTER --,--';
  };
  resetButton.onUp = resetScene;

  const update = (stepSeconds: number): void => {
    input.updateInput();
    simulationSteps += 1;
    FlxG.elapsed = stepSeconds;
    if (FlxG.keys.justPressed('A') || FlxG.keys.justPressed('LEFT')) {
      keyDownSteps += 1;
    }
    if (FlxG.keys.justReleased('A') || FlxG.keys.justReleased('LEFT')) {
      keyUpSteps += 1;
    }
    if (FlxG.mouse.justCancelled()) cancelledSteps += 1;
    const speed = 125 * stepSeconds;
    if (FlxG.keys.A || FlxG.keys.LEFT) player.x -= speed;
    if (FlxG.keys.D || FlxG.keys.RIGHT) player.x += speed;
    if (FlxG.keys.W || FlxG.keys.UP) player.y -= speed;
    if (FlxG.keys.S || FlxG.keys.DOWN) player.y += speed;
    player.x = Math.max(150, Math.min(785, player.x));
    player.y = Math.max(198, Math.min(222, player.y));
    const globalPointer = FlxG.mouse.getGlobalPosition();
    pointer.visible = globalPointer.x !== 0 || globalPointer.y !== 0;
    pointer.x = FlxG.mouse.x - 4;
    pointer.y = FlxG.mouse.y - 4;
    toggleButton.update();
    resetButton.update();
    liveLabel.text = `STEP ${String(simulationSteps).padStart(4, '0')}   KEY ${
      FlxG.keys.any() ? 'HELD' : 'IDLE'
    }   POINTER ${Math.round(FlxG.mouse.x)},${Math.round(FlxG.mouse.y)}`;
    context.updateCameras();
  };

  const buttonCenter = new FlxPoint(
    toggleButton.x + toggleButton.width * 0.5,
    toggleButton.y + toggleButton.height * 0.5,
  );
  const buttonScreen = camera.worldToScreen(buttonCenter);
  const restored = camera.screenToWorld(buttonScreen);
  const contractMetrics = verifyInputContracts();
  const metrics: PhaseSevenMetrics = {
    ...contractMetrics,
    cameraRoundTrip:
      Math.abs(restored.x - buttonCenter.x) < 1e-8 &&
      Math.abs(restored.y - buttonCenter.y) < 1e-8,
    pointerCapture: 'setPointerCapture' in app.canvas,
    renderer: app.renderer.type === 1 ? 'webgl' : 'webgpu',
  };

  const readState = (): PhaseSevenState => ({
    buttonActivations,
    buttonOn: toggleButton.on,
    buttonScreenX: buttonScreen.x,
    buttonScreenY: buttonScreen.y,
    cancelledSteps,
    keyDownSteps,
    keyUpSteps,
    keysPressed: FlxG.keys.any(),
    playerX: player.x,
    playerY: player.y,
    pointerX: FlxG.mouse.x,
    pointerY: FlxG.mouse.y,
    simulationSteps,
  });

  input.updateInput();
  toggleButton.update();
  resetButton.update();
  renderer.render();

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
    advance(steps): PhaseSevenState {
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
      input.destroy();
      renderer.destroy();
      for (const object of [
        panel,
        lane,
        player,
        pointer,
        title,
        instructions,
        transitionLabel,
        liveLabel,
        toggleButton,
        resetButton,
      ]) {
        object.destroy();
      }
      for (const current of context.cameras) current.destroy();
      app.destroy(true, { children: true });
      FlxG.clearContext(context);
    },
    pause(): void {
      clock.setPaused(true);
    },
    reset(): PhaseSevenState {
      clock.setPaused(true);
      resetScene();
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
