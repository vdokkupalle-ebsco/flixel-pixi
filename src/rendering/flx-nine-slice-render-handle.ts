import { Container, NineSliceSprite, Texture } from 'pixi.js';

import type { FlxCamera } from '../core/flx-camera';
import type { FlxNineSliceSprite } from '../objects/flx-nine-slice-sprite';
import { syncPixiNineSliceSprite } from '../objects/flx-nine-slice';
import type { FlxRenderHandle } from './flx-render-handle';
import {
  interpolateObjectAngle,
  interpolateObjectX,
  interpolateObjectY,
} from './flx-render-interpolation';

/** Pixi 9-slice projection for one {@link FlxNineSliceSprite}. @public */
export class FlxNineSliceRenderHandle implements FlxRenderHandle {
  readonly view = new Container({ label: 'FlxNineSliceSprite' });
  readonly slice = new NineSliceSprite({ texture: Texture.EMPTY });

  readonly #owner: FlxNineSliceSprite;
  readonly #onDestroy: () => void;
  #destroyed = false;

  constructor(
    owner: FlxNineSliceSprite,
    onDestroy: () => void = () => undefined,
  ) {
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
    this.view.destroy({ children: true });
    this.#onDestroy();
  }
}
