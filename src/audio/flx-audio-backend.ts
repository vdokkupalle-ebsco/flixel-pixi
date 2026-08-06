/** Service token for the audio manager. @public */
export const FLX_AUDIO_SERVICE = Symbol('flixel-pixi.audio');

/**
 * Low-level handle to a single playing sound, owned by a backend.
 * `FlxSound` drives playback through this interface.
 * @public
 */
export interface FlxSoundHandle {
  play(startTime?: number, loop?: boolean): void;
  pause(): void;
  resume(): void;
  stop(): void;
  setVolume(volume: number): void;
  setPan(pan: number): void;
  readonly playing: boolean;
  readonly position: number;
  readonly duration: number;
  destroy(): void;
}

/**
 * Replaceable audio backend.  The browser implementation wraps Web Audio API;
 * the null implementation enables headless testing.
 * @public
 */
export interface FlxAudioBackend {
  readonly unlocked: boolean;
  readonly suspended: boolean;

  /** Wire gesture listeners (click/keydown/touchstart) to unlock audio. */
  unlockAudio(): void;

  /**
   * Create a sound handle.
   * @param source - decoded `AudioBuffer`, URL string, or `HTMLAudioElement`.
   * @param streaming - true to use a media-element source node.
   */
  createSound(
    source: unknown,
    streaming: boolean,
  ): FlxSoundHandle;

  setGlobalVolume(volume: number): void;
  setGlobalMute(muted: boolean): void;
  pauseAll(): void;
  resumeAll(): void;
  destroy(): void;
}
