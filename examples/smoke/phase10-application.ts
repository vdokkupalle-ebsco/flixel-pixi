import { Application } from 'pixi.js';
import {
  convertFlxReplayToAS3Text,
  FlxG,
  FlxGame,
  FlxSprite,
  FlxState,
  FlxText,
} from '../../src';

class PlayState extends FlxState {
  player!: FlxSprite;
  statusText!: FlxText;
  frameCount = 0;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff111827;

    this.player = new FlxSprite(140, 100);
    this.player.makeGraphic(20, 20, 0xff3b82f6);
    this.player.velocity.x = 60;
    this.player.velocity.y = 40;
    this.add(this.player);

    this.statusText = new FlxText(10, 10, 300, 'Frame: 0');
    this.statusText.setFormat(undefined, 12, 0xffffff);
    this.add(this.statusText);
  }

  override update(): void {
    this.frameCount++;

    // Mouse movement test
    if (FlxG.mouse.justPressed()) {
      this.player.x = FlxG.mouse.x;
      this.player.y = FlxG.mouse.y;
    }

    // Keyboard controls
    if (FlxG.keys.pressed('LEFT')) this.player.velocity.x = -100;
    if (FlxG.keys.pressed('RIGHT')) this.player.velocity.x = 100;
    if (FlxG.keys.pressed('UP')) this.player.velocity.y = -100;
    if (FlxG.keys.pressed('DOWN')) this.player.velocity.y = 100;

    // Bounce off bounds
    if (this.player.x <= 0 || this.player.x >= 300)
      this.player.velocity.x *= -1;
    if (this.player.y <= 0 || this.player.y >= 220)
      this.player.velocity.y *= -1;

    super.update();

    const mode = FlxG.vcr.recording
      ? 'RECORDING'
      : FlxG.vcr.replaying
        ? 'REPLAYING'
        : 'IDLE';
    this.statusText.text = `Frame: ${this.frameCount} | Mode: ${mode}\nPos: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`;
  }
}

async function bootPhase10Demo(): Promise<() => Promise<void>> {
  const host = document.querySelector<HTMLElement>(
    '[data-testid="phase10-canvas-host"]',
  );
  const statusEl = document.querySelector<HTMLElement>(
    '[data-testid="status"]',
  );
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

  if (!host || !statusEl || !replayInfoEl) {
    throw new Error('Required Phase 10 DOM elements missing.');
  }

  const app = new Application();
  await app.init({
    width: 320,
    height: 240,
    backgroundColor: 0x111827,
  });
  host.appendChild(app.canvas);

  const game = new FlxGame(320, 240, PlayState, 1, 60, 30, false, {
    pointerTarget: app.canvas,
    keyboardTarget: window,
  });

  let tickerFn: (() => void) | null = null;
  tickerFn = () => {
    game.advance(app.ticker.deltaMS / 1000);
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
  app.ticker.add(tickerFn);

  // Button Listeners
  recordBtn?.addEventListener('click', () => {
    FlxG.recordReplay();
    if (recordBtn) recordBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
    if (playBtn) playBtn.disabled = true;
    if (rewindBtn) rewindBtn.disabled = true;
    if (stepBtn) stepBtn.disabled = true;
    if (exportBtn) exportBtn.disabled = true;
  });

  stopBtn?.addEventListener('click', () => {
    FlxG.stopRecording();
    if (recordBtn) recordBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    if (playBtn) playBtn.disabled = false;
    if (rewindBtn) rewindBtn.disabled = false;
    if (stepBtn) stepBtn.disabled = false;
    if (exportBtn) exportBtn.disabled = false;
  });

  playBtn?.addEventListener('click', () => {
    if (FlxG.vcr.replay) {
      FlxG.loadReplay(FlxG.vcr.replay, new PlayState());
    }
  });

  rewindBtn?.addEventListener('click', () => {
    FlxG.reloadReplay();
  });

  stepBtn?.addEventListener('click', () => {
    game.step();
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

  statusEl.textContent = 'Phase 10 Replay Lab Active';
  statusEl.setAttribute('data-state', 'ready');
  if (destroyBtn) destroyBtn.disabled = false;

  let destroyed = false;
  const teardown = async () => {
    if (destroyed) return;
    destroyed = true;
    if (tickerFn) app.ticker.remove(tickerFn);
    game.destroy();
    app.destroy(true);
    if (statusEl) {
      statusEl.textContent = 'Destroyed';
      statusEl.setAttribute('data-state', 'destroyed');
    }
  };

  destroyBtn?.addEventListener('click', () => {
    void teardown();
  });

  return teardown;
}

if (typeof window !== 'undefined') {
  void bootPhase10Demo();
}
