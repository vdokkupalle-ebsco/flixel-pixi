import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  FLX_CAMERA_HOST_SERVICE,
  FlxCamera,
  FlxContext,
  FlxG,
  FlxObject,
  FlxPoint,
} from '../../src';

let context: FlxContext;

beforeEach(() => {
  context = new FlxContext(320, 180, 0.5);
  FlxG.installContext(context);
});

afterEach(() => {
  FlxG.clearContext(context);
});

describe('Phase 5 FlxCamera follow and bounds', () => {
  it('focuses on a target and configures every AS3 dead-zone preset', () => {
    const camera = new FlxCamera(0, 0, 160, 90);
    const target = new FlxObject(100, 50, 20, 10);

    camera.follow(target);
    camera.updateWithElapsed(0);
    expect(camera.scroll.x).toBeCloseTo(30.0000001);
    expect(camera.scroll.y).toBeCloseTo(10.0000001);
    expect(camera.deadzone).toBeNull();

    camera.follow(target, FlxCamera.STYLE_PLATFORMER);
    expect(camera.deadzone).toMatchObject({
      height: 30,
      width: 20,
      x: 70,
      y: 22.5,
    });

    camera.follow(target, FlxCamera.STYLE_TOPDOWN);
    expect(camera.deadzone).toMatchObject({
      height: 40,
      width: 40,
      x: 60,
      y: 25,
    });

    camera.follow(target, FlxCamera.STYLE_TOPDOWN_TIGHT);
    expect(camera.deadzone).toMatchObject({
      height: 20,
      width: 20,
      x: 70,
      y: 35,
    });
  });

  it('clamps scrolling to camera bounds and can update world bounds', () => {
    const camera = new FlxCamera(0, 0, 100, 80);
    const target = new FlxObject(500, 400, 20, 20);
    camera.follow(target);
    camera.setBounds(10, 20, 240, 180, true);
    expect(camera.scroll).toEqual(new FlxPoint(150, 120));
    expect(FlxG.worldBounds).toMatchObject({
      height: 180,
      width: 240,
      x: 10,
      y: 20,
    });

    camera.setBounds(5, 6, 20, 20);
    expect(camera.scroll).toEqual(new FlxPoint(5, 6));
  });

  it('copies structural follow state without sharing rectangles', () => {
    const source = new FlxCamera(0, 0, 100, 80);
    source.follow(new FlxObject(10, 20, 5, 5), FlxCamera.STYLE_TOPDOWN_TIGHT);
    source.setBounds(0, 0, 500, 400);
    const copy = new FlxCamera(10, 10, 50, 40).copyFrom(source);
    expect(copy.target).toBe(source.target);
    expect(copy.deadzone).toEqual(source.deadzone);
    expect(copy.deadzone).not.toBe(source.deadzone);
    expect(copy.bounds).toEqual(source.bounds);
    expect(copy.bounds).not.toBe(source.bounds);
  });
});

