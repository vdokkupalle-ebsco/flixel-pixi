import type { FlxCamera } from './flx-camera';
import type { FlxContainer } from './flx-container';

/** Base lifecycle object shared by gameplay objects, groups, and plugins. @public */
export class FlxBasic {
  static activeCount = 0;
  static visibleCount = 0;

  ID = -1;
  exists = true;
  active = true;
  visible = true;
  alive = true;
  cameras: readonly FlxCamera[] | null = null;
  /** Exclusive logical container that currently owns this object, if any. */
  container: FlxContainer | null = null;
  ignoreDrawDebug = false;

  /** Override to release owned resources. */
  destroy(): void {
    // Lifecycle hook for subclasses with owned resources.
  }

  /** Called immediately before `update`. */
  preUpdate(): void {
    FlxBasic.activeCount += 1;
  }

  /** Override with authoritative simulation behavior. */
  update(): void {
    // Simulation hook for subclasses.
  }

  /** Called immediately after `update`. */
  postUpdate(): void {
    // Lifecycle hook for subclasses.
  }

  /** Renderer adapters override this without making core depend on PixiJS. */
  draw(): void {
    FlxBasic.visibleCount += this.cameras?.length ?? 1;
  }

  /** Override to enqueue debug geometry for an adapter-owned camera. */
  drawDebug(camera: unknown = null): void {
    void camera;
    // Debug-render hook for adapter-backed subclasses.
  }

  /** Marks the object both dead and nonexistent. */
  kill(): void {
    this.alive = false;
    this.exists = false;
  }

  /** Marks the object alive and existing. */
  revive(): void {
    this.alive = true;
    this.exists = true;
  }

  toString(): string {
    return this.constructor.name || 'FlxBasic';
  }
}
