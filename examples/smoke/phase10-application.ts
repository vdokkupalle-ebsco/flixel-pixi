import { Application } from 'pixi.js';
import {
  convertFlxReplayToAS3Text,
  FlxCameraRenderer,
  FlxG,
  FlxGame,
  FlxGraphic,
  FlxSprite,
  FlxState,
  FlxText,
  makeGraphicPixels,
} from '../../src';

let activeRenderer: FlxCameraRenderer | null = null;

/** Snapshot of a PlayState at the moment recording begins. */
interface PlayStateSnapshot {
  playerX: number;
  playerY: number;
  velocityX: number;
  velocityY: number;
  markerX: number;
  markerY: number;
}

/** Shared mutable snapshot used to restore state at replay start. */
let recordingSnapshot: PlayStateSnapshot | null = null;

class PlayState extends FlxState {
  player!: FlxSprite;
  pointerMarker!: FlxSprite;
  titleText!: FlxText;
  statusText!: FlxText;
  instructionsText!: FlxText;
  frameCount = 0;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff1e293b; // Dark slate background

    // Player Ball Sprite (40x40 cyan box with white border)
    const ballPixels = makeGraphicPixels(40, 40, 0xff38bdf8);
    for (let i = 0; i < 40; i++) {
      ballPixels.data[i] = 0xffffffff;
      ballPixels.data[39 * 40 + i] = 0xffffffff;
      ballPixels.data[i * 40] = 0xffffffff;
      ballPixels.data[i * 40 + 39] = 0xffffffff;
    }
    const ballGraphic = FlxGraphic.fromPixels(ballPixels, 'phase10-ball');

    // Restore from snapshot if one exists (set before calling switchState for replay)
    const snap = recordingSnapshot;
    this.player = new FlxSprite(snap?.playerX ?? 300, snap?.playerY ?? 220);
    this.player.loadGraphic(ballGraphic);
    this.player.velocity.x = snap?.velocityX ?? 180;
    this.player.velocity.y = snap?.velocityY ?? 140;
    this.add(this.player);

    // Pointer Marker (20x20 magenta square)
    const markerPixels = makeGraphicPixels(20, 20, 0xffec4899);
    const markerGraphic = FlxGraphic.fromPixels(markerPixels, 'phase10-marker');
    this.pointerMarker = new FlxSprite(
      snap?.markerX ?? -100,
      snap?.markerY ?? -100,
    );
    this.pointerMarker.loadGraphic(markerGraphic);
    this.add(this.pointerMarker);

    // Title Text
    this.titleText = new FlxText(20, 16, 600, 'FLIXEL-PIXI REPLAY LAB');
    this.titleText.setFormat(undefined, 20, 0xfffacc15, 'left');
    this.add(this.titleText);

    // Instructions
    this.instructionsText = new FlxText(
      20,
      46,
      600,
      'Use ARROW KEYS or CLICK MOUSE to move the ball',
    );
    this.instructionsText.setFormat(undefined, 13, 0xff94a3b8, 'left');
    this.add(this.instructionsText);

    // Live Status Text
    this.statusText = new FlxText(20, 420, 600, 'Initializing...');
    this.statusText.setFormat(undefined, 16, 0xff4ade80, 'left');
    this.add(this.statusText);

