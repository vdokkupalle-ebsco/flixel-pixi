import { Container, Sprite, Texture } from 'pixi.js';

import type { FlxSprite } from '../objects/flx-sprite';
import type { FlxRenderHandle } from './flx-render-handle';

/** Pixi container/sprite pair synchronized from one `FlxSprite`. @public */
export class FlxSpriteRenderHandle implements FlxRenderHandle {
  readonly view: Container;
  readonly sprite: Sprite;

  readonly #owner: FlxSprite;
  readonly #onDestroy: () => void;
  #destroyed = false;

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

  sync(): void {
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

    this.view.position.set(owner.x - owner.offset.x, owner.y - owner.offset.y);
    this.view.origin.set(owner.origin.x, owner.origin.y);
    this.view.scale.set(owner.scale.x, owner.scale.y);
    this.view.angle = owner.angle;
    this.view.alpha = owner.alpha;
    this.view.tint = owner.color;
    this.view.blendMode = owner.blend ?? 'normal';
    this.view.visible = owner.exists && owner.visible && owner.alpha > 0;
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.view.destroy({ children: true });
    this.#onDestroy();
  }
}
