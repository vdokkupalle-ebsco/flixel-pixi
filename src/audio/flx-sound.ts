import { FlxBasic } from '../core/flx-basic';
import type { FlxObject } from '../objects/flx-object';
import type { FlxSoundHandle } from './flx-audio-backend';

/**
 * Port of `org.flixel.FlxSound`.
 *
 * Extends `FlxBasic` and drives playback through a `FlxSoundHandle` obtained
 * from the active `FlxAudioBackend`. All authoritative state (volume, fade,
 * proximity, loop, alive/exists) lives on this object; the handle is a
 * platform-specific playback delegate.
 *
 * @public
 */
export class FlxSound extends FlxBasic {
  /** Sound name for identification and debugging. */
  name = '';

  /** Metadata artist string (informational only). */
  artist = '';

  /** Smoothed peak amplitude 0–1 (combined). */
  amplitude = 0;

  /** Smoothed peak amplitude for the left channel (same as `amplitude` in stereo panner). */
  amplitudeLeft = 0;

  /** Smoothed peak amplitude for the right channel (same as `amplitude` in stereo panner). */
  amplitudeRight = 0;

  /** If true, `destroy()` is called automatically when playback finishes. */
  autoDestroy = false;

  /** If true, this sound survives state switches. */
  survive = false;

  /** World x position for proximity audio. */
  x = 0;

  /** World y position for proximity audio. */
  y = 0;

  /** Instance volume before global and proximity scaling (0–1). */
  #volume = 1;

  /** Whether this sound is currently looping. */
  #looping = false;

  /** Whether the sound has been loaded (either embedded or streaming). */
  #loaded = false;

  /** The backend playback handle. */
  #handle: FlxSoundHandle | null = null;

  // --- Fade state ---
  #fadeDirection: 'in' | 'out' | null = null;
  #fadeDuration = 0;
  #fadeElapsed = 0;
  #fadeStartVolume = 0;
  #fadeTargetVolume = 0;
  #fadeCallback: (() => void) | null = null;

  // --- Proximity state ---
  #proximityTarget: FlxObject | null = null;
  #proximityRadius = 0;
  #proximityPan = false;

  /** Global volume multiplier, set by FlxAudioManager. @internal */
  _globalVolume = 1;

  /** Global mute flag, set by FlxAudioManager. @internal */
  _globalMuted = false;

  /** Per-instance volume (0–1). */
  get volume(): number {
    return this.#volume;
  }

  set volume(value: number) {
    this.#volume = Math.max(0, Math.min(1, value));
    this.#syncVolume();
  }

  /** Effective volume accounting for global volume and mute. */
  getActualVolume(): number {
    if (this._globalMuted) return 0;
    return this.#volume * this._globalVolume;
  }

  /**
   * Load an embedded sound asset.
   * @param source - An `AudioBuffer`, URL string, or asset alias.
   * @param loop - Whether the sound should loop.
   * @param autoDestroy - Whether to auto-destroy when done.
   */
  loadEmbedded(source: unknown, loop = false, autoDestroy = false): FlxSound {
    this.#looping = loop;
    this.autoDestroy = autoDestroy;
    this.#loaded = true;
    this._source = source;
    this._streaming = false;
    return this;
  }

  /**
   * Load a streaming sound from a URL.
   * @param url - The streaming URL.
   * @param loop - Whether the sound should loop.
   * @param autoDestroy - Whether to auto-destroy when done.
   */
  loadStream(url: string, loop = false, autoDestroy = false): FlxSound {
    this.#looping = loop;
    this.autoDestroy = autoDestroy;
    this.#loaded = true;
    this._source = url;
    this._streaming = true;
    return this;
  }

  /**
   * Configure proximity-based volume and panning.
   * @param x - Source x position.
   * @param y - Source y position.
   * @param target - The object to measure distance from (typically the player or camera).
   * @param radius - Maximum audible distance.
   * @param pan - Whether to apply stereo panning based on horizontal offset.
   */
  proximity(
    x: number,
    y: number,
    target: FlxObject,
    radius: number,
    pan = true,
  ): FlxSound {
    this.x = x;
    this.y = y;
    this.#proximityTarget = target;
    this.#proximityRadius = Math.max(1, radius);
    this.#proximityPan = pan;
    return this;
  }

