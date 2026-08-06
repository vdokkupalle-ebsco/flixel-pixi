import { describe, expect, it } from 'vitest';
import { FlxSound } from '../../src/audio/flx-sound';
import { FlxAudioManager } from '../../src/audio/flx-audio-manager';
import { NullAudioBackend } from '../../src/audio/null-audio-backend';
import { FlxContext } from '../../src/core/flx-context';
import { FlxG } from '../../src/core/flx-g';
import { FlxGame } from '../../src/core/flx-game';
import { FlxState } from '../../src/core/flx-state';
import { FlxObject } from '../../src/objects/flx-object';

class TestState extends FlxState {}

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

    sound.destroy();
    expect(sound.exists).toBe(false);
    manager.destroy();
  });

  it('handles volume fading in and out over update ticks', () => {
    const sound = new FlxSound();
    sound._createHandle = () => new NullAudioBackend().createSound('test.mp3', false);
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
    sound._createHandle = () => new NullAudioBackend().createSound('test.mp3', false);
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
    const game = new FlxGame(320, 240, TestState, 1, 60, 30, false, {}, new NullAudioBackend());

    FlxG.volume = 0.8;
    expect(FlxG.volume).toBe(0.8);

    FlxG.mute = true;
    expect(FlxG.mute).toBe(true);
    FlxG.mute = false;

    const musicTrack = FlxG.playMusic('bgm.mp3', 0.6);
    expect(FlxG.music).not.toBeNull();
    expect(FlxG.music?.survive).toBe(true);

    const sfx = FlxG.play('sfx.mp3', 1.0, false, true);
    expect(FlxG.sounds.members.includes(sfx)).toBe(true);

    FlxG.pauseSounds();
    FlxG.resumeSounds();

    game.step(1 / 60);

    // Switch state should clear non-survive sounds but keep music
    class NextState extends FlxState {}
    game.requestState(new NextState());
    game.step(1 / 60);

    expect(FlxG.music).not.toBeNull();
    expect(FlxG.sounds.members.includes(sfx)).toBe(false);

    game.destroy();
  });
});
