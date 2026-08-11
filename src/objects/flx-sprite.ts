import { Texture, type BLEND_MODES } from 'pixi.js';

import { FlxGraphic } from '../assets/flx-graphic';
import {
  atlasBakeCellFromTexture,
  bakeAtlasFrameStrip,
  type FlxAtlasBakeCell,
} from '../assets/flx-atlas-bake';
import { canvasSourceFromTexture } from '../assets/flx-atlas';
import type { FlxAtlasFrameList } from '../assets/flx-atlas-frame';
import { FlxAnimationController } from '../animation/flx-animation-controller';
import { FlxFramesCollection } from '../animation/flx-frames-collection';
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

/**
 * Options for `FlxSprite.play` when using the object-form overload.
 * @public
 */
export interface FlxAnimationPlayOptions {
  /**
   * Whether the animation loops. Default `false` for the options-object form.
   * Use the legacy `addAnimation(name, frames, frameRate, looped)` call if you
   * want looping to be the stored default.
   */
  loop?: boolean;
  /**
   * Playback speed multiplier relative to the game update rate.
   * `1` = one animation frame per update. Must be positive. Default `1`.
   */
  speed?: number;
  /**
   * Force restart even if this animation is already playing. Default `false`.
   */
  force?: boolean;
  /** Play frames in reverse order. Default `false`. */
  reversed?: boolean;
  /** Starting frame number within the animation. Default `0`. */
  frame?: number;
}

/**
 * Options when registering an animation from {@link FlxAtlasFrameList}.
 * @public
 */
export interface FlxAtlasAnimationOptions {
  /** Output cell width when baking atlas frames into the sprite strip. */
  frameWidth?: number;
  /** Output cell height when baking atlas frames into the sprite strip. */
  frameHeight?: number;
}

/** @internal Discriminator: is `frames` an atlas frame list? */
function isAtlasFrameList(
  frames: readonly number[] | FlxAtlasFrameList,
): frames is FlxAtlasFrameList {
  return (
    frames.length > 0 &&
    typeof frames[0] === 'object' &&
    frames[0] !== null &&
    'texture' in frames[0]
  );
}

const DEFAULT_FRAMERATE = 60;

function resolveFramerate(): number {
  if (!FlxG.hasContext) return DEFAULT_FRAMERATE;
  const rate = FlxG.context.updateFramerate;
  return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_FRAMERATE;
}

