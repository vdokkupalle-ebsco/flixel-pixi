import { Container, Sprite, Texture } from 'pixi.js';

import type { FlxCamera } from '../core/flx-camera';
import type { FlxButton } from '../objects/flx-button';
import type { FlxRenderHandle } from './flx-render-handle';
import { FlxTextRenderHandle } from './flx-text-render-handle';
import {
  interpolateObjectAngle,
  interpolateObjectX,
  interpolateObjectY,
} from './flx-render-interpolation';

/** Composite Pixi view for a button background and its optional label. @public */
export class FlxButtonRenderHandle implements FlxRenderHandle {
  readonly view = new Container({ label: 'FlxButton' });
  readonly sprite = new Sprite({ texture: Texture.EMPTY });

  readonly #owner: FlxButton;
  readonly #onDestroy: () => void;
  #labelHandle: FlxTextRenderHandle | null = null;
  #destroyed = false;

  constructor(owner: FlxButton, onDestroy: () => void = () => undefined) {
    this.#owner = owner;
    this.#onDestroy = onDestroy;
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
    this.sprite.scale.set(owner.renderFlipped ? -1 : 1, 1);
    this.sprite.position.set(owner.renderFlipped ? owner.frameWidth : 0, 0);

    const label = owner.label;
    if (label === null) {
      this.#labelHandle?.destroy();
      this.#labelHandle = null;
    } else {
      if (this.#labelHandle === null || this.#labelHandle.destroyed) {
        this.#labelHandle = new FlxTextRenderHandle(label);
        this.view.addChild(this.#labelHandle.view);
      }
      this.#labelHandle.sync(undefined, interpolationAlpha);
      this.#labelHandle.view.position.set(label.x - owner.x, label.y - owner.y);
    }

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
    this.#labelHandle?.destroy();
    this.#labelHandle = null;
    this.view.destroy({ children: true });
    this.#onDestroy();
  }
}
