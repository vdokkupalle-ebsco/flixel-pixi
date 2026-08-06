import { FlxPoint } from '../math/flx-point';
import { FlxG } from '../core/flx-g';
import { DebugPathDisplay } from '../plugin/debug-path-display';

/** Mutable path data followed by a `FlxObject`. @public */
export class FlxPath {
  nodes: FlxPoint[];
  debugColor = 0xffffff;
  debugScrollFactor = new FlxPoint(1, 1);
  ignoreDrawDebug = false;

  #destroyed = false;

  constructor(nodes: FlxPoint[] | null = null) {
    this.nodes = nodes ?? [];
    FlxPath.manager?.add(this);
  }

  static get manager(): DebugPathDisplay | null {
    return FlxG.hasContext ? FlxG.getPlugin(DebugPathDisplay) : null;
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    FlxPath.manager?.remove(this);
    this.nodes.length = 0;
  }

  add(x: number, y: number): void {
    this.nodes.push(new FlxPoint(x, y));
  }

  addAt(x: number, y: number, index: number): void {
    this.#requireIndex(index);
    this.nodes.splice(
      Math.min(index, this.nodes.length),
      0,
      new FlxPoint(x, y),
    );
  }

  addPoint(node: FlxPoint, asReference = false): void {
    this.nodes.push(asReference ? node : new FlxPoint(node.x, node.y));
  }

  addPointAt(node: FlxPoint, index: number, asReference = false): void {
    this.#requireIndex(index);
    this.nodes.splice(
      Math.min(index, this.nodes.length),
      0,
      asReference ? node : new FlxPoint(node.x, node.y),
    );
  }

  remove(node: FlxPoint): FlxPoint | null {
    const index = this.nodes.indexOf(node);
    return index < 0 ? null : (this.nodes.splice(index, 1)[0] ?? null);
  }

  removeAt(index: number): FlxPoint | null {
    this.#requireIndex(index);
    if (this.nodes.length === 0) return null;
    const boundedIndex = Math.min(index, this.nodes.length - 1);
    return this.nodes.splice(boundedIndex, 1)[0] ?? null;
  }

  head(): FlxPoint | null {
    return this.nodes[0] ?? null;
  }

  tail(): FlxPoint | null {
    return this.nodes[this.nodes.length - 1] ?? null;
  }

  #requireIndex(index: number): void {
    if (!Number.isInteger(index) || index < 0) {
      throw new RangeError('Path index must be a non-negative integer.');
    }
  }
}
