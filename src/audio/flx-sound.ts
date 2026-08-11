import { FlxBasic } from '../core/flx-basic';
import { FlxG } from '../core/flx-g';
import type { FlxCameraLike, FlxObject } from '../objects/flx-object';
import type { FlxSoundHandle } from './flx-audio-backend';
import type { FlxSoundGroup } from './flx-sound-group';

/** Behavior used by an attached sound after its source leaves the viewport. @public */
export type FlxSoundOffscreenBehavior = 'pause' | 'stop';

/** Configuration for {@link FlxSound.attachTo}. @public */
export interface FlxSoundAttachmentOptions {
  /** Object used as the center of hearing, normally the player. */
  listener: FlxObject;
  /** Maximum audible distance in logical world units. */
  radius: number;
  /** Apply player-relative left/right stereo panning. Defaults to true. */
  pan?: boolean;
  /** Gate playback by camera visibility. Defaults to `visible`. */
  viewport?: 'ignore' | 'visible';
  /** Pause in place or stop/restart after leaving the viewport. Defaults to `pause`. */
  offscreen?: FlxSoundOffscreenBehavior;
  /** Extra logical pixels beyond the viewport before suspending. Defaults to 0. */
  margin?: number;
  /** Override the source object's cameras for visibility checks. */
  cameras?: readonly FlxCameraLike[];
}

