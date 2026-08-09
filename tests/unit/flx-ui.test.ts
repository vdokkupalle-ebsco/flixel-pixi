// @vitest-environment happy-dom
import { Container, type Renderer } from 'pixi.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FlxAccessibilityOverlay } from '../../src/browser/flx-accessibility-overlay';
import {
  FlxBar,
  FlxBarRenderHandle,
  FlxButton,
  FlxCameraRenderer,
  FlxContext,
  FlxG,
  FlxInputManager,
} from '../../src';

function bounds(
  left: number,
  top: number,
  width: number,
  height: number,
): DOMRect {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    toJSON: () => ({}),
    top,
    width,
    x: left,
    y: top,
  };
}

afterEach(() => {
  FlxG.clearContext();
  document.body.replaceChildren();
});

describe('FlxBar', () => {
  it('binds values, clamps ranges, fires limits, and projects fills', () => {
    const stats = { health: 50 };
    const emptied = vi.fn();
    const filled = vi.fn();
    const bar = new FlxBar(
      10,
      20,
      FlxBar.LEFT_TO_RIGHT,
      120,
      12,
      stats,
      'health',
      0,
      100,
      true,
    )
      .createFilledBar(0x111827ff, 0x22c55eff, true, 0xffffffff)
      .setCallbacks(emptied, filled);
    bar.update();
    const handle = bar.createRenderHandle();

    expect(handle).toBeInstanceOf(FlxBarRenderHandle);
    expect(bar.percent).toBe(50);
    expect(handle.fill.width).toBeCloseTo(60);
    expect(handle.border.context).toBeDefined();

    stats.health = 0;
    bar.update();
    expect(emptied).toHaveBeenCalledOnce();
    expect(handle.fill.visible).toBe(false);
    stats.health = 200;
    bar.update();
    expect(filled).toHaveBeenCalledOnce();
    expect(bar.value).toBe(100);

    bar.direction = FlxBar.HORIZONTAL_OUTSIDE_IN;
    bar.value = 50;
    expect(handle.fill.width).toBeCloseTo(30);
    expect(handle.secondaryFill.width).toBeCloseTo(30);
    expect(handle.secondaryFill.x).toBeCloseTo(90);

    bar.destroy();
    expect(handle.destroyed).toBe(true);
  });

  it('supports providers and rejects invalid range/binding values', () => {
    let value = 3;
    const bar = new FlxBar(0, 0, FlxBar.BOTTOM_TO_TOP, 10, 30, null, '', 1, 5);
    bar.setValueProvider(() => value);
    bar.update();
    expect(bar.fraction).toBe(0.5);
    value = Number.NaN;
    expect(() => bar.update()).toThrow(/finite/);
    expect(() => bar.setRange(2, 2)).toThrow(/greater/);
    expect(() => bar.trackParent(null, 'health')).toThrow(/parent/);
    bar.trackParent({ health: 'full' }, 'health');
    expect(() => bar.update()).toThrow(/numeric/);
    bar.destroy();
  });
});

describe('browser UI accessibility bridge', () => {
  it('projects semantic buttons and queues focus/activation for fixed updates', () => {
    const context = new FlxContext(320, 160);
    FlxG.installContext(context);
    const renderer = new FlxCameraRenderer(
      {
        render: () => undefined,
        resolution: 1,
      } as unknown as Renderer,
      new Container(),
      context,
    );
    const activated = vi.fn();
    const button = new FlxButton(40, 30, null, activated);
    button.accessibleLabel = 'Continue';
    renderer.add(button);
    const host = document.createElement('div');
    const canvas = document.createElement('canvas');
    canvas.style.objectFit = 'contain';
    host.appendChild(canvas);
    document.body.appendChild(host);
    host.getBoundingClientRect = () => bounds(0, 0, 640, 480);
    canvas.getBoundingClientRect = () => bounds(0, 0, 640, 480);
    const input = new FlxInputManager(context, { pointerTarget: canvas });
    const overlay = new FlxAccessibilityOverlay(
      host,
      canvas,
      renderer,
      320,
      160,
    );
    const semanticButton = host.querySelector<HTMLButtonElement>(
      '[data-flx-accessible-button]',
    );

    expect(semanticButton?.getAttribute('aria-label')).toBe('Continue');
    expect(semanticButton?.style.left).toBe('80px');
    expect(semanticButton?.style.top).toBe('140px');
    expect(semanticButton?.style.width).toBe('160px');
    expect(semanticButton?.style.height).toBe('40px');

    canvas.dispatchEvent(
      new PointerEvent('pointermove', {
        clientX: 80,
        clientY: 140,
        pointerId: 1,
      }),
    );
    input.updateInput();
    expect(input.mouse.getGlobalPosition()).toMatchObject({ x: 40, y: 30 });

    semanticButton?.dispatchEvent(new Event('focus'));
    semanticButton?.click();
    input.updateInput();
    button.update();
    expect(button.focused).toBe(true);
    expect(button.status).toBe(FlxButton.HIGHLIGHT);
    expect(activated).toHaveBeenCalledOnce();

    button.enabled = false;
    overlay.sync();
    expect(semanticButton?.disabled).toBe(true);
    semanticButton?.click();
    input.updateInput();
    button.update();
    expect(activated).toHaveBeenCalledOnce();

    overlay.destroy();
    renderer.destroy();
    input.destroy();
    button.destroy();
  });
});
