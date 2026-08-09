import {
  FlxFramesCollection,
  FlxG,
  FlxGraphic,
  FlxSprite,
  FlxState,
  FlxText,
  makeGraphicPixels,
} from '../../../src';

export interface AnimationShowcaseSnapshot {
  finished: number;
  forwardFrame: number;
  frameChanges: number;
  loops: number;
  paused: boolean;
  reverseFrame: number;
  timedFrame: number;
}

const COLORS = [0xff5f6dff, 0xffc371ff, 0x38bdf8ff, 0x4ade80ff];

function makeAnimationSheet(): FlxGraphic {
  const frameSize = 16;
  const pixels = makeGraphicPixels(frameSize * COLORS.length, frameSize, 0);
  for (let frame = 0; frame < COLORS.length; frame += 1) {
    for (let y = 0; y < frameSize; y += 1) {
      for (let x = 0; x < frameSize; x += 1) {
        const edge = x < 2 || y < 2 || x >= frameSize - 2 || y >= frameSize - 2;
        const eye = y >= 5 && y <= 7 && (x === 5 || x === 10);
        const color = edge
          ? 0xe2e8f0ff
          : eye
            ? 0x07111fff
            : (COLORS[frame] ?? 0xffffffff);
        pixels.data[y * pixels.width + frame * frameSize + x] = color;
      }
    }
  }
  return FlxGraphic.fromPixels(pixels, 'animation-showcase-sheet');
}

function label(
  state: FlxState,
  x: number,
  y: number,
  width: number,
  text: string,
  color = 0xff94a3b8,
  size = 11,
): FlxText {
  const output = new FlxText(x, y, width, text).setFormat(
    undefined,
    size,
    color,
    'left',
  );
  state.add(output);
  return output;
}

/** Named-frame, reverse, timing, and signal animation showcase. */
export class AnimationShowcaseState extends FlxState {
  forward!: FlxSprite;
  reverse!: FlxSprite;
  timed!: FlxSprite;
  status!: FlxText;
  frameChanges = 0;
  loops = 0;
  finished = 0;
  paused = false;

  #graphic!: FlxGraphic;
  #frames!: FlxFramesCollection;
  #replayDelay = 0;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff07111f;
    label(this, 24, 18, 592, 'ANIMATION + FRAME MODEL', 0xffe2e8f0, 16);
    label(
      this,
      24,
      45,
      592,
      'NAMED FRAMES · REVERSE · LOOP POINT · PER-FRAME TIMING · SIGNALS',
      0xff38bdf8,
      10,
    );

    this.#graphic = makeAnimationSheet();
    this.#frames = FlxFramesCollection.fromGraphicGrid(this.#graphic, 16, 16, {
      durations: [0.28, 0.08, 0.14, 0.36],
      names: ['hero_0', 'hero_1', 'hero_2', 'hero_3'],
    });

    this.forward = this.#makeSprite(86, 124, 'FORWARD / LOOP FROM FRAME 1');
    this.forward.animation.addByPrefix('forward', 'hero_', 7, true);
    const forwardAnimation = this.forward.animation.getAnimationList()[0];
    if (forwardAnimation) forwardAnimation.loopPoint = 1;
    this.forward.animation.onLoop.add(() => {
      this.loops += 1;
    });
    this.forward.animation.onFrameChange.add(() => {
      this.frameChanges += 1;
    });
    this.forward.animation.play('forward');

    this.reverse = this.#makeSprite(294, 124, 'REVERSED + FLIPPED');
    this.reverse.animation.addByNames(
      'reverse',
      ['hero_0', 'hero_1', 'hero_2', 'hero_3'],
      6,
      true,
      true,
    );
    this.reverse.animation.play('reverse', false, true);

    this.timed = this.#makeSprite(502, 124, 'FRAME DURATIONS / ON FINISH');
    this.timed.animation.addByIndices(
      'timed',
      'hero_',
      [0, 1, 2, 3],
      '',
      0,
      false,
    );
    this.timed.animation.onFinish.add(() => {
      this.finished += 1;
      this.#replayDelay = 0.45;
    });
    this.timed.animation.play('timed');

    this.status = label(this, 24, 252, 592, '', 0xff4ade80, 11);
    label(
      this,
      24,
      286,
      592,
      "All playback advances on Flixel's fixed simulation clock; Pixi only renders the selected texture.",
      0xff94a3b8,
      10,
    );
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    for (const sprite of [this.forward, this.reverse, this.timed]) {
      sprite.animation.paused = paused;
    }
  }

  restart(): void {
    this.frameChanges = 0;
    this.loops = 0;
    this.finished = 0;
    this.#replayDelay = 0;
    this.setPaused(false);
    this.forward.animation.play('forward', true);
    this.reverse.animation.play('reverse', true, true);
    this.timed.animation.play('timed', true);
  }

  snapshot(): AnimationShowcaseSnapshot {
    return {
      finished: this.finished,
      forwardFrame: this.forward.animation.frameIndex,
      frameChanges: this.frameChanges,
      loops: this.loops,
      paused: this.paused,
      reverseFrame: this.reverse.animation.frameIndex,
      timedFrame: this.timed.animation.frameIndex,
    };
  }

  override update(): void {
    if (!this.paused && this.timed.animation.finished) {
      this.#replayDelay -= FlxG.elapsed;
      if (this.#replayDelay <= 0) this.timed.animation.play('timed', true);
    }
    this.status.text = `${this.paused ? 'PAUSED' : 'PLAYING'} · ${this.frameChanges} frame events · ${this.loops} loops · ${this.finished} finishes`;
    super.update();
  }

  override destroy(): void {
    super.destroy();
    this.#frames.destroy();
    this.#graphic.destroy();
  }

  #makeSprite(x: number, y: number, description: string): FlxSprite {
    const sprite = new FlxSprite(x, y).loadFrames(this.#frames);
    sprite.scale.make(4, 4);
    this.add(sprite);
    label(this, x - 56, y + 82, 176, description, 0xffcbd5e1, 9);
    return sprite;
  }
}
