import { Container } from 'pixi.js';

import type { FlxCamera } from '../core/flx-camera';
import type { FlxSprite } from '../objects/flx-sprite';
import type { FlxSpriteGroup } from '../objects/flx-sprite-group';
import type { FlxRenderHandle } from './flx-render-handle';

/** Adapter-owned Pixi container branch for one logical sprite composite. @public */
export class FlxSpriteGroupRenderHandle implements FlxRenderHandle {
  readonly view = new Container({ label: 'FlxSpriteGroup' });

  readonly #owner: FlxSpriteGroup;
  readonly #onDestroy: () => void;
  readonly #members = new Map<FlxSprite, FlxRenderHandle>();
  #destroyed = false;

  constructor(owner: FlxSpriteGroup, onDestroy: () => void = () => undefined) {
    this.#owner = owner;
    this.#onDestroy = onDestroy;
    this.sync();
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  /** Number of direct member branches currently owned by this handle. */
  get memberHandleCount(): number {
    return this.#members.size;
  }

  sync(camera?: FlxCamera): void {
    if (this.#destroyed) return;
    const desired = this.#owner.members
      .slice(0, this.#owner.length)
      .filter((member): member is FlxSprite => member !== null);
    const desiredSet = new Set(desired);

    for (const [member, handle] of this.#members) {
      if (desiredSet.has(member)) continue;
      this.#members.delete(member);
      handle.destroy();
    }

    for (const member of desired) {
      let handle = this.#members.get(member);
      if (handle === undefined || handle.destroyed) {
        handle = member.createRenderHandle();
        this.#members.set(member, handle);
        this.view.addChild(handle.view);
      }
      handle.sync(camera);
      handle.view.position.set(
        member.x - this.#owner.x - member.offset.x,
        member.y - this.#owner.y - member.offset.y,
      );
      this.view.setChildIndex(handle.view, this.#membersOrder(member, desired));
    }

    this.view.position.set(this.#owner.x, this.#owner.y);
    this.view.scale.set(1, 1);
    this.view.angle = 0;
    this.view.alpha = 1;
    this.view.tint = 0xffffff;
    this.view.blendMode = 'normal';
    this.view.visible =
      this.#owner.exists && this.#owner.visible && this.#owner.alpha > 0;
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    for (const handle of this.#members.values()) handle.destroy();
    this.#members.clear();
    this.view.destroy();
    this.#onDestroy();
  }

  #membersOrder(member: FlxSprite, desired: readonly FlxSprite[]): number {
    return desired.indexOf(member);
  }
}