interface ResolvedSoundAttachmentOptions {
  listener: FlxObject;
  radius: number;
  pan: boolean;
  viewport: 'ignore' | 'visible';
  offscreen: FlxSoundOffscreenBehavior;
  margin: number;
  cameras?: readonly FlxCameraLike[];
}

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
  #group: FlxSoundGroup | null = null;

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
  #proximityVolume = 1;
  #attachmentSource: FlxObject | null = null;
  #attachmentOptions: ResolvedSoundAttachmentOptions | null = null;
  #attachmentSuspended = false;

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

  /** Hierarchical volume/mute bus used by this sound. */
  get group(): FlxSoundGroup | null {
    return this.#group;
  }

  set group(value: FlxSoundGroup | null) {
    if (value === this.#group) return;
    if (value === null) this.#group?.remove(this);
    else value.add(this);
  }

  /** Effective volume accounting for global volume and mute. */
  getActualVolume(): number {
    if (this._globalMuted || this.#group?.muted) return 0;
    return this.#volume * this._globalVolume * (this.#group?.actualVolume ?? 1);
  }

  /** Effective gain after global, group, instance, and proximity attenuation. */
  get effectiveVolume(): number {
    return this.getActualVolume() * this.#proximityVolume;
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

  /**
   * Follow a world object and spatialize it relative to a listener.
   * Camera visibility may pause or stop playback automatically.
   */
  attachTo(source: FlxObject, options: FlxSoundAttachmentOptions): FlxSound {
    if (!(options.radius > 0) || !Number.isFinite(options.radius)) {
      throw new RangeError(
        'FlxSound attachment radius must be finite and greater than 0.',
      );
    }
    const margin = options.margin ?? 0;
    if (!Number.isFinite(margin) || margin < 0) {
      throw new RangeError(
        'FlxSound attachment margin must be finite and at least 0.',
      );
    }
    if (this.#attachmentSource !== null) this.detach();
    this.#attachmentSource = source;
    this.#attachmentOptions = {
      listener: options.listener,
      radius: options.radius,
      pan: options.pan ?? true,
      viewport: options.viewport ?? 'visible',
      offscreen: options.offscreen ?? 'pause',
      margin,
      ...(options.cameras === undefined ? {} : { cameras: options.cameras }),
    };
    this.#syncAttachmentPosition();
    this.proximity(
      this.x,
      this.y,
      options.listener,
      options.radius,
      options.pan ?? true,
    );
    return this;
  }

  /** Stop following the attached object and restore ordinary playback. */
  detach(): FlxSound {
    if (this.#attachmentSuspended) this.#resumeAttachmentPlayback();
    this.#attachmentSource = null;
    this.#attachmentOptions = null;
    this.#attachmentSuspended = false;
    this.#proximityTarget = null;
    this.#proximityVolume = 1;
    this.#handle?.setPan(0);
    this.#syncVolume();
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

    if (this.#attachmentSource !== null && this.#attachmentOptions !== null) {
      this.#syncAttachmentPosition();
      if (!this.#attachmentVisible()) {
        this.#proximityVolume = 0;
        this.#suspendAttachmentPlayback();
        this.amplitude = 0;
        this.amplitudeLeft = 0;
        this.amplitudeRight = 0;
        return;
      }
      if (this.#attachmentSuspended) this.#resumeAttachmentPlayback();
    }

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
    let effectiveVolume = this.getActualVolume();
    if (this.#proximityTarget !== null) {
      const useCenter = this.#attachmentOptions !== null;
      const targetX =
        this.#proximityTarget.x +
        (useCenter ? this.#proximityTarget.width / 2 : 0);
      const targetY =
        this.#proximityTarget.y +
        (useCenter ? this.#proximityTarget.height / 2 : 0);
      const dx = this.x - targetX;
      const dy = this.y - targetY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const proximityVolume = Math.max(0, 1 - dist / this.#proximityRadius);

      this.#proximityVolume = proximityVolume;
      effectiveVolume *= this.#proximityVolume;
      this.#handle?.setVolume(effectiveVolume);

      if (this.#proximityPan && this.#handle) {
        const pan = Math.max(-1, Math.min(1, dx / this.#proximityRadius));
        this.#handle.setPan(pan);
      }
    } else {
      this.#proximityVolume = 1;
      this.#syncVolume();
    }

    // --- Amplitude (approximate) ---
    if (this.#handle?.playing) {
      this.amplitude = effectiveVolume;
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
    this.#group?.remove(this);
    this.#attachmentSource = null;
    this.#attachmentOptions = null;
    this.#attachmentSuspended = false;
    this.#proximityTarget = null;
    this.#proximityVolume = 1;
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

  /** @internal */
  _setGroup(group: FlxSoundGroup | null): void {
    this.#group = group;
    this.#syncVolume();
  }

  /** @internal */
  _syncGroupVolume(): void {
    this.#syncVolume();
  }

  #syncVolume(): void {
    this.#handle?.setVolume(this.effectiveVolume);
  }

  #syncAttachmentPosition(): void {
    const source = this.#attachmentSource;
    if (source === null) return;
    this.x = source.x + source.width / 2;
    this.y = source.y + source.height / 2;
  }

  #attachmentVisible(): boolean {
    const source = this.#attachmentSource;
    const options = this.#attachmentOptions;
    if (source === null || options === null || options.viewport === 'ignore') {
      return true;
    }
    if (!source.exists || !source.visible) return false;
    const cameras = options.cameras ?? source.cameras ?? FlxG.cameras;
    const margin = this.#attachmentSuspended ? 0 : options.margin;
    return cameras.some((camera) => {
      const point = source.getScreenXY(undefined, camera);
      return (
        point.x + source.width > -margin &&
        point.x < camera.width + margin &&
        point.y + source.height > -margin &&
        point.y < camera.height + margin
      );
    });
  }

  #suspendAttachmentPlayback(): void {
    if (this.#attachmentSuspended || !this.#handle?.playing) return;
    this.#attachmentSuspended = true;
    if (this.#attachmentOptions?.offscreen === 'stop') this.stop();
    else this.pause();
  }

  #resumeAttachmentPlayback(): void {
    if (!this.#attachmentSuspended) return;
    const behavior = this.#attachmentOptions?.offscreen;
    this.#attachmentSuspended = false;
    if (behavior === 'stop') this.play(true);
    else this.resume();
  }

  #resetFade(): void {
    this.#fadeDirection = null;
    this.#fadeDuration = 0;
    this.#fadeElapsed = 0;
    this.#fadeCallback = null;
  }
}
