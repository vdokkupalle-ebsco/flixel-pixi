import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  FlxBackdrop,
  FlxBackdropRenderHandle,
  FlxContext,
  FlxG,
  FlxGraphic,
  FlxPoint,
  makeGraphicPixels,
} from '../../src';

function backdropGraphic(): FlxGraphic {
  return FlxGraphic.fromPixels(
    makeGraphicPixels(4, 2, 0x4488ccff),
    'backdrop-test',
  );
}

describe('FlxBackdrop', () => {
  beforeEach(() => {
    FlxG.installContext(new FlxContext(320, 180, 0.5));
  });

  afterEach(() => {
    FlxG.clearContext();
  });

  it('projects one tiling sprite and advances deterministically', () => {
    const graphic = backdropGraphic();
    const backdrop = new FlxBackdrop(graphic, 5, 6, 20, 10);
    backdrop.tileScale.make(2, 2);
    backdrop.scrollVelocity.make(-10, 4);
    backdrop.repeatY = false;
    backdrop.antialiasing = true;
    const handle = backdrop.createRenderHandle();

    expect(handle).toBeInstanceOf(FlxBackdropRenderHandle);
    expect(handle.tiling.texture).toBe(graphic.texture);
    expect(handle.tiling.width).toBe(20);
    expect(handle.tiling.height).toBe(4);
    expect(handle.tiling.roundPixels).toBe(false);

    FlxG.elapsed = 0.5;
    backdrop.preUpdate();
    backdrop.update();
    handle.sync(undefined, 0.5);
    expect(backdrop.tilePosition).toMatchObject({ x: -5, y: 2 });
    expect(handle.tiling.tilePosition.x).toBe(-2.5);
    expect(handle.tiling.tilePosition.y).toBe(0);

    backdrop.repeatY = true;
    backdrop.tileAngle = 90;
    backdrop.resize(24, 12);
    handle.sync(undefined, 1);
    expect(handle.tiling.height).toBe(12);
    expect(handle.tiling.tilePosition.y).toBe(2);
    expect(handle.tiling.tileRotation).toBeCloseTo(Math.PI / 2);
    expect(backdrop.origin).toMatchObject({ x: 12, y: 6 });

    backdrop.destroy();
    expect(handle.destroyed).toBe(true);
    expect(graphic.destroyed).toBe(false);
    graphic.destroy();
  });

  it('supports logical-region culling and validates its dedicated loader', () => {
    const graphic = backdropGraphic();
    const backdrop = new FlxBackdrop();
    expect(() => backdrop.resize(0, 10)).toThrow('Backdrop width');
    expect(() => backdrop.loadGraphic(graphic)).toThrow('loadBackdropGraphic');

    backdrop.loadBackdropGraphic(graphic, 100, 40);
    const camera = { height: 60, scroll: new FlxPoint(), width: 80 };
    backdrop.x = 70;
    expect(backdrop.onScreen(camera)).toBe(true);
    backdrop.x = 80;
    expect(backdrop.onScreen(camera)).toBe(false);

    backdrop.scale.make(0.5, 0.5);
    backdrop.setOriginToCorner();
    backdrop.x = 70;
    expect(backdrop.onScreen(camera)).toBe(true);

    backdrop.destroy();
    graphic.destroy();
  });
});
