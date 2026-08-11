import { BitmapText, Container, Text, TextStyle } from 'pixi.js';

import type { FlxCamera } from '../core/flx-camera';
import type { FlxText } from '../objects/flx-text';
import type { FlxRenderHandle } from './flx-render-handle';
import {
  interpolateObjectAngle,
  interpolateObjectX,
  interpolateObjectY,
} from './flx-render-interpolation';

/** Pixi leaf used by a `FlxTextRenderHandle`. @public */
export type FlxPixiTextNode = BitmapText | Text;

/** Pixi text leaf wrapped by a transform-owning container. @public */
export class FlxTextRenderHandle implements FlxRenderHandle {
  readonly view: Container;
  readonly textNode: FlxPixiTextNode;

  readonly #owner: FlxText;
  readonly #onDestroy: () => void;
  #styleVersion = -1;
  #destroyed = false;

  constructor(owner: FlxText, onDestroy: () => void = () => undefined) {
    this.#owner = owner;
    this.#onDestroy = onDestroy;
    this.view = new Container({ label: 'FlxText' });
    const options = { text: owner.text, style: owner.textStyle };
    this.textNode =
      owner.renderMode === 'bitmap'
        ? new BitmapText(options)
        : new Text({
            ...options,
            textureStyle: {
              scaleMode: owner.antialiasing ? 'linear' : 'nearest',
            },
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

    const canMeasure = typeof CanvasRenderingContext2D !== 'undefined';
    const measuredHeight = canMeasure
      ? this.textNode.height
      : Math.max(1, owner.text.split('\n').length * owner.size * 1.2 + 4);
    const measuredWidth = canMeasure
      ? this.textNode.width
      : Math.min(
          owner.width,
          Math.max(...owner.text.split('\n').map((line) => line.length), 0) *
            owner.size *
            0.6,
        );
    owner.updateTextBounds(measuredHeight);
    const horizontalOffset =
      owner.alignment === 'center'
        ? (owner.width - measuredWidth) * 0.5
        : owner.alignment === 'right'
          ? owner.width - measuredWidth
          : 0;
    this.textNode.position.set(horizontalOffset, 0);
    this.textNode.roundPixels = !owner.antialiasing;

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
    this.view.visible = this.view.visible && owner.isCanvasTextVisible();
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.view.destroy({ children: true });
    this.#onDestroy();
  }
}
