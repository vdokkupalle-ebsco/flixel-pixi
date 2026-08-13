import { Container, Graphics, Sprite, Texture } from 'pixi.js';

import type { FlxCamera } from '../core/flx-camera';
import { FlxBar } from '../objects/flx-bar';
import { destroyRenderView } from './destroy-render-view';
import type { FlxRenderHandle } from './flx-render-handle';
import {
  interpolateObjectAngle,
  interpolateObjectX,
  interpolateObjectY,
} from './flx-render-interpolation';

function applyColor(sprite: Sprite, rgba: number): void {
  sprite.tint = (rgba >>> 8) & 0xffffff;
  sprite.alpha = (rgba & 0xff) / 255;
}

/** Pixi projection for a texture-free {@link FlxBar}. @public */
export class FlxBarRenderHandle implements FlxRenderHandle {
  readonly view = new Container({ label: 'FlxBar' });
  readonly background = new Sprite(Texture.WHITE);
  readonly fill = new Sprite(Texture.WHITE);
  readonly secondaryFill = new Sprite(Texture.WHITE);
  readonly border = new Graphics({ label: 'FlxBarBorder' });

  readonly #owner: FlxBar;
  readonly #onDestroy: () => void;
  #borderSignature = '';
  #destroyed = false;

  constructor(owner: FlxBar, onDestroy: () => void = () => undefined) {
    this.#owner = owner;
    this.#onDestroy = onDestroy;
    this.view.addChild(
      this.background,
      this.fill,
      this.secondaryFill,
      this.border,
    );
    this.sync();
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  sync(camera?: FlxCamera, interpolationAlpha = 1): void {
    void camera;
    if (this.#destroyed) return;
    const owner = this.#owner;
    this.background.position.set(0, 0);
    this.background.width = owner.width;
    this.background.height = owner.height;
    applyColor(this.background, owner.emptyColor);
    applyColor(this.fill, owner.fillColor);
    applyColor(this.secondaryFill, owner.fillColor);
    this.#syncFill(owner.fraction);
    this.#syncBorder();

    this.view.position.set(
      interpolateObjectX(owner, interpolationAlpha) - owner.offset.x,
      interpolateObjectY(owner, interpolationAlpha) - owner.offset.y,
    );
    this.view.origin.set(owner.origin.x, owner.origin.y);
    this.view.scale.set(owner.scale.x, owner.scale.y);
    this.view.angle = interpolateObjectAngle(owner, interpolationAlpha);
    this.view.alpha = owner.alpha;
    this.view.tint = owner.color;
    this.view.blendMode = owner.blend ?? 'normal';
    this.view.visible = owner.exists && owner.visible && owner.alpha > 0;
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    destroyRenderView(this.view);
    this.#onDestroy();
  }

  #syncFill(fraction: number): void {
    const width = this.#owner.width;
    const height = this.#owner.height;
    const primary = this.fill;
    const secondary = this.secondaryFill;
    secondary.visible = false;
    primary.visible = fraction > 0;
    primary.position.set(0, 0);

    switch (this.#owner.direction) {
      case FlxBar.RIGHT_TO_LEFT:
        primary.width = width * fraction;
        primary.height = height;
        primary.x = width - primary.width;
        break;
      case FlxBar.TOP_TO_BOTTOM:
        primary.width = width;
        primary.height = height * fraction;
        break;
      case FlxBar.BOTTOM_TO_TOP:
        primary.width = width;
        primary.height = height * fraction;
        primary.y = height - primary.height;
        break;
      case FlxBar.HORIZONTAL_INSIDE_OUT:
        primary.width = width * fraction;
        primary.height = height;
        primary.x = (width - primary.width) * 0.5;
        break;
      case FlxBar.HORIZONTAL_OUTSIDE_IN: {
        const sideWidth = width * fraction * 0.5;
        primary.width = sideWidth;
        primary.height = height;
        secondary.visible = fraction > 0;
        secondary.position.set(width - sideWidth, 0);
        secondary.width = sideWidth;
        secondary.height = height;
        break;
      }
      case FlxBar.VERTICAL_INSIDE_OUT:
        primary.width = width;
        primary.height = height * fraction;
        primary.y = (height - primary.height) * 0.5;
        break;
      case FlxBar.VERTICAL_OUTSIDE_IN: {
        const sideHeight = height * fraction * 0.5;
        primary.width = width;
        primary.height = sideHeight;
        secondary.visible = fraction > 0;
        secondary.position.set(0, height - sideHeight);
        secondary.width = width;
        secondary.height = sideHeight;
        break;
      }
      default:
        primary.width = width * fraction;
        primary.height = height;
        break;
    }
  }

  #syncBorder(): void {
    const owner = this.#owner;
    const signature = `${owner.width}:${owner.height}:${owner.showBorder}:${owner.borderColor}`;
    if (signature === this.#borderSignature) return;
    this.#borderSignature = signature;
    this.border.clear();
    if (!owner.showBorder) return;
    this.border
      .rect(
        0.5,
        0.5,
        Math.max(0, owner.width - 1),
        Math.max(0, owner.height - 1),
      )
      .stroke({
        alpha: (owner.borderColor & 0xff) / 255,
        color: (owner.borderColor >>> 8) & 0xffffff,
        pixelLine: true,
        width: 1,
      });
  }
}
