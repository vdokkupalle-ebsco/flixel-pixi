import { BufferImageSource, Rectangle, Texture } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  FlxContext,
  FlxFrame,
  FlxFramesCollection,
  FlxG,
  FlxGraphic,
  FlxSprite,
  makeGraphicPixels,
} from '../../src';
import type { FlxAtlasFrameList } from '../../src';

function texture(width = 2, height = 1): Texture {
  return new Texture({
    source: new BufferImageSource({
      autoGenerateMipmaps: false,
      height,
      resource: new Uint8Array(width * height * 4),
      scaleMode: 'nearest',
      width,
    }),
  });
}

describe('FlxFrame and FlxFramesCollection', () => {
  beforeEach(() => {
    FlxG.installContext(new FlxContext(320, 180));
  });

  afterEach(() => {
    FlxG.clearContext();
  });

  it('creates lazy grid frames and resolves names, prefixes, and indices', () => {
    const graphic = FlxGraphic.fromPixels(
      makeGraphicPixels(4, 1, 0xffffffff),
      'frame-grid',
    );
    const collection = FlxFramesCollection.fromGraphicGrid(graphic, 1, 1, {
      names: ['idle_0', 'idle_1', 'run_0.png', 'run_1.png'],
    });

    expect(graphic.cachedFrameCount).toBe(0);
    expect(collection.numFrames).toBe(4);
    expect(collection.getByPrefix('idle_').map((frame) => frame.index)).toEqual(
      [0, 1],
    );
    expect(collection.getByName('run_0').index).toBe(2);
    expect(
      collection
        .getByNames(['idle_1', 'run_1.png'])
        .map((frame) => frame.index),
    ).toEqual([1, 3]);
    expect(collection.getByIndices([3, 0]).map((frame) => frame.name)).toEqual([
      'run_1.png',
      'idle_0',
    ]);
    expect(collection.getFrame(2).texture.frame.x).toBe(2);
    expect(graphic.cachedFrameCount).toBe(1);
    expect(() => collection.getFrame(4)).toThrow(RangeError);
    expect(() => collection.getByName('missing')).toThrow('No frame');
    expect(() => collection.setNames(['one'])).toThrow(RangeError);

    collection.setNames(['0', '1', '2', '3']);
    expect(collection.getByName('2').index).toBe(2);
    collection.destroy();
    expect(collection.numFrames).toBe(0);
    graphic.destroy();
  });

  it('uses atlas texture views directly and honors per-frame durations', () => {
    const source = texture(4, 1);
    const atlasFrames: FlxAtlasFrameList = [
      {
        duration: 0.2,
        index: 0,
        name: 'walk_0',
        texture: new Texture({
          frame: new Rectangle(0, 0, 2, 1),
          source: source.source,
        }),
      },
      {
        duration: 0.05,
        index: 1,
        name: 'walk_1',
        texture: new Texture({
          frame: new Rectangle(2, 0, 2, 1),
          source: source.source,
        }),
      },
    ];
    const collection = FlxFramesCollection.fromAtlas(atlasFrames);
    const sprite = new FlxSprite().loadFrames(collection);
    expect(sprite.renderTexture).toBe(atlasFrames[0]?.texture);
    sprite.animation.addByPrefix('walk', 'walk_', 0, false);
    sprite.animation.play('walk');

    FlxG.elapsed = 0.1;
    sprite.postUpdate();
    expect(sprite.frame).toBe(0);
    FlxG.elapsed = 0.11;
    sprite.postUpdate();
    expect(sprite.frame).toBe(1);
    expect(sprite.renderTexture).toBe(atlasFrames[1]?.texture);
    FlxG.elapsed = 0.06;
    sprite.postUpdate();
    expect(sprite.animation.finished).toBe(true);

    sprite.destroy();
    collection.destroy();
    for (const frame of atlasFrames) frame.texture.destroy(false);
    source.destroy(true);
  });

  it('validates frame and grid metadata', () => {
    const source = texture();
    expect(() => new FlxFrame({ index: -1, texture: source })).toThrow(
      RangeError,
    );
    expect(
      () => new FlxFrame({ duration: -1, index: 0, texture: source }),
    ).toThrow(RangeError);
    const lazy = () => source;
    expect(
      () => new FlxFrame({ height: 0, index: 0, texture: lazy, width: 1 }),
    ).toThrow(RangeError);

    const graphic = new FlxGraphic(source);
    expect(() => FlxFramesCollection.fromGraphicGrid(graphic, 0, 1)).toThrow(
      RangeError,
    );
    expect(() => new FlxSprite().loadFrames(new FlxFramesCollection())).toThrow(
      RangeError,
    );
    const mismatched = new FlxFramesCollection([
      new FlxFrame({ index: 0, texture: source }),
      new FlxFrame({ height: 1, index: 1, texture: source, width: 1 }),
    ]);
    expect(() => new FlxSprite().loadFrames(mismatched)).toThrow(
      'uniform frame dimensions',
    );
    source.destroy(true);
  });

  it('supports direct frame defaults and both png name fallbacks', () => {
    const source = texture(3, 2);
    const plain = new FlxFrame({ index: 0, texture: source });
    const collection = new FlxFramesCollection([
      plain,
      new FlxFrame({ index: 1, name: 'hero.png', texture: source }),
      new FlxFrame({ index: 2, name: 'enemy', texture: source }),
    ]);

    expect(plain).toMatchObject({
      duration: 0,
      height: 2,
      name: null,
      width: 3,
    });
    expect(collection.getByName('hero')).toBe(collection.getFrame(1));
    expect(collection.getByName('enemy.png')).toBe(collection.getFrame(2));
    expect(collection.getByPrefix('')).toHaveLength(2);
    source.destroy(true);
  });
});
