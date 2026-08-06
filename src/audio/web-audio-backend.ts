import type {
  FlxAudioBackend,
  FlxSoundHandle,
} from './flx-audio-backend';

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
  ) {
    this.#ctx = ctx;
    this.#source = source;
    this.#streaming = streaming;
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
        /* autoplay blocked — queued by backend */
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
      this.#source.play().catch(() => {});
      this.playing = true;
    } else if (this.#source instanceof AudioBuffer) {
      this.play(this.#pausedAt, this.#loop);
    }
  }

  stop(): void {
    if (this.#destroyed) return;

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
    this.#gainNode.gain.value = Math.max(0, Math.min(1, volume));
  }

  setPan(pan: number): void {
    if (this.#destroyed) return;
    this.#panNode.pan.value = Math.max(-1, Math.min(1, pan));
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.stop();
    this.#gainNode.disconnect();
    this.#panNode.disconnect();
  }
}

/**
 * Browser `AudioContext` implementation of `FlxAudioBackend`.
 *
 * Creates the `AudioContext` lazily on first play or `unlockAudio()`.
 * Handles autoplay policy via a queue: sounds played before unlock are
 * recorded and replayed on the first user gesture. Focus loss suspends
 * the context; visibility return resumes it.
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
  readonly #handles: Set<WebSoundHandle> = new Set();
  readonly #pendingQueue: Array<{
    handle: WebSoundHandle;
    startTime: number;
    loop: boolean;
  }> = [];

  readonly #gestureEvents = ['click', 'keydown', 'touchstart'] as const;
  readonly #boundUnlock = (): void => this.#handleUnlock();
  readonly #boundVisibility = (): void => this.#handleVisibility();

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

  createSound(
    source: unknown,
    streaming: boolean,
  ): FlxSoundHandle {
    this.#ensureContext();
    const handle = new WebSoundHandle(
      this.#ctx!,
      this.#masterGain!,
      source as AudioBuffer | HTMLAudioElement,
      streaming,
    );
    this.#handles.add(handle);
    return handle;
  }

  setGlobalVolume(volume: number): void {
    this.#globalVolume = Math.max(0, Math.min(1, volume));
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
    for (const handle of this.#handles) {
      if (handle.playing) handle.pause();
    }
  }

  resumeAll(): void {
    if (this.#ctx?.state === 'suspended') {
      this.#ctx.resume().catch(() => {});
    }
    for (const handle of this.#handles) {
      handle.resume();
    }
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;

    for (const event of this.#gestureEvents) {
      document.removeEventListener(event, this.#boundUnlock);
    }
    document.removeEventListener('visibilitychange', this.#boundVisibility);

    for (const handle of this.#handles) handle.destroy();
    this.#handles.clear();
    this.#pendingQueue.length = 0;

    if (this.#ctx) {
      this.#ctx.close().catch(() => {});
      this.#ctx = null;
    }
  }

  /**
   * Queue a play request if audio is not yet unlocked.
   * Called by `FlxSound` through the handle.
   * @internal
   */
  queueIfLocked(
    handle: FlxSoundHandle,
    startTime: number,
    loop: boolean,
  ): boolean {
    if (this.#unlocked) return false;
    this.#pendingQueue.push({
      handle: handle as WebSoundHandle,
      startTime,
      loop,
    });
    return true;
  }

  #ensureContext(): void {
    if (this.#ctx) return;
    this.#ctx = new AudioContext();
    this.#masterGain = this.#ctx.createGain();
    this.#masterGain.gain.value = this.#globalMuted ? 0 : this.#globalVolume;
    this.#masterGain.connect(this.#ctx.destination);

    document.addEventListener('visibilitychange', this.#boundVisibility);
  }

  #handleUnlock(): void {
    if (this.#unlocked) return;
    this.#ensureContext();

    if (this.#ctx!.state === 'suspended') {
      this.#ctx!.resume().catch(() => {});
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
      this.#ctx.suspend().catch(() => {});
    } else {
      this.#ctx.resume().catch(() => {});
    }
  }
}
