import { Container, Graphics } from 'pixi.js';

import type { FlxCamera } from '../core/flx-camera';
import type { FlxVirtualStick } from '../objects/flx-virtual-stick';
import {
  interpolateObjectAngle,
  interpolateObjectX,
  interpolateObjectY,
} from './flx-render-interpolation';
import type { FlxRenderHandle } from './flx-render-handle';

/** Pixi projection for a texture-free virtual analog stick. @public */
export class FlxVirtualStickRenderHandle implements FlxRenderHandle {
  readonly view = new Container({ label: 'FlxVirtualStick' });
  readonly base = new Graphics({ label: 'FlxVirtualStickBase' });
  readonly knob = new Graphics({ label: 'FlxVirtualStickKnob' });

  readonly #owner: FlxVirtualStick;
  readonly #onDestroy: () => void;
  #signature = '';
  #destroyed = false;

  constructor(owner: FlxVirtualStick, onDestroy: () => void = () => undefined) {
    this.#owner = owner;
    this.#onDestroy = onDestroy;
    this.view.addChild(this.base, this.knob);
    this.sync();
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  sync(camera?: FlxCamera, interpolationAlpha = 1): void {
    void camera;
    if (this.#destroyed) return;
    const owner = this.#owner;
    this.#syncGeometry();
    const travel = owner.radius - owner.knobRadius;
    this.knob.position.set(
      owner.radius + owner.rawX * travel,
      owner.radius + owner.rawY * travel,
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
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.view.destroy({ children: true });
    this.#onDestroy();
  }

  #syncGeometry(): void {
    const owner = this.#owner;
    const signature = [
      owner.radius,
      owner.knobRadius,
      owner.baseColor,
      owner.knobColor,
      owner.pressedKnobColor,
      owner.outlineColor,
      owner.pressed,
    ].join(':');
    if (signature === this.#signature) return;
    this.#signature = signature;
    this.base.clear();
    this.knob.clear();
    const base = splitColor(owner.baseColor);
    const outline = splitColor(owner.outlineColor);
    const knob = splitColor(
      owner.pressed ? owner.pressedKnobColor : owner.knobColor,
    );
    this.base
      .circle(owner.radius, owner.radius, owner.radius - 1)
      .fill(base)
      .stroke({ ...outline, width: 2 });
    this.knob
      .circle(0, 0, owner.knobRadius)
      .fill(knob)
      .stroke({ ...outline, width: 2 });
  }
}

function splitColor(color: number): { alpha: number; color: number } {
  return { alpha: (color & 0xff) / 255, color: (color >>> 8) & 0xffffff };
}
