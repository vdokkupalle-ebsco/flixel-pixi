/** Named frame sequence used by `FlxSprite`. @public */
export class FlxAnim {
  name: string;
  frameRate: number;
  frames: number[];
  looped: boolean;
  loopPoint = 0;
  flipX: boolean;
  flipY: boolean;
  timeScale = 1;
  curFrame = 0;
  finished = true;
  paused = true;
  reversed = false;
  /**
   * Default loop flag recorded at `addAnimation` time.
   * Used by `play(name)` (no options) to restore the legacy 4-arg behaviour.
   */
  readonly defaultLooped: boolean;
  /**
   * Default playback speed multiplier recorded at `addAnimation` time.
   * 1 = one animation frame per game update; stored for option-less `play`.
   */
  readonly defaultSpeed: number;

  constructor(
    name: string,
    frames: readonly number[],
    frameRate = 0,
    looped = true,
    defaultSpeed = 1,
    flipX = false,
    flipY = false,
  ) {
    this.name = name;
    this.frameRate = frameRate;
    this.frames = [...frames];
    this.looped = looped;
    this.defaultLooped = looped;
    this.defaultSpeed = defaultSpeed;
    this.flipX = flipX;
    this.flipY = flipY;
  }

  get delay(): number {
    return this.frameRate > 0 ? 1 / this.frameRate : 0;
  }

  get frameDuration(): number {
    return this.delay;
  }

  set frameDuration(value: number) {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(
        'frameDuration must be a non-negative finite number.',
      );
    }
    this.frameRate = value > 0 ? 1 / value : 0;
  }

  get numFrames(): number {
    return this.frames.length;
  }

  destroy(): void {
    this.frames = [];
  }
}
