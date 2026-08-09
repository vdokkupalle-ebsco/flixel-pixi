import type { FlxCamera } from '../core/flx-camera';
import type { FlxBasic } from '../core/flx-basic';
import { FlxContainer } from '../core/flx-container';
import { FlxGroup, type FlxBasicConstructor } from '../core/flx-group';
import { FlxCallbackPoint } from '../math/flx-callback-point';
import { FlxPoint } from '../math/flx-point';
import type { FlxRenderHandle } from '../rendering/flx-render-handle';
import { FlxSpriteGroupRenderHandle } from '../rendering/flx-sprite-group-render-handle';
import type { FlxCameraLike } from './flx-object';
import { FlxSprite } from './flx-sprite';

/** Function applied to one direct sprite-group member. @public */
export type FlxSpriteTransform<T extends FlxSprite, V> = (
  sprite: T,
  value: V,
) => void;

const spriteContainerOwners = new WeakMap<
  FlxContainer,
  FlxSpriteGroup<FlxSprite>
>();

/**
 * A transformable sprite composite backed by a logical `FlxGroup`.
 *
 * Members use world-space `x`/`y` while owned. `add()` interprets an incoming
 * member position as local to the composite and translates it into world
 * space; `remove()` converts it back to local space. Collision expands to the
 * member AABBs rather than treating the composite as one rectangle.
 * @public
 */
export class FlxSpriteGroup<T extends FlxSprite = FlxSprite> extends FlxSprite {
  readonly group: FlxGroup<T>;
  directAlpha = false;

  #transformSuppressionDepth = 0;
  #destroyedGroup = false;

