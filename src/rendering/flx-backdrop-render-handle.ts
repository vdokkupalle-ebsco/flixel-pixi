import { Container, Texture, TilingSprite } from 'pixi.js';

import type { FlxCamera } from '../core/flx-camera';
import type { FlxBackdrop } from '../objects/flx-backdrop';
import { destroyRenderView } from './destroy-render-view';
import type { FlxRenderHandle } from './flx-render-handle';
import {
  interpolateObjectAngle,
  interpolateObjectX,
  interpolateObjectY,
} from './flx-render-interpolation';

/** Pixi tiling-sprite projection for one {@link FlxBackdrop}. @public */
export class FlxBackdropRenderHandle implements FlxRenderHandle {
  readonly view = new Container({ label: 'FlxBackdrop' });
  readonly tiling = new TilingSprite({ texture: Texture.EMPTY });

  readonly #owner: FlxBackdrop;
  readonly #onDestroy: () => void;
  #destroyed = false;

  constructor(owner: FlxBackdrop, onDestroy: () => void = () => undefined) {
    this.#owner = owner;
    this.#onDestroy = onDestroy;
    this.view.addChild(this.tiling);
    this.sync();
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  sync(camera?: FlxCamera, interpolationAlpha = 1): void {
    void camera;
    if (this.#destroyed) return;
    const owner = this.#owner;
    const texture = owner.tileTexture;
    if (this.tiling.texture !== texture) this.tiling.texture = texture;

    const tileX =
      owner.lastTilePosition.x +
      (owner.tilePosition.x - owner.lastTilePosition.x) * interpolationAlpha;
    const tileY =
      owner.lastTilePosition.y +
      (owner.tilePosition.y - owner.lastTilePosition.y) * interpolationAlpha;
    this.tiling.tilePosition.set(
      owner.repeatX ? tileX : 0,
      owner.repeatY ? tileY : 0,
    );
    this.tiling.tileScale.set(owner.tileScale.x, owner.tileScale.y);
    this.tiling.tileRotation = (owner.tileAngle * Math.PI) / 180;
    const tileWidth = texture.width * Math.abs(owner.tileScale.x);
    const tileHeight = texture.height * Math.abs(owner.tileScale.y);
    this.tiling.width = owner.repeatX
      ? owner.width
      : Math.min(owner.width, tileWidth);
    this.tiling.height = owner.repeatY
      ? owner.height
      : Math.min(owner.height, tileHeight);
    this.tiling.roundPixels = !owner.antialiasing;

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
}
