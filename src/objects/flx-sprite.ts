import { Texture, type BLEND_MODES } from 'pixi.js';

import { FlxGraphic } from '../assets/flx-graphic';
import { makeGraphicPixels, type PixelBuffer } from '../compat/pixel-buffer';
import { FlxG } from '../core/flx-g';
import { FlxPoint } from '../math/flx-point';
import { FlxSpriteRenderHandle } from '../rendering/flx-sprite-render-handle';
import type { FlxRenderHandle } from '../rendering/flx-render-handle';
import { FlxAnim } from './flx-anim';
import { FlxObject, type FlxCameraLike } from './flx-object';

/** Called whenever a sprite materializes a new animation frame. @public */
export type FlxAnimationCallback = (
  animationName: string | null,
  frameNumber: number,
  frameIndex: number,
) => void;

/** Renderer-neutral Flixel sprite state with adapter-owned Pixi views. @public */
export class FlxSprite extends FlxObject {
  origin = new FlxPoint();
  offset = new FlxPoint();
  scale = new FlxPoint(1, 1);
  blend: BLEND_MODES | null = null;
  antialiasing = false;
  finished = false;
  frameWidth = 0;
  frameHeight = 0;
  frames = 0;
  dirty = true;

  readonly #animations: FlxAnim[] = [];
  readonly #renderHandles = new Set<FlxRenderHandle>();
  #graphic: FlxGraphic | null = null;
  #ownsGraphic = false;
  #supportsReverse = false;
  #currentAnimation: FlxAnim | null = null;
  #currentAnimationFrame = 0;
  #currentFrameIndex = 0;
  #frameTimer = 0;
  #callback: FlxAnimationCallback | null = null;
  #facing = FlxObject.RIGHT;
  #alpha = 1;
  #color = 0xffffff;
  #animationPaused = false;
  #destroyed = false;

  constructor(x = 0, y = 0, simpleGraphic: FlxGraphic | Texture | null = null) {
    super(x, y);
    this.health = 1;
    if (simpleGraphic === null) this.makeGraphic(8, 8);
    else this.loadGraphic(simpleGraphic);
  }

