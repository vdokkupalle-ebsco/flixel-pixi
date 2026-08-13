import { Container, type Renderer } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  FLX_CAMERA_HOST_SERVICE,
  FlxCamera,
  FlxCameraRenderer,
  FlxContext,
  FlxG,
  FlxObject,
  FlxObjectInspector,
  FlxSprite,
  FlxWatch,
} from '../../src';

interface RenderCall {
  clear?: boolean;
  container?: Container;
  target?: unknown;
}

function fakeRenderer(resolution = 2): {
  calls: RenderCall[];
  renderer: Renderer;
} {
  const calls: RenderCall[] = [];
  return {
    calls,
    renderer: {
      render(options: RenderCall): void {
        calls.push(options);
      },
      resolution,
    } as unknown as Renderer,
  };
}

let context: FlxContext;

beforeEach(() => {
  context = new FlxContext(100, 60, 0.5);
  FlxG.installContext(context);
});

afterEach(() => {
  FlxG.clearContext(context);
});

describe('Pixi camera render passes', () => {
  it('picks the topmost authoritative object and tracks its selection', () => {
    const outputStage = new Container();
    const fake = fakeRenderer(1);
    const cameraRenderer = new FlxCameraRenderer(
      fake.renderer,
      outputStage,
      context,
    );
    const camera = context.camera;
    camera.scroll.make(10, 5);
    camera.zoom = 1.5;
    camera.angle = 12;
    camera.setScale(1.2, 0.8);
    const lower = new FlxSprite(30, 20).makeGraphic(20, 20, 0xffffffff);
    const upper = new FlxSprite(35, 25).makeGraphic(20, 20, 0xffffffff);
    cameraRenderer.add(lower);
    cameraRenderer.add(upper);
    const watch = new FlxWatch();
    const inspector = new FlxObjectInspector(cameraRenderer, {
      logicalHeight: 60,
      logicalWidth: 100,
      watch,
    });
    const point = camera.worldToScreen({ x: 40, y: 30 });

    const selection = inspector.selectAt(point);
    expect(selection?.object).toBe(upper);
    expect(cameraRenderer.selectedObject).toBe(upper);
    expect(watch.snapshot().map((entry) => entry.name)).toEqual([
      'selection.x',
      'selection.y',
      'selection.width',
      'selection.height',
    ]);

    upper.visible = false;
    expect(inspector.selectAt(point)?.object).toBe(lower);
    inspector.clear();
    expect(cameraRenderer.selectedObject).toBeNull();
    expect(watch.snapshot()).toEqual([]);
    inspector.destroy();
    cameraRenderer.destroy();
    lower.destroy();
    upper.destroy();
    outputStage.destroy({ children: true });
  });

  it('interpolates render transforms without mutating authoritative state', () => {
    const outputStage = new Container();
    const fake = fakeRenderer(1);
    const cameraRenderer = new FlxCameraRenderer(
      fake.renderer,
      outputStage,
      context,
    );
    const camera = context.camera;
    camera.lastScroll.make(0, 0);
    camera.scroll.make(10, 6);
    const sprite = new FlxSprite(30, 40).makeGraphic(8, 8, 0xffffffff);
    sprite.last.make(10, 20);
    sprite.lastAngle = 350;
    sprite.angle = 10;
    const handle = cameraRenderer.add(sprite);

    cameraRenderer.render([camera], 0.5);

    expect(handle.view.position).toMatchObject({ x: 15, y: 27 });
    expect(handle.view.angle).toBeCloseTo(360);
    expect(sprite).toMatchObject({ angle: 10, x: 30, y: 40 });
    expect(camera.scroll).toMatchObject({ x: 10, y: 6 });

    cameraRenderer.render([camera], 1);
    expect(handle.view.position).toMatchObject({ x: 20, y: 34 });
    expect(() => cameraRenderer.render([camera], -0.1)).toThrow(
      /interpolationAlpha/,
    );

    cameraRenderer.destroy();
    sprite.destroy();
    outputStage.destroy({ children: true });
  });

  it('routes one logical world through ordered camera targets', () => {
    const primary = context.camera;
    primary.scroll.make(4.9, 5.9);
    primary.setScale(1.25, 0.75);
    primary.angle = 12;
    primary.alpha = 0.8;
    primary.color = 0xaabbcc;
    primary.bgColor = 0x00112233;
    primary.flash(0x00ffffff, 1);
    primary.fade(0xff000000, 1);
    const secondary = context.addCamera(new FlxCamera(110, 4, 80, 50));
    secondary.antialiasing = true;

    const outputStage = new Container();
    const fake = fakeRenderer();
    const cameraRenderer = new FlxCameraRenderer(
      fake.renderer,
      outputStage,
      context,
    );
    cameraRenderer.debugBounds = true;

    const shared = new FlxSprite(20, 15).makeGraphic(8, 8, 0x7bdff2ff);
    const primaryOnly = new FlxSprite(30, 20).makeGraphic(8, 8, 0xff70a6ff);
    primaryOnly.cameras = [primary];
    const noCollision = new FlxSprite(40, 20).makeGraphic(8, 8, 0xffffffff);
    noCollision.allowCollisions = FlxObject.NONE;
    const immovable = new FlxSprite(50, 20).makeGraphic(8, 8, 0xffffffff);
    immovable.immovable = true;
    const offscreen = new FlxSprite(1_000, 1_000);
    const hidden = new FlxSprite(10, 10);
    hidden.visible = false;
    const transparent = new FlxSprite(10, 10);
    transparent.alpha = 0;

    const sharedHandle = cameraRenderer.add(shared);
    expect(cameraRenderer.add(shared)).toBe(sharedHandle);
    cameraRenderer.add(primaryOnly);
    cameraRenderer.add(noCollision);
    cameraRenderer.add(immovable);
    cameraRenderer.add(offscreen);
    cameraRenderer.add(hidden);
    cameraRenderer.add(transparent);
    cameraRenderer.render();

    const primaryView = cameraRenderer.getCameraView(primary);
    const secondaryView = cameraRenderer.getCameraView(secondary);
    expect(primaryView).not.toBeNull();
    expect(secondaryView).not.toBeNull();
    if (primaryView === null || secondaryView === null) {
      throw new Error('Expected camera views.');
    }
    expect(fake.calls).toHaveLength(3);
    expect(fake.calls[0]?.target).toBe(primaryView.target);
    expect(fake.calls[1]?.target).toBe(secondaryView.target);
    expect(fake.calls[2]).toMatchObject({
      clear: true,
      container: outputStage,
    });
    expect(outputStage.children).toEqual([
      primaryView.container,
      secondaryView.container,
    ]);
    expect(primaryView.output.alpha).toBe(0.8);
    expect(primaryView.output.angle).toBeCloseTo(12);
    expect(primaryView.output.tint).toBe(0xaabbcc);
    expect(primaryView.output.position).toMatchObject({ x: 62.5, y: 22.5 });
    expect(primaryView.output.scale).toMatchObject({ x: 1.25, y: 0.75 });
    expect(secondaryView.output.texture.source.scaleMode).toBe('linear');
    expect(sharedHandle.view.position).toMatchObject({ x: 20, y: 15 });
    expect(primaryOnly.renderHandleCount).toBe(1);
    expect(cameraRenderer.cameraCount).toBe(2);
    expect(cameraRenderer.registeredObjectCount).toBe(7);
    expect(cameraRenderer.renderTargetBytes).toBe(
      (100 * 2 * 60 * 2 + 80 * 2 * 50 * 2) * 4,
    );

    cameraRenderer.resize(1.5);
    expect(primaryView.target.source.pixelWidth).toBe(150);
    expect(secondaryView.target.source.pixelHeight).toBe(75);
    expect(() => cameraRenderer.resize(0)).toThrow(RangeError);

    const secondaryTarget = secondaryView.target;
    expect(context.removeCamera(secondary, false)).toBe(true);
    expect(secondaryTarget.destroyed).toBe(true);
    expect(cameraRenderer.remove(shared, false)).toBe(true);
    expect(sharedHandle.destroyed).toBe(false);
    sharedHandle.destroy();
    expect(cameraRenderer.remove(shared)).toBe(false);
    expect(cameraRenderer.getCameraView(secondary)).toBeNull();

    cameraRenderer.destroy();
    cameraRenderer.destroy();
    expect(cameraRenderer.destroyed).toBe(true);
    expect(cameraRenderer.cameraCount).toBe(0);
    expect(cameraRenderer.registeredObjectCount).toBe(0);
    expect(context.getService(FLX_CAMERA_HOST_SERVICE)).toBeUndefined();
    expect(() => cameraRenderer.render()).toThrow(/destroyed/);
    expect(() => cameraRenderer.add(new FlxSprite())).toThrow(/destroyed/);

    for (const object of [
      shared,
      primaryOnly,
      noCollision,
      immovable,
      offscreen,
      hidden,
      transparent,
    ]) {
      object.destroy();
    }
    outputStage.destroy({ children: true });
  });

  it('handles hidden, late, missing, invalid, and conflicting cameras', () => {
    const outputStage = new Container();
    const fake = fakeRenderer(1);
    const cameraRenderer = new FlxCameraRenderer(
      fake.renderer,
      outputStage,
      context,
    );
    const primaryView = cameraRenderer.getCameraView(context.camera);
    expect(primaryView).not.toBeNull();
    context.camera.exists = false;
    cameraRenderer.render();
    expect(primaryView?.container.visible).toBe(false);
    expect(fake.calls).toHaveLength(1);

    const late = new FlxCamera(5, 6, 20, 10);
    cameraRenderer.render([late]);
    expect(cameraRenderer.getCameraView(late)).not.toBeNull();
    cameraRenderer.removeCamera(new FlxCamera(0, 0, 8, 8));
    cameraRenderer.removeCamera(context.camera);
    cameraRenderer.render([]);
    const lateView = cameraRenderer.getCameraView(late);
    lateView?.container.removeFromParent();
    cameraRenderer.render([]);

    const destroyed = new FlxCamera(0, 0, 8, 8);
    destroyed.destroy();
    expect(() => cameraRenderer.addCamera(destroyed)).toThrow(
      /destroyed camera/,
    );
    expect(() => context.addCamera(destroyed)).toThrow(/destroyed camera/);
    expect(
      () => new FlxCameraRenderer(fake.renderer, new Container(), context),
    ).toThrow(/already installed/);

    cameraRenderer.destroy();
    late.destroy();
    outputStage.destroy({ children: true });
  });
});