  constructor(x = 0, y = 0, maxSize = 0) {
    super(x, y);
    this.group = this.createGroup(maxSize);
    if (this.group instanceof FlxContainer) {
      spriteContainerOwners.set(
        this.group,
        this as unknown as FlxSpriteGroup<FlxSprite>,
      );
    }
    this.#installReactiveFields();
    this.origin = new FlxCallbackPoint(0, 0, () => this.#syncOrigins());
    this.scale = new FlxCallbackPoint(1, 1, () => this.#syncScales());
    this.scrollFactor = new FlxCallbackPoint(1, 1, () =>
      this.#syncScrollFactors(),
    );
  }

  protected createGroup(maxSize: number): FlxGroup<T> {
    return new FlxGroup<T>(maxSize);
  }

  get members(): (T | null)[] {
    return this.group.members;
  }

  get length(): number {
    return this.group.length;
  }

  get maxSize(): number {
    return this.group.maxSize;
  }

  set maxSize(value: number) {
    this.group.maxSize = value;
  }

  override get alpha(): number {
    return super.alpha;
  }

  override set alpha(value: number) {
    const bounded = Math.min(1, Math.max(0, value));
    const previous = super.alpha;
    if (this.group !== undefined && this.exists && previous !== bounded) {
      if (this.directAlpha || previous === 0) {
        this.transformChildren((member, next) => {
          member.alpha = next;
        }, bounded);
      } else {
        const factor = bounded / previous;
        this.transformChildren((member, ratio) => {
          member.alpha *= ratio;
        }, factor);
      }
    }
    super.alpha = bounded;
  }

  override get color(): number {
    return super.color;
  }

  override set color(value: number) {
    const next = value & 0xffffff;
    if (this.group !== undefined && this.exists && super.color !== next) {
      this.transformChildren((member, color) => {
        member.color = color;
      }, next);
    }
    super.color = next;
  }

  override get solid(): boolean {
    return super.solid;
  }

  override set solid(value: boolean) {
    if (this.group !== undefined && this.exists && super.solid !== value) {
      this.transformChildren((member, next) => {
        member.solid = next;
      }, value);
    }
    super.solid = value;
  }

  add(sprite: T): T {
    this.#assertNoCycle(sprite);
    if (this.group.members.includes(sprite)) return sprite;
    const hasSlot = this.group.members.some((member) => member === null);
    if (
      !hasSlot &&
      this.maxSize > 0 &&
      this.group.members.length >= this.maxSize
    ) {
      return sprite;
    }

    const previousOwner =
      sprite.container === null
        ? undefined
        : spriteContainerOwners.get(sprite.container);
    if (previousOwner !== undefined && previousOwner !== this) {
      previousOwner.remove(sprite);
    }

    sprite.x += this.x;
    sprite.y += this.y;
    sprite.alpha *= this.alpha;
    sprite.scrollFactor.copyFrom(this.scrollFactor);
    sprite.cameras = this.cameras;
    sprite.origin.make(
      this.x + this.origin.x - sprite.x,
      this.y + this.origin.y - sprite.y,
    );
    return this.group.add(sprite);
  }

  remove(sprite: T, splice = false): T | null {
    const removed = this.group.remove(sprite, splice);
    if (removed === null) return null;
    removed.x -= this.x;
    removed.y -= this.y;
    removed.cameras = null;
    return removed;
  }

  replace(oldObject: T, newObject: T): T | null {
    if (!this.group.members.includes(oldObject)) return null;
    if (oldObject === newObject) return newObject;
    if (oldObject !== newObject && this.group.members.includes(newObject)) {
      return null;
    }
    this.#assertNoCycle(newObject);
    const previousOwner =
      newObject.container === null
        ? undefined
        : spriteContainerOwners.get(newObject.container);
    if (previousOwner !== undefined && previousOwner !== this) {
      previousOwner.remove(newObject);
    }
    newObject.x += this.x;
    newObject.y += this.y;
    newObject.alpha *= this.alpha;
    newObject.scrollFactor.copyFrom(this.scrollFactor);
    newObject.cameras = this.cameras;
    this.#setMemberOrigin(newObject);
    return this.group.replace(oldObject, newObject);
  }

  recycle(objectClass?: FlxBasicConstructor<T>): T | null {
    if (this.maxSize > 0 && this.length >= this.maxSize) {
      return this.group.recycle(objectClass);
    }
    const available = this.group.getFirstAvailable(objectClass);
    if (available !== null) return available;
    return objectClass === undefined ? null : this.add(new objectClass());
  }

  clear(): void {
    this.group.clear();
  }

  contains(sprite: FlxSprite, recurse = false): boolean {
    for (const member of this.members.slice(0, this.length)) {
      if (member === sprite) return true;
      if (
        recurse &&
        member instanceof FlxSpriteGroup &&
        member.contains(sprite, true)
      ) {
        return true;
      }
    }
    return false;
  }

  setAll(variableName: string, value: unknown, recurse = true): void {
    this.group.setAll(variableName, value, recurse);
  }

  callAll(functionName: string, recurse = true): void {
    this.group.callAll(functionName, recurse);
  }

  getFirstAvailable(objectClass?: FlxBasicConstructor<T>): T | null {
    return this.group.getFirstAvailable(objectClass);
  }

  getFirstNull(): number {
    return this.group.getFirstNull();
  }

  getFirstExtant(): T | null {
    return this.group.getFirstExtant();
  }

  getFirstAlive(): T | null {
    return this.group.getFirstAlive();
  }

  getFirstDead(): T | null {
    return this.group.getFirstDead();
  }

  countLiving(): number {
    return this.group.countLiving();
  }

  countDead(): number {
    return this.group.countDead();
  }

  getRandom(startIndex = 0, length = 0): T | null {
    return this.group.getRandom(startIndex, length);
  }

  sort(index = 'y', order = FlxGroup.ASCENDING): void {
    this.group.sort(index, order);
  }

  /** Applies one property transform to every direct member in stable order. */
  transformChildren<V>(transform: FlxSpriteTransform<T, V>, value: V): void {
    if (this.#transformSuppressionDepth > 0 || this.group === undefined) return;
    for (const sprite of this.members.slice(0, this.length)) {
      if (sprite !== null) transform(sprite, value);
    }
  }

  /** Applies several transforms to every existing direct member. */
  multiTransformChildren<V>(
    transforms: readonly FlxSpriteTransform<T, V>[],
    values: readonly V[],
  ): void {
    if (transforms.length > values.length) {
      throw new RangeError('Each child transform requires a value.');
    }
    if (this.#transformSuppressionDepth > 0 || this.group === undefined) return;
    for (const sprite of this.members.slice(0, this.length)) {
      if (sprite === null || !sprite.exists) continue;
      for (let index = 0; index < transforms.length; index += 1) {
        transforms[index]?.(sprite, values[index] as V);
      }
    }
  }

  /** Returns a member position relative to this composite's translation. */
  getMemberLocalPosition(member: T, out: FlxPoint = new FlxPoint()): FlxPoint {
    this.#assertMember(member);
    return out.make(member.x - this.x, member.y - this.y);
  }

  /** Converts a translation-local point into authoritative world space. */
  getWorldPosition(local: Readonly<FlxPoint>, out = new FlxPoint()): FlxPoint {
    return out.make(this.x + local.x, this.y + local.y);
  }

  /** Moves an owned member using translation-local coordinates. */
  setMemberLocalPosition(member: T, x: number, y: number): T {
    this.#assertMember(member);
    member.x = this.x + x;
    member.y = this.y + y;
    this.#setMemberOrigin(member);
    return member;
  }

  findMinX(): number {
    if (this.length === 0) return this.x;
    let value = Number.POSITIVE_INFINITY;
    for (const member of this.members.slice(0, this.length)) {
      if (member !== null) {
        value = Math.min(
          value,
          member instanceof FlxSpriteGroup ? member.findMinX() : member.x,
        );
      }
    }
    return Number.isFinite(value) ? value : this.x;
  }

  findMaxX(): number {
    if (this.length === 0) return this.x;
    let value = Number.NEGATIVE_INFINITY;
    for (const member of this.members.slice(0, this.length)) {
      if (member !== null) {
        value = Math.max(
          value,
          member instanceof FlxSpriteGroup
            ? member.findMaxX()
            : member.x + member.width,
        );
      }
    }
    return Number.isFinite(value) ? value : this.x;
  }

  findMinY(): number {
    if (this.length === 0) return this.y;
    let value = Number.POSITIVE_INFINITY;
    for (const member of this.members.slice(0, this.length)) {
      if (member !== null) {
        value = Math.min(
          value,
          member instanceof FlxSpriteGroup ? member.findMinY() : member.y,
        );
      }
    }
    return Number.isFinite(value) ? value : this.y;
  }

  findMaxY(): number {
    if (this.length === 0) return this.y;
    let value = Number.NEGATIVE_INFINITY;
    for (const member of this.members.slice(0, this.length)) {
      if (member !== null) {
        value = Math.max(
          value,
          member instanceof FlxSpriteGroup
            ? member.findMaxY()
            : member.y + member.height,
        );
      }
    }
    return Number.isFinite(value) ? value : this.y;
  }

  override overlaps(objectOrGroup: FlxBasic): boolean {
    return this.members
      .slice(0, this.length)
      .some((member) => member?.exists && member.overlaps(objectOrGroup));
  }

  override overlapsAt(x: number, y: number, objectOrGroup: FlxBasic): boolean {
    const deltaX = x - this.x;
    const deltaY = y - this.y;
    return this.members.slice(0, this.length).some((member) => {
      return (
        member?.exists === true &&
        member.overlapsAt(member.x + deltaX, member.y + deltaY, objectOrGroup)
      );
    });
  }

  override overlapsPoint(point: Readonly<FlxPoint>): boolean {
    return this.members
      .slice(0, this.length)
      .some(
        (member) =>
          member?.exists && member.visible && member.overlapsPoint(point),
      );
  }

  override onScreen(camera?: FlxCameraLike): boolean {
    return this.members
      .slice(0, this.length)
      .some(
        (member) => member?.exists && member.visible && member.onScreen(camera),
      );
  }

  override update(): void {
    this.group.update();
  }

  override draw(): void {
    this.group.draw();
  }

  override kill(): void {
    this.#transformSuppressionDepth += 1;
    try {
      super.kill();
    } finally {
      this.#transformSuppressionDepth -= 1;
    }
    this.group.kill();
  }

  override revive(): void {
    this.#transformSuppressionDepth += 1;
    try {
      super.revive();
    } finally {
      this.#transformSuppressionDepth -= 1;
    }
    for (const member of this.members.slice(0, this.length)) {
      if (member !== null && !member.exists) member.revive();
    }
    this.group.revive();
  }

  override reset(x: number, y: number): void {
    const deltaX = x - this.x;
    const deltaY = y - this.y;
    for (const member of this.members.slice(0, this.length)) {
      if (member !== null) member.reset(member.x + deltaX, member.y + deltaY);
    }
    this.#transformSuppressionDepth += 1;
    try {
      super.reset(x, y);
    } finally {
      this.#transformSuppressionDepth -= 1;
    }
  }

  override createRenderHandle(): FlxRenderHandle {
    return this.trackRenderHandle((onDestroy) => {
      return new FlxSpriteGroupRenderHandle(this, onDestroy);
    });
  }

  override destroy(): void {
    if (this.#destroyedGroup) return;
    this.#destroyedGroup = true;
    this.group.destroy();
    super.destroy();
  }

  #syncOrigins(): void {
    this.transformChildren(
      (member) => this.#setMemberOrigin(member),
      undefined,
    );
  }

  #syncScales(): void {
    this.transformChildren(
      (member, scale) => member.scale.copyFrom(scale),
      this.scale,
    );
  }

  #syncScrollFactors(): void {
    this.transformChildren(
      (member, scrollFactor) => member.scrollFactor.copyFrom(scrollFactor),
      this.scrollFactor,
    );
  }

  #setMemberOrigin(member: T): void {
    member.origin.make(
      this.x + this.origin.x - member.x,
      this.y + this.origin.y - member.y,
    );
  }

  #installReactiveFields(): void {
    let x = this.x;
    let y = this.y;
    let angle = this.angle;
    let exists = this.exists;
    let active = this.active;
    let visible = this.visible;
    let alive = this.alive;
    let cameras = this.cameras;
    let immovable = this.immovable;

    Object.defineProperties(this, {
      x: {
        configurable: true,
        enumerable: true,
        get: () => x,
        set: (value: number) => {
          if (this.exists && x !== value) {
            this.transformChildren((member, delta) => {
              member.x += delta;
            }, value - x);
          }
          x = value;
        },
      },
      y: {
        configurable: true,
        enumerable: true,
        get: () => y,
        set: (value: number) => {
          if (this.exists && y !== value) {
            this.transformChildren((member, delta) => {
              member.y += delta;
            }, value - y);
          }
          y = value;
        },
      },
      angle: {
        configurable: true,
        enumerable: true,
        get: () => angle,
        set: (value: number) => {
          if (this.exists && angle !== value) {
            this.transformChildren((member, delta) => {
              member.angle += delta;
            }, value - angle);
          }
          angle = value;
        },
      },
      exists: {
        configurable: true,
        enumerable: true,
        get: () => exists,
        set: (value: boolean) => {
          if (exists !== value) {
            this.transformChildren((member, next) => {
              member.exists = next;
            }, value);
          }
          exists = value;
        },
      },
      active: {
        configurable: true,
        enumerable: true,
        get: () => active,
        set: (value: boolean) => {
          if (this.exists && active !== value) {
            this.transformChildren((member, next) => {
              member.active = next;
            }, value);
          }
          active = value;
        },
      },
      visible: {
        configurable: true,
        enumerable: true,
        get: () => visible,
        set: (value: boolean) => {
          if (this.exists && visible !== value) {
            this.transformChildren((member, next) => {
              member.visible = next;
            }, value);
          }
          visible = value;
        },
      },
      alive: {
        configurable: true,
        enumerable: true,
        get: () => alive,
        set: (value: boolean) => {
          if (alive !== value) {
            this.transformChildren((member, next) => {
              member.alive = next;
            }, value);
          }
          alive = value;
        },
      },
      cameras: {
        configurable: true,
        enumerable: true,
        get: () => cameras,
        set: (value: readonly FlxCamera[] | null) => {
          if (cameras !== value) {
            this.transformChildren((member, next) => {
              member.cameras = next;
            }, value);
          }
          cameras = value;
        },
      },
      immovable: {
        configurable: true,
        enumerable: true,
        get: () => immovable,
        set: (value: boolean) => {
          if (this.exists && immovable !== value) {
            this.transformChildren((member, next) => {
              member.immovable = next;
            }, value);
          }
          immovable = value;
        },
      },
      width: {
        configurable: true,
        enumerable: true,
        get: () => (this.length === 0 ? 0 : this.findMaxX() - this.findMinX()),
        set: () => undefined,
      },
      height: {
        configurable: true,
        enumerable: true,
        get: () => (this.length === 0 ? 0 : this.findMaxY() - this.findMinY()),
        set: () => undefined,
      },
    });
  }

  #assertMember(member: T): void {
    if (!this.group.members.includes(member)) {
      throw new Error('Sprite is not a member of this FlxSpriteGroup.');
    }
  }

  #assertNoCycle(sprite: T): void {
    if (
      (sprite as FlxSprite) === this ||
      (sprite instanceof FlxSpriteGroup && sprite.contains(this, true))
    ) {
      throw new Error('FlxSpriteGroup membership cannot contain a cycle.');
    }
  }
}

/** Sprite composite whose backing group enforces exclusive ownership. @public */
export class FlxSpriteContainer<
  T extends FlxSprite = FlxSprite,
> extends FlxSpriteGroup<T> {
  protected override createGroup(maxSize: number): FlxContainer<T> {
    return new FlxContainer<T>(maxSize);
  }
}
