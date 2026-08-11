import { Container, Sprite, Texture } from 'pixi.js';

import type { FlxCamera } from '../core/flx-camera';
import type { FlxSprite } from '../objects/flx-sprite';
import { FlxFilterChain } from './flx-filter-chain';
import type { FlxRenderHandle } from './flx-render-handle';
import {
  interpolateObjectAngle,
  interpolateObjectX,
  interpolateObjectY,
} from './flx-render-interpolation';

/** Pixi container/sprite pair synchronized from one `FlxSprite`. @public */
export class FlxSpriteRenderHandle implements FlxRenderHandle {
  readonly view: Container;
  readonly sprite: Sprite;

  readonly #owner: FlxSprite;
  readonly #onDestroy: () => void;
  #destroyed = false;
  readonly #filterChain = new FlxFilterChain();

  constructor(owner: FlxSprite, onDestroy: () => void = () => undefined) {
    this.#owner = owner;
    this.#onDestroy = onDestroy;
    this.view = new Container({ label: 'FlxSprite' });
    this.sprite = new Sprite({ texture: Texture.EMPTY });
    this.view.addChild(this.sprite);
    this.sync();
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  sync(camera?: FlxCamera, interpolationAlpha = 1): void {
    void camera;
    if (this.#destroyed) return;
    const owner = this.#owner;
    this.sprite.texture = owner.renderTexture;
    this.sprite.roundPixels = !owner.antialiasing;
    this.sprite.scale.set(
      owner.renderFlipped ? -1 : 1,
      owner.renderFlippedY ? -1 : 1,
    );
    this.sprite.position.set(
      owner.renderFlipped ? owner.frameWidth : 0,
      owner.renderFlippedY ? owner.frameHeight : 0,
    );

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
    this.#filterChain.sync(this.view, owner.filters, owner.filterArea);
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#filterChain.destroy(this.view);
    this.view.destroy({ children: true });
    this.#onDestroy();
  }
}
