import { FlxGroup } from './flx-group';

/** Base game state; initialize state-owned objects in `create`. @public */
export class FlxState extends FlxGroup {
  create(): void {
    // State initialization hook.
  }
}

/** Zero-argument state constructor used by reset and startup. @public */
export type FlxStateConstructor<T extends FlxState = FlxState> = new () => T;