    // Register all visual objects with active renderer if available
    if (activeRenderer) {
      activeRenderer.clearObjects();
      activeRenderer.add(this.player);
      activeRenderer.add(this.pointerMarker);
      activeRenderer.add(this.titleText);
      activeRenderer.add(this.instructionsText);
      activeRenderer.add(this.statusText);
    }
  }

  override update(): void {
    this.frameCount++;

    // Mouse click test
    if (FlxG.mouse.justPressed()) {
      this.player.x = FlxG.mouse.x - 20;
      this.player.y = FlxG.mouse.y - 20;
      this.pointerMarker.x = FlxG.mouse.x - 10;
      this.pointerMarker.y = FlxG.mouse.y - 10;
    }

    // Keyboard controls
    if (FlxG.keys.pressed('LEFT')) this.player.velocity.x = -240;
    if (FlxG.keys.pressed('RIGHT')) this.player.velocity.x = 240;
    if (FlxG.keys.pressed('UP')) this.player.velocity.y = -240;
    if (FlxG.keys.pressed('DOWN')) this.player.velocity.y = 240;

    // Bounce off bounds
    if (this.player.x <= 10) {
      this.player.x = 10;
      this.player.velocity.x = Math.abs(this.player.velocity.x);
    } else if (this.player.x >= 590) {
      this.player.x = 590;
      this.player.velocity.x = -Math.abs(this.player.velocity.x);
    }

    if (this.player.y <= 70) {
      this.player.y = 70;
      this.player.velocity.y = Math.abs(this.player.velocity.y);
    } else if (this.player.y >= 430) {
      this.player.y = 430;
      this.player.velocity.y = -Math.abs(this.player.velocity.y);
    }

    super.update();

    const mode = FlxG.vcr.recording
      ? 'RECORDING ●'
      : FlxG.vcr.replaying
        ? 'REPLAYING ▶'
        : FlxG.paused
          ? 'PAUSED ❚❚'
          : 'IDLE';
    const modeColor = FlxG.vcr.recording
      ? 0xfff87171
      : FlxG.vcr.replaying
        ? 0xff4ade80
        : FlxG.paused
          ? 0xfffacc15
          : 0xff60a5fa;

    this.statusText.color = modeColor;
    this.statusText.text = `Frame: ${String(this.frameCount).padStart(5, '0')} | Mode: ${mode} | Ball Pos: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`;
  }

  /** Capture current state into a snapshot object. */
  takeSnapshot(): PlayStateSnapshot {
    return {
      playerX: this.player.x,
      playerY: this.player.y,
      velocityX: this.player.velocity.x,
      velocityY: this.player.velocity.y,
      markerX: this.pointerMarker.x,
      markerY: this.pointerMarker.y,
    };
  }
}

export interface Phase10Application {
  game: FlxGame;
  step(steps?: number): void;
  destroy(): void;
}

