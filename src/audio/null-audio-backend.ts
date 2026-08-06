import type { FlxAudioBackend, FlxSoundHandle } from './flx-audio-backend';

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

  setVolume(volume: number): void {
    void volume;
  }

  setPan(pan: number): void {
    void pan;
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

  createSound(source: unknown, streaming: boolean): FlxSoundHandle {
    void source;
    void streaming;
    return new NullSoundHandle();
  }

  setGlobalVolume(volume: number): void {
    void volume;
  }

  setGlobalMute(muted: boolean): void {
    void muted;
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