describe('Phase 5 FlxCamera effects and transforms', () => {
  it('advances flash, fade, and directional shake deterministically', () => {
    const camera = new FlxCamera(0, 0, 200, 100);
    let flashes = 0;
    let fades = 0;
    let shakes = 0;
    camera.flash(0xffffffff, 1, () => {
      flashes += 1;
    });
    camera.fade(0xff112233, 1, () => {
      fades += 1;
    });
    camera.shake(
      0.1,
      1,
      () => {
        shakes += 1;
      },
      true,
      FlxCamera.SHAKE_HORIZONTAL_ONLY,
    );

    camera.updateWithElapsed(0.25);
    expect(camera.flashAlpha).toBeCloseTo(0.75);
    expect(camera.fadeAlpha).toBeCloseTo(0.25);
    expect(camera.shakeOffset.x).not.toBe(0);
    expect(camera.shakeOffset.y).toBe(0);
    camera.updateWithElapsed(0.75);
    expect({ fades, flashes, shakes }).toEqual({
      fades: 1,
      flashes: 1,
      shakes: 1,
    });
    expect(camera.shakeOffset).toEqual(new FlxPoint());

    camera.updateWithElapsed(1);
    expect({ fades, flashes, shakes }).toEqual({
      fades: 1,
      flashes: 1,
      shakes: 1,
    });
  });

  it('honors force rules and cancels callbacks through stopFX', () => {
    const camera = new FlxCamera(0, 0, 100, 100);
    let callbacks = 0;
    camera.flash(0xffffffff, 2, () => {
      callbacks += 1;
    });
    camera.updateWithElapsed(0.5);
    camera.flash(0xff000000, 1, null, false);
    expect(camera.flashColor).toBe(0xffffffff);
    camera.flash(0xff000000, 1, null, true);
    expect(camera.flashColor).toBe(0xff000000);
    camera.fade(0xff000000, 1, () => {
      callbacks += 1;
    });
    camera.shake(0.05, 1, () => {
      callbacks += 1;
    });
    camera.stopFX();
    camera.updateWithElapsed(2);
    expect(callbacks).toBe(0);
    expect(camera.flashAlpha).toBe(0);
    expect(camera.fadeAlpha).toBe(0);
  });

  it('round-trips translated, zoomed, scaled, and rotated coordinates', () => {
    const camera = new FlxCamera(90, 35, 200, 120, 1.75);
    camera.scroll.make(30, -15);
    camera.setScale(1.25, 0.8);
    camera.angle = 27;
    const world = new FlxPoint(145, 62);
    const screen = camera.worldToScreen(world);
    const roundTrip = camera.screenToWorld(screen);
    expect(roundTrip.x).toBeCloseTo(world.x, 10);
    expect(roundTrip.y).toBeCloseTo(world.y, 10);
    expect(
      camera.containsScreenPoint(camera.worldToScreen(new FlxPoint(80, 40))),
    ).toBe(true);
    expect(camera.containsScreenPoint(new FlxPoint(-1_000, -1_000))).toBe(
      false,
    );
  });

  it('validates camera dimensions, zoom, scale, and elapsed time', () => {
    expect(() => new FlxCamera(0, 0, 0, 10)).toThrow(RangeError);
    const camera = new FlxCamera(0, 0, 10, 10);
    expect(() => {
      camera.zoom = -1;
    }).toThrow(RangeError);
    expect(() => camera.setScale(0)).toThrow(RangeError);
    expect(() => camera.updateWithElapsed(-1)).toThrow(RangeError);
    expect(() => camera.resize(0, 1)).toThrow(RangeError);
  });

  it('covers adapted display properties and remaining effect directions', () => {
    const previousDefaultZoom = FlxCamera.defaultZoom;
    FlxCamera.defaultZoom = 2;
    try {
      const camera = new FlxCamera(0, 0, 100, 80);
      expect(camera.zoom).toBe(2);
      camera.alpha = -1;
      expect(camera.alpha).toBe(0);
      camera.alpha = 3;
      expect(camera.alpha).toBe(1);
      camera.color = 0xff123456;
      expect(camera.color).toBe(0x123456);
      camera.setScale(1.5);
      expect(camera.getScale()).toEqual(new FlxPoint(1.5, 1.5));
      const scale = new FlxPoint();
      expect(camera.getScale(scale)).toBe(scale);

      camera.follow(new FlxObject(120, 90, 10, 10), FlxCamera.STYLE_TOPDOWN);
      camera.resize(120, 90);
      expect(camera.deadzone?.width).toBe(30);
      expect(() => camera.setBounds(0, 0, -1, 1)).toThrow(RangeError);
      expect(() => camera.setBounds(0, 0, 1, -1)).toThrow(RangeError);
      expect(() => camera.setBounds(Number.NaN, 0, 1, 1)).toThrow(RangeError);

      camera.flash(0xff112233, 2);
      camera.flash(0xff445566, 2, null, false);
      expect(camera.flashColor).toBe(0xff112233);
      camera.fade(0xff112233, 2);
      camera.fade(0xff445566, 2, null, false);
      expect(camera.fadeColor).toBe(0xff112233);

      camera.shake(0.05, 1, null, true, FlxCamera.SHAKE_VERTICAL_ONLY);
      camera.updateWithElapsed(0.1);
      expect(camera.shakeOffset.x).toBe(0);
      expect(camera.shakeOffset.y).not.toBe(0);
      camera.shake(0.05, 1, null, true, FlxCamera.SHAKE_BOTH_AXES);
      camera.updateWithElapsed(0.1);
      expect(camera.shakeOffset.x).not.toBe(0);
      expect(camera.shakeOffset.y).not.toBe(0);
      const offset = camera.shakeOffset;
      camera.shake(0.2, 3, null, false);
      expect(camera.shakeOffset).toBe(offset);
      expect(() => camera.shake(-1)).toThrow(RangeError);
      expect(() => camera.shake(Number.NaN)).toThrow(RangeError);
      expect(() => camera.shake(0.1, Number.NaN)).toThrow(RangeError);

      const empty = new FlxCamera(0, 0, 20, 20);
      camera.copyFrom(empty);
      expect(camera.bounds).toBeNull();
      expect(camera.deadzone).toBeNull();
      camera.active = false;
      camera.update();
      camera.destroy();
      camera.update();
    } finally {
      FlxCamera.defaultZoom = previousDefaultZoom;
    }
  });
});

describe('Phase 5 FlxG camera facade', () => {
  it('adds, selects, removes, and resets cameras through the context', () => {
    const original = FlxG.camera;
    const secondary = FlxG.addCamera(new FlxCamera(160, 0, 160, 180));
    expect(FlxG.cameras).toEqual([original, secondary]);
    FlxG.camera = secondary;
    expect(FlxG.camera).toBe(secondary);
    FlxG.bgColor = 0xff123456;
    expect(original.bgColor).toBe(0xff123456);
    expect(secondary.bgColor).toBe(0xff123456);

    expect(FlxG.removeCamera(secondary, false)).toBe(true);
    expect(secondary.destroyed).toBe(false);
    expect(FlxG.camera).toBe(original);
    expect(FlxG.removeCamera(secondary)).toBe(false);

    const replacement = new FlxCamera(0, 0, 320, 180);
    expect(FlxG.resetCameras(replacement)).toBe(replacement);
    expect(FlxG.cameras).toEqual([replacement]);
    expect(original.destroyed).toBe(true);
  });

  it('broadcasts effects to every active camera', () => {
    const second = FlxG.addCamera(new FlxCamera(0, 0, 100, 100));
    FlxG.flash(0xffabcdef, 2);
    FlxG.fade(0xff010203, 2);
    FlxG.shake(0.01, 1);
    for (const camera of [FlxG.camera, second]) {
      expect(camera.flashColor).toBe(0xffabcdef);
      expect(camera.fadeColor).toBe(0xff010203);
    }
  });

  it('keeps a renderer host synchronized when the final camera is removed', () => {
    const added: FlxCamera[] = [];
    const removed: FlxCamera[] = [];
    context.setService(FLX_CAMERA_HOST_SERVICE, {
      addCamera(camera: FlxCamera): void {
        added.push(camera);
      },
      removeCamera(camera: FlxCamera): void {
        removed.push(camera);
      },
    });
    const original = context.camera;

    expect(context.removeCamera(original, false)).toBe(true);
    expect(removed).toEqual([original]);
    expect(context.cameras).toHaveLength(1);
    expect(context.camera).not.toBe(original);
    expect(added).toEqual([context.camera]);
  });
});