  override destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    for (const handle of [...this.#renderHandles]) handle.destroy();
    for (const animation of this.#animations) animation.destroy();
    this.#animations.length = 0;
    this.#releaseGraphic();
    this.#callback = null;
    this.#currentAnimation = null;
    super.destroy();
  }

  loadGraphic(
    source: FlxGraphic | Texture,
    animated = false,
    reverse = false,
    width = 0,
    height = 0,
    unique = false,
  ): this {
    void unique;
    this.#releaseGraphic();
    if (source instanceof FlxGraphic) {
      this.#graphic = source;
      this.#ownsGraphic = false;
    } else {
      this.#graphic = new FlxGraphic(source);
      this.#ownsGraphic = true;
    }

    this.#configureGraphic(animated, reverse, width, height);
    return this;
  }

  makeGraphic(
    width: number,
    height: number,
    color = 0xffffffff,
    unique = false,
    key: string | null = null,
  ): this {
    void unique;
    this.#releaseGraphic();
    this.#graphic = FlxGraphic.fromPixels(
      makeGraphicPixels(width, height, color),
      key ?? undefined,
    );
    this.#ownsGraphic = true;
    this.#configureGraphic(false, false, width, height);
    return this;
  }

  /** Installs a generated CPU pixel buffer as this sprite's owned texture. */
  protected loadPixelBuffer(buffer: PixelBuffer, key?: string): this {
    this.#releaseGraphic();
    this.#graphic = FlxGraphic.fromPixels(buffer, key);
    this.#ownsGraphic = true;
    this.#configureGraphic(false, false, buffer.width, buffer.height);
    return this;
  }

  override postUpdate(): void {
    super.postUpdate();
    this.updateAnimation();
    this.syncRenderHandles();
  }

  override draw(): void {
    this.syncRenderHandles();
    super.draw();
  }

  protected updateAnimation(): void {
    const animation = this.#currentAnimation;
    if (
      this.#animationPaused ||
      animation === null ||
      animation.delay <= 0 ||
      (!animation.looped && this.finished)
    ) {
      if (this.dirty) this.drawFrame();
      return;
    }

    this.#frameTimer += FlxG.elapsed;
    while (this.#frameTimer > animation.delay) {
      this.#frameTimer -= animation.delay;
      if (this.#currentAnimationFrame === animation.frames.length - 1) {
        if (animation.looped) this.#currentAnimationFrame = 0;
        this.finished = true;
      } else {
        this.#currentAnimationFrame += 1;
      }
      this.#currentFrameIndex =
        animation.frames[this.#currentAnimationFrame] ?? 0;
      this.dirty = true;
    }

    if (this.dirty) this.drawFrame();
  }

  drawFrame(force = false): void {
    if (!force && !this.dirty) return;
    this.#validateFrame(this.#currentFrameIndex);
    this.dirty = false;
    this.#callback?.(
      this.#currentAnimation?.name ?? null,
      this.#currentAnimationFrame,
      this.#currentFrameIndex,
    );
    this.syncRenderHandles();
  }

  addAnimation(
    name: string,
    frames: readonly number[],
    frameRate = 0,
    looped = true,
  ): void {
    if (name.length === 0)
      throw new RangeError('Animation name cannot be empty.');
    if (frames.length === 0) {
      throw new RangeError('Animation must contain at least one frame.');
    }
    for (const frame of frames) this.#validateFrame(frame);
    this.#animations.push(new FlxAnim(name, frames, frameRate, looped));
  }

  addAnimationCallback(callback: FlxAnimationCallback | null): void {
    this.#callback = callback;
  }

  play(animationName: string, force = false): void {
    if (
      !force &&
      this.#currentAnimation?.name === animationName &&
      (this.#currentAnimation.looped || !this.finished)
    ) {
      return;
    }
    const animation = this.#animations.find((candidate) => {
      return candidate.name === animationName;
    });
    if (animation === undefined) {
      throw new Error(`No animation called "${animationName}".`);
    }

    this.#currentAnimation = animation;
    this.#currentAnimationFrame = 0;
    this.#currentFrameIndex = animation.frames[0] ?? 0;
    this.#frameTimer = 0;
    this.#animationPaused = false;
    this.finished = animation.delay <= 0;
    this.dirty = true;
    this.drawFrame();
  }

  pauseAnimation(): void {
    this.#animationPaused = true;
  }

  resumeAnimation(): void {
    this.#animationPaused = false;
  }

