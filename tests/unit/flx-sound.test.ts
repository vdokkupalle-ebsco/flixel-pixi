import { describe, expect, it } from 'vitest';
import { FlxSound } from '../../src/audio/flx-sound';
import { FlxSoundGroup } from '../../src/audio/flx-sound-group';
import {
  FLX_AUDIO_SERVICE,
  type FlxSoundHandle,
} from '../../src/audio/flx-audio-backend';
import {
  FlxAudioManager,
  type FlxAudioService,
} from '../../src/audio/flx-audio-manager';
import { NullAudioBackend } from '../../src/audio/null-audio-backend';
import { FlxContext } from '../../src/core/flx-context';
import { FlxG } from '../../src/core/flx-g';
import { FlxGame } from '../../src/core/flx-game';
import { FlxState } from '../../src/core/flx-state';
import { FlxObject } from '../../src/objects/flx-object';

class TestState extends FlxState {}

class RecordingSoundHandle implements FlxSoundHandle {
  playing = false;
  position = 0;
  duration = 10;
  volume = 1;
  pan = 0;
  pauseCalls = 0;
  resumeCalls = 0;
  playCalls = 0;

  play(): void {
    this.playCalls += 1;
    this.playing = true;
  }
  pause(): void {
    this.pauseCalls += 1;
    this.playing = false;
  }
  resume(): void {
    this.resumeCalls += 1;
    this.playing = true;
  }
  stop(): void {
    this.playing = false;
    this.position = 0;
  }
  setVolume(volume: number): void {
    this.volume = volume;
  }
  setPan(pan: number): void {
    this.pan = pan;
  }
  destroy(): void {
    this.playing = false;
  }
}

class RecordingAudioBackend extends NullAudioBackend {
  readonly handles: RecordingSoundHandle[] = [];

  override createSound(): FlxSoundHandle {
    const handle = new RecordingSoundHandle();
    this.handles.push(handle);
    return handle;
  }
}

