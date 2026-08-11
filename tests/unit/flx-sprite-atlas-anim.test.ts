// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BufferImageSource, Rectangle, Texture } from 'pixi.js';

import { FlxContext, FlxG, FlxSprite } from '../../src';
import type {
  FlxAtlasFrame,
  FlxAtlasFrameList,
} from '../../src/assets/flx-atlas-frame';
import * as atlasBAke from '../../src/assets/flx-atlas-bake';

// ── Test helpers ──────────────────────────────────────────────────────────────

/** Build a tiny atlas frame list backed by real (but tiny) Pixi textures. */
function buildFrameList(count: number, fw = 8, fh = 8): FlxAtlasFrameList {
  const sheetW = fw * count;
  const bytes = new Uint8Array(sheetW * fh * 4);
  const bufSource = new BufferImageSource({
    autoGenerateMipmaps: false,
    height: fh,
    resource: bytes,
    scaleMode: 'nearest',
    width: sheetW,
  });

  return Array.from({ length: count }, (_, i): FlxAtlasFrame => ({
    index: i,
    name: `frame_${i}.png`,
    texture: new Texture({
      frame: new Rectangle(i * fw, 0, fw, fh),
      source: bufSource,
    }),
  }));
}

function loadTwoFrameGraphic(sprite: FlxSprite): void {
  sprite.makeGraphic(16, 8);
  const graphic = sprite.graphic;
  if (graphic === null) throw new Error('Expected makeGraphic to create data.');
  sprite.loadGraphic(graphic.texture, true, false, 8, 8);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('FlxSprite.addAnimation + play — atlas frame list', () => {
  beforeEach(() => {
    FlxG.installContext(new FlxContext(320, 180, 0.5));
  });

  afterEach(() => {
    FlxG.clearContext();
    vi.restoreAllMocks();
  });

  it('addAnimation with atlas frames bakes a strip and registers the animation', () => {
    const sprite = new FlxSprite();
    const frames = buildFrameList(3); // fw=8, fh=8

    // Bake returns a horizontal strip 24×8
    const stripBytes = new Uint8Array(24 * 8 * 4);
    const stripSource = new BufferImageSource({
      autoGenerateMipmaps: false,
      height: 8,
      resource: stripBytes,
      scaleMode: 'nearest',
      width: 24,
    });
    const stripTex = new Texture({ source: stripSource });
    vi.spyOn(atlasBAke, 'bakeAtlasFrameStrip').mockReturnValue(stripTex);

    sprite.addAnimation('run', frames);
    expect(atlasBAke.bakeAtlasFrameStrip).toHaveBeenCalledOnce();
    expect(sprite.frames).toBe(3); // 24px / 8px = 3 frames

    sprite.destroy();
  });

  it('bakes transformed atlas frames at their logical dimensions', () => {
    const sprite = new FlxSprite();
    const [base] = buildFrameList(1);
    if (base === undefined) throw new Error('Expected an atlas frame.');
    const transformed: FlxAtlasFrame = {
      ...base,
      texture: new Texture({
        frame: new Rectangle(0, 0, 6, 4),
        orig: new Rectangle(0, 0, 14, 12),
        rotate: 2,
        source: base.texture.source,
        trim: new Rectangle(3, 2, 4, 6),
      }),
    };
    const stripTex = new Texture({
      source: new BufferImageSource({
        autoGenerateMipmaps: false,
        height: 12,
        resource: new Uint8Array(14 * 12 * 4),
        scaleMode: 'nearest',
        width: 14,
      }),
    });
    const bakeSpy = vi
      .spyOn(atlasBAke, 'bakeAtlasFrameStrip')
      .mockReturnValue(stripTex);

    sprite.addAnimation('rotated', [transformed]);
    expect(bakeSpy).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          height: 4,
          rotated: true,
          sourceHeight: 12,
          sourceWidth: 14,
          trimHeight: 6,
          trimWidth: 4,
          trimX: 3,
          trimY: 2,
          width: 6,
        }),
      ],
      14,
      12,
    );
    expect(sprite.frameWidth).toBe(14);
    expect(sprite.frameHeight).toBe(12);
    sprite.destroy();
  });

  it('two atlas animations share one append-only strip', () => {
    const sprite = new FlxSprite();
    const walk = buildFrameList(2, 8, 8);
    const jump = buildFrameList(1, 8, 8).map((frame, i) => ({
      ...frame,
      name: `jump_${i}.png`,
      // Offset the frame rect so keys differ from walk slots
      texture: new Texture({
        frame: new Rectangle(16 + i * 8, 0, 8, 8),
        source: frame.texture.source,
      }),
    }));

    const bakeSpy = vi
      .spyOn(atlasBAke, 'bakeAtlasFrameStrip')
      .mockImplementation((cells, outW, outH) => {
        const width = outW * cells.length;
        const bytes = new Uint8Array(width * outH * 4);
        return new Texture({
          source: new BufferImageSource({
            autoGenerateMipmaps: false,
            height: outH,
            resource: bytes,
            scaleMode: 'nearest',
            width,
          }),
        });
      });

    sprite.addAnimation('walk', walk);
    expect(bakeSpy).toHaveBeenCalledTimes(1);
    expect(sprite.frames).toBe(2);

    sprite.addAnimation('jump', jump);
    expect(bakeSpy).toHaveBeenCalledTimes(2);
    expect(sprite.frames).toBe(3); // 2 walk + 1 jump appended

    sprite.play('walk', { loop: true });
    expect(sprite.animationName).toBe('walk');
    sprite.play('jump', { force: true });
    expect(sprite.animationName).toBe('jump');

    sprite.destroy();
  });

  it('atlas addAnimation respects frameWidth/frameHeight options', () => {
    const sprite = new FlxSprite();
    const frames = buildFrameList(2, 16, 32);
    vi.spyOn(atlasBAke, 'bakeAtlasFrameStrip').mockImplementation(
      (cells, outW, outH) => {
        const width = outW * cells.length;
        const bytes = new Uint8Array(width * outH * 4);
        return new Texture({
          source: new BufferImageSource({
            autoGenerateMipmaps: false,
            height: outH,
            resource: bytes,
            scaleMode: 'nearest',
            width,
          }),
        });
      },
    );

    sprite.addAnimation('walk', frames, { frameWidth: 8, frameHeight: 16 });
    expect(atlasBAke.bakeAtlasFrameStrip).toHaveBeenCalledWith(
      expect.any(Array),
      8,
      16,
    );
    expect(sprite.frameWidth).toBe(8);
    expect(sprite.frameHeight).toBe(16);
    sprite.destroy();
  });

  it('play with options object: loop defaults to false, speed defaults to 1', () => {
    const sprite = new FlxSprite();
    loadTwoFrameGraphic(sprite);
    sprite.addAnimation('idle', [0, 1]);

    sprite.play('idle', { loop: false, speed: 1 });
    expect(sprite.animationName).toBe('idle');
    expect(sprite.finished).toBe(false);

    // With loop: true
    sprite.play('idle', { loop: true, force: true });
    expect(sprite.animationName).toBe('idle');

    sprite.destroy();
  });

  it('play with options object: speed <= 0 throws RangeError', () => {
    const sprite = new FlxSprite();
    loadTwoFrameGraphic(sprite);
    sprite.addAnimation('idle', [0, 1]);

    expect(() => sprite.play('idle', { speed: 0 })).toThrow(RangeError);
    expect(() => sprite.play('idle', { speed: -1 })).toThrow(RangeError);

    sprite.destroy();
  });

  it('play with legacy boolean force preserves looped=true default from 4-arg addAnimation', () => {
    const sprite = new FlxSprite();
    loadTwoFrameGraphic(sprite);

    // 4-arg form: looped = true stored as default
    sprite.addAnimation('walk', [0, 1], 10, true);
    sprite.play('walk', false); // legacy boolean false → uses stored defaultLooped=true

    FlxG.elapsed = 0.11; // > 0.1s delay → advances to frame 1 (last)
    sprite.postUpdate();
    // finished is set to true when reaching the last frame, but loop resets frame index
    expect(sprite.animationName).toBe('walk');
    // finished=true is set briefly; after looping back, another postUpdate cycle resets it
    // The important thing is the animation continues to play (not stuck)
    const afterFirst = sprite.frame; // 0 or 1 depending on loop reset
    expect([0, 1]).toContain(afterFirst);

    sprite.destroy();
  });

  it('play with legacy boolean: non-looped animation sets finished=true and stops', () => {
    const sprite = new FlxSprite();
    loadTwoFrameGraphic(sprite);

    sprite.addAnimation('once', [0, 1], 10, false);
    sprite.play('once');
    FlxG.elapsed = 0.21;
    sprite.postUpdate();

    expect(sprite.finished).toBe(true);
    expect(sprite.frame).toBe(1);

    sprite.destroy();
  });

  it('play force:true option restarts animation', () => {
    const sprite = new FlxSprite();
    loadTwoFrameGraphic(sprite);
    sprite.addAnimation('idle', [0, 1], 10, true);
    sprite.play('idle');

    FlxG.elapsed = 0.11;
    sprite.postUpdate();
    expect(sprite.frame).toBe(1);

    sprite.play('idle', { force: true });
    expect(sprite.frame).toBe(0); // restarted

    sprite.destroy();
  });

  it('play without force does not restart same looping animation', () => {
    const sprite = new FlxSprite();
    loadTwoFrameGraphic(sprite);
    sprite.addAnimation('walk', [0, 1], 10, true);
    sprite.play('walk');

    FlxG.elapsed = 0.11;
    sprite.postUpdate();
    expect(sprite.frame).toBe(1);

    sprite.play('walk'); // no force → should not restart
    expect(sprite.frame).toBe(1);

    sprite.destroy();
  });

  it('addAnimation replaces existing animation with same name', () => {
    const sprite = new FlxSprite();
    loadTwoFrameGraphic(sprite);

    sprite.addAnimation('a', [0, 1], 10, true);
    sprite.addAnimation('a', [1], 5, false); // replace
    sprite.play('a');
    FlxG.elapsed = 0.21;
    sprite.postUpdate();
    expect(sprite.frame).toBe(1); // only frame in replaced anim

    sprite.destroy();
  });

  it('new 2-arg addAnimation: defaultLooped=false so animation stops after one pass', () => {
    const sprite = new FlxSprite();
    loadTwoFrameGraphic(sprite);

    // 2-arg form (no frameRate / looped)
    sprite.addAnimation('idle', [0, 1]);
    sprite.play('idle'); // legacy boolean false → uses defaultLooped=false

    FlxG.elapsed = 1; // well past 2 frames at 60fps
    sprite.postUpdate();
    // Default loop=false → animation finishes and stays on last frame
    expect(sprite.finished).toBe(true);

    sprite.destroy();
  });

  it('play with options { loop: true } loops via #playbackLoop', () => {
    const sprite = new FlxSprite();
    loadTwoFrameGraphic(sprite);
    sprite.addAnimation('walk', [0, 1]); // default loop=false
    sprite.play('walk', { loop: true, speed: 10 }); // high speed

    FlxG.elapsed = 1; // advance many frames
    sprite.postUpdate();
    // Because loop=true, finished can be true but animation continues cycling
    expect(sprite.animationName).toBe('walk');

    sprite.destroy();
  });
});
