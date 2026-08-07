import { Application } from 'pixi.js';
import {
  FlxCameraRenderer,
  FlxDebugger,
  FlxG,
  FlxGame,
  FlxGraphic,
  FlxPreloader,
  FlxSprite,
  FlxState,
  FlxText,
  makeGraphicPixels,
} from '../../src';

let activeRenderer: FlxCameraRenderer | null = null;

// ─── PlayState ────────────────────────────────────────────────────────────────

class PlayState extends FlxState {
  player!: FlxSprite;
  frameCount = 0;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff0f172a;

    const px = makeGraphicPixels(40, 40, 0xff38bdf8);
    for (let i = 0; i < 40; i++) {
      px.data[i] = 0xffffffff;
      px.data[39 * 40 + i] = 0xffffffff;
      px.data[i * 40] = 0xffffffff;
      px.data[i * 40 + 39] = 0xffffffff;
    }
    this.player = new FlxSprite(300, 220);
    this.player.loadGraphic(FlxGraphic.fromPixels(px, 'p11-ball'));
    this.player.velocity.x = 180;
    this.player.velocity.y = 140;
    this.add(this.player);

    const title = new FlxText(20, 14, 600, 'PHASE 11 — DEBUGGER & PRELOADER');
    title.setFormat(undefined, 16, 0xfacc15, 'left');
    this.add(title);

    const hint = new FlxText(
      20,
      38,
      600,
      'Open the debugger panel below. Watch player.x and player.y live.',
    );
    hint.setFormat(undefined, 11, 0xff94a3b8, 'left');
    this.add(hint);

    if (activeRenderer) {
      activeRenderer.clearObjects();
      activeRenderer.add(this.player);
      activeRenderer.add(title);
      activeRenderer.add(hint);
    }

    // Register watch entries
    FlxG.watch.add(
      this.player as unknown as Record<string, unknown>,
      'x',
      'player.x',
    );
    FlxG.watch.add(
      this.player as unknown as Record<string, unknown>,
      'y',
      'player.y',
    );
    FlxG.watch.add(
      this.player.velocity as unknown as Record<string, unknown>,
      'x',
      'velocity.x',
    );
    FlxG.watch.add(
      this.player.velocity as unknown as Record<string, unknown>,
      'y',
      'velocity.y',
    );
  }

  override update(): void {
    this.frameCount++;

    if (FlxG.keys.pressed('LEFT')) this.player.velocity.x = -240;
    if (FlxG.keys.pressed('RIGHT')) this.player.velocity.x = 240;
    if (FlxG.keys.pressed('UP')) this.player.velocity.y = -240;
    if (FlxG.keys.pressed('DOWN')) this.player.velocity.y = 240;

    if (this.player.x <= 10) {
      this.player.x = 10;
      this.player.velocity.x = Math.abs(this.player.velocity.x);
    }
    if (this.player.x >= 590) {
      this.player.x = 590;
      this.player.velocity.x = -Math.abs(this.player.velocity.x);
    }
    if (this.player.y <= 40) {
      this.player.y = 40;
      this.player.velocity.y = Math.abs(this.player.velocity.y);
    }
    if (this.player.y >= 430) {
      this.player.y = 430;
      this.player.velocity.y = -Math.abs(this.player.velocity.y);
    }

    // Log ball position every 120 frames (~2 s at 60 FPS)
    if (this.frameCount % 120 === 0) {
      FlxG.log.add(
        `Ball @ (${Math.round(this.player.x)}, ${Math.round(this.player.y)}) frame ${this.frameCount}`,
        0xff4ade80,
      );
    }

    super.update();
  }

  override destroy(): void {
    FlxG.watch.clear();
    super.destroy();
  }
}

// ─── Boot function ────────────────────────────────────────────────────────────

export interface Phase11Application {
  game: FlxGame;
  debugger: FlxDebugger;
  destroy(): void;
}

export async function bootPhase11Demo(
  host: HTMLElement,
): Promise<Phase11Application> {
  // ── Preloader ──────────────────────────────────────────────────────────────
  const preloader = new FlxPreloader({ title: 'Phase 11 Debugger Lab' });
  preloader.setProgress(10, 'Setting up renderer…');

  // Simulate 3-step async asset loading
  await new Promise<void>((resolve) => {
    let pct = 10;
    const interval = setInterval(() => {
      pct += 30;
      preloader.setProgress(pct, pct < 100 ? `Loading… (${pct}%)` : 'Done!');
      if (pct >= 100) {
        clearInterval(interval);
        resolve();
      }
    }, 600);
  });

  // ── Pixi canvas ───────────────────────────────────────────────────────────
  const app = new Application();
  await app.init({
    width: 640,
    height: 480,
    backgroundColor: 0x0f172a,
    resolution: Math.min(window.devicePixelRatio, 2),
    autoDensity: true,
  });
  app.canvas.style.cssText =
    'width:100%;height:100%;display:block;object-fit:contain';
  host.replaceChildren(app.canvas);

  preloader.setProgress(100, 'Ready!');

  // ── Game ──────────────────────────────────────────────────────────────────
  const game = new FlxGame(640, 480, PlayState, 1, 60, 30, false, {
    pointerTarget: app.canvas,
    keyboardTarget: window,
  });

  activeRenderer = new FlxCameraRenderer(app.renderer, app.stage, game.context);
  game.step(1 / 60);

  if (activeRenderer && game.state) {
    for (const basic of game.state.members) {
      if (basic instanceof FlxSprite || basic instanceof FlxText) {
        activeRenderer.add(basic);
      }
    }
  }

  // Dismiss preloader after first frame renders
  preloader.complete();

  // ── Debugger ──────────────────────────────────────────────────────────────
  const dbg = new FlxDebugger({ container: document.body });
  dbg.setVCRCallbacks({
    record: () => {
      FlxG.recordReplay(false);
    },
    stop: () => {
      FlxG.stopRecording();
    },
    play: () => {
      if (FlxG.vcr.replay) FlxG.loadReplay(FlxG.vcr.replay, new PlayState());
      FlxG.paused = false;
    },
    rewind: () => {
      FlxG.paused = true;
      FlxG.reloadReplay();
    },
    stepFrame: () => {
      FlxG.paused = true;
      FlxG.vcr.stepRequested = true;
      game.step(1 / 60);
      activeRenderer?.render();
    },
    getVCR: () => FlxG.vcr,
  });
  dbg.subscribeToChannel(game.debugChannel, game.log, game.watch);

  // Wire visual-debug toggle → renderer.debugBounds draws coloured outlines
  document.body.addEventListener('flxdbg:vis-debug', (e) => {
    const on = (e as CustomEvent<{ on: boolean }>).detail.on;
    FlxG.visualDebug = on;
    if (activeRenderer) activeRenderer.debugBounds = on;
  });

  // Ticker
  app.ticker.add(() => {
    if (!FlxG.paused) game.advance(app.ticker.deltaMS / 1000);
    activeRenderer?.render();
  });

  // Initial log message
  FlxG.log.add('Phase 11 Debugger Lab ready. Ball bouncing!', 0xff38bdf8);
  FlxG.log.add(
    'Use arrow keys to steer. Watch panel shows live position.',
    0xffcbd5e1,
  );

  return {
    game,
    debugger: dbg,
    destroy() {
      app.ticker.stop();
      dbg.destroy();
      activeRenderer?.destroy();
      activeRenderer = null;
      game.destroy();
      app.destroy(true);
    },
  };
}