describe('FlxSound and FlxAudioManager', () => {
  it('manages sound lifecycle, playback, and properties', () => {
    const context = new FlxContext(320, 240);
    const backend = new NullAudioBackend();
    const manager = new FlxAudioManager(context, backend);

    const sound = new FlxSound();
    sound._createHandle = () => backend.createSound('test.mp3', false);
    sound.loadEmbedded('test.mp3', false, false);

    sound._globalVolume = manager.volume; // 0.5
    expect(sound.volume).toBe(1);
    expect(sound.getActualVolume()).toBe(0.5);

    sound.play();
    expect(sound.alive).toBe(true);
    expect(sound.exists).toBe(true);

    sound.pause();
    sound.resume();
    sound.stop();

    sound.volume = 0.8;
    expect(sound.volume).toBe(0.8);

    // Auto destroy when handle is set but not playing
    sound.autoDestroy = true;
    sound.play();
    sound.stop();
    sound.update();
    expect(sound.exists).toBe(false);
    manager.destroy();
  });

  it('handles volume fading in and out over update ticks', () => {
    const sound = new FlxSound();
    sound._createHandle = () =>
      new NullAudioBackend().createSound('test.mp3', false);
    sound.loadEmbedded('test.mp3');

    sound.fadeIn(1.0);
    expect(sound.volume).toBe(0);

    sound._elapsed = 0.5;
    sound.update();
    expect(sound.volume).toBeCloseTo(0.5, 2);

    sound._elapsed = 0.5;
    sound.update();
    expect(sound.volume).toBeCloseTo(1.0, 2);

    let fadeOutDone = false;
    sound.fadeOut(1.0, () => {
      fadeOutDone = true;
    });

    sound._elapsed = 0.5;
    sound.update();
    expect(sound.volume).toBeCloseTo(0.5, 2);

    sound._elapsed = 0.5;
    sound.update();
    expect(sound.volume).toBeCloseTo(0, 2);
    expect(fadeOutDone).toBe(true);
  });

  it('calculates proximity volume and stereo panning', () => {
    const sound = new FlxSound();
    sound._createHandle = () =>
      new NullAudioBackend().createSound('test.mp3', false);
    sound.loadEmbedded('test.mp3');

    const listener = new FlxObject(100, 100, 10, 10);
    sound.proximity(50, 100, listener, 100, true);
    sound.play();

    sound._elapsed = 0.1;
    sound.update();

    // Distance is 50, radius is 100 -> proximity volume is 0.5
    expect(sound.amplitude).toBeGreaterThan(0);

    sound.destroy();
    listener.destroy();
  });

  it('integrates with FlxG static facade and FlxGame step loop', () => {
    const game = new FlxGame(
      320,
      240,
      TestState,
      1,
      60,
      30,
      false,
      {},
      new NullAudioBackend(),
    );

    FlxG.volume = 0.8;
    expect(FlxG.volume).toBe(0.8);

    FlxG.mute = true;
    expect(FlxG.mute).toBe(true);
    FlxG.mute = false;

    FlxG.playMusic('bgm1.mp3', 0.6);
    expect(FlxG.music).not.toBeNull();
    expect(FlxG.music?.survive).toBe(true);

    // Play music again to cover replacing existing music track
    FlxG.playMusic('bgm2.mp3', 0.8);
    expect(FlxG.music).not.toBeNull();

    const streamSound = FlxG.stream(
      'http://example.com/audio.mp3',
      0.5,
      true,
      false,
    );
    expect(streamSound.exists).toBe(true);
    streamSound.kill();
    expect(streamSound.exists).toBe(false);

    const sfx = FlxG.play('sfx.mp3', 1.0, false, true);
    expect(FlxG.sounds.members.includes(sfx)).toBe(true);

    sfx.autoDestroy = true;
    sfx.update(); // handles autoDestroy tick when handle not playing

    FlxG.pauseSounds();
    FlxG.resumeSounds();

    FlxG.pauseSounds();
    FlxG.resumeSounds();

    // Switch state should clear non-survive sounds but keep music
    class NextState extends FlxState {}
    game.requestState(new NextState());
    game.step(1 / 60);

    expect(FlxG.music).not.toBeNull();
    expect(FlxG.sounds.members.includes(sfx)).toBe(false);

    // Test forceDestroy
    FlxG.context
      .getService<FlxAudioService>(FLX_AUDIO_SERVICE)
      ?.destroySounds(true);
    expect(FlxG.music).toBeNull();

    game.destroy();
  });

  it('returns auto-destroyed one-shot sounds to reusable group slots', () => {
    const context = new FlxContext(320, 240);
    const manager = new FlxAudioManager(context, new NullAudioBackend());

    for (let index = 0; index < 100; index += 1) {
      const sound = manager.play('one-shot', 1, false, true);
      sound.stop();
      manager.updateSounds(1 / 60);
      expect(manager.sounds.members.includes(sound)).toBe(false);
    }

    expect(manager.sounds.members.length).toBeLessThanOrEqual(1);
    manager.destroy();
  });

  it('routes sounds through hierarchical volume and mute groups', () => {
    const context = new FlxContext(320, 240);
    const manager = new FlxAudioManager(context, new NullAudioBackend());
    manager.volume = 0.8;
    manager.soundGroup.volume = 0.5;
    const dialogue = manager.soundGroup.createChild('dialogue');
    dialogue.volume = 0.25;

    const sound = manager.play('voice', 0.5, false, false, dialogue);
    expect(sound.group).toBe(dialogue);
    expect(dialogue.soundCount).toBe(1);
    expect(sound.getActualVolume()).toBeCloseTo(0.05);

    manager.soundGroup.mute = true;
    expect(sound.getActualVolume()).toBe(0);
    manager.soundGroup.mute = false;
    sound.group = manager.soundGroup;
    expect(dialogue.soundCount).toBe(0);
    expect(manager.soundGroup.soundCount).toBe(1);
    expect(sound.getActualVolume()).toBeCloseTo(0.2);

    sound.destroy();
    expect(manager.soundGroup.soundCount).toBe(0);
    manager.destroy();
  });

  it('uses independent default buses for effects and music', () => {
    const game = new FlxGame(
      320,
      240,
      TestState,
      1,
      60,
      30,
      false,
      {},
      new NullAudioBackend(),
    );
    const custom = new FlxSoundGroup('custom');

    const effect = FlxG.play('effect', 1, false, false);
    FlxG.playMusic('music', 1, custom);
    expect(effect.group).toBe(FlxG.soundGroup);
    expect(FlxG.music?.group).toBe(custom);

    game.destroy();
    custom.destroy();
  });

  it('follows an object with distance, stereo, and viewport-aware playback', () => {
    const backend = new RecordingAudioBackend();
    const game = new FlxGame(
      320,
      240,
      TestState,
      1,
      60,
      30,
      false,
      {},
      backend,
    );
    game.step(1 / 60);
    const source = new FlxObject(90, 90, 20, 20);
    const player = new FlxObject(190, 90, 20, 20);
    const sound = FlxG.play('waterfall', 1, true, false).attachTo(source, {
      listener: player,
      radius: 200,
      margin: 16,
    });
    const handle = backend.handles[0];
    expect(handle).toBeDefined();

    game.step(1 / 60);
    expect(sound.x).toBe(100);
    expect(sound.y).toBe(100);
    expect(handle?.volume).toBeCloseTo(0.25);
    expect(sound.effectiveVolume).toBeCloseTo(0.25);
    expect(handle?.pan).toBeCloseTo(-0.5);

    source.x = 340;
    game.step(1 / 60);
    expect(handle?.pauseCalls).toBe(1);
    expect(handle?.playing).toBe(false);
    expect(sound.effectiveVolume).toBe(0);

    // Once suspended, the margin becomes a hysteresis band: the source must
    // enter the real viewport before playback resumes.
    source.x = 325;
    game.step(1 / 60);
    expect(handle?.resumeCalls).toBe(0);
    source.x = 319;
    game.step(1 / 60);
    expect(handle?.resumeCalls).toBe(1);
    expect(handle?.playing).toBe(true);

    sound.detach();
    expect(handle?.pan).toBe(0);
    game.destroy();
    source.destroy();
    player.destroy();
  });

  it('validates spatial attachment configuration', () => {
    const sound = new FlxSound();
    const source = new FlxObject();
    const listener = new FlxObject();
    expect(() => sound.attachTo(source, { listener, radius: 0 })).toThrow(
      RangeError,
    );
    expect(() =>
      sound.attachTo(source, { listener, margin: -1, radius: 100 }),
    ).toThrow(RangeError);
    sound.destroy();
    source.destroy();
    listener.destroy();
  });
});