  restartAnimation(): void {
    if (this.#currentAnimation !== null)
      this.play(this.#currentAnimation.name, true);
  }

  randomFrame(): void {
    this.#currentAnimation = null;
    this.#currentAnimationFrame = 0;
    this.#currentFrameIndex = Math.floor(FlxG.random() * this.frames);
    this.dirty = true;
  }

  setOriginToCorner(): void {
    this.origin.make();
  }

  centerOffsets(adjustPosition = false): void {
    this.offset.x = (this.frameWidth - this.width) * 0.5;
    this.offset.y = (this.frameHeight - this.height) * 0.5;
    if (adjustPosition) {
      this.x += this.offset.x;
      this.y += this.offset.y;
    }
  }

  override onScreen(camera: FlxCameraLike = FlxG.camera): boolean {
    const point = this.getScreenXY(undefined, camera);
    point.x -= this.offset.x;
    point.y -= this.offset.y;
    if (this.angle === 0 && this.scale.x === 1 && this.scale.y === 1) {
      return (
        point.x + this.frameWidth > 0 &&
        point.x < camera.width &&
        point.y + this.frameHeight > 0 &&
        point.y < camera.height
      );
    }

    const halfWidth = this.frameWidth * 0.5;
    const halfHeight = this.frameHeight * 0.5;
    const radius =
      Math.hypot(halfWidth, halfHeight) *
      Math.max(Math.abs(this.scale.x), Math.abs(this.scale.y));
    point.x += halfWidth;
    point.y += halfHeight;
    return (
      point.x + radius > 0 &&
      point.x - radius < camera.width &&
      point.y + radius > 0 &&
      point.y - radius < camera.height
    );
  }

  createRenderHandle(): FlxRenderHandle {
    return this.trackRenderHandle((onDestroy) => {
      return new FlxSpriteRenderHandle(this, onDestroy);
    });
  }

  syncRenderHandles(): void {
    for (const handle of this.#renderHandles) handle.sync();
  }

  protected trackRenderHandle<T extends FlxRenderHandle>(
    create: (onDestroy: () => void) => T,
  ): T {
    const handle = create(() => {
      this.#renderHandles.delete(handle);
    });
    this.#renderHandles.add(handle);
    return handle;
  }

  get facing(): number {
    return this.#facing;
  }

  set facing(direction: number) {
    if (this.#facing !== direction) this.dirty = true;
    this.#facing = direction;
  }

  get alpha(): number {
    return this.#alpha;
  }

  set alpha(value: number) {
    this.#alpha = Math.min(1, Math.max(0, value));
  }

  get color(): number {
    return this.#color;
  }

  set color(value: number) {
    this.#color = value & 0xffffff;
  }

  get frame(): number {
    return this.#currentFrameIndex;
  }

  set frame(value: number) {
    this.#validateFrame(value);
    this.#currentAnimation = null;
    this.#currentAnimationFrame = 0;
    this.#currentFrameIndex = value;
    this.finished = false;
    this.dirty = true;
  }

  get animationName(): string | null {
    return this.#currentAnimation?.name ?? null;
  }

  get animationFrame(): number {
    return this.#currentAnimationFrame;
  }

  get animationPaused(): boolean {
    return this.#animationPaused;
  }

  /** Number of live adapter handles owned by this gameplay object. */
  get renderHandleCount(): number {
    return this.#renderHandles.size;
  }

  /** @internal */
  get renderTexture(): Texture {
    const graphic = this.#graphic;
    if (graphic === null || this.frames === 0) return Texture.EMPTY;
    return graphic.frameTexture(
      this.#currentFrameIndex,
      this.frameWidth,
      this.frameHeight,
    );
  }

  /** @internal */
  get renderFlipped(): boolean {
    return this.#supportsReverse && this.#facing === FlxObject.LEFT;
  }

  /** @internal */
  get graphic(): FlxGraphic | null {
    return this.#graphic;
  }

  #configureGraphic(
    animated: boolean,
    reverse: boolean,
    requestedWidth: number,
    requestedHeight: number,
  ): void {
    const graphic = this.#graphic;
    if (graphic === null) return;
    let width = requestedWidth;
    let height = requestedHeight;
    if (width === 0) width = animated ? graphic.height : graphic.width;
    if (height === 0) height = animated ? width : graphic.height;
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width <= 0 ||
      height <= 0 ||
      width > graphic.width ||
      height > graphic.height
    ) {
      throw new RangeError('Frame dimensions must fit inside the graphic.');
    }

    this.frameWidth = width;
    this.frameHeight = height;
    this.width = width;
    this.height = height;
    this.frames =
      Math.floor(graphic.width / width) * Math.floor(graphic.height / height);
    this.origin.make(width * 0.5, height * 0.5);
    this.#supportsReverse = reverse;
    this.#currentFrameIndex = 0;
    this.#currentAnimationFrame = 0;
    this.#frameTimer = 0;
    this.dirty = true;
    this.drawFrame();
  }

  #validateFrame(frame: number): void {
    if (!Number.isInteger(frame) || frame < 0 || frame >= this.frames) {
      throw new RangeError(`Frame ${frame} is outside 0..${this.frames - 1}.`);
    }
  }

  #releaseGraphic(): void {
    if (this.#ownsGraphic) this.#graphic?.destroy();
    this.#graphic = null;
    this.#ownsGraphic = false;
  }
}