  /** Start or restart playback. */
  play(forceRestart = false): void {
    if (!this.exists || !this.#loaded) return;
    if (this.#handle !== null && this.#handle.playing && !forceRestart) return;

    if (this.#handle === null) {
      this.#handle = this._createHandle?.() ?? null;
    }

    if (this.#handle !== null) {
      this.#handle.play(0, this.#looping);
      this.#syncVolume();
    }

    this.active = true;
    this.alive = true;
    this.exists = true;
  }

  /** Pause playback. */
  pause(): void {
    this.#handle?.pause();
  }

  /** Resume from pause. */
  resume(): void {
    this.#handle?.resume();
  }

  /** Stop playback and reset position. */
  stop(): void {
    this.#handle?.stop();
    this.#resetFade();
  }

  /** Fade the volume in from 0 over `duration` seconds. */
  fadeIn(duration: number): void {
    this.#fadeDirection = 'in';
    this.#fadeDuration = Math.max(0.001, duration);
    this.#fadeElapsed = 0;
    this.#fadeStartVolume = 0;
    this.#fadeTargetVolume = this.#volume > 0 ? this.#volume : 1;
    this.#fadeCallback = null;
    this.#volume = 0;

    if (!this.#handle?.playing) {
      this.play();
    }
  }

  /**
   * Fade the volume out over `duration` seconds.
   * @param duration - Fade time in seconds.
   * @param callback - Called when the fade completes.
   */
  fadeOut(duration: number, callback: (() => void) | null = null): void {
    this.#fadeDirection = 'out';
    this.#fadeDuration = Math.max(0.001, duration);
    this.#fadeElapsed = 0;
    this.#fadeStartVolume = this.#volume;
    this.#fadeTargetVolume = 0;
    this.#fadeCallback = callback;
  }

  /** Kill the sound: stop playback and mark dead/nonexistent. */
  override kill(): void {
    this.stop();
    super.kill();
  }

  /** Per-frame update: fades, proximity, auto-destroy, amplitude. */
  override update(): void {
    if (!this.exists || !this.active) return;

    // --- Fade ---
    if (this.#fadeDirection !== null) {
      this.#fadeElapsed += this._elapsed;
      const t = Math.min(1, this.#fadeElapsed / this.#fadeDuration);
      this.#volume =
        this.#fadeStartVolume +
        (this.#fadeTargetVolume - this.#fadeStartVolume) * t;

      if (t >= 1) {
        const cb = this.#fadeCallback;
        this.#resetFade();
        if (this.#fadeDirection === 'out' || this.#volume <= 0) {
          this.stop();
        }
        this.#fadeDirection = null;
        cb?.();
      }
    }

    // --- Proximity ---
    if (this.#proximityTarget !== null) {
      const dx = this.x - this.#proximityTarget.x;
      const dy = this.y - this.#proximityTarget.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const proximityVolume = Math.max(0, 1 - dist / this.#proximityRadius);

      this.#handle?.setVolume(proximityVolume * this.getActualVolume());

      if (this.#proximityPan && this.#handle) {
        const pan = Math.max(-1, Math.min(1, dx / this.#proximityRadius));
        this.#handle.setPan(pan);
      }
    } else {
      this.#syncVolume();
    }

    // --- Amplitude (approximate) ---
    if (this.#handle?.playing) {
      this.amplitude = this.getActualVolume();
    } else {
      this.amplitude = 0;
    }
    this.amplitudeLeft = this.amplitude;
    this.amplitudeRight = this.amplitude;

    // --- Auto-destroy ---
    if (
      this.autoDestroy &&
      this.#handle !== null &&
      !this.#handle.playing &&
      this.#fadeDirection === null
    ) {
      this.destroy();
    }
  }

  /** Release the backend handle and clean up. */
  override destroy(): void {
    this.stop();
    this.exists = false;
    this.active = false;
    this.#handle?.destroy();
    this.#handle = null;
    this.#proximityTarget = null;
    this.#fadeCallback = null;
    this.#loaded = false;
    super.destroy();
  }

  // --- Internal hooks for FlxAudioManager ---

  /**
   * Factory function injected by `FlxAudioManager` to create a handle from the
   * backend. Set before `play()` is called.
   * @internal
   */
  _createHandle: (() => FlxSoundHandle) | null = null;

  /**
   * Stashed source asset for handle creation. @internal
   */
  _source: unknown = null;

  /**
   * Whether the source is streaming. @internal
   */
  _streaming = false;

  /**
   * Elapsed time injected by `FlxAudioManager.updateSounds()`. @internal
   */
  _elapsed = 0;

  /**
   * The playback handle, exposed read-only for the manager. @internal
   */
  get _handle(): FlxSoundHandle | null {
    return this.#handle;
  }

  #syncVolume(): void {
    this.#handle?.setVolume(this.getActualVolume());
  }

  #resetFade(): void {
    this.#fadeDirection = null;
    this.#fadeDuration = 0;
    this.#fadeElapsed = 0;
    this.#fadeCallback = null;
  }
}
