import type { FlxBasic } from '../core/flx-basic';
import { FlxGroup } from '../core/flx-group';
import { FlxRect } from '../math/flx-rect';
import { FlxObject } from '../objects/flx-object';
import { FlxList } from './flx-list';

/** Called after an accepted overlap pair is found. @public */
export type FlxOverlapCallback = (first: FlxObject, second: FlxObject) => void;

/** Decides whether an overlap pair is accepted. @public */
export type FlxProcessCallback = (
  first: FlxObject,
  second: FlxObject,
) => boolean;

interface FlxQuadTreeRun {
  notify: FlxOverlapCallback | null;
  process: FlxProcessCallback | null;
  seen: WeakMap<FlxObject, WeakSet<FlxObject>>;
  useBothLists: boolean;
}

/** Flixel-compatible broad-phase quadtree with single/dual-list operation. @public */
export class FlxQuadTree extends FlxRect {
  static readonly A_LIST = 0;
  static readonly B_LIST = 1;
  static divisions = 6;

  readonly #run: FlxQuadTreeRun;
  readonly #isRoot: boolean;
  readonly #canSubdivide: boolean;
  readonly #leftEdge: number;
  readonly #rightEdge: number;
  readonly #topEdge: number;
  readonly #bottomEdge: number;
  readonly #halfWidth: number;
  readonly #halfHeight: number;
  readonly #midpointX: number;
  readonly #midpointY: number;
  readonly #minimum: number;
  #headA = new FlxList();
  #tailA = this.#headA;
  #headB = new FlxList();
  #tailB = this.#headB;
  #northWest: FlxQuadTree | null = null;
  #northEast: FlxQuadTree | null = null;
  #southEast: FlxQuadTree | null = null;
  #southWest: FlxQuadTree | null = null;
  #destroyed = false;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    parent: FlxQuadTree | null = null,
  ) {
    super(x, y, width, height);
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      throw new RangeError(
        'Quadtree bounds must be finite with positive size.',
      );
    }
    if (!Number.isInteger(FlxQuadTree.divisions) || FlxQuadTree.divisions < 1) {
      throw new RangeError('FlxQuadTree.divisions must be a positive integer.');
    }

    this.#run =
      parent === null
        ? {
            notify: null,
            process: null,
            seen: new WeakMap(),
            useBothLists: false,
          }
        : parent.#run;
    this.#isRoot = parent === null;
    if (parent !== null) {
      this.#copyList(parent.#headA, FlxQuadTree.A_LIST);
      this.#copyList(parent.#headB, FlxQuadTree.B_LIST);
    }

    const minimum =
      parent === null
        ? Math.max(
            1,
            Math.trunc((width + height) / (2 * FlxQuadTree.divisions)),
          )
        : parent.#minimum;
    this.#minimum = minimum;
    this.#canSubdivide = width > minimum || height > minimum;
    this.#leftEdge = x;
    this.#rightEdge = x + width;
    this.#halfWidth = width * 0.5;
    this.#midpointX = x + this.#halfWidth;
    this.#topEdge = y;
    this.#bottomEdge = y + height;
    this.#halfHeight = height * 0.5;
    this.#midpointY = y + this.#halfHeight;
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#headA.destroy();
    this.#headB.destroy();
    this.#northWest?.destroy();
    this.#northEast?.destroy();
    this.#southEast?.destroy();
    this.#southWest?.destroy();
    this.#northWest = null;
    this.#northEast = null;
    this.#southEast = null;
    this.#southWest = null;
    this.#run.notify = null;
    this.#run.process = null;
  }

  load(
    first: FlxBasic,
    second: FlxBasic | null = null,
    notify: FlxOverlapCallback | null = null,
    process: FlxProcessCallback | null = null,
  ): void {
    this.add(first, FlxQuadTree.A_LIST);
    if (second !== null) this.add(second, FlxQuadTree.B_LIST);
    this.#run.useBothLists = second !== null;
    this.#run.notify = notify;
    this.#run.process = process;
  }

  add(objectOrGroup: FlxBasic, list: number): void {
    if (list !== FlxQuadTree.A_LIST && list !== FlxQuadTree.B_LIST) {
      throw new RangeError('Quadtree list must be A_LIST or B_LIST.');
    }
    const compositeGroup =
      objectOrGroup instanceof FlxGroup
        ? objectOrGroup
        : Reflect.get(objectOrGroup, 'group') instanceof FlxGroup
          ? (Reflect.get(objectOrGroup, 'group') as FlxGroup)
          : null;
    if (compositeGroup !== null) {
      if (
        objectOrGroup instanceof FlxObject &&
        (!objectOrGroup.exists ||
          objectOrGroup.allowCollisions === FlxObject.NONE)
      ) {
        return;
      }
      for (const member of compositeGroup.members.slice(
        0,
        compositeGroup.length,
      )) {
        if (member !== null && member.exists) this.add(member, list);
      }
      return;
    }
    if (
      objectOrGroup instanceof FlxObject &&
      objectOrGroup.exists &&
      objectOrGroup.allowCollisions !== FlxObject.NONE
    ) {
      this.#addObject(objectOrGroup, list);
    }
  }

  execute(): boolean {
    if (this.#isRoot) this.#run.seen = new WeakMap();
    let processed = false;
    for (let iterator: FlxList | null = this.#headA; iterator !== null;) {
      const object = iterator.object;
      if (object !== null && object.exists && object.allowCollisions > 0) {
        const checks = this.#run.useBothLists ? this.#headB : iterator.next;
        if (checks !== null && this.#overlapNode(object, checks))
          processed = true;
      }
      iterator = iterator.next;
    }

    if (this.#northWest?.execute()) processed = true;
    if (this.#northEast?.execute()) processed = true;
    if (this.#southEast?.execute()) processed = true;
    if (this.#southWest?.execute()) processed = true;
    return processed;
  }

  #addObject(object: FlxObject, list: number): void {
    const objectLeft = object.x;
    const objectTop = object.y;
    const objectRight = object.x + object.width;
    const objectBottom = object.y + object.height;

    if (
      !this.#canSubdivide ||
      (this.#leftEdge >= objectLeft &&
        this.#rightEdge <= objectRight &&
        this.#topEdge >= objectTop &&
        this.#bottomEdge <= objectBottom)
    ) {
      this.#addToList(object, list);
      return;
    }

    if (objectLeft > this.#leftEdge && objectRight < this.#midpointX) {
      if (objectTop > this.#topEdge && objectBottom < this.#midpointY) {
        this.#northWest ??= this.#child(this.#leftEdge, this.#topEdge);
        this.#northWest.#addObject(object, list);
        return;
      }
      if (objectTop > this.#midpointY && objectBottom < this.#bottomEdge) {
        this.#southWest ??= this.#child(this.#leftEdge, this.#midpointY);
        this.#southWest.#addObject(object, list);
        return;
      }
    }

    if (objectLeft > this.#midpointX && objectRight < this.#rightEdge) {
      if (objectTop > this.#topEdge && objectBottom < this.#midpointY) {
        this.#northEast ??= this.#child(this.#midpointX, this.#topEdge);
        this.#northEast.#addObject(object, list);
        return;
      }
      if (objectTop > this.#midpointY && objectBottom < this.#bottomEdge) {
        this.#southEast ??= this.#child(this.#midpointX, this.#midpointY);
        this.#southEast.#addObject(object, list);
        return;
      }
    }

    if (
      objectRight > this.#leftEdge &&
      objectLeft < this.#midpointX &&
      objectBottom > this.#topEdge &&
      objectTop < this.#midpointY
    ) {
      this.#northWest ??= this.#child(this.#leftEdge, this.#topEdge);
      this.#northWest.#addObject(object, list);
    }
    if (
      objectRight > this.#midpointX &&
      objectLeft < this.#rightEdge &&
      objectBottom > this.#topEdge &&
      objectTop < this.#midpointY
    ) {
      this.#northEast ??= this.#child(this.#midpointX, this.#topEdge);
      this.#northEast.#addObject(object, list);
    }
    if (
      objectRight > this.#midpointX &&
      objectLeft < this.#rightEdge &&
      objectBottom > this.#midpointY &&
      objectTop < this.#bottomEdge
    ) {
      this.#southEast ??= this.#child(this.#midpointX, this.#midpointY);
      this.#southEast.#addObject(object, list);
    }
    if (
      objectRight > this.#leftEdge &&
      objectLeft < this.#midpointX &&
      objectBottom > this.#midpointY &&
      objectTop < this.#bottomEdge
    ) {
      this.#southWest ??= this.#child(this.#leftEdge, this.#midpointY);
      this.#southWest.#addObject(object, list);
    }
  }

  #addToList(object: FlxObject, list: number): void {
    if (list === FlxQuadTree.A_LIST)
      this.#tailA = this.#append(this.#tailA, object);
    else this.#tailB = this.#append(this.#tailB, object);

    if (!this.#canSubdivide) return;
    if (this.#northWest !== null) this.#northWest.#addToList(object, list);
    if (this.#northEast !== null) this.#northEast.#addToList(object, list);
    if (this.#southEast !== null) this.#southEast.#addToList(object, list);
    if (this.#southWest !== null) this.#southWest.#addToList(object, list);
  }

  #append(tail: FlxList, object: FlxObject): FlxList {
    if (tail.object === null) {
      tail.object = object;
      return tail;
    }
    const next = new FlxList();
    next.object = object;
    tail.next = next;
    return next;
  }

  #copyList(head: FlxList, list: number): void {
    for (let iterator: FlxList | null = head; iterator !== null;) {
      if (iterator.object !== null) {
        if (list === FlxQuadTree.A_LIST)
          this.#tailA = this.#append(this.#tailA, iterator.object);
        else this.#tailB = this.#append(this.#tailB, iterator.object);
      }
      iterator = iterator.next;
    }
  }

  #child(x: number, y: number): FlxQuadTree {
    return new FlxQuadTree(x, y, this.#halfWidth, this.#halfHeight, this);
  }

  #overlapNode(object: FlxObject, head: FlxList): boolean {
    let processed = false;
    for (let iterator: FlxList | null = head; iterator !== null;) {
      if (!object.exists || object.allowCollisions <= 0) break;
      const checkObject = iterator.object;
      if (
        checkObject !== null &&
        object !== checkObject &&
        checkObject.exists &&
        checkObject.allowCollisions > 0 &&
        FlxQuadTree.#sweptHullsOverlap(object, checkObject) &&
        this.#markPair(object, checkObject)
      ) {
        const accepted =
          this.#run.process === null || this.#run.process(object, checkObject);
        if (accepted) {
          processed = true;
          this.#run.notify?.(object, checkObject);
        }
      }
      iterator = iterator.next;
    }
    return processed;
  }

  #markPair(first: FlxObject, second: FlxObject): boolean {
    if (
      this.#run.seen.get(first)?.has(second) === true ||
      this.#run.seen.get(second)?.has(first) === true
    ) {
      return false;
    }
    let seconds = this.#run.seen.get(first);
    if (seconds === undefined) {
      seconds = new WeakSet();
      this.#run.seen.set(first, seconds);
    }
    seconds.add(second);
    return true;
  }

  static #sweptHullsOverlap(first: FlxObject, second: FlxObject): boolean {
    const firstX = Math.min(first.x, first.last.x);
    const firstY = Math.min(first.y, first.last.y);
    const firstWidth = first.width + Math.abs(first.x - first.last.x);
    const firstHeight = first.height + Math.abs(first.y - first.last.y);
    const secondX = Math.min(second.x, second.last.x);
    const secondY = Math.min(second.y, second.last.y);
    const secondWidth = second.width + Math.abs(second.x - second.last.x);
    const secondHeight = second.height + Math.abs(second.y - second.last.y);
    return (
      firstX + firstWidth > secondX &&
      firstX < secondX + secondWidth &&
      firstY + firstHeight > secondY &&
      firstY < secondY + secondHeight
    );
  }
}
