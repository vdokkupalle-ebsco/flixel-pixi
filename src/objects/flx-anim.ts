/** Named frame sequence used by `FlxSprite`. @public */
export class FlxAnim {
  readonly name: string;
  readonly delay: number;
  frames: number[];
  readonly looped: boolean;

  constructor(
    name: string,
    frames: readonly number[],
    frameRate = 0,
    looped = true,
  ) {
    this.name = name;
    this.delay = frameRate > 0 ? 1 / frameRate : 0;
    this.frames = [...frames];
    this.looped = looped;
  }

  destroy(): void {
    this.frames = [];
  }
}
