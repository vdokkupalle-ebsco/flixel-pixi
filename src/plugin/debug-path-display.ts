import type { Graphics } from 'pixi.js';

import { FlxBasic } from '../core/flx-basic';
import type { FlxCamera } from '../core/flx-camera';
import type { FlxPath } from '../objects/flx-path';

/** Plugin that owns path-debug registration and Pixi geometry projection. @public */
export class DebugPathDisplay extends FlxBasic {
  readonly #paths: FlxPath[] = [];
  #destroyed = false;

  constructor() {
    super();
    this.active = false;
  }

  get pathCount(): number {
    return this.#paths.length;
  }

  add(path: FlxPath): void {
    if (!this.#paths.includes(path)) this.#paths.push(path);
  }

  remove(path: FlxPath): void {
    const index = this.#paths.indexOf(path);
    if (index >= 0) this.#paths.splice(index, 1);
  }

  clear(): void {
    const snapshot = [...this.#paths].reverse();
    this.#paths.length = 0;
    for (const path of snapshot) path.destroy();
  }

  /** Draws registered paths into an adapter-owned, camera-local layer. */
  drawTo(graphics: Graphics, camera: FlxCamera): void {
    for (
      let pathIndex = this.#paths.length - 1;
      pathIndex >= 0;
      pathIndex -= 1
    ) {
      const path = this.#paths[pathIndex];
      if (path === undefined || path.ignoreDrawDebug || path.nodes.length === 0)
        continue;
      const nodes = path.nodes;
      for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index];
        const next = nodes[(index + 1) % nodes.length];
        if (node === undefined || next === undefined) continue;
        const x = Math.trunc(
          node.x - Math.trunc(camera.scroll.x * path.debugScrollFactor.x),
        );
        const y = Math.trunc(
          node.y - Math.trunc(camera.scroll.y * path.debugScrollFactor.y),
        );
        const nextX = Math.trunc(
          next.x - Math.trunc(camera.scroll.x * path.debugScrollFactor.x),
        );
        const nextY = Math.trunc(
          next.y - Math.trunc(camera.scroll.y * path.debugScrollFactor.y),
        );
        const endpoint = index === 0 || index === nodes.length - 1;
        const size = endpoint ? 4 : 2;
        const nodeColor =
          nodes.length > 1 && index === 0
            ? 0x00f225
            : nodes.length > 1 && index === nodes.length - 1
              ? 0xff0012
              : path.debugColor;
        graphics
          .rect(x - size * 0.5, y - size * 0.5, size, size)
          .fill({ alpha: 0.5, color: nodeColor })
          .moveTo(x, y)
          .lineTo(nextX, nextY)
          .stroke({
            alpha: index === nodes.length - 1 ? 0.15 : 0.3,
            color: path.debugColor,
            pixelLine: true,
            width: 1,
          });
      }
    }
  }

  override destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.clear();
    super.destroy();
  }
}
