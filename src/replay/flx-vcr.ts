import type { FlxState } from '../core/flx-state';
import type { FlxReplay } from './flx-replay';

/** VCR control interface for recording, playback, and step controls. @public */
export interface FlxVCR {
  cancelKeys: string[];
  onComplete: (() => void) | null;
  recording: boolean;
  reloadState: FlxState | null;
  replay: FlxReplay | null;
  replaying: boolean;
  stepRequested: boolean;
  timeout: number;
}

/** Creates a default VCR state container. @public */
export function createVCR(): FlxVCR {
  return {
    cancelKeys: ['Escape'],
    onComplete: null,
    recording: false,
    reloadState: null,
    replay: null,
    replaying: false,
    stepRequested: false,
    timeout: 0,
  };
}
