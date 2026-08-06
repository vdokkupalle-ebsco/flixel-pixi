import type { FlxObject } from '../objects/flx-object';

/** Internal linked-list node used by the Flixel-compatible quadtree. */
export class FlxList {
  object: FlxObject | null = null;
  next: FlxList | null = null;

  destroy(): void {
    this.object = null;
    let node: FlxList | null = this.next;
    this.next = null;
    while (node !== null) {
      const next: FlxList | null = node.next;
      node.object = null;
      node.next = null;
      node = next;
    }
  }
}
