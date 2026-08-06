import type {
  FlxAudioBackend,
  FlxSoundHandle,
} from './flx-audio-backend';

/** No-op sound handle for headless tests. @public */
class NullSoundHandle implements FlxSoundHandle {
  playing = false;
  position = 0;
  duration = 0;

  play(): void {
    this.playing = true;
  }

  pause(): void {
    this.playing = false;
  }

  resume(): void {
    this.playing = true;
  }

  stop(): void {
    this.playing = false;
    this.position = 0;
  }

  setVolume(_volume: number): void {
    // No-op.
  }

  setPan(_pan: number): void {
    // No-op.
  }

  destroy(): void {
    this.playing = false;
  }
}

/**
 * No-op audio backend for headless unit tests.
 * Always unlocked, never suspended, all methods are inert.
 * @public
 */
export class NullAudioBackend implements FlxAudioBackend {
  readonly unlocked = true;
  readonly suspended = false;

  unlockAudio(): void {
    // Already unlocked.
  }

  createSound(
    _source: unknown,
    _streaming: boolean,
  ): FlxSoundHandle {
    return new NullSoundHandle();
  }

  setGlobalVolume(_volume: number): void {
    // No-op.
  }

  setGlobalMute(_muted: boolean): void {
    // No-op.
  }

  pauseAll(): void {
    // No-op.
  }

  resumeAll(): void {
    // No-op.
  }

  destroy(): void {
    // No-op.
  }
}
