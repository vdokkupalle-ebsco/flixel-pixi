import type { Container } from 'pixi.js';

import type { FlxCamera } from '../core/flx-camera';

/** Adapter-owned Pixi view synchronized from an authoritative Flixel object. @public */
export interface FlxRenderHandle {
  readonly view: Container;
  readonly destroyed: boolean;
  sync(camera?: FlxCamera): void;
  destroy(): void;
}
