import { FlxObject } from '../objects/flx-object';

import type { FlxTilemap } from './flx-tilemap';

/** Runtime constructor used to filter tile callbacks. @public */
export type FlxTileFilter = abstract new (...args: never[]) => FlxObject;

/** Callback registered for a tile type. @public */
export type FlxTileCallback = (tile: FlxTile, object: FlxObject) => void;

/** Reusable collision proxy for one tile type. @public */
export class FlxTile extends FlxObject {
  callback: FlxTileCallback | null = null;
  filter: FlxTileFilter | null = null;
  tilemap: FlxTilemap | null;
  readonly index: number;
  mapIndex = 0;

  constructor(
    tilemap: FlxTilemap,
    index: number,
    width: number,
    height: number,
    visible: boolean,
    allowCollisions: number,
  ) {
    super(0, 0, width, height);
    this.tilemap = tilemap;
    this.index = index;
    this.visible = visible;
    this.allowCollisions = allowCollisions;
    this.immovable = true;
    this.moves = false;
  }

  override destroy(): void {
    this.callback = null;
    this.filter = null;
    this.tilemap = null;
    super.destroy();
  }
}
