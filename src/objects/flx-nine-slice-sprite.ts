import type { Texture } from 'pixi.js';

import { FlxGraphic } from '../assets/flx-graphic';
import type { FlxAtlas } from '../assets/flx-atlas';
import { FlxNineSliceRenderHandle } from '../rendering/flx-nine-slice-render-handle';
import {
  type FlxNineSliceBorderInput,
  type FlxNineSliceBorders,
  resolveNineSliceBorders,
  validateNineSliceBorders,
} from './flx-nine-slice';
import { FlxObject } from './flx-object';
import { FlxSprite } from './flx-sprite';

/**
 * Resizable sprite with fixed corner and edge art via Pixi 9-slice scaling.
 *
 * Use {@link loadNineSliceGraphic} or {@link loadNineSliceFrame} instead of
 * {@link FlxSprite.loadGraphic} so border insets are tracked for rendering.
 * @public
 */
export class FlxNineSliceSprite extends FlxSprite {
  #leftWidth = 10;
  #topHeight = 10;
  #rightWidth = 10;
  #bottomHeight = 10;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    super(x, y);
    this.allowCollisions = FlxObject.NONE;
    if (width > 0 && height > 0) {
      this.width = width;
      this.height = height;
      this.frameWidth = width;
      this.frameHeight = height;
    }
  }

  get leftWidth(): number {
    return this.#leftWidth;
  }

  get topHeight(): number {
    return this.#topHeight;
  }

  get rightWidth(): number {
    return this.#rightWidth;
  }

  get bottomHeight(): number {
    return this.#bottomHeight;
  }

  /** Replace all border insets and resync renderer-owned geometry. */
  setBorders(left: number, top: number, right: number, bottom: number): this {
    const texture = this.renderTexture;
    const textureWidth = texture.width > 0 ? texture.width : this.frameWidth;
    const textureHeight =
      texture.height > 0 ? texture.height : this.frameHeight;
    const borders: FlxNineSliceBorders = {
      bottom,
      left,
      right,
      top,
    };
    validateNineSliceBorders(
      borders,
      textureWidth,
      textureHeight,
      this.width,
      this.height,
    );
    this.#leftWidth = left;
    this.#topHeight = top;
    this.#rightWidth = right;
    this.#bottomHeight = bottom;
    this.syncRenderHandles();
    return this;
  }

  /** Resize the stretched region without distorting corner art. */
  resize(width: number, height: number): this {
    if (!Number.isFinite(width) || width <= 0) {
      throw new RangeError(
        'Nine-slice width must be a positive finite number.',
      );
    }
    if (!Number.isFinite(height) || height <= 0) {
      throw new RangeError(
        'Nine-slice height must be a positive finite number.',
      );
    }
    const texture = this.renderTexture;
    const textureWidth = texture.width > 0 ? texture.width : this.frameWidth;
    const textureHeight =
      texture.height > 0 ? texture.height : this.frameHeight;
    validateNineSliceBorders(
      {
        bottom: this.#bottomHeight,
        left: this.#leftWidth,
        right: this.#rightWidth,
        top: this.#topHeight,
      },
      textureWidth,
      textureHeight,
      width,
      height,
    );
    this.width = width;
    this.height = height;
    this.frameWidth = width;
    this.frameHeight = height;
    this.syncRenderHandles();
    return this;
  }

  loadNineSliceTexture(
    texture: Texture,
    width: number,
    height: number,
    borders?: FlxNineSliceBorderInput,
  ): this {
    return this.loadNineSliceGraphic(
      new FlxGraphic(texture),
      false,
      false,
      texture.frame.width,
      texture.frame.height,
      borders,
      width,
      height,
    );
  }

  loadNineSliceFrame(
    atlas: FlxAtlas,
    name: string,
    width: number,
    height: number,
    borders?: FlxNineSliceBorderInput,
  ): this {
    const frame = atlas.getFrame(name);
    return this.loadNineSliceTexture(frame.texture, width, height, borders);
  }

  loadNineSliceGraphic(
    source: FlxGraphic | Texture,
    animated = false,
    reverse = false,
    frameWidth = 0,
    frameHeight = 0,
    borders?: FlxNineSliceBorderInput,
    displayWidth?: number,
    displayHeight?: number,
  ): this {
    FlxSprite.prototype.loadGraphic.call(
      this,
      source,
      animated,
      reverse,
      frameWidth,
      frameHeight,
    );
    const texture = this.renderTexture;
    const textureWidth = frameWidth > 0 ? frameWidth : texture.frame.width;
    const textureHeight = frameHeight > 0 ? frameHeight : texture.frame.height;
    const resolved = resolveNineSliceBorders(
      borders,
      textureWidth,
      textureHeight,
    );
    const outWidth = displayWidth ?? this.frameWidth;
    const outHeight = displayHeight ?? this.frameHeight;
    validateNineSliceBorders(
      resolved,
      textureWidth,
      textureHeight,
      outWidth,
      outHeight,
    );
    this.#leftWidth = resolved.left;
    this.#topHeight = resolved.top;
    this.#rightWidth = resolved.right;
    this.#bottomHeight = resolved.bottom;
    if (displayWidth !== undefined || displayHeight !== undefined) {
      this.width = outWidth;
      this.height = outHeight;
      this.frameWidth = outWidth;
      this.frameHeight = outHeight;
    }
    this.syncRenderHandles();
    return this;
  }

  override loadGraphic(
    source: FlxGraphic | Texture,
    animated = false,
    reverse = false,
    width = 0,
    height = 0,
    unique = false,
  ): this {
    void source;
    void animated;
    void reverse;
    void width;
    void height;
    void unique;
    throw new Error(
      'FlxNineSliceSprite.loadGraphic is not supported. Use loadNineSliceGraphic or loadNineSliceFrame.',
    );
  }

  override createRenderHandle(): FlxNineSliceRenderHandle {
    return this.trackRenderHandle((onDestroy) => {
      return new FlxNineSliceRenderHandle(this, onDestroy);
    });
  }

  override postUpdate(): void {
    super.postUpdate();
    this.syncRenderHandles();
  }
}
