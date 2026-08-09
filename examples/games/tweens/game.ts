import {
  FlxEase,
  FlxG,
  FlxSprite,
  FlxState,
  FlxText,
  FlxTween,
} from '../../../src';

export interface TweenShowcaseSnapshot {
  activeTweens: number;
  angle: number;
  color: number;
  cycles: number;
  motionX: number;
  motionY: number;
  paused: boolean;
  propertyX: number;
}

const COLORS = {
  amber: 0xffffb020,
  blue: 0xff38bdf8,
  green: 0xff4ade80,
  muted: 0xff475569,
  pink: 0xfff472b6,
  purple: 0xffa78bfa,
  red: 0xfffb7185,
  white: 0xffe2e8f0,
};

function makeBox(
  state: FlxState,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
): FlxSprite {
  const sprite = new FlxSprite(x, y).makeGraphic(width, height, color);
  state.add(sprite);
  return sprite;
}

function makeLabel(
  state: FlxState,
  x: number,
  y: number,
  width: number,
  text: string,
  color = COLORS.white,
  size = 10,
): FlxText {
  const label = new FlxText(x, y, width, text);
  label.setFormat(undefined, size, color, 'left');
  state.add(label);
  return label;
}

/** Visual tour of generic, miscellaneous, and motion tween factories. */
export class TweenShowcaseState extends FlxState {
  propertyBox!: FlxSprite;
  angleBox!: FlxSprite;
  colorBox!: FlxSprite;
  flickerBox!: FlxSprite;
  shakeBox!: FlxSprite;
  quadBox!: FlxSprite;
  cubicBox!: FlxSprite;
  circleBox!: FlxSprite;
  linearPathBox!: FlxSprite;
  quadPathBox!: FlxSprite;
  readonly tweens: FlxTween[] = [];
  cycles = 0;
  paused = false;
  status!: FlxText;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff07111f;

    makeLabel(this, 12, 8, 616, 'TWEEN SHOWCASE', COLORS.white, 14);
    this.status = makeLabel(this, 360, 10, 268, '', COLORS.green, 10);

    makeLabel(this, 12, 34, 616, 'PROPERTY + EASING', COLORS.blue, 10);
    this.#makeTrack('linear', 66);
    this.#makeTrack('quadInOut', 94);
    this.#makeTrack('backInOut', 122);

    makeLabel(this, 12, 150, 616, 'SPECIALIZED EFFECTS', COLORS.blue, 10);
    makeLabel(this, 146, 220, 70, 'angle', COLORS.muted);
    makeLabel(this, 267, 220, 70, 'color', COLORS.muted);
    makeLabel(this, 388, 220, 70, 'flicker', COLORS.muted);
    makeLabel(this, 509, 220, 70, 'shake', COLORS.muted);
    this.angleBox = makeBox(this, 164, 190, 32, 14, COLORS.amber);
    this.colorBox = makeBox(this, 285, 184, 22, 26, COLORS.pink);
    this.flickerBox = makeBox(this, 406, 184, 22, 26, COLORS.green);
    this.shakeBox = makeBox(this, 527, 184, 22, 26, COLORS.red);

    makeLabel(this, 12, 246, 616, 'CURVE + CIRCULAR MOTION', COLORS.blue, 10);
    makeLabel(this, 105, 342, 120, 'quadratic', COLORS.muted);
    makeLabel(this, 320, 342, 120, 'cubic', COLORS.muted);
    makeLabel(this, 500, 342, 120, 'circular', COLORS.muted);
    this.#makeGuidePoint(100, 326);
    this.#makeGuidePoint(190, 268);
    this.#makeGuidePoint(280, 326);
    this.#makeGuidePoint(310, 326);
    this.#makeGuidePoint(345, 270);
    this.#makeGuidePoint(415, 270);
    this.#makeGuidePoint(450, 326);
    this.#makeGuidePoint(540, 270);
    this.quadBox = makeBox(this, 96, 322, 10, 10, COLORS.purple);
    this.cubicBox = makeBox(this, 306, 322, 10, 10, COLORS.green);
    this.circleBox = makeBox(this, 566, 296, 10, 10, COLORS.amber);

    makeLabel(this, 12, 366, 616, 'DISTANCE-WEIGHTED PATHS', COLORS.blue, 10);
    makeLabel(this, 12, 405, 90, 'linearPath', COLORS.muted);
    makeLabel(this, 350, 405, 80, 'quadPath', COLORS.muted);
    this.#makeGuidePoint(110, 430);
    this.#makeGuidePoint(220, 386);
    this.#makeGuidePoint(326, 446);
    this.#makeGuidePoint(410, 442);
    this.#makeGuidePoint(480, 382);
    this.#makeGuidePoint(560, 434);
    this.linearPathBox = makeBox(this, 106, 426, 10, 10, COLORS.pink);
    this.quadPathBox = makeBox(this, 406, 438, 10, 10, COLORS.blue);