export async function bootPhase10Demo(
  host?: HTMLElement | null,
): Promise<Phase10Application> {
  const replayInfoEl = document.querySelector<HTMLElement>(
    '[data-testid="replay-info"]',
  );

  const recordBtn = document.querySelector<HTMLButtonElement>(
    '[data-action="record-replay"]',
  );
  const stopBtn = document.querySelector<HTMLButtonElement>(
    '[data-action="stop-recording"]',
  );
  const playBtn = document.querySelector<HTMLButtonElement>(
    '[data-action="play-replay"]',
  );
  const rewindBtn = document.querySelector<HTMLButtonElement>(
    '[data-action="rewind-replay"]',
  );
  const stepBtn = document.querySelector<HTMLButtonElement>(
    '[data-action="step-frame"]',
  );
  const exportBtn = document.querySelector<HTMLButtonElement>(
    '[data-action="export-as3"]',
  );
  const destroyBtn = document.querySelector<HTMLButtonElement>(
    '[data-action="destroy"]',
  );

  let app: Application | null = null;
  activeRenderer = null;
  recordingSnapshot = null;

  if (host) {
    app = new Application();
    await app.init({
      width: 640,
      height: 480,
      backgroundColor: 0x1e293b,
      resolution: Math.min(window.devicePixelRatio, 2),
      autoDensity: true,
    });
    app.canvas.style.width = '100%';
    app.canvas.style.height = '100%';
    app.canvas.style.display = 'block';
    app.canvas.style.objectFit = 'contain';
    host.replaceChildren(app.canvas);
  }

  const game = new FlxGame(
    640,
    480,
    PlayState,
    1,
    60,
    30,
    false,
    app?.canvas ? { pointerTarget: app.canvas, keyboardTarget: window } : {},
  );

  if (app) {
    activeRenderer = new FlxCameraRenderer(
      app.renderer,
      app.stage,
      game.context,
    );
  }

  game.step(1 / 60);

  // If objects were created before activeRenderer was assigned, register them now
  if (activeRenderer && game.state) {
    for (const basic of game.state.members) {
      if (basic instanceof FlxSprite || basic instanceof FlxText) {
        activeRenderer.add(basic);
      }
    }
  }

  const updateReplayInfo = () => {
    if (replayInfoEl) {
      if (FlxG.vcr.recording) {
        replayInfoEl.textContent = `Recording frame ${FlxG.vcr.replay?.frameCount ?? 0}`;
      } else if (FlxG.vcr.replaying) {
        replayInfoEl.textContent = `Replaying frame ${FlxG.vcr.replay?.frame ?? 0} of ${FlxG.vcr.replay?.frameCount ?? 0}`;
      } else {
        replayInfoEl.textContent = FlxG.vcr.replay
          ? `Replay ready (${FlxG.vcr.replay.frameCount} frames)`
          : 'Idle';
      }
    }
  };

  /** Re-register all state members with the active renderer after a state switch. */
  const reRegisterRenderer = () => {
    if (activeRenderer && game.state) {
      activeRenderer.clearObjects();
      for (const basic of game.state.members) {
        if (basic instanceof FlxSprite || basic instanceof FlxText) {
          activeRenderer.add(basic);
        }
      }
    }
  };

  let tickerFn: (() => void) | null = null;
  if (app) {
    tickerFn = () => {
      if (!FlxG.paused) {
        game.advance(app.ticker.deltaMS / 1000);
      }
      activeRenderer?.render();
      updateReplayInfo();
    };
    app.ticker.add(tickerFn);
  }

  // Button Listeners
  recordBtn?.addEventListener('click', () => {
    // Capture current ball position BEFORE any state reset
    const currentState = game.state as PlayState | null;
    recordingSnapshot = currentState?.takeSnapshot() ?? null;

    // Record without resetting state — preserves current ball position
    FlxG.recordReplay(false);

    if (recordBtn) recordBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
    if (playBtn) playBtn.disabled = true;
    if (rewindBtn) rewindBtn.disabled = true;
    if (stepBtn) stepBtn.disabled = true;
    if (exportBtn) exportBtn.disabled = true;
    updateReplayInfo();
  });

  stopBtn?.addEventListener('click', () => {
    FlxG.stopRecording();
    if (recordBtn) recordBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    if (playBtn) playBtn.disabled = false;
    if (rewindBtn) rewindBtn.disabled = false;
    if (stepBtn) stepBtn.disabled = false;
    if (exportBtn) exportBtn.disabled = false;
    updateReplayInfo();
  });

  playBtn?.addEventListener('click', () => {
    if (FlxG.vcr.replay) {
      // Create a fresh PlayState; its create() will restore from recordingSnapshot
      FlxG.loadReplay(FlxG.vcr.replay, new PlayState());
      // After the state switch commits on next step, re-register renderer objects
      requestAnimationFrame(() => {
        reRegisterRenderer();
      });
      FlxG.paused = false;
      updateReplayInfo();
    }
  });

  rewindBtn?.addEventListener('click', () => {
    if (FlxG.vcr.replay) {
      FlxG.paused = true;
      // Rewind replay head and create a fresh state from the snapshot
      FlxG.vcr.replay.rewind();
      FlxG.vcr.replaying = true;
      FlxG.vcr.recording = false;
      FlxG.globalSeed = FlxG.vcr.replay.seed;
      FlxG.switchState(new PlayState());
      // Force one step so the state commits and objects are created
      game.step(1 / 60);
      reRegisterRenderer();
      activeRenderer?.render();
      updateReplayInfo();
    }
  });

  stepBtn?.addEventListener('click', () => {
    if (FlxG.vcr.replay && !FlxG.vcr.replay.finished) {
      FlxG.paused = true;
      FlxG.vcr.stepRequested = true;
      game.step(1 / 60);
      reRegisterRenderer();
      activeRenderer?.render();
      updateReplayInfo();
    }
  });

  exportBtn?.addEventListener('click', () => {
    if (FlxG.vcr.replay) {
      const text = convertFlxReplayToAS3Text(FlxG.vcr.replay);
      console.log('--- AS3 Replay Export ---\n', text);
      alert(
        `Exported AS3 Replay (${FlxG.vcr.replay.frameCount} frames):\n\n${text.slice(0, 200)}...`,
      );
    }
  });

  if (destroyBtn) destroyBtn.disabled = false;

  return {
    game,
    step(steps = 1) {
      for (let i = 0; i < steps; i++) {
        game.step(1 / 60);
      }
      activeRenderer?.render();
      updateReplayInfo();
    },
    destroy() {
      if (tickerFn && app) {
        app.ticker.remove(tickerFn);
      }
      activeRenderer?.destroy();
      activeRenderer = null;
      recordingSnapshot = null;
      game.destroy();
      app?.destroy(true);
    },
  };
}
