import { Container, NineSliceSprite, Texture } from 'pixi.js';

import type { FlxCamera } from '../core/flx-camera';
import type { FlxNineSliceButton } from '../objects/flx-nine-slice-button';
import { syncPixiNineSliceSprite } from '../objects/flx-nine-slice';
import { FlxTextRenderHandle } from './flx-text-render-handle';
import type { FlxRenderHandle } from './flx-render-handle';
import {
  interpolateObjectAngle,
  interpolateObjectX,
  interpolateObjectY,
} from './flx-render-interpolation';

/** Composite Pixi view for a 9-slice button background and optional label. @public */
export class FlxNineSliceButtonRenderHandle implements FlxRenderHandle {
  readonly view = new Container({ label: 'FlxNineSliceButton' });
  readonly slice = new NineSliceSprite({ texture: Texture.EMPTY });

  readonly #owner: FlxNineSliceButton;
  readonly #onDestroy: () => void;
  #labelHandle: FlxTextRenderHandle | null = null;
  #destroyed = false;

  constructor(owner: FlxNineSliceButton, onDestroy: () => void = () => undefined) {
    this.#owner = owner;
    this.#onDestroy = onDestroy;
    this.view.addChild(this.slice);
    this.sync();
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  sync(camera?: FlxCamera, interpolationAlpha = 1): void {
    void camera;
    if (this.#destroyed) return;
    const owner = this.#owner;
    syncPixiNineSliceSprite(this.slice, owner);

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
