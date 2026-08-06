import { FlxBasic } from '../core/flx-basic';
import { FlxG } from '../core/flx-g';
import { FlxGroup } from '../core/flx-group';
import { FlxPoint } from '../math/flx-point';
import { FlxU } from '../math/flx-u';
import type { FlxPath } from './flx-path';

/** Camera fields needed by headless screen-coordinate helpers. @public */
export interface FlxCameraLike {
  readonly scroll: Readonly<FlxPoint>;
  readonly width: number;
  readonly height: number;
}

/** Authoritative world-space motion and collision object. @public */
export class FlxObject extends FlxBasic {
  static readonly LEFT = 0x0001;
  static readonly RIGHT = 0x0010;
  static readonly UP = 0x0100;
  static readonly DOWN = 0x1000;

  static readonly NONE = 0;
  static readonly CEILING = FlxObject.UP;
  static readonly FLOOR = FlxObject.DOWN;
  static readonly WALL = FlxObject.LEFT | FlxObject.RIGHT;
  static readonly ANY =
    FlxObject.LEFT | FlxObject.RIGHT | FlxObject.UP | FlxObject.DOWN;
  static readonly OVERLAP_BIAS = 4;

  static readonly PATH_FORWARD = 0x000000;
  static readonly PATH_BACKWARD = 0x000001;
  static readonly PATH_LOOP_FORWARD = 0x000010;
  static readonly PATH_LOOP_BACKWARD = 0x000100;
  static readonly PATH_YOYO = 0x001000;
  static readonly PATH_HORIZONTAL_ONLY = 0x010000;
  static readonly PATH_VERTICAL_ONLY = 0x100000;

  x: number;
  y: number;
  width: number;
  height: number;
  immovable = false;
  velocity = new FlxPoint();
  mass = 1;
  elasticity = 0;
  acceleration = new FlxPoint();
  drag = new FlxPoint();
  maxVelocity = new FlxPoint(10_000, 10_000);
  angle = 0;
  angularVelocity = 0;
  angularAcceleration = 0;
  angularDrag = 0;
  maxAngular = 10_000;
  scrollFactor = new FlxPoint(1, 1);
  health = 0;
  moves = true;
  touching = FlxObject.NONE;
  wasTouching = FlxObject.NONE;
  allowCollisions = FlxObject.ANY;
  last: FlxPoint;
  path: FlxPath | null = null;
  pathSpeed = 0;
  pathAngle = 0;

