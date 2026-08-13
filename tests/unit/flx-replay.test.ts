import { describe, expect, it } from 'vitest';
import {
  convertAS3ReplayToFlxReplay,
  convertFlxReplayToAS3Text,
  FlxG,
  FlxGame,
  FlxReplay,
  FlxState,
  FrameRecord,
  MouseRecord,
} from '../../src';

describe('FlxReplay and determinism', () => {
  it('creates and serializes MouseRecord and FrameRecord', () => {
    const mouse = new MouseRecord(100.4, 200.7, 1, -2);
    expect(mouse.x).toBe(100);
    expect(mouse.y).toBe(201);
    expect(mouse.button).toBe(1);
    expect(mouse.wheel).toBe(-2);

    const frame = new FrameRecord(
      1,
      [{ code: 65, value: 1 }],
      mouse,
      'hash123',
      [
        {
          axes: [0.25, -0.5],
          buttons: [{ state: 2, value: 0.8 }],
          id: 'Replay Pad',
          index: 1,
          mapping: 'standard',
          uid: 4,
        },
      ],
      [
        {
          age: 2,
          cancelled: false,
          isPrimary: true,
          pointerId: 9,
          pressure: 0.5,
          startX: 10,
          startY: 20,
          state: 1,
          x: 30,
          y: 40,
        },
      ],
    );
    const saved = frame.save();
    expect(saved.frame).toBe(1);
    expect(saved.keys).toEqual([{ code: 65, value: 1 }]);
    expect(saved.mouse).toEqual({ x: 100, y: 201, button: 1, wheel: -2 });
    expect(saved.checksum).toBe('hash123');
    expect(saved.gamepads?.[0]).toEqual({
      axes: [0.25, -0.5],
      buttons: [{ state: 2, value: 0.8 }],
      id: 'Replay Pad',
      index: 1,
      mapping: 'standard',
      uid: 4,
    });
    expect(saved.touches?.[0]).toEqual(
      expect.objectContaining({ pointerId: 9, state: 1, x: 30 }),
    );

    const loadedFrame = new FrameRecord();
    loadedFrame.load(saved);
    expect(loadedFrame.frame).toBe(1);
    expect(loadedFrame.mouse?.x).toBe(100);
    expect(loadedFrame.checksum).toBe('hash123');
    expect(loadedFrame.gamepads).toEqual(saved.gamepads);
    expect(loadedFrame.touches).toEqual(saved.touches);

    loadedFrame.destroy();
    expect(loadedFrame.keys).toEqual([]);
    expect(loadedFrame.mouse).toBeNull();
    expect(loadedFrame.gamepads).toEqual([]);
    expect(loadedFrame.touches).toEqual([]);
  });

  it('records, saves, loads, and rewinds FlxReplay', () => {
    const replay = new FlxReplay();
    replay.create(12345);
    expect(replay.seed).toBe(12345);
    expect(replay.frameCount).toBe(0);

    const m1 = new MouseRecord(10, 20, 0, 0);
    replay.recordFrame(0, [{ code: 32, value: 1 }], m1);
    replay.recordFrame(1, [], null);

    expect(replay.frameCount).toBe(2);

    const serialized = replay.save();
    expect(serialized).toContain('"seed": 12345');
    expect(serialized).toContain('"frameCount": 2');
    expect(serialized).toContain('"version": "1.2"');

    const reloaded = new FlxReplay();
    reloaded.load(serialized);
    expect(reloaded.seed).toBe(12345);
    expect(reloaded.frameCount).toBe(2);
    expect(reloaded.finished).toBe(false);

    const f0 = reloaded.playNextFrame();
    expect(f0?.frame).toBe(0);
    expect(f0?.mouse?.x).toBe(10);
    expect(reloaded.finished).toBe(false);

    const f1 = reloaded.playNextFrame();
    expect(f1?.frame).toBe(1);
    expect(reloaded.finished).toBe(true);

    const f2 = reloaded.playNextFrame();
    expect(f2).toBeNull();

    reloaded.rewind();
    expect(reloaded.frame).toBe(0);
    expect(reloaded.finished).toBe(false);
  });

  it('detects state divergence cleanly', () => {
    const replay = new FlxReplay();
    replay.create(42);
    replay.flagDivergence(15, 'expected_crc_abc', 'actual_crc_xyz');

    expect(replay.diverged).toBe(true);
    expect(replay.divergenceFrame).toBe(15);
    expect(replay.divergenceInfo).toContain('State diverged at frame 15');
  });

  it('converts legacy AS3 text replay bi-directionally', () => {
    const as3Text = `seed:999\n0 [] 50 60 1 0\n1 [] 55 65 0 0`;
    const replay = convertAS3ReplayToFlxReplay(as3Text);

    expect(replay.seed).toBe(999);
    expect(replay.frameCount).toBe(2);
    expect(replay.frames[0]?.mouse?.x).toBe(50);

    const exported = convertFlxReplayToAS3Text(replay);
    expect(exported).toContain('seed:999');
    expect(exported).toContain('0 [] 50 60 1 0');
  });

  it('integrates VCR controls and FlxG facade statics', () => {
    let stateCreates = 0;
    class MockState extends FlxState {
      override create(): void {
        super.create();
        stateCreates++;
      }
    }
    const game = new FlxGame(320, 240, MockState);
    game.step();
    expect(stateCreates).toBe(1);

    FlxG.vcr.replay = null;
    expect(FlxG.stopRecording()).toBe('');
    FlxG.reloadReplay();

    FlxG.recordReplay(true);
    expect(FlxG.vcr.recording).toBe(true);
    expect(FlxG.vcr.replaying).toBe(false);

    game.step();
    expect(stateCreates).toBe(2);
    game.step();

    const payload = FlxG.stopRecording();
    expect(FlxG.vcr.recording).toBe(false);
    expect(payload).toContain('"frameCount": 2');

    const replay = new FlxReplay();
    replay.load(payload);
    let completeCalled = false;

    FlxG.loadReplay(replay, new MockState(), ['Escape'], 0, () => {
      completeCalled = true;
    });

    expect(FlxG.vcr.replaying).toBe(true);
    game.step();
    game.step();

    expect(FlxG.vcr.replaying).toBe(false);
    expect(completeCalled).toBe(true);

    FlxG.loadReplay(replay);
    FlxG.reloadReplay(false);
    FlxG.stopReplay();
    FlxG.recordReplay(false);
    expect(FlxG.vcr.recording).toBe(true);

    game.destroy();
  });
});
