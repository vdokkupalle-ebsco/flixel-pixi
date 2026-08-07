import type { FlxBasic } from '../core/flx-basic';
import { FlxGroup } from '../core/flx-group';
import type { FlxGame } from '../core/flx-game';
import { FlxEmitter } from '../objects/flx-emitter';
import { FlxSprite } from '../objects/flx-sprite';
import { FlxTilemap } from '../tilemap/flx-tilemap';
import type { FlxCameraRenderer } from './flx-camera-renderer';

/** Sprite, tilemap, or emitter that can be registered with {@link FlxCameraRenderer}. @public */
export type FlxRenderable = FlxSprite | FlxTilemap | FlxEmitter;

/** Collect displayables under a Flixel basic (state/group tree). @public */
export function collectRenderables(
  root: FlxBasic,
  out: FlxRenderable[],
): void {
  if (root instanceof FlxTilemap || root instanceof FlxEmitter) {
    out.push(root);
    return;
  }
  if (root instanceof FlxSprite) {
    out.push(root);
  }
  if (root instanceof FlxGroup) {
    for (const member of root.members) {
      if (member !== null) collectRenderables(member, out);
    }
  }
}

/**
 * Synchronize renderer entries with the active state's renderables.
 * Adds missing objects; removes entries for objects no longer in the tree.
 * Does not clear and rebuild all handles.
 * @public
 */
export function syncWorldToRenderer(
  game: FlxGame,
  renderer: FlxCameraRenderer,
): void {
  const state = game.state;
  const desired: FlxRenderable[] = [];
  if (state !== null) collectRenderables(state, desired);

  const desiredSet = new Set(desired);

  const registered = Array.from(renderer.registeredObjects);
  for (const object of registered) {
    if (!desiredSet.has(object)) {
      renderer.remove(object, true);
    }
  }
  for (const object of desired) {
    renderer.add(object);
  }
}
