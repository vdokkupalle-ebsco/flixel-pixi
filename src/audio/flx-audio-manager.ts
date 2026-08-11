import type { FlxContext } from '../core/flx-context';
import { FlxGroup } from '../core/flx-group';
import { FLX_AUDIO_SERVICE, type FlxAudioBackend } from './flx-audio-backend';
import { FlxSound } from './flx-sound';
import { FlxSoundGroup } from './flx-sound-group';

/**
 * Audio service interface consumed by `FlxG` and `FlxGame`.
 * @public
 */
export interface FlxAudioService {
  music: FlxSound | null;
  readonly sounds: FlxGroup;
  volume: number;
  mute: boolean;
  readonly soundGroup: FlxSoundGroup;
  readonly musicGroup: FlxSoundGroup;
  /** Subscribe to master volume/mute changes when supported. */
  onChange?(listener: (state: FlxAudioState) => void): () => void;

  play(
    source: unknown,
    volume?: number,
    loop?: boolean,
    autoDestroy?: boolean,
    group?: FlxSoundGroup,
  ): FlxSound;

  playMusic(source: unknown, volume?: number, group?: FlxSoundGroup): void;

  stream(
    url: string,
    volume?: number,
    loop?: boolean,
    autoDestroy?: boolean,
    group?: FlxSoundGroup,
  ): FlxSound;

  pauseSounds(): void;
  resumeSounds(): void;
  updateSounds(elapsed: number): void;
  destroySounds(forceDestroy: boolean): void;
  destroy(): void;
}

/** Serializable master audio preferences. @public */
export interface FlxAudioState {
  /** Whether master audio is muted. */
  readonly mute: boolean;
  /** Master gain from 0 through 1. */
  readonly volume: number;
}

/**
 * Owns the audio backend, the music singleton, and the sound-effects group.
 *
 * Registered on the `FlxContext` service map via `FLX_AUDIO_SERVICE`.
 * `FlxG` resolves it to expose `FlxG.music`, `FlxG.sounds`, `FlxG.play()`,
 * `FlxG.playMusic()`, `FlxG.stream()`, `FlxG.volume`, `FlxG.mute`,
 * `FlxG.pauseSounds()`, and `FlxG.resumeSounds()`.
 *
 * @public
 */
export class FlxAudioManager implements FlxAudioService {
  music: FlxSound | null = null;
  readonly sounds: FlxGroup = new FlxGroup();
  readonly soundGroup = new FlxSoundGroup('sound');
  readonly musicGroup = new FlxSoundGroup('music');

  #volume = 0.5;
  #muted = false;
  readonly #listeners = new Set<(state: FlxAudioState) => void>();
  readonly #backend: FlxAudioBackend;
  readonly #context: FlxContext;

  constructor(context: FlxContext, backend: FlxAudioBackend) {
    const existing = context.getService<FlxAudioService>(FLX_AUDIO_SERVICE);
    if (existing !== undefined) {
      throw new Error('An audio service is already installed in this context.');
    }
    this.#context = context;
    this.#backend = backend;
    this.#backend.unlockAudio();
    context.setService(FLX_AUDIO_SERVICE, this);
  }

  get volume(): number {
    return this.#volume;
  }

