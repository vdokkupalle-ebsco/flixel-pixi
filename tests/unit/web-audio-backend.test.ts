// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WebAudioBackend } from '../../src/audio/web-audio-backend';

class FakeAudioBuffer {
  duration = 2;
}

class FakeGainNode {
  gain = { value: 1 };
  connect(): void {
    return undefined;
  }
  disconnect(): void {
    return undefined;
  }
}

class FakeStereoPannerNode {
  pan = { value: 0 };
  connect(): void {
    return undefined;
  }
  disconnect(): void {
    return undefined;
  }
}

class FakeBufferSourceNode {
  buffer: FakeAudioBuffer | null = null;
  loop = false;
  onended: (() => void) | null = null;
  started = false;
  stopped = false;
  connect(): void {
    return undefined;
  }
  disconnect(): void {
    return undefined;
  }
  start(): void {
    this.started = true;
  }
  stop(): void {
    this.stopped = true;
  }
}

class FakeMediaSourceNode {
  connect(): void {
    return undefined;
  }
  disconnect(): void {
    return undefined;
  }
}

class FakeAudioElement {
  currentTime = 0;
  duration = 3;
  loop = false;
  preload = '';
  playCalls = 0;
  pauseCalls = 0;
  constructor(readonly src = '') {}
  play(): Promise<void> {
    this.playCalls += 1;
    return Promise.resolve();
  }
  pause(): void {
    this.pauseCalls += 1;
  }
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: AudioContextState = 'suspended';
  resumeCalls = 0;
  suspendCalls = 0;
  currentTime = 0;
  destination = {};
  readonly bufferSources: FakeBufferSourceNode[] = [];
  readonly gains: FakeGainNode[] = [];
  readonly mediaElements: FakeAudioElement[] = [];
  readonly panners: FakeStereoPannerNode[] = [];
  constructor() {
    FakeAudioContext.instances.push(this);
  }
  createGain(): FakeGainNode {
    const node = new FakeGainNode();
    this.gains.push(node);
    return node;
  }
  createStereoPanner(): FakeStereoPannerNode {
    const node = new FakeStereoPannerNode();
    this.panners.push(node);
    return node;
  }
  createBufferSource(): FakeBufferSourceNode {
    const node = new FakeBufferSourceNode();
    this.bufferSources.push(node);
    return node;
  }
  createMediaElementSource(element: FakeAudioElement): FakeMediaSourceNode {
    this.mediaElements.push(element);
    return new FakeMediaSourceNode();
  }
  resume(): Promise<void> {
    this.resumeCalls += 1;
    this.state = 'running';
    return Promise.resolve();
  }
  suspend(): Promise<void> {
    this.suspendCalls += 1;
    this.state = 'suspended';
    return Promise.resolve();
  }
  close(): Promise<void> {
    this.state = 'closed';
    return Promise.resolve();
  }
}

describe('WebAudioBackend', () => {
  beforeEach(() => {
    FakeAudioContext.instances.length = 0;
    vi.stubGlobal('AudioBuffer', FakeAudioBuffer);
    vi.stubGlobal('AudioBufferSourceNode', FakeBufferSourceNode);
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('HTMLAudioElement', FakeAudioElement);
    vi.stubGlobal('MediaElementAudioSourceNode', FakeMediaSourceNode);
    vi.stubGlobal('Audio', FakeAudioElement);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('queues AudioBuffer playback until the first gesture and stops on destroy', () => {
    const backend = new WebAudioBackend();
    backend.unlockAudio();
    const handle = backend.createSound(new FakeAudioBuffer(), false);
    const context = FakeAudioContext.instances[0];
    expect(context).toBeDefined();

    handle.play();
    expect(handle.playing).toBe(true);
    expect(context?.bufferSources).toHaveLength(0);

    document.dispatchEvent(new Event('click'));
    expect(backend.unlocked).toBe(true);
    expect(context?.bufferSources).toHaveLength(1);
    expect(context?.bufferSources[0]?.started).toBe(true);

    handle.destroy();
    expect(context?.bufferSources[0]?.stopped).toBe(true);
    backend.destroy();
  });

  it('turns URL strings into media elements and cancels stopped queued play', () => {
    const backend = new WebAudioBackend();
    backend.unlockAudio();
    const cancelled = backend.createSound('/sound.ogg', true);
    cancelled.play();
    cancelled.stop();

    document.dispatchEvent(new Event('click'));
    const context = FakeAudioContext.instances[0];
    expect(context?.mediaElements).toHaveLength(0);

    const playing = backend.createSound('/music.ogg', false);
    playing.play();
    expect(context?.mediaElements).toHaveLength(1);
    expect(context?.mediaElements[0]?.src).toBe('/music.ogg');
    expect(context?.mediaElements[0]?.playCalls).toBe(1);
    backend.destroy();
  });

  it('reconnects a queued stream to gain and pan after pausing offscreen', () => {
    const backend = new WebAudioBackend();
    backend.unlockAudio();
    const handle = backend.createSound('/ambience.wav', true);
    const context = FakeAudioContext.instances[0];
    expect(context).toBeDefined();
    if (!context) throw new Error('Expected an AudioContext instance.');

    handle.play();
    handle.pause();
    handle.setVolume(0.25);
    handle.setPan(-0.5);
    handle.resume();

    expect(context.mediaElements).toHaveLength(0);
    document.dispatchEvent(new Event('click'));
    expect(context.mediaElements).toHaveLength(1);
    expect(context.gains[1]?.gain.value).toBe(0.25);
    expect(context.panners[0]?.pan.value).toBe(-0.5);
    expect(context.mediaElements[0]?.playCalls).toBe(1);
    backend.destroy();
  });

  it('rejects unsupported source values', () => {
    const backend = new WebAudioBackend();
    expect(() => backend.createSound({ alias: 'missing' }, false)).toThrow(
      TypeError,
    );
    backend.destroy();
  });

  it('suspends and resumes with document visibility by default', () => {
    const backend = new WebAudioBackend();
    backend.createSound('/music.ogg', true);
    const context = FakeAudioContext.instances[0];
    expect(context).toBeDefined();
    if (!context) throw new Error('Expected an AudioContext instance.');

    context.state = 'running';
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(context?.suspendCalls).toBe(1);

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(context?.resumeCalls).toBe(1);
    backend.destroy();
  });

  it('can leave audio running across document visibility changes', () => {
    const backend = new WebAudioBackend({ visibilityPolicy: 'continue' });
    backend.createSound('/music.ogg', true);
    const context = FakeAudioContext.instances[0];
    expect(context).toBeDefined();
    if (!context) throw new Error('Expected an AudioContext instance.');

    context.state = 'running';
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(context?.suspendCalls).toBe(0);
    expect(context?.resumeCalls).toBe(0);
    backend.destroy();
  });
});
