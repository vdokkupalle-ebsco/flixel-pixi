import { clamp, clamp01 } from '../math/flx-math';
import type { FlxAudioBackend, FlxSoundHandle } from './flx-audio-backend';

interface PendingSoundRequest {
  handle: WebSoundHandle;
  startTime: number;
  loop: boolean;
}

/** Policy used by {@link WebAudioBackend} when document visibility changes. @public */
export type WebAudioVisibilityPolicy = 'continue' | 'suspend';

/** Options for {@link WebAudioBackend}. @public */
export interface WebAudioBackendOptions {
  /** Suspend while hidden and resume when visible. Defaults to `suspend`. */
  visibilityPolicy?: WebAudioVisibilityPolicy;
}

/** @internal */
class WebSoundHandle implements FlxSoundHandle {
  playing = false;
  position = 0;
  readonly duration: number;

  readonly #ctx: AudioContext;
  readonly #gainNode: GainNode;
  readonly #panNode: StereoPannerNode;
  readonly #source: AudioBuffer | HTMLAudioElement;
  readonly #streaming: boolean;
  readonly #queuePlay: (
    handle: WebSoundHandle,
    startTime: number,
    loop: boolean,
  ) => boolean;
  readonly #cancelPending: (handle: WebSoundHandle) => void;
  readonly #onDestroy: (handle: WebSoundHandle) => void;
  #sourceNode: AudioBufferSourceNode | MediaElementAudioSourceNode | null =
    null;
  #startedAt = 0;
  #pausedAt = 0;
  #loop = false;
  #destroyed = false;

  constructor(
    ctx: AudioContext,
    masterGain: GainNode,
    source: AudioBuffer | HTMLAudioElement,
    streaming: boolean,
    queuePlay: (
      handle: WebSoundHandle,
      startTime: number,
      loop: boolean,
    ) => boolean,
    cancelPending: (handle: WebSoundHandle) => void,
    onDestroy: (handle: WebSoundHandle) => void,
  ) {
    this.#ctx = ctx;
    this.#source = source;
    this.#streaming = streaming;
    this.#queuePlay = queuePlay;
    this.#cancelPending = cancelPending;
    this.#onDestroy = onDestroy;
    this.duration =
      source instanceof AudioBuffer ? source.duration : source.duration || 0;

    this.#gainNode = ctx.createGain();
    this.#panNode = ctx.createStereoPanner();
    this.#gainNode.connect(this.#panNode);
    this.#panNode.connect(masterGain);
  }

  play(startTime = 0, loop = false): void {
    if (this.#destroyed) return;
    this.stop();
    this.#loop = loop;

    if (this.#queuePlay(this, startTime, loop)) {
      this.playing = true;
      this.#pausedAt = startTime;
      return;
    }

    if (this.#streaming && this.#source instanceof HTMLAudioElement) {
      const el = this.#source;
      el.currentTime = startTime;
      el.loop = loop;
      if (this.#sourceNode === null) {
        const node = this.#ctx.createMediaElementSource(el);
        node.connect(this.#gainNode);
        this.#sourceNode = node;
      }
      el.play().catch(() => {
        this.playing = false;
      });
    } else if (this.#source instanceof AudioBuffer) {
      const node = this.#ctx.createBufferSource();
      node.buffer = this.#source;
      node.loop = loop;
      node.connect(this.#gainNode);
      node.onended = () => {
        if (!this.#loop || this.#destroyed) {
          this.playing = false;
        }
      };
      node.start(0, startTime);
      this.#sourceNode = node;
      this.#startedAt = this.#ctx.currentTime - startTime;
    }

    this.playing = true;
    this.#pausedAt = 0;
  }

  pause(): void {
    if (!this.playing || this.#destroyed) return;

    this.#cancelPending(this);

    if (this.#streaming && this.#source instanceof HTMLAudioElement) {
      this.#source.pause();
    } else if (this.#sourceNode instanceof AudioBufferSourceNode) {
      this.#pausedAt = this.#ctx.currentTime - this.#startedAt;
      this.#sourceNode.stop();
      this.#sourceNode.disconnect();
      this.#sourceNode = null;
    }

    this.playing = false;
  }

  resume(): void {
    if (this.playing || this.#destroyed) return;

    if (this.#streaming && this.#source instanceof HTMLAudioElement) {
      if (this.#sourceNode === null) {
        const pausedAt = this.#source.currentTime;
        this.play(pausedAt, this.#loop);
        return;
      }
      this.#source.play().catch(() => {
        this.playing = false;
      });
      this.playing = true;
    } else if (this.#source instanceof AudioBuffer) {
      this.play(this.#pausedAt, this.#loop);
    }
  }

  stop(): void {
    if (this.#destroyed) return;

    this.#cancelPending(this);

    if (this.#streaming && this.#source instanceof HTMLAudioElement) {
      this.#source.pause();
      this.#source.currentTime = 0;
    } else if (this.#sourceNode instanceof AudioBufferSourceNode) {
      try {
        this.#sourceNode.stop();
      } catch {
        /* already stopped */
      }
      this.#sourceNode.disconnect();
      this.#sourceNode = null;
    }

    this.playing = false;
    this.position = 0;
    this.#pausedAt = 0;
  }

  setVolume(volume: number): void {
    if (this.#destroyed) return;
    this.#gainNode.gain.value = clamp01(volume);
  }

  setPan(pan: number): void {
    if (this.#destroyed) return;
    this.#panNode.pan.value = clamp(pan, -1, 1);
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.stop();
    this.#destroyed = true;
    this.#sourceNode?.disconnect();
    this.#sourceNode = null;
    this.#gainNode.disconnect();
    this.#panNode.disconnect();
    this.#onDestroy(this);
  }
}

/**
 * Browser `AudioContext` implementation of `FlxAudioBackend`.
 *
 * Creates the `AudioContext` lazily on first play or `unlockAudio()`.
 * Handles autoplay policy via a queue: sounds played before unlock are
 * recorded and replayed on the first user gesture. By default, hiding the
 * document suspends the context and returning resumes it.
 *
 * @public
 */
export class WebAudioBackend implements FlxAudioBackend {
  #ctx: AudioContext | null = null;
  #masterGain: GainNode | null = null;
  #unlocked = false;
  #destroyed = false;
  #globalVolume = 1;
  #globalMuted = false;
  readonly #visibilityPolicy: WebAudioVisibilityPolicy;
  readonly #handles: Set<WebSoundHandle> = new Set<WebSoundHandle>();
  readonly #pendingQueue: PendingSoundRequest[] = [];

  readonly #gestureEvents = ['click', 'keydown', 'touchstart'] as const;
  readonly #boundUnlock = (): void => this.#handleUnlock();
  readonly #boundVisibility = (): void => this.#handleVisibility();

  constructor(options: WebAudioBackendOptions = {}) {
    this.#visibilityPolicy = options.visibilityPolicy ?? 'suspend';
  }

  get unlocked(): boolean {
    return this.#unlocked;
  }

  get suspended(): boolean {
    return this.#ctx?.state === 'suspended';
  }

  unlockAudio(): void {
    if (this.#unlocked || this.#destroyed) return;
    for (const event of this.#gestureEvents) {
      document.addEventListener(event, this.#boundUnlock, { once: false });
    }
  }

  createSound(source: unknown, streaming: boolean): FlxSoundHandle {
    this.#ensureContext();
    const ctx = this.#ctx;
    const masterGain = this.#masterGain;
    if (ctx === null || masterGain === null) {
      throw new Error('AudioContext failed to initialize.');
    }
    let resolvedSource: AudioBuffer | HTMLAudioElement;
    let resolvedStreaming: boolean;
    if (typeof source === 'string') {
      resolvedSource = new Audio(source);
      resolvedSource.preload = streaming ? 'metadata' : 'auto';
      resolvedStreaming = true;
    } else if (
      typeof AudioBuffer !== 'undefined' &&
      source instanceof AudioBuffer
    ) {
      resolvedSource = source;
      resolvedStreaming = false;
    } else if (
      typeof HTMLAudioElement !== 'undefined' &&
      source instanceof HTMLAudioElement
    ) {
      resolvedSource = source;
      resolvedStreaming = true;
    } else {
      throw new TypeError(
        'WebAudioBackend source must be an AudioBuffer, HTMLAudioElement, or URL string.',
      );
    }

    const handle = new WebSoundHandle(
      ctx,
      masterGain,
      resolvedSource,
      resolvedStreaming,
      (candidate, startTime, loop) =>
        this.#queueIfLocked(candidate, startTime, loop),
      (candidate) => this.#cancelPending(candidate),
      (candidate) => this.#handles.delete(candidate),
    );
    this.#handles.add(handle);
    return handle;
  }

  setGlobalVolume(volume: number): void {
    this.#globalVolume = clamp01(volume);
    if (this.#masterGain) {
      this.#masterGain.gain.value = this.#globalMuted ? 0 : this.#globalVolume;
    }
  }

  setGlobalMute(muted: boolean): void {
    this.#globalMuted = muted;
    if (this.#masterGain) {
      this.#masterGain.gain.value = muted ? 0 : this.#globalVolume;
    }
  }

  pauseAll(): void {
    if (this.#ctx?.state === 'running') {
      this.#ctx.suspend().catch(() => {
        /* No-op */
      });
    }
  }

  resumeAll(): void {
    if (this.#ctx?.state === 'suspended') {
      this.#ctx.resume().catch(() => {
        /* No-op */
      });
    }
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;

    for (const event of this.#gestureEvents) {
      document.removeEventListener(event, this.#boundUnlock);
    }
    document.removeEventListener('visibilitychange', this.#boundVisibility);

    for (const handle of [...this.#handles]) handle.destroy();
    this.#handles.clear();
    this.#pendingQueue.length = 0;

    if (this.#ctx) {
      this.#ctx.close().catch(() => {
        /* No-op */
      });
      this.#ctx = null;
    }
  }

  /**
   * Queue a play request if audio is not yet unlocked.
   * Called by `FlxSound` through the handle.
   * @internal
   */
  #queueIfLocked(
    handle: WebSoundHandle,
    startTime: number,
    loop: boolean,
  ): boolean {
    if (this.#unlocked) return false;
    this.#cancelPending(handle);
    this.#pendingQueue.push({
      handle,
      startTime,
      loop,
    });
    return true;
  }

  #cancelPending(handle: WebSoundHandle): void {
    for (let index = this.#pendingQueue.length - 1; index >= 0; index -= 1) {
      if (this.#pendingQueue[index]?.handle === handle) {
        this.#pendingQueue.splice(index, 1);
      }
    }
  }

  #ensureContext(): void {
    if (this.#ctx) return;
    this.#ctx = new AudioContext();
    this.#masterGain = this.#ctx.createGain();
    this.#masterGain.gain.value = this.#globalMuted ? 0 : this.#globalVolume;
    this.#masterGain.connect(this.#ctx.destination);

    if (this.#visibilityPolicy === 'suspend') {
      document.addEventListener('visibilitychange', this.#boundVisibility);
    }
  }

  #handleUnlock(): void {
    if (this.#unlocked) return;
    this.#ensureContext();
    const ctx = this.#ctx;
    if (ctx !== null && ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        /* No-op */
      });
    }

    this.#unlocked = true;

    for (const event of this.#gestureEvents) {
      document.removeEventListener(event, this.#boundUnlock);
    }

    // Drain the pending queue.
    const queued = [...this.#pendingQueue];
    this.#pendingQueue.length = 0;
    for (const entry of queued) {
      entry.handle.play(entry.startTime, entry.loop);
    }
  }

  #handleVisibility(): void {
    if (!this.#ctx || this.#destroyed) return;
    if (document.hidden) {
      this.#ctx.suspend().catch(() => {
        /* No-op */
      });
    } else {
      this.#ctx.resume().catch(() => {
        /* No-op */
      });
    }
  }
}