  set volume(value: number) {
    const next = Math.max(0, Math.min(1, value));
    if (next === this.#volume) return;
    this.#volume = next;
    this.#propagateGlobals();
    this.#emitChange();
  }

  get mute(): boolean {
    return this.#muted;
  }

  set mute(value: boolean) {
    if (value === this.#muted) return;
    this.#muted = value;
    this.#propagateGlobals();
    this.#emitChange();
  }

  /** Subscribe to master audio preference changes. */
  onChange(listener: (state: FlxAudioState) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /**
   * Play a sound effect.
   * @param source - `AudioBuffer`, `HTMLAudioElement`, or URL string.
   * @param volume - Per-instance volume (0–1). Defaults to 1.
   * @param loop - Whether to loop. Defaults to false.
   * @param autoDestroy - Whether to auto-destroy when done. Defaults to true.
   */
  play(
    source: unknown,
    volume = 1,
    loop = false,
    autoDestroy = true,
    group = this.soundGroup,
  ): FlxSound {
    const sound = this.#createSound(
      source,
      false,
      volume,
      loop,
      autoDestroy,
      group,
    );
    this.sounds.add(sound);
    sound.play();
    return sound;
  }

  /**
   * Play music, stopping the current track.
   * @param source - `AudioBuffer`, `HTMLAudioElement`, or URL string.
   * @param volume - Volume (0–1). Defaults to 1.
   */
  playMusic(source: unknown, volume = 1, group = this.musicGroup): void {
    if (this.music !== null) {
      this.music.stop();
      this.music.destroy();
    }
    this.music = this.#createSound(source, false, volume, true, false, group);
    this.music.survive = true;
    this.music.play();
  }

  /**
   * Play a streaming sound from a URL.
   * @param url - The streaming URL.
   * @param volume - Per-instance volume (0–1). Defaults to 1.
   * @param loop - Whether to loop. Defaults to false.
   * @param autoDestroy - Whether to auto-destroy when done. Defaults to true.
   */
  stream(
    url: string,
    volume = 1,
    loop = false,
    autoDestroy = true,
    group = this.soundGroup,
  ): FlxSound {
    const sound = this.#createSound(
      url,
      true,
      volume,
      loop,
      autoDestroy,
      group,
    );
    this.sounds.add(sound);
    sound.play();
    return sound;
  }

  /** Pause all sounds and music. */
  pauseSounds(): void {
    this.music?.pause();
    for (const member of this.sounds.members) {
      if (member instanceof FlxSound) member.pause();
    }
    this.#backend.pauseAll();
  }

  /** Resume all sounds and music. */
  resumeSounds(): void {
    this.#backend.resumeAll();
    this.music?.resume();
    for (const member of this.sounds.members) {
      if (member instanceof FlxSound) member.resume();
    }
  }

  /** Called by `FlxGame.step()` to advance fades, proximity, and auto-destroy. */
  updateSounds(elapsed: number): void {
    if (this.music !== null) {
      this.music._elapsed = elapsed;
      if (this.music.exists && this.music.active) {
        this.music.update();
      }
    }

    for (let index = this.sounds.members.length - 1; index >= 0; index -= 1) {
      const member = this.sounds.members[index];
      if (!(member instanceof FlxSound)) continue;
      if (member.exists && member.active) {
        member._elapsed = elapsed;
        member.update();
      }
      if (!member.exists) this.sounds.remove(member);
    }
  }

  /**
   * Remove non-survive sounds on state switch.
   * @param forceDestroy - If true, destroy survive sounds too.
   */
  destroySounds(forceDestroy: boolean): void {
    // Clean effects.
    for (let i = this.sounds.members.length - 1; i >= 0; i -= 1) {
      const member = this.sounds.members[i];
      if (member instanceof FlxSound) {
        if (forceDestroy || !member.survive) {
          member.destroy();
          this.sounds.remove(member);
        }
      }
    }

    // Clean music only on force.
    if (forceDestroy && this.music !== null) {
      this.music.destroy();
      this.music = null;
    }
  }

  /** Full teardown. */
  destroy(): void {
    this.destroySounds(true);
    this.sounds.destroy();
    this.soundGroup.destroy();
    this.musicGroup.destroy();
    this.#backend.destroy();
    this.#listeners.clear();
    this.#context.removeService(FLX_AUDIO_SERVICE);
  }

  #createSound(
    source: unknown,
    streaming: boolean,
    volume: number,
    loop: boolean,
    autoDestroy: boolean,
    group: FlxSoundGroup,
  ): FlxSound {
    const sound = new FlxSound();
    sound._globalVolume = this.#volume;
    sound._globalMuted = this.#muted;
    sound._createHandle = () => this.#backend.createSound(source, streaming);
    sound.group = group;

    if (streaming) {
      sound.loadStream(source as string, loop, autoDestroy);
    } else {
      sound.loadEmbedded(source, loop, autoDestroy);
    }

    sound.volume = volume;
    return sound;
  }

  #propagateGlobals(): void {
    if (this.music !== null) {
      this.music._globalVolume = this.#volume;
      this.music._globalMuted = this.#muted;
    }
    for (const member of this.sounds.members) {
      if (member instanceof FlxSound) {
        member._globalVolume = this.#volume;
        member._globalMuted = this.#muted;
      }
    }
  }

  #emitChange(): void {
    const state = Object.freeze({ mute: this.#muted, volume: this.#volume });
    for (const listener of [...this.#listeners]) listener(state);
  }
}