    this.restartTweens();
  }

  restartTweens(): void {
    for (const tween of this.tweens) tween.cancelChain();
    this.tweens.length = 0;
    this.cycles = 0;
    this.paused = false;

    const tracks = this.members.filter(
      (member): member is FlxSprite =>
        member instanceof FlxSprite && member.height === 18,
    );
    const [linear, quad, back] = tracks;
    if (linear) linear.x = 164;
    if (quad) quad.x = 164;
    if (back) back.x = 164;
    this.propertyBox = linear ?? this.propertyBox;

    if (linear) {
      this.tweens.push(
        FlxTween.tween(linear, { x: 592 }, 1.8, {
          type: FlxTween.PINGPONG,
          onComplete: () => {
            this.cycles += 1;
          },
        }),
      );
    }
    if (quad) {
      this.tweens.push(
        FlxTween.tween(quad, { x: 592 }, 1.8, {
          ease: FlxEase.quadInOut,
          type: FlxTween.PINGPONG,
        }),
      );
    }
    if (back) {
      this.tweens.push(
        FlxTween.tween(back, { x: 592 }, 1.8, {
          ease: FlxEase.backInOut,
          type: FlxTween.PINGPONG,
        }),
      );
    }

    this.angleBox.angle = -25;
    this.colorBox.color = COLORS.pink & 0xffffff;
    this.colorBox.alpha = 1;
    this.flickerBox.visible = true;
    this.shakeBox.offset.make();
    this.tweens.push(
      FlxTween.angle(this.angleBox, -25, 205, 1.2, {
        ease: FlxEase.sineInOut,
        type: FlxTween.PINGPONG,
      }),
      FlxTween.color(this.colorBox, 1.2, COLORS.pink, COLORS.blue, {
        ease: FlxEase.sineInOut,
        type: FlxTween.PINGPONG,
      }),
      FlxTween.flicker(this.flickerBox, 1, 0.12, {
        type: FlxTween.LOOPING,
      }),
      FlxTween.shake(this.shakeBox, 0.12, 0.8, 'xy', {
        type: FlxTween.LOOPING,
      }),
      FlxTween.quadMotion(
        this.quadBox,
        100,
        326,
        190,
        268,
        280,
        326,
        2.2,
        true,
        { ease: FlxEase.sineInOut, type: FlxTween.PINGPONG },
      ),
      FlxTween.cubicMotion(
        this.cubicBox,
        310,
        326,
        345,
        270,
        415,
        270,
        450,
        326,
        2.2,
        { ease: FlxEase.sineInOut, type: FlxTween.PINGPONG },
      ),
      FlxTween.circularMotion(
        this.circleBox,
        540,
        300,
        30,
        0,
        true,
        2.4,
        true,
        { type: FlxTween.LOOPING },
      ),
      FlxTween.linearPath(
        this.linearPathBox,
        [
          { x: 110, y: 430 },
          { x: 220, y: 386 },
          { x: 326, y: 446 },
        ],
        2.8,
        true,
        { ease: FlxEase.sineInOut, type: FlxTween.PINGPONG },
      ),
      FlxTween.quadPath(
        this.quadPathBox,
        [
          { x: 410, y: 442 },
          { x: 480, y: 382 },
          { x: 560, y: 434 },
        ],
        2.4,
        true,
        { ease: FlxEase.sineInOut, type: FlxTween.PINGPONG },
      ),
    );
  }

  setTweensPaused(paused: boolean): void {
    this.paused = paused;
    for (const tween of this.tweens) tween.active = !paused;
  }

  snapshot(): TweenShowcaseSnapshot {
    return {
      activeTweens: this.tweens.filter((tween) => tween.active).length,
      angle: this.angleBox.angle,
      color: this.colorBox.color,
      cycles: this.cycles,
      motionX: this.circleBox.x,
      motionY: this.circleBox.y,
      paused: this.paused,
      propertyX: this.propertyBox.x,
    };
  }

  override update(): void {
    const active = this.tweens.filter((tween) => tween.active).length;
    this.status.text = `${this.paused ? 'PAUSED' : 'PLAYING'} · ${active} active · ${this.cycles} loops`;
    super.update();
  }

  #makeTrack(name: string, y: number): void {
    makeLabel(this, 12, y + 3, 130, name, COLORS.muted);
    makeBox(this, 150, y + 8, 454, 2, 0xff1e293b);
    const colors: Record<string, number> = {
      backInOut: COLORS.pink,
      linear: COLORS.amber,
      quadInOut: COLORS.green,
    };
    makeBox(this, 164, y, 18, 18, colors[name] ?? COLORS.white);
  }

  #makeGuidePoint(x: number, y: number): void {
    makeBox(this, x - 2, y - 2, 4, 4, COLORS.muted);
  }
}
