import { FlxSignal } from '../core/flx-signal';
import type { FlxAnim } from '../objects/flx-anim';
import type { FlxSprite } from '../objects/flx-sprite';

/** Payload dispatched whenever an animation materializes a new frame. @public */
export interface FlxAnimationFrameEvent {
  readonly animationName: string | null;
  readonly frameNumber: number;
  readonly frameIndex: number;
}

/** HaxeFlixel-style animation API backed by a deterministic FlxSprite clock. @public */
export class FlxAnimationController {
  readonly onFrameChange = new FlxSignal<FlxAnimationFrameEvent>();
  readonly onFinish = new FlxSignal<string>();
  readonly onLoop = new FlxSignal<string>();
  timeScale = 1;

  readonly #sprite: FlxSprite;

  constructor(sprite: FlxSprite) {
    this.#sprite = sprite;
  }

  add(
    name: string,
    frames: readonly number[],
    frameRate = 30,
    looped = true,
    flipX = false,
    flipY = false,
  ): void {
    this.#sprite.registerAnimation(
      name,
      frames,
      frameRate,
      looped,
      flipX,
      flipY,
    );
  }

  remove(name: string): boolean {
    return this.#sprite.removeAnimation(name);
  }

  append(name: string, frames: readonly number[]): void {
    this.#sprite.appendAnimation(name, frames);
  }

  addByNames(
    name: string,
    frameNames: readonly string[],
    frameRate = 30,
    looped = true,
    flipX = false,
    flipY = false,
  ): void {
    this.add(
      name,
      frameNames.map((frameName) => this.#sprite.frameIndexByName(frameName)),
      frameRate,
      looped,
      flipX,
      flipY,
    );
  }

  addByPrefix(
    name: string,
    prefix: string,
    frameRate = 30,
    looped = true,
    flipX = false,
    flipY = false,
  ): void {
    const frames = this.#sprite.frameIndicesByPrefix(prefix);
    if (frames.length === 0) {
      throw new Error(`No frames begin with "${prefix}".`);
    }
    this.add(name, frames, frameRate, looped, flipX, flipY);
  }

  addByIndices(
    name: string,
    prefix: string,
    indices: readonly number[],
    postfix = '',
    frameRate = 30,
    looped = true,
    flipX = false,
    flipY = false,
  ): void {
    this.addByNames(
      name,
      indices.map((index) => `${prefix}${index}${postfix}`),
      frameRate,
      looped,
      flipX,
      flipY,
    );
  }

  play(name: string, force = false, reversed = false, frame = 0): void {
    this.#sprite.playAnimation(name, force, reversed, frame);
  }

  finish(): void {
    this.#sprite.finishAnimation();
  }

  stop(): void {
    this.#sprite.stopAnimation();
  }

  randomFrame(): void {
    this.#sprite.randomFrame();
  }

  exists(name: string): boolean {
    return this.#sprite.getAnimation(name) !== null;
  }

  rename(oldName: string, newName: string): boolean {
    return this.#sprite.renameAnimation(oldName, newName);
  }

  getAnimationList(): FlxAnim[] {
    return this.#sprite.getAnimationList();
  }

  getNameList(): string[] {
    return this.getAnimationList().map((animation) => animation.name);
  }

  get curAnim(): FlxAnim | null {
    return this.#sprite.currentAnimation;
  }

  set curAnim(animation: FlxAnim | null) {
    if (animation === null) this.stop();
    else this.play(animation.name, true);
  }

  get name(): string | null {
    return this.curAnim?.name ?? null;
  }

  set name(value: string | null) {
    if (value === null) this.stop();
    else this.play(value);
  }

  get frameIndex(): number {
    return this.#sprite.frame;
  }

  set frameIndex(value: number) {
    this.#sprite.frame = value;
  }

  get frameName(): string | null {
    return this.#sprite.currentFrameName;
  }

  set frameName(value: string | null) {
    if (value === null) return;
    this.frameIndex = this.#sprite.frameIndexByName(value);
  }

  get paused(): boolean {
    return this.#sprite.animationPaused;
  }

  set paused(value: boolean) {
    if (value) this.#sprite.pauseAnimation();
    else this.#sprite.resumeAnimation();
  }

  get finished(): boolean {
    return this.#sprite.finished;
  }

  set finished(value: boolean) {
    if (value) this.finish();
    else this.#sprite.resumeAnimation();
  }

  get numFrames(): number {
    return this.#sprite.frames;
  }

  /** @internal */
  dispatchFrameChange(event: FlxAnimationFrameEvent): void {
    this.onFrameChange.dispatch(event);
  }

  /** @internal */
  dispatchFinish(name: string): void {
    this.onFinish.dispatch(name);
  }

  /** @internal */
  dispatchLoop(name: string): void {
    this.onLoop.dispatch(name);
  }

  destroy(): void {
    this.onFrameChange.destroy();
    this.onFinish.destroy();
    this.onLoop.destroy();
  }
}