  #destroyed = false;
  #flickerTimer = 0;
  #pathNodeIndex = 0;
  #pathMode = FlxObject.PATH_FORWARD;
  #pathIncrement = 1;
  #pathRotate = false;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    super();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.last = new FlxPoint(x, y);
  }

  override destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.path?.destroy();
    this.path = null;
    this.cameras = null;
    super.destroy();
  }

  override preUpdate(): void {
    super.preUpdate();
    if (this.#flickerTimer > 0) {
      this.#flickerTimer -= FlxG.elapsed;
      if (this.#flickerTimer <= 0) this.#flickerTimer = 0;
    }

    this.last.copyFrom(this);
    if (
      this.path !== null &&
      this.pathSpeed !== 0 &&
      this.path.nodes[this.#pathNodeIndex] !== undefined
    ) {
      this.#updatePathMotion();
    }
  }

  override postUpdate(): void {
    if (this.moves) this.#updateMotion();
    this.wasTouching = this.touching;
    this.touching = FlxObject.NONE;
    super.postUpdate();
  }

  followPath(
    path: FlxPath,
    speed = 100,
    mode = FlxObject.PATH_FORWARD,
    autoRotate = false,
  ): void {
    if (path.nodes.length === 0) return;
    this.path = path;
    this.pathSpeed = FlxU.abs(speed);
    this.#pathMode = mode;
    this.#pathRotate = autoRotate;

    if (
      mode === FlxObject.PATH_BACKWARD ||
      mode === FlxObject.PATH_LOOP_BACKWARD
    ) {
      this.#pathNodeIndex = path.nodes.length - 1;
      this.#pathIncrement = -1;
    } else {
      this.#pathNodeIndex = 0;
      this.#pathIncrement = 1;
    }
  }

  stopFollowingPath(destroyPath = false): void {
    this.pathSpeed = 0;
    if (destroyPath && this.path !== null) {
      this.path.destroy();
      this.path = null;
    }
  }

  overlaps(objectOrGroup: FlxBasic): boolean {
    if (objectOrGroup instanceof FlxGroup) {
      let result = false;
      for (const member of objectOrGroup.members.slice(
        0,
        objectOrGroup.length,
      )) {
        if (member !== null && this.overlaps(member)) result = true;
      }
      return result;
    }
    return objectOrGroup instanceof FlxObject
      ? FlxObject.#rectanglesOverlap(this.x, this.y, this, objectOrGroup)
      : false;
  }

  overlapsAt(x: number, y: number, objectOrGroup: FlxBasic): boolean {
    if (objectOrGroup instanceof FlxGroup) {
      let result = false;
      for (const member of objectOrGroup.members.slice(
        0,
        objectOrGroup.length,
      )) {
        if (member !== null && this.overlapsAt(x, y, member)) result = true;
      }
      return result;
    }
    return objectOrGroup instanceof FlxObject
      ? FlxObject.#rectanglesOverlap(x, y, this, objectOrGroup)
      : false;
  }

  overlapsPoint(point: Readonly<FlxPoint>): boolean {
    return (
      point.x > this.x &&
      point.x < this.x + this.width &&
      point.y > this.y &&
      point.y < this.y + this.height
    );
  }

  onScreen(camera: FlxCameraLike = FlxG.camera): boolean {
    const point = this.getScreenXY(undefined, camera);
    return (
      point.x + this.width > 0 &&
      point.x < camera.width &&
      point.y + this.height > 0 &&
      point.y < camera.height
    );
  }

  getScreenXY(
    point: FlxPoint = new FlxPoint(),
    camera: FlxCameraLike = FlxG.camera,
  ): FlxPoint {
    point.x = this.x - Math.trunc(camera.scroll.x * this.scrollFactor.x);
    point.y = this.y - Math.trunc(camera.scroll.y * this.scrollFactor.y);
    point.x += point.x > 0 ? 0.0000001 : -0.0000001;
    point.y += point.y > 0 ? 0.0000001 : -0.0000001;
    return point;
  }

  flicker(duration = 1): void {
    this.#flickerTimer = duration;
  }

  get flickering(): boolean {
    return this.#flickerTimer !== 0;
  }

  get solid(): boolean {
    return (this.allowCollisions & FlxObject.ANY) > FlxObject.NONE;
  }

  set solid(value: boolean) {
    this.allowCollisions = value ? FlxObject.ANY : FlxObject.NONE;
  }

  getMidpoint(point: FlxPoint = new FlxPoint()): FlxPoint {
    point.x = this.x + this.width * 0.5;
    point.y = this.y + this.height * 0.5;
    return point;
  }

  reset(x: number, y: number): void {
    this.revive();
    this.touching = FlxObject.NONE;
    this.wasTouching = FlxObject.NONE;
    this.x = x;
    this.y = y;
    this.last.copyFrom(this);
    this.velocity.make();
  }

  isTouching(direction: number): boolean {
    return (this.touching & direction) > FlxObject.NONE;
  }

  justTouched(direction: number): boolean {
    return (
      (this.touching & direction) > FlxObject.NONE &&
      (this.wasTouching & direction) <= FlxObject.NONE
    );
  }

  hurt(damage: number): void {
    this.health -= damage;
    if (this.health <= 0) this.kill();
  }

  static separate(first: FlxObject, second: FlxObject): boolean {
    const separatedX = FlxObject.separateX(first, second);
    const separatedY = FlxObject.separateY(first, second);
    return separatedX || separatedY;
  }

  static separateX(first: FlxObject, second: FlxObject): boolean {
    if (first.immovable && second.immovable) return false;

    const firstDelta = first.x - first.last.x;
    const secondDelta = second.x - second.last.x;
    let overlap = 0;

    if (firstDelta !== secondDelta) {
      const firstDeltaAbsolute = Math.abs(firstDelta);
      const secondDeltaAbsolute = Math.abs(secondDelta);
      const firstHullX = first.x - (firstDelta > 0 ? firstDelta : 0);
      const secondHullX = second.x - (secondDelta > 0 ? secondDelta : 0);
      const firstHullWidth = first.width + firstDeltaAbsolute;
      const secondHullWidth = second.width + secondDeltaAbsolute;

      if (
        firstHullX + firstHullWidth > secondHullX &&
        firstHullX < secondHullX + secondHullWidth &&
        first.last.y + first.height > second.last.y &&
        first.last.y < second.last.y + second.height
      ) {
        const maximumOverlap =
          firstDeltaAbsolute + secondDeltaAbsolute + FlxObject.OVERLAP_BIAS;
        if (firstDelta > secondDelta) {
          overlap = first.x + first.width - second.x;
          if (
            overlap > maximumOverlap ||
            (first.allowCollisions & FlxObject.RIGHT) === 0 ||
            (second.allowCollisions & FlxObject.LEFT) === 0
          ) {
            overlap = 0;
          } else {
            first.touching |= FlxObject.RIGHT;
            second.touching |= FlxObject.LEFT;
          }
        } else {
          overlap = first.x - second.width - second.x;
          if (
            -overlap > maximumOverlap ||
            (first.allowCollisions & FlxObject.LEFT) === 0 ||
            (second.allowCollisions & FlxObject.RIGHT) === 0
          ) {
            overlap = 0;
          } else {
            first.touching |= FlxObject.LEFT;
            second.touching |= FlxObject.RIGHT;
          }
        }
      }
    }

    if (overlap === 0) return false;
    FlxObject.#resolveAxis(first, second, overlap, 'x');
    return true;
  }

  static separateY(first: FlxObject, second: FlxObject): boolean {
    if (first.immovable && second.immovable) return false;

    const firstDelta = first.y - first.last.y;
    const secondDelta = second.y - second.last.y;
    let overlap = 0;

    if (firstDelta !== secondDelta) {
      const firstDeltaAbsolute = Math.abs(firstDelta);
      const secondDeltaAbsolute = Math.abs(secondDelta);
      const firstHullY = first.y - (firstDelta > 0 ? firstDelta : 0);
      const secondHullY = second.y - (secondDelta > 0 ? secondDelta : 0);
      const firstHullHeight = first.height + firstDeltaAbsolute;
      const secondHullHeight = second.height + secondDeltaAbsolute;

      if (
        first.x + first.width > second.x &&
        first.x < second.x + second.width &&
        firstHullY + firstHullHeight > secondHullY &&
        firstHullY < secondHullY + secondHullHeight
      ) {
        const maximumOverlap =
          firstDeltaAbsolute + secondDeltaAbsolute + FlxObject.OVERLAP_BIAS;
        if (firstDelta > secondDelta) {
          overlap = first.y + first.height - second.y;
          if (
            overlap > maximumOverlap ||
            (first.allowCollisions & FlxObject.DOWN) === 0 ||
            (second.allowCollisions & FlxObject.UP) === 0
          ) {
            overlap = 0;
          } else {
            first.touching |= FlxObject.DOWN;
            second.touching |= FlxObject.UP;
          }
        } else {
          overlap = first.y - second.height - second.y;
          if (
            -overlap > maximumOverlap ||
            (first.allowCollisions & FlxObject.UP) === 0 ||
            (second.allowCollisions & FlxObject.DOWN) === 0
          ) {
            overlap = 0;
          } else {
            first.touching |= FlxObject.UP;
            second.touching |= FlxObject.DOWN;
          }
        }
      }
    }

    if (overlap === 0) return false;
    FlxObject.#resolveAxis(first, second, overlap, 'y');

    if (first.immovable !== second.immovable) {
      if (
        !first.immovable &&
        second.active &&
        second.moves &&
        firstDelta > secondDelta
      ) {
        first.x += second.x - second.last.x;
      } else if (
        !second.immovable &&
        first.active &&
        first.moves &&
        firstDelta < secondDelta
      ) {
        second.x += first.x - first.last.x;
      }
    }
    return true;
  }

  #updateMotion(): void {
    const elapsed = FlxG.elapsed;
    let velocityDelta =
      (FlxU.computeVelocity(
        this.angularVelocity,
        this.angularAcceleration,
        this.angularDrag,
        this.maxAngular,
        elapsed,
      ) -
        this.angularVelocity) /
      2;
    this.angularVelocity += velocityDelta;
    this.angle += this.angularVelocity * elapsed;
    this.angularVelocity += velocityDelta;

    velocityDelta =
      (FlxU.computeVelocity(
        this.velocity.x,
        this.acceleration.x,
        this.drag.x,
        this.maxVelocity.x,
        elapsed,
      ) -
        this.velocity.x) /
      2;
    this.velocity.x += velocityDelta;
    this.x += this.velocity.x * elapsed;
    this.velocity.x += velocityDelta;

    velocityDelta =
      (FlxU.computeVelocity(
        this.velocity.y,
        this.acceleration.y,
        this.drag.y,
        this.maxVelocity.y,
        elapsed,
      ) -
        this.velocity.y) /
      2;
    this.velocity.y += velocityDelta;
    this.y += this.velocity.y * elapsed;
    this.velocity.y += velocityDelta;
  }

  #advancePath(snap = true): FlxPoint | null {
    const path = this.path;
    if (path === null || path.nodes.length === 0) return null;

    if (snap) {
      const oldNode = path.nodes[this.#pathNodeIndex];
      if (oldNode !== undefined) {
        if ((this.#pathMode & FlxObject.PATH_VERTICAL_ONLY) === 0)
          this.x = oldNode.x - this.width * 0.5;
        if ((this.#pathMode & FlxObject.PATH_HORIZONTAL_ONLY) === 0)
          this.y = oldNode.y - this.height * 0.5;
      }
    }

    this.#pathNodeIndex += this.#pathIncrement;
    if ((this.#pathMode & FlxObject.PATH_BACKWARD) > 0) {
      if (this.#pathNodeIndex < 0) {
        this.#pathNodeIndex = 0;
        this.pathSpeed = 0;
      }
    } else if ((this.#pathMode & FlxObject.PATH_LOOP_FORWARD) > 0) {
      if (this.#pathNodeIndex >= path.nodes.length) this.#pathNodeIndex = 0;
    } else if ((this.#pathMode & FlxObject.PATH_LOOP_BACKWARD) > 0) {
      if (this.#pathNodeIndex < 0)
        this.#pathNodeIndex = Math.max(0, path.nodes.length - 1);
    } else if ((this.#pathMode & FlxObject.PATH_YOYO) > 0) {
      if (this.#pathIncrement > 0) {
        if (this.#pathNodeIndex >= path.nodes.length) {
          this.#pathNodeIndex = Math.max(0, path.nodes.length - 2);
          this.#pathIncrement = -this.#pathIncrement;
        }
      } else if (this.#pathNodeIndex < 0) {
        this.#pathNodeIndex = Math.min(1, path.nodes.length - 1);
        this.#pathIncrement = -this.#pathIncrement;
      }
    } else if (this.#pathNodeIndex >= path.nodes.length) {
      this.#pathNodeIndex = path.nodes.length - 1;
      this.pathSpeed = 0;
    }
    return path.nodes[this.#pathNodeIndex] ?? null;
  }

  #updatePathMotion(): void {
    const path = this.path;
    if (path === null) return;
    const center = this.getMidpoint();
    let node = path.nodes[this.#pathNodeIndex];
    if (node === undefined) return;

    const deltaX = node.x - center.x;
    const deltaY = node.y - center.y;
    const horizontalOnly =
      (this.#pathMode & FlxObject.PATH_HORIZONTAL_ONLY) > 0;
    const verticalOnly = (this.#pathMode & FlxObject.PATH_VERTICAL_ONLY) > 0;
    const threshold = this.pathSpeed * FlxG.elapsed;

    if (
      (horizontalOnly && Math.abs(deltaX) < threshold) ||
      (verticalOnly && Math.abs(deltaY) < threshold) ||
      (!horizontalOnly &&
        !verticalOnly &&
        Math.hypot(deltaX, deltaY) < threshold)
    ) {
      const advanced = this.#advancePath();
      if (advanced !== null) node = advanced;
    }

    if (this.pathSpeed === 0) return;
    this.getMidpoint(center);
    if (horizontalOnly || center.y === node.y) {
      this.velocity.x = center.x < node.x ? this.pathSpeed : -this.pathSpeed;
      this.pathAngle = this.velocity.x < 0 ? -90 : 90;
      if (!horizontalOnly) this.velocity.y = 0;
    } else if (verticalOnly || center.x === node.x) {
      this.velocity.y = center.y < node.y ? this.pathSpeed : -this.pathSpeed;
      this.pathAngle = this.velocity.y < 0 ? 0 : 180;
      if (!verticalOnly) this.velocity.x = 0;
    } else {
      this.pathAngle = FlxU.getAngle(center, node);
      FlxU.rotatePoint(0, this.pathSpeed, 0, 0, this.pathAngle, this.velocity);
    }

    if (this.#pathRotate) {
      this.angularVelocity = 0;
      this.angularAcceleration = 0;
      this.angle = this.pathAngle;
    }
  }

  static #rectanglesOverlap(
    x: number,
    y: number,
    source: FlxObject,
    target: FlxObject,
  ): boolean {
    return (
      target.x + target.width > x &&
      target.x < x + source.width &&
      target.y + target.height > y &&
      target.y < y + source.height
    );
  }

  static #resolveAxis(
    first: FlxObject,
    second: FlxObject,
    overlap: number,
    axis: 'x' | 'y',
  ): void {
    const firstVelocity = first.velocity[axis];
    const secondVelocity = second.velocity[axis];
    if (!first.immovable && !second.immovable) {
      overlap *= 0.5;
      first[axis] -= overlap;
      second[axis] += overlap;
      let newFirst =
        Math.sqrt(
          (secondVelocity * secondVelocity * second.mass) / first.mass,
        ) * (secondVelocity > 0 ? 1 : -1);
      let newSecond =
        Math.sqrt((firstVelocity * firstVelocity * first.mass) / second.mass) *
        (firstVelocity > 0 ? 1 : -1);
      const average = (newFirst + newSecond) * 0.5;
      newFirst -= average;
      newSecond -= average;
      first.velocity[axis] = average + newFirst * first.elasticity;
      second.velocity[axis] = average + newSecond * second.elasticity;
    } else if (!first.immovable) {
      first[axis] -= overlap;
      first.velocity[axis] = secondVelocity - firstVelocity * first.elasticity;
    } else if (!second.immovable) {
      second[axis] += overlap;
      second.velocity[axis] =
        firstVelocity - secondVelocity * second.elasticity;
    }
  }
}
