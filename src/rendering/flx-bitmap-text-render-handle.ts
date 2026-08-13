import { BitmapText, Container, TextStyle } from 'pixi.js';

import type { FlxCamera } from '../core/flx-camera';
import type { FlxBitmapText } from '../objects/flx-bitmap-text';
import { destroyRenderView } from './destroy-render-view';
import type { FlxRenderHandle } from './flx-render-handle';
import {
  interpolateObjectAngle,
  interpolateObjectX,
  interpolateObjectY,
} from './flx-render-interpolation';

/** Pixi `BitmapText` projection for one {@link FlxBitmapText}. @public */
export class FlxBitmapTextRenderHandle implements FlxRenderHandle {
  readonly view: Container;
  readonly textNode: BitmapText;

  readonly #owner: FlxBitmapText;
  readonly #onDestroy: () => void;
  #styleVersion = -1;
  #destroyed = false;

  constructor(owner: FlxBitmapText, onDestroy: () => void = () => undefined) {
    this.#owner = owner;
    this.#onDestroy = onDestroy;
    this.view = new Container({ label: 'FlxBitmapText' });
    this.textNode = new BitmapText({
      text: owner.text,
      style: owner.textStyle,
    });
    this.view.addChild(this.textNode);
    this.sync();
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  sync(camera?: FlxCamera, interpolationAlpha = 1): void {
    void camera;
    if (this.#destroyed) return;
    const owner = this.#owner;
    if (this.textNode.text !== owner.text) this.textNode.text = owner.text;
    if (this.#styleVersion !== owner.textStyleVersion) {
      this.textNode.style = new TextStyle(owner.textStyle);
      this.#styleVersion = owner.textStyleVersion;
    }

    const measured = this.textNode;
    owner.updateTextBounds(measured.height);
    const horizontalOffset =
      owner.alignment === 'center'
        ? (owner.fieldWidth - measured.width) * 0.5
        : owner.alignment === 'right'
          ? owner.fieldWidth - measured.width
          : 0;
    this.textNode.position.set(Math.max(0, horizontalOffset), 0);
    this.textNode.roundPixels = !owner.antialiasing;
    this.textNode.tint = owner.color;

    this.view.position.set(
      interpolateObjectX(owner, interpolationAlpha) - owner.offset.x,
      interpolateObjectY(owner, interpolationAlpha) - owner.offset.y,
    );
    this.view.origin.set(owner.origin.x, owner.origin.y);
    this.view.scale.set(owner.scale.x, owner.scale.y);
    this.view.angle = interpolateObjectAngle(owner, interpolationAlpha);
    this.view.alpha = owner.alpha;
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
