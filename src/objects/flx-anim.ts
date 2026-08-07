/** Named frame sequence used by `FlxSprite`. @public */
export class FlxAnim {
  readonly name: string;
  readonly delay: number;
  frames: number[];
  readonly looped: boolean;
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
  ) {
    this.name = name;
    this.delay = frameRate > 0 ? 1 / frameRate : 0;
    this.frames = [...frames];
    this.looped = looped;
    this.defaultLooped = looped;
    this.defaultSpeed = defaultSpeed;
  }

  destroy(): void {
    this.frames = [];
  }
}
