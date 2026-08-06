import { FlxG } from './flx-g';
import { FlxBasic } from './flx-basic';

/** Constructor accepted by {@link FlxGroup.recycle}. @public */
export type FlxBasicConstructor<T extends FlxBasic = FlxBasic> = new () => T;

/** Mutation-safe collection that owns member lifecycle traversal. @public */
export class FlxGroup<T extends FlxBasic = FlxBasic> extends FlxBasic {
  static readonly ASCENDING = -1;
  static readonly DESCENDING = 1;

  members: (T | null)[] = [];
  length = 0;

  #destroyed = false;
  #marker = 0;
  #maxSize: number;

  constructor(maxSize = 0) {
    super();
    if (!Number.isInteger(maxSize) || maxSize < 0) {
      throw new RangeError('maxSize must be a non-negative integer.');
    }
    this.#maxSize = maxSize;
  }

  override destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;

    for (const member of this.members) member?.destroy();
    this.members.length = 0;
    this.length = 0;
    this.#marker = 0;
    super.destroy();
  }

  /** Groups do not count themselves as active gameplay objects. */
  override preUpdate(): void {
    // Groups traverse members but do not count themselves as active objects.
  }

  /**
   * Traverses a stable snapshot. Additions wait until the next traversal;
   * members removed before their turn are skipped.
   */
  override update(): void {
    const snapshot = this.members.slice(0, this.length);
    for (const member of snapshot) {
      if (
        member !== null &&
        this.members.includes(member) &&
        member.exists &&
        member.active
      ) {
        member.preUpdate();
        member.update();
        member.postUpdate();
      }
    }
  }

  override draw(): void {
    const snapshot = this.members.slice(0, this.length);
    for (const member of snapshot) {
      if (
        member !== null &&
        this.members.includes(member) &&
        member.exists &&
        member.visible
      ) {
        member.draw();
      }
    }
  }

  get maxSize(): number {
    return this.#maxSize;
  }

  set maxSize(size: number) {
    if (!Number.isInteger(size) || size < 0) {
      throw new RangeError('maxSize must be a non-negative integer.');
    }

    this.#maxSize = size;
    if (size === 0 || size >= this.members.length) return;

    for (let index = size; index < this.members.length; index += 1) {
      this.members[index]?.destroy();
    }
    this.members.length = size;
    this.length = size;
    if (this.#marker >= size) this.#marker = 0;
  }

  add(object: T): T {
    if (this.members.includes(object)) return object;

    for (let index = 0; index < this.members.length; index += 1) {
      if (this.members[index] === null) {
        this.members[index] = object;
        this.length = Math.max(this.length, index + 1);
        return object;
      }
    }

    if (this.#maxSize > 0 && this.members.length >= this.#maxSize)
      return object;

    const oldCapacity = this.members.length;
    const doubledCapacity = oldCapacity === 0 ? 1 : oldCapacity * 2;
    const newCapacity =
      this.#maxSize > 0
        ? Math.min(doubledCapacity, this.#maxSize)
        : doubledCapacity;
    this.members.length = newCapacity;
    this.members.fill(null, oldCapacity);
    this.members[oldCapacity] = object;
    this.length = oldCapacity + 1;
    return object;
  }

  recycle(objectClass?: FlxBasicConstructor<T>): T | null {
    if (this.#maxSize > 0) {
      if (this.length < this.#maxSize) {
        return objectClass === undefined ? null : this.add(new objectClass());
      }

      const member = this.members[this.#marker] ?? null;
      this.#marker = (this.#marker + 1) % this.#maxSize;
      return member;
    }

    const available = this.getFirstAvailable(objectClass);
    if (available !== null) return available;
    return objectClass === undefined ? null : this.add(new objectClass());
  }

  remove(object: T, splice = false): T | null {
    const index = this.members.indexOf(object);
    if (index < 0) return null;

    if (splice) {
      this.members.splice(index, 1);
      this.length = Math.max(0, this.length - 1);
    } else {
      this.members[index] = null;
    }
    return object;
  }

  replace(oldObject: T, newObject: T): T | null {
    const index = this.members.indexOf(oldObject);
    if (index < 0) return null;
    this.members[index] = newObject;
    return newObject;
  }

  sort(index = 'y', order = FlxGroup.ASCENDING): void {
    this.members.sort((first, second) => {
      if (first === null) return second === null ? 0 : 1;
      if (second === null) return -1;
      const firstValue = Reflect.get(first, index) as unknown;
      const secondValue = Reflect.get(second, index) as unknown;
      if (firstValue === secondValue) return 0;
      return (firstValue as number) < (secondValue as number) ? order : -order;
    });
  }

  setAll(variableName: string, value: unknown, recurse = true): void {
    for (const member of this.members.slice(0, this.length)) {
      if (member === null) continue;
      if (recurse && member instanceof FlxGroup) {
        member.setAll(variableName, value, true);
      } else {
        Reflect.set(member, variableName, value);
      }
    }
  }

  callAll(functionName: string, recurse = true): void {
    const normalizedName = functionName.replace(/\(\)$/, '');
    for (const member of this.members.slice(0, this.length)) {
      if (member === null) continue;
      if (recurse && member instanceof FlxGroup) {
        member.callAll(normalizedName, true);
      } else {
        const method = Reflect.get(member, normalizedName) as unknown;
        if (typeof method !== 'function') {
          throw new TypeError(`${normalizedName} is not a member function.`);
        }
        Reflect.apply(method, member, []);
      }
    }
  }

  getFirstAvailable(objectClass?: FlxBasicConstructor<T>): T | null {
    for (const member of this.members.slice(0, this.length)) {
      if (
        member !== null &&
        !member.exists &&
        (objectClass === undefined || member instanceof objectClass)
      ) {
        return member;
      }
    }
    return null;
  }

  getFirstNull(): number {
    return this.members.findIndex((member) => member === null);
  }

  getFirstExtant(): T | null {
    return (
      this.members.find((member): member is T => member?.exists === true) ??
      null
    );
  }

  getFirstAlive(): T | null {
    return (
      this.members.find(
        (member): member is T => member?.exists === true && member.alive,
      ) ?? null
    );
  }

  getFirstDead(): T | null {
    return (
      this.members.find(
        (member): member is T => member !== null && !member.alive,
      ) ?? null
    );
  }

  countLiving(): number {
    const populated = this.members.filter(
      (member): member is T => member !== null,
    );
    if (populated.length === 0) return -1;
    return populated.filter((member) => member.exists && member.alive).length;
  }

  countDead(): number {
    const populated = this.members.filter(
      (member): member is T => member !== null,
    );
    if (populated.length === 0) return -1;
    return populated.filter((member) => !member.alive).length;
  }

  getRandom(startIndex = 0, length = 0): T | null {
    return FlxG.getRandom(this.members, startIndex, length);
  }

  clear(): void {
    this.members.length = 0;
    this.length = 0;
    this.#marker = 0;
  }

  override kill(): void {
    for (const member of this.members.slice(0, this.length)) {
      if (member?.exists) member.kill();
    }
    super.kill();
  }
}