interface AtlasStripSlot {
  readonly key: string;
  readonly name: string;
  readonly cell: FlxAtlasBakeCell;
}

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
  readonly animation: FlxAnimationController;

  readonly #animations: FlxAnim[] = [];
  readonly #renderHandles = new Set<FlxRenderHandle>();
  #graphic: FlxGraphic | null = null;
  #ownsGraphic = false;
  #frameCollection: FlxFramesCollection | null = null;
  #ownsFrameCollection = false;
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
  /** Per-playback loop override (set by play). */
  #playbackLoop = true;
  /** Per-playback delay in seconds (set by play). 0 = freeze on frame 0. */
  #playbackDelay = 0;
  #playbackReversed = false;
  /**
   * Append-only atlas strip slots. Multiple atlas `addAnimation` calls share
   * one graphic; indices stay stable because slots are only appended.
   */
  readonly #atlasStripSlots: AtlasStripSlot[] = [];
  #frameNames: (string | null)[] = [];
  #atlasStripCellW = 0;
  #atlasStripCellH = 0;

  constructor(x = 0, y = 0, simpleGraphic: FlxGraphic | Texture | null = null) {
    super(x, y);
    this.animation = new FlxAnimationController(this);
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
    this.animation.destroy();
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

  /** Loads named texture views without baking them into a new strip. */
  loadFrames(collection: FlxFramesCollection, reverse = false): this {
    if (collection.numFrames === 0) {
      throw new RangeError('FlxSprite.loadFrames requires at least one frame.');
    }
    const first = collection.getFrame(0);
    if (
      collection.frames.some(
        (frame) => frame.width !== first.width || frame.height !== first.height,
      )
    ) {
      throw new RangeError(
        'FlxSprite.loadFrames requires uniform frame dimensions.',
      );
    }
    this.#releaseGraphic();
    this.#frameCollection = collection;
    this.#ownsFrameCollection = false;
    this.#configureFrames(collection, reverse);
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
      this.#currentFrameDuration() <= 0 ||
      (!this.#playbackLoop && this.finished)
    ) {
      if (this.dirty) this.drawFrame();
      return;
    }

    this.#frameTimer +=
      FlxG.elapsed * this.animation.timeScale * animation.timeScale;
    let frameDuration = this.#currentFrameDuration();
    while (frameDuration > 0 && this.#frameTimer > frameDuration) {
      this.#frameTimer -= frameDuration;
      const lastFrame = animation.frames.length - 1;
      const atBoundary = this.#playbackReversed
        ? this.#currentAnimationFrame <= animation.loopPoint
        : this.#currentAnimationFrame >= lastFrame;
      if (atBoundary) {
        if (this.#playbackLoop) {
          this.#currentAnimationFrame = this.#playbackReversed
            ? lastFrame
            : animation.loopPoint;
          this.finished = true;
          this.animation.dispatchLoop(animation.name);
        } else if (!this.finished) {
          this.finished = true;
          this.#animationPaused = true;
          this.animation.dispatchFinish(animation.name);
        }
      } else {
        this.#currentAnimationFrame += this.#playbackReversed ? -1 : 1;
      }
      this.#currentFrameIndex =
        animation.frames[this.#currentAnimationFrame] ?? 0;
      this.#syncAnimationState();
      this.dirty = true;
      if (!this.#playbackLoop && this.finished) break;
      frameDuration = this.#currentFrameDuration();
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
    this.animation.dispatchFrameChange({
      animationName: this.#currentAnimation?.name ?? null,
      frameIndex: this.#currentFrameIndex,
      frameNumber: this.#currentAnimationFrame,
    });
    this.syncRenderHandles();
  }

  /**
   * Register a named animation.
   *
   * **Strip form (legacy-compatible):**
   * ```ts
   * sprite.addAnimation('walk', [0, 1, 2], 12, true);
   * ```
   *
   * **Atlas frame form:**
   * ```ts
   * sprite.addAnimation('walk', atlas.framesByPrefix('walk_', 1, 2), {
   *   frameWidth: 64,
   *   frameHeight: 128,
   * });
   * ```
   * Atlas frames are baked into a shared strip internally (append-only).
   *
   * Replaces any existing animation with the same name.
   */
  addAnimation(
    name: string,
    frames: readonly number[] | FlxAtlasFrameList,
    frameRateOrOptions?: number | FlxAtlasAnimationOptions,
    looped?: boolean,
  ): void {
    if (name.length === 0)
      throw new RangeError('Animation name cannot be empty.');
    if (frames.length === 0) {
      throw new RangeError('Animation must contain at least one frame.');
    }

    if (isAtlasFrameList(frames)) {
      const atlasOpts =
        typeof frameRateOrOptions === 'object' && frameRateOrOptions !== null
          ? frameRateOrOptions
          : undefined;
      this.#addAnimationFromAtlas(name, frames, atlasOpts);
    } else {
      const frameRate =
        typeof frameRateOrOptions === 'number' ? frameRateOrOptions : undefined;
      // 4-arg form: legacy frameRate/looped defaults; 2-arg form: speed=1/loop=false
      const useLegacyDefaults = frameRate !== undefined || looped !== undefined;
      const resolvedFrameRate = frameRate ?? 0;
      const resolvedLooped = useLegacyDefaults ? (looped ?? true) : false;
      const defaultSpeed =
        resolvedFrameRate > 0 ? resolvedFrameRate / resolveFramerate() : 1;
      this.registerAnimation(
        name,
        frames as readonly number[],
        resolvedFrameRate,
        resolvedLooped,
        false,
        false,
        defaultSpeed,
      );
    }
  }

  /**
   * Play a named animation.
   *
   * **Legacy form:** `play(name)` or `play(name, force: boolean)` — uses the
   * `looped` / `frameRate` values stored when `addAnimation` was called.
   *
   * **Options form:** `play(name, { loop, speed, force })`
   * - `loop` defaults to `false`
   * - `speed` defaults to `1` (one anim frame per game update)
   * - `force` defaults to `false`
   */
  play(
    name: string,
    forceOrOptions: boolean | FlxAnimationPlayOptions = false,
  ): void {
    let loop: boolean;
    let speed: number;
    let force: boolean;
    let reversed = false;
    let frame = 0;

    if (typeof forceOrOptions === 'boolean') {
      // Legacy form — apply per-animation stored defaults
      force = forceOrOptions;
      const existing = this.#animations.find((a) => a.name === name);
      loop = existing?.defaultLooped ?? true;
      speed = existing?.defaultSpeed ?? 1;
    } else {
      // Options form
      const opts = forceOrOptions;
      force = opts.force ?? false;
      loop = opts.loop ?? false;
      speed = opts.speed ?? 1;
      reversed = opts.reversed ?? false;
      frame = opts.frame ?? 0;
      if (speed <= 0) {
        throw new RangeError('FlxSprite.play: speed must be > 0.');
      }
    }

    if (
      !force &&
      this.#currentAnimation?.name === name &&
      this.#playbackReversed === reversed &&
      (this.#playbackLoop || !this.finished)
    ) {
      return;
    }
    const animation = this.#animations.find((candidate) => {
      return candidate.name === name;
    });
    if (animation === undefined) {
      throw new Error(`No animation called "${name}".`);
    }

    this.#currentAnimation = animation;
    const maxFrame = animation.frames.length - 1;
    if (!Number.isInteger(frame)) {
      throw new RangeError('FlxSprite.play: frame must be an integer.');
    }
    const startFrame =
      frame < 0
        ? Math.floor(FlxG.random() * animation.frames.length)
        : Math.min(Math.max(frame, 0), maxFrame);
    this.#playbackReversed = reversed;
    this.#currentAnimationFrame = reversed ? maxFrame - startFrame : startFrame;
    this.#currentFrameIndex =
      animation.frames[this.#currentAnimationFrame] ?? 0;
    this.#frameTimer = 0;
    this.#animationPaused = false;
    this.#playbackLoop = loop;

    // Compute delay from speed + framerate
    const framerate = resolveFramerate();
    this.#playbackDelay = speed > 0 ? 1 / (framerate * speed) : 0;

    // If the animation was registered with a legacy frameRate, its stored
    // delay is authoritative when play() is called in legacy boolean form.
    if (typeof forceOrOptions === 'boolean' && animation.delay > 0) {
      this.#playbackDelay = animation.delay;
    }

    this.finished = this.#playbackDelay <= 0;
    this.#syncAnimationState();
    this.dirty = true;
    this.drawFrame();
  }

  addAnimationCallback(callback: FlxAnimationCallback | null): void {
    this.#callback = callback;
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
    this.#syncAnimationState();
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

  /** @internal */
  get currentAnimation(): FlxAnim | null {
    return this.#currentAnimation;
  }

  /** @internal */
  get currentFrameName(): string | null {
    return (
      this.#frameCollection?.getFrame(this.#currentFrameIndex).name ?? null
    );
  }

  /** Number of live adapter handles owned by this gameplay object. */
  get renderHandleCount(): number {
    return this.#renderHandles.size;
  }

  /** @internal */
  get renderTexture(): Texture {
    if (this.#frameCollection !== null && this.frames > 0) {
      return this.#frameCollection.getFrame(this.#currentFrameIndex).texture;
    }
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
    const facingFlip = this.#supportsReverse && this.#facing === FlxObject.LEFT;
    return facingFlip !== (this.#currentAnimation?.flipX ?? false);
  }

  /** @internal */
  get renderFlippedY(): boolean {
    return this.#currentAnimation?.flipY ?? false;
  }

  /** @internal */
  get graphic(): FlxGraphic | null {
    return this.#graphic;
  }

  get frameCollection(): FlxFramesCollection | null {
    return this.#frameCollection;
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Bake atlas frames into a shared horizontal strip graphic and register the
   * animation. Slots are append-only so earlier atlas animations keep working.
   */
  #addAnimationFromAtlas(
    name: string,
    frames: FlxAtlasFrameList,
    options?: FlxAtlasAnimationOptions,
  ): void {
    const first = frames[0];
    if (first === undefined) {
      throw new RangeError('Atlas animation requires at least one frame.');
    }
    const outW = options?.frameWidth ?? first.texture.orig.width;
    const outH = options?.frameHeight ?? first.texture.orig.height;
    if (outW <= 0 || outH <= 0) {
      throw new RangeError(
        'Atlas animation frameWidth/frameHeight must be positive.',
      );
    }

    if (this.#atlasStripSlots.length === 0) {
      this.#atlasStripCellW = outW;
      this.#atlasStripCellH = outH;
    } else if (
      outW !== this.#atlasStripCellW ||
      outH !== this.#atlasStripCellH
    ) {
      throw new RangeError(
        `Atlas animation "${name}" frame size ${outW}×${outH} does not match ` +
          `existing strip cell size ${this.#atlasStripCellW}×${this.#atlasStripCellH}.`,
      );
    }

    const indices: number[] = [];
    let appended = false;
    for (const frame of frames) {
      const texture = frame.texture;
      const trim = texture.trim;
      const key =
        `${frame.name}@${texture.frame.x},${texture.frame.y},${texture.frame.width}x${texture.frame.height}` +
        `/r${texture.rotate}/o${texture.orig.width}x${texture.orig.height}` +
        `/t${trim?.x ?? 0},${trim?.y ?? 0},${trim?.width ?? texture.orig.width}x${trim?.height ?? texture.orig.height}` +
        `->${outW}x${outH}`;
      let slotIndex = this.#atlasStripSlots.findIndex(
        (slot) => slot.key === key,
      );
      if (slotIndex < 0) {
        const canvasSource = canvasSourceFromTexture(
          new Texture({ source: texture.source }),
        );
        slotIndex = this.#atlasStripSlots.length;
        this.#atlasStripSlots.push({
          cell: atlasBakeCellFromTexture(texture, canvasSource),
          key,
          name: frame.name,
        });
        appended = true;
      }
      indices.push(slotIndex);
    }

    if (appended || this.#graphic === null) {
      const cells = this.#atlasStripSlots.map((slot) => slot.cell);
      const stripTexture = bakeAtlasFrameStrip(
        cells,
        this.#atlasStripCellW,
        this.#atlasStripCellH,
      );
      this.loadGraphic(
        stripTexture,
        true,
        true,
        this.#atlasStripCellW,
        this.#atlasStripCellH,
      );
      this.#frameNames = this.#atlasStripSlots.map((slot) => slot.name);
      this.#frameCollection?.setNames(this.#frameNames);
    }

    this.registerAnimation(name, indices, 0, false);
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
    this.#frameNames = Array.from({ length: this.frames }, (_, index) =>
      String(index),
    );
    this.#frameCollection = FlxFramesCollection.fromGraphicGrid(
      graphic,
      width,
      height,
      { names: this.#frameNames },
    );
    this.#ownsFrameCollection = true;
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
    if (this.#ownsFrameCollection) this.#frameCollection?.destroy();
    this.#frameCollection = null;
    this.#ownsFrameCollection = false;
    if (this.#ownsGraphic) this.#graphic?.destroy();
    this.#graphic = null;
    this.#ownsGraphic = false;
  }

  /** @internal */
  registerAnimation(
    name: string,
    frames: readonly number[],
    frameRate = 30,
    looped = true,
    flipX = false,
    flipY = false,
    defaultSpeed = frameRate > 0 ? frameRate / resolveFramerate() : 1,
  ): void {
    if (name.length === 0) {
      throw new RangeError('Animation name cannot be empty.');
    }
    if (frames.length === 0) {
      throw new RangeError('Animation must contain at least one frame.');
    }
    for (const frame of frames) this.#validateFrame(frame);

    const existingIdx = this.#animations.findIndex(
      (animation) => animation.name === name,
    );
    if (existingIdx >= 0) {
      const existing = this.#animations[existingIdx];
      if (existing === this.#currentAnimation) {
        this.stopAnimation();
        this.#currentAnimation = null;
      }
      existing?.destroy();
      this.#animations.splice(existingIdx, 1);
    }
    this.#animations.push(
      new FlxAnim(name, frames, frameRate, looped, defaultSpeed, flipX, flipY),
    );
  }

  /** @internal */
  removeAnimation(name: string): boolean {
    const index = this.#animations.findIndex(
      (animation) => animation.name === name,
    );
    if (index < 0) return false;
    const [removed] = this.#animations.splice(index, 1);
    if (removed === this.#currentAnimation) {
      this.stopAnimation();
      this.#currentAnimation = null;
    }
    removed?.destroy();
    return true;
  }

  /** @internal */
  appendAnimation(name: string, frames: readonly number[]): void {
    const animation = this.getAnimation(name);
    if (animation === null) throw new Error(`No animation called "${name}".`);
    for (const frame of frames) this.#validateFrame(frame);
    animation.frames.push(...frames);
  }

  /** @internal */
  renameAnimation(oldName: string, newName: string): boolean {
    if (newName.length === 0) {
      throw new RangeError('Animation name cannot be empty.');
    }
    if (this.getAnimation(newName) !== null) {
      throw new Error(`Animation "${newName}" already exists.`);
    }
    const animation = this.getAnimation(oldName);
    if (animation === null) return false;
    animation.name = newName;
    return true;
  }

  /** @internal */
  getAnimation(name: string): FlxAnim | null {
    return (
      this.#animations.find((animation) => animation.name === name) ?? null
    );
  }

  /** @internal */
  getAnimationList(): FlxAnim[] {
    return [...this.#animations];
  }

  /** @internal */
  playAnimation(
    name: string,
    force = false,
    reversed = false,
    frame = 0,
  ): void {
    const animation = this.getAnimation(name);
    if (animation === null) throw new Error(`No animation called "${name}".`);
    this.play(name, {
      force,
      frame,
      loop: animation.looped,
      reversed,
      speed: animation.defaultSpeed,
    });
  }

  /** @internal */
  finishAnimation(): void {
    const animation = this.#currentAnimation;
    if (animation === null) return;
    this.#currentAnimationFrame = this.#playbackReversed
      ? 0
      : animation.frames.length - 1;
    this.#currentFrameIndex =
      animation.frames[this.#currentAnimationFrame] ?? 0;
    this.finished = true;
    this.#animationPaused = true;
    this.#syncAnimationState();
    this.dirty = true;
    this.drawFrame();
    this.animation.dispatchFinish(animation.name);
  }

  /** @internal */
  stopAnimation(): void {
    this.finished = true;
    this.#animationPaused = true;
    this.#syncAnimationState();
  }

  /** @internal */
  frameIndexByName(name: string): number {
    return this.#frameCollection?.getByName(name).index ?? -1;
  }

  /** @internal */
  frameIndicesByPrefix(prefix: string): number[] {
    return (
      this.#frameCollection?.getByPrefix(prefix).map((frame) => frame.index) ??
      []
    );
  }

  #syncAnimationState(): void {
    const animation = this.#currentAnimation;
    if (animation === null) return;
    animation.curFrame = this.#currentAnimationFrame;
    animation.finished = this.finished;
    animation.paused = this.#animationPaused;
    animation.reversed = this.#playbackReversed;
  }

  #configureFrames(collection: FlxFramesCollection, reverse: boolean): void {
    const first = collection.getFrame(0);
    this.frameWidth = first.width;
    this.frameHeight = first.height;
    this.width = first.width;
    this.height = first.height;
    this.frames = collection.numFrames;
    this.#frameNames = collection.frames.map((frame) => frame.name);
    this.origin.make(first.width * 0.5, first.height * 0.5);
    this.#supportsReverse = reverse;
    this.#currentFrameIndex = 0;
    this.#currentAnimationFrame = 0;
    this.#frameTimer = 0;
    this.dirty = true;
    this.drawFrame();
  }

  #currentFrameDuration(): number {
    const duration =
      this.#frameCollection?.getFrame(this.#currentFrameIndex).duration ?? 0;
    return duration > 0 ? duration : this.#playbackDelay;
  }
}
