import { Container, Graphics } from 'pixi.js';

import type { FlxCamera } from '../core/flx-camera';
import { FlxButton } from '../objects/flx-button';
import type { FlxVirtualButton } from '../objects/flx-virtual-button';
import { destroyRenderView } from './destroy-render-view';
import type { FlxRenderHandle } from './flx-render-handle';
import { FlxTextRenderHandle } from './flx-text-render-handle';
import {
  interpolateObjectAngle,
  interpolateObjectX,
  interpolateObjectY,
} from './flx-render-interpolation';

/** Texture-free Pixi projection for one {@link FlxVirtualButton}. @public */
export class FlxVirtualButtonRenderHandle implements FlxRenderHandle {
  readonly view = new Container({ label: 'FlxVirtualButton' });
  readonly background = new Graphics({ label: 'FlxVirtualButtonBackground' });

  readonly #owner: FlxVirtualButton;
  readonly #onDestroy: () => void;
  #labelHandle: FlxTextRenderHandle | null = null;
  #signature = '';
  #destroyed = false;

  constructor(
    owner: FlxVirtualButton,
    onDestroy: () => void = () => undefined,
  ) {
    this.#owner = owner;
    this.#onDestroy = onDestroy;
    this.view.addChild(this.background);
    this.sync();
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  sync(camera?: FlxCamera, interpolationAlpha = 1): void {
    void camera;
    if (this.#destroyed) return;
    const owner = this.#owner;
    this.#syncBackground();
    const label = owner.label;
    if (label !== null) {
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
    destroyRenderView(this.view);
    this.#onDestroy();
  }

  #syncBackground(): void {
    const owner = this.#owner;
    const color =
      owner.status === FlxButton.DISABLED
        ? owner.disabledColor
        : owner.status === FlxButton.PRESSED
          ? owner.pressedColor
          : owner.status === FlxButton.HIGHLIGHT
            ? owner.highlightColor
            : owner.normalColor;
    const signature = `${owner.width}:${owner.height}:${color}`;
    if (signature === this.#signature) return;
    this.#signature = signature;
    this.background.clear();
    const radius = Math.min(owner.width, owner.height) * 0.5;
    this.background
      .circle(owner.width * 0.5, owner.height * 0.5, radius - 1)
      .fill({ alpha: (color & 0xff) / 255, color: (color >>> 8) & 0xffffff })
      .stroke({ alpha: 0.8, color: 0xffffff, width: 2 });
  }
}
