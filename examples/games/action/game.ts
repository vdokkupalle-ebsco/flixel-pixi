import {
  FlxCamera,
  FlxEmitter,
  FlxG,
  FlxGraphic,
  FlxGamepadButton,
  FlxSave,
  FlxSprite,
  FlxState,
  FlxText,
  LocalStorageBackend,
  makeGraphicPixels,
} from '../../../src';

function createBlipBuffer(ctx: AudioContext): AudioBuffer {
  const duration = 0.12;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const t = i / ctx.sampleRate;
    data[i] = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 18) * 0.35;
  }
  return buffer;
}

function particleGraphic(): FlxGraphic {
  const pixels = makeGraphicPixels(6, 6, 0xfffbbf24);
  return FlxGraphic.fromPixels(pixels, 'action-particle');
}

/** Action showcase: particles, audio, save, dual cameras, replay hooks. */
export class ActionState extends FlxState {
  player!: FlxSprite;
  emitter!: FlxEmitter;
  hud!: FlxText;
  save = new FlxSave();
  bursts = 0;
  audioCtx: AudioContext | null = null;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff111827;

    this.save.bind('sample-games_action', {
      version: 1,
      backend: new LocalStorageBackend(),
    });
    this.bursts = (this.save.data?.bursts as number) ?? 0;

    this.player = new FlxSprite(300, 220);
    this.player.makeGraphic(24, 24, 0xfff472b6);
    this.player.maxVelocity.x = 220;
    this.player.maxVelocity.y = 220;
    this.player.drag.x = 1400;
    this.player.drag.y = 1400;
    this.add(this.player);

    this.emitter = new FlxEmitter(312, 232);
    this.emitter.makeParticles(particleGraphic(), 32, 0, false, 0);
    this.emitter.setXSpeed(-120, 120);
    this.emitter.setYSpeed(-160, -40);
    this.emitter.gravity = 200;
    this.add(this.emitter);

    this.hud = new FlxText(
      8,
      6,
      420,
      'ACTION — arrows · Z burst+sfx · page buttons for VCR',
    );
    this.hud.setFormat(undefined, 11, 0xffe2e8f0, 'left');
    this.hud.scrollFactor.x = 0;
    this.hud.scrollFactor.y = 0;
    this.add(this.hud);

    const mini = new FlxCamera(480, 16, 144, 108, 0.35);
    mini.bgColor = 0xff1e1b4b;
    FlxG.addCamera(mini);
    mini.follow(this.player);
  }

  burst(): void {
    this.emitter.at(this.player);
    this.emitter.start(true, 0.6, 0, 16);
    this.bursts += 1;
    if (this.save.data) {
      this.save.data.bursts = this.bursts;
      this.save.flush();
    }
    try {
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      void this.audioCtx.resume();
      FlxG.play(createBlipBuffer(this.audioCtx), 0.8);
    } catch {
      // Audio may be blocked until gesture; burst still counts.
    }
  }

  override update(): void {
    this.player.acceleration.x = 0;
    this.player.acceleration.y = 0;
    if (FlxG.keys.pressed('LEFT')) this.player.acceleration.x = -1100;
    if (FlxG.keys.pressed('RIGHT')) this.player.acceleration.x = 1100;
    if (FlxG.keys.pressed('UP')) this.player.acceleration.y = -1100;
    if (FlxG.keys.pressed('DOWN')) this.player.acceleration.y = 1100;

    const gamepad = FlxG.gamepads.firstActive;
    if (gamepad !== null) {
      const axisX = gamepad.getAxis(0);
      const axisY = gamepad.getAxis(1);
      if (axisX !== 0) this.player.acceleration.x = axisX * 1100;
      if (axisY !== 0) this.player.acceleration.y = axisY * 1100;
      if (gamepad.justPressed(FlxGamepadButton.A)) this.burst();
    }

    if (this.player.x < 0) this.player.x = 0;
    if (this.player.y < 0) this.player.y = 0;
    if (this.player.x > FlxG.width - this.player.width) {
      this.player.x = FlxG.width - this.player.width;
    }
    if (this.player.y > FlxG.height - this.player.height) {
      this.player.y = FlxG.height - this.player.height;
    }

    if (FlxG.keys.justPressed('Z')) this.burst();

    const vcr = FlxG.vcr.recording
      ? 'REC'
      : FlxG.vcr.replaying
        ? 'REPLAY'
        : 'idle';
    const padLabel = gamepad === null ? 'none' : `#${gamepad.uid}`;
    this.hud.text = `bursts ${this.bursts} (saved) · vcr ${vcr} · pad ${padLabel} · cams ${FlxG.cameras.length}`;

    super.update();
  }

  override destroy(): void {
    this.save.close();
    super.destroy();
  }
}
