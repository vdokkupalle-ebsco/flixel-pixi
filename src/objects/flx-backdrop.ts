import { Texture } from 'pixi.js';

import type { FlxAtlas } from '../assets/flx-atlas';
import { FlxGraphic } from '../assets/flx-graphic';
import { FlxG } from '../core/flx-g';
import { FlxPoint } from '../math/flx-point';
import { FlxBackdropRenderHandle } from '../rendering/flx-backdrop-render-handle';
import type { FlxCameraLike } from './flx-object';
import { FlxObject } from './flx-object';
import { FlxSprite } from './flx-sprite';

function requireDimension(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
  return value;
}

/**
 * Infinitely repeating, independently scrolling texture region.
 *
 * The authoritative state stays renderer-neutral while the Pixi adapter uses
 * one `TilingSprite`, avoiding duplicate gameplay objects and wrap seams.
 * @public
 */
export class FlxBackdrop extends FlxSprite {
  /** Texture offset in logical pixels. */
  readonly tilePosition = new FlxPoint();
  /** Tile offset captured at the start of the latest fixed update. @internal */
  readonly lastTilePosition = new FlxPoint();
  /** Scale applied to each repeated tile without resizing the visible region. */
  readonly tileScale = new FlxPoint(1, 1);
  /** Deterministic tile-position change in logical pixels per second. */
  readonly scrollVelocity = new FlxPoint();
  /** Repeat the texture horizontally. */
  repeatX = true;
  /** Repeat the texture vertically. */
  repeatY = true;
  /** Rotation applied to each tile, in degrees. */
  tileAngle = 0;

  #tileTexture: Texture = Texture.EMPTY;

  constructor(
    source: FlxGraphic | Texture | null = null,
    x = 0,
    y = 0,
    width = 0,
    height = 0,
  ) {
    super(x, y);
    this.allowCollisions = FlxObject.NONE;
    if (source !== null) {
      this.loadBackdropGraphic(source, width, height);
    } else if (width > 0 || height > 0) {
      this.resize(width, height);
    }
  }

  /** Texture repeated by the renderer-owned tiling sprite. @internal */
  get tileTexture(): Texture {
    return this.#tileTexture;
  }

  /** Load a texture and optionally set the visible tiling region. */
  loadBackdropGraphic(
    source: FlxGraphic | Texture,
    width = 0,
    height = 0,
  ): this {
    FlxSprite.prototype.loadGraphic.call(this, source);
    this.#tileTexture = source instanceof FlxGraphic ? source.texture : source;
    const regionWidth = width > 0 ? width : this.#tileTexture.width;
    const regionHeight = height > 0 ? height : this.#tileTexture.height;
    requireDimension(regionWidth, 'Backdrop width');
    requireDimension(regionHeight, 'Backdrop height');
    this.width = regionWidth;
    this.height = regionHeight;
    this.origin.make(regionWidth * 0.5, regionHeight * 0.5);
    this.syncRenderHandles();
    return this;
  }

  /** Load one named atlas frame as the repeating texture. */
  loadBackdropFrame(
    atlas: FlxAtlas,
    name: string,
    width = 0,
    height = 0,
  ): this {
    return this.loadBackdropGraphic(
      atlas.getFrame(name).texture,
      width,
      height,
    );
  }

  /** Resize the visible tiling region without scaling its repeated texture. */
  resize(width: number, height: number): this {
    requireDimension(width, 'Backdrop width');
    requireDimension(height, 'Backdrop height');
    const centered =
      this.origin.x === this.width * 0.5 && this.origin.y === this.height * 0.5;
    this.width = width;
    this.height = height;
    if (centered) this.origin.make(width * 0.5, height * 0.5);
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
      'FlxBackdrop.loadGraphic is not supported. Use loadBackdropGraphic or loadBackdropFrame.',
    );
  }

  override update(): void {
    super.update();
    this.tilePosition.x += this.scrollVelocity.x * FlxG.elapsed;
    this.tilePosition.y += this.scrollVelocity.y * FlxG.elapsed;
  }

  override preUpdate(): void {
    super.preUpdate();
    this.lastTilePosition.copyFrom(this.tilePosition);
  }

  override onScreen(camera: FlxCameraLike = FlxG.camera): boolean {
    const point = this.getScreenXY(undefined, camera);
    point.x -= this.offset.x;
    point.y -= this.offset.y;
    if (this.angle === 0 && this.scale.x === 1 && this.scale.y === 1) {
      return (
        point.x + this.width > 0 &&
        point.x < camera.width &&
        point.y + this.height > 0 &&
        point.y < camera.height
      );
    }

    const halfWidth = this.width * 0.5;
    const halfHeight = this.height * 0.5;
    const radians = (this.angle * Math.PI) / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    const relativeCenterX = (halfWidth - this.origin.x) * this.scale.x;
    const relativeCenterY = (halfHeight - this.origin.y) * this.scale.y;
    point.x +=
      this.origin.x + relativeCenterX * cosine - relativeCenterY * sine;
    point.y +=
      this.origin.y + relativeCenterX * sine + relativeCenterY * cosine;
    const extentX =
      Math.abs(cosine * halfWidth * this.scale.x) +
      Math.abs(sine * halfHeight * this.scale.y);
    const extentY =
      Math.abs(sine * halfWidth * this.scale.x) +
      Math.abs(cosine * halfHeight * this.scale.y);
    return (
      point.x + extentX > 0 &&
      point.x - extentX < camera.width &&
      point.y + extentY > 0 &&
      point.y - extentY < camera.height
    );
  }

  override createRenderHandle(): FlxBackdropRenderHandle {
    return this.trackRenderHandle((onDestroy) => {
      return new FlxBackdropRenderHandle(this, onDestroy);
    });
  }
}
