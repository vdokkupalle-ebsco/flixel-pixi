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
  FlxInputText,
  FlxSprite,
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
    expect(() => bar.setParent({ health: 'full' }, 'health')).toThrow(
      /numeric/,
    );
    bar.destroy();
  });

  it('follows a parent position and can stop tracking', () => {
    const parent = {
      health: 40,
      scrollFactor: { x: 0, y: 0 },
      x: 100,
      y: 200,
    };
    const bar = new FlxBar(
      0,
      0,
      FlxBar.LEFT_TO_RIGHT,
      40,
      8,
      parent,
      'health',
    ).setParent(parent, 'health', true, 4, -12);
    bar.update();
    expect(bar.x).toBe(104);
    expect(bar.y).toBe(188);
    expect(bar.percent).toBe(40);
    parent.x = 120;
    parent.y = 180;
    bar.update();
    expect(bar.x).toBe(124);
    expect(bar.y).toBe(168);
    bar.stopTrackingParent(16, 24);
    parent.x = 200;
    bar.update();
    expect(bar.x).toBe(16);
    expect(bar.y).toBe(24);
    bar.destroy();
  });
});

describe('FlxButton', () => {
  it('defaults HUD scroll factor and exposes disabled status', () => {
    const button = new FlxButton();
    expect(button.scrollFactor.x).toBe(0);
    expect(button.scrollFactor.y).toBe(0);
    button.enabled = false;
    button.update();
    expect(button.status).toBe(FlxButton.DISABLED);
    button.destroy();
  });

  it('activates when a press swipes over the button before release', () => {
    const context = new FlxContext(320, 160);
    FlxG.installContext(context);
    const activated = vi.fn();
    const button = new FlxButton(40, 30, null, activated);
    const host = document.createElement('div');
    const canvas = document.createElement('canvas');
    canvas.style.objectFit = 'contain';
    host.appendChild(canvas);
    document.body.appendChild(host);
    host.getBoundingClientRect = () => bounds(0, 0, 640, 480);
    canvas.getBoundingClientRect = () => bounds(0, 0, 640, 480);
    const input = new FlxInputManager(context, { pointerTarget: canvas });

    canvas.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        clientX: 0,
        clientY: 0,
        pointerId: 1,
      }),
    );
    input.updateInput();
    button.update();
    expect(activated).not.toHaveBeenCalled();

    canvas.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        clientX: 100,
        clientY: 160,
        pointerId: 1,
      }),
    );
    input.updateInput();
    button.update();
    expect(button.status).toBe(FlxButton.PRESSED);

    canvas.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        clientX: 100,
        clientY: 160,
        pointerId: 1,
      }),
    );
    input.updateInput();
    button.update();
    expect(activated).toHaveBeenCalledOnce();

    input.destroy();
    button.destroy();
    host.remove();
  });

  it('supports semantic overrides, programmatic activation, and late labels', () => {
    const activated = vi.fn();
    const button = new FlxButton(4, 5, null, activated);
    expect(button.text).toBe('');
    expect(button.accessibleLabel).toBeNull();
    button.text = 'Play';
    expect(button.text).toBe('Play');
    expect(button.accessibleLabel).toBe('Play');
    button.text = 'Resume';
    button.accessibleLabel = 'Resume game';
    expect(button.accessibleLabel).toBe('Resume game');
    expect(button.activate()).toBe(true);
    expect(activated).toHaveBeenCalledOnce();
    button.enabled = false;
    expect(button.activate()).toBe(false);
    button.enabled = true;
    button.exists = false;
    expect(button.activate()).toBe(false);
    button.exists = true;
    button.visible = false;
    expect(button.activate()).toBe(false);
    button.destroy();
  });

  it('syncs toggle labels and destroys shared sounds once', () => {
    const context = new FlxContext(320, 160);
    FlxG.installContext(context);
    const input = new FlxInputManager(context);
    const button = new FlxButton(10, 20, 'Toggle');
    button.queueAccessibilityFocus(true);
    button.update();
    button.on = true;
    expect(button.frame).toBe(FlxButton.NORMAL);
    button.on = false;

    button.labelOffsets.length = 1;
    button.labelAlphas.length = 0;
    expect(() => button.update()).not.toThrow();
    const sharedSound = { destroy: vi.fn(), play: vi.fn() };
    button.setSounds(
      sharedSound as never,
      sharedSound as never,
      sharedSound as never,
      sharedSound as never,
    );
    button.destroy();
    expect(sharedSound.destroy).toHaveBeenCalledOnce();
    input.destroy();
  });
});

describe('FlxInputText', () => {
  it('normalizes authored values and retains multiline input', () => {
    const single = new FlxInputText(0, 0, 120, 'abc\ndef');
    expect(single.text).toBe('abc def');
    single.select(2, 99);
    single.maxLength = 4;
    expect(single.text).toBe('abc ');
    expect(single.selectionEnd).toBe(4);
    expect(() => {
      single.maxLength = -1;
    }).toThrow(/non-negative/);
    single.destroy();

    const multiline = new FlxInputText(0, 0, 120, 'ab\ncd', {
      height: 48,
      maxLength: 4,
      multiline: true,
    });
    expect(multiline.text).toBe('ab\nc');
    expect(multiline.height).toBe(48);
    multiline.destroy();

    expect(() => new FlxInputText(0, 0, 120, '', { height: 0 })).toThrow(
      /positive/,
    );
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

  it('publishes native text, selection, composition, and submit on fixed updates', () => {
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
    const changed = vi.fn();
    const submitted = vi.fn();
    const field = new FlxInputText(40, 30, 120, '', {
      accessibleLabel: 'Player name',
      maxLength: 6,
      placeholder: 'Name',
    });
    field.onTextChange = changed;
    field.onSubmit = submitted;
    renderer.add(field);
    const host = document.createElement('div');
    const canvas = document.createElement('canvas');
    canvas.style.objectFit = 'contain';
    host.appendChild(canvas);
    document.body.appendChild(host);
    host.getBoundingClientRect = () => bounds(0, 0, 640, 480);
    canvas.getBoundingClientRect = () => bounds(0, 0, 640, 480);
    const overlay = new FlxAccessibilityOverlay(
      host,
      canvas,
      renderer,
      320,
      160,
    );
    const keyboard = new FlxInputManager(context, { keyboardTarget: window });
    const native = host.querySelector<HTMLInputElement>(
      '[data-flx-input-text]',
    );

    expect(native?.getAttribute('aria-label')).toBe('Player name');
    expect(native?.style.left).toBe('80px');
    expect(native?.style.top).toBe('140px');
    expect(native?.style.width).toBe('240px');
    expect(native?.style.height).toBe('48px');
    expect(native?.placeholder).toBe('Name');

    field.focus();
    overlay.sync();
    expect(document.activeElement).toBe(native);
    expect(field.focused).toBe(false);
    field.update();
    expect(field.focused).toBe(true);

    field.blur();
    overlay.sync();
    expect(document.activeElement).not.toBe(native);
    field.update();
    expect(field.focused).toBe(false);

    native?.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        code: 'KeyA',
        key: 'a',
      }),
    );
    keyboard.updateInput();
    expect(keyboard.keys.A).toBe(false);

    native?.focus();
    if (native) {
      native.value = 'abcdefghi';
      native.setSelectionRange(6, 6);
      native.dispatchEvent(new Event('compositionstart'));
      native.dispatchEvent(new Event('input'));
    }
    expect(field.text).toBe('');
    expect(field.focused).toBe(false);
    expect(field.composing).toBe(false);
    field.update();
    expect(field.text).toBe('abcdef');
    expect(field.focused).toBe(true);
    expect(field.composing).toBe(true);
    expect(changed).toHaveBeenCalledWith('abcdef');

    native?.dispatchEvent(new Event('compositionend'));
    native?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', repeat: false }),
    );
    field.update();
    expect(field.composing).toBe(false);
    expect(submitted).toHaveBeenCalledWith('abcdef');

    field.text = 'xy';
    field.select(1, 2);
    overlay.sync();
    expect(native?.value).toBe('xy');
    expect(native?.selectionStart).toBe(1);
    expect(native?.selectionEnd).toBe(2);
    field.type = 'email';
    field.select(0, 1);
    expect(() => overlay.sync()).not.toThrow();

    overlay.destroy();
    expect(field.isCanvasTextVisible()).toBe(true);
    keyboard.destroy();
    renderer.destroy();
    field.destroy();
  });

  it('manages multiline controls, visibility, removal, and idempotent teardown', () => {
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
    const button = new FlxButton(8, 8, 'Options');
    const decorative = new FlxSprite();
    const field = new FlxInputText(16, 40, 140, 'line one', {
      height: 48,
      maxLength: 0,
      multiline: true,
    });
    field.enabled = false;
    field.editable = false;
    renderer.add(button);
    renderer.add(field);
    renderer.add(decorative);

    const host = document.createElement('div');
    host.style.position = 'absolute';
    const canvas = document.createElement('canvas');
    canvas.style.objectFit = 'contain';
    host.appendChild(canvas);
    document.body.appendChild(host);
    host.getBoundingClientRect = () => bounds(0, 0, 640, 480);
    canvas.getBoundingClientRect = () => bounds(0, 0, 640, 480);
    const overlay = new FlxAccessibilityOverlay(
      host,
      canvas,
      renderer,
      320,
      160,
    );
    const native = host.querySelector<HTMLTextAreaElement>('textarea');
    const semanticButton = host.querySelector<HTMLButtonElement>('button');
    expect(native).toBeInstanceOf(HTMLTextAreaElement);
    expect(native?.disabled).toBe(true);
    expect(native?.readOnly).toBe(true);
    expect(native?.hasAttribute('maxlength')).toBe(false);
    if (native !== null) {
      Object.defineProperty(native, 'selectionStart', {
        configurable: true,
        value: null,
      });
      Object.defineProperty(native, 'selectionEnd', {
        configurable: true,
        value: null,
      });
      native.dispatchEvent(new Event('input'));
    }
    const camera = context.cameras[0];
    if (camera === undefined) throw new Error('Expected the default camera.');
    button.cameras = [camera];
    overlay.sync();

    semanticButton?.dispatchEvent(new Event('blur'));
    native?.dispatchEvent(new Event('select'));
    native?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', repeat: true }),
    );
    native?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', repeat: false }),
    );
    field.update();

    native?.dispatchEvent(new Event('compositionstart'));
    field.text = 'authored while composing';
    overlay.sync();
    expect(native?.value).toBe('line one');
    native?.dispatchEvent(new Event('compositionend'));
    field.update();

    field.visible = false;
    button.alpha = 0;
    overlay.sync();
    expect(native?.hidden).toBe(true);
    expect(semanticButton?.hidden).toBe(true);

    renderer.remove(field, false);
    renderer.remove(button, false);
    renderer.remove(decorative, false);
    overlay.sync();
    expect(host.querySelector('textarea')).toBeNull();
    expect(host.querySelector('button')).toBeNull();
    expect(field.isCanvasTextVisible()).toBe(true);

    overlay.destroy();
    overlay.sync();
    overlay.destroy();
    expect(host.style.position).toBe('absolute');
    renderer.destroy();
    button.destroy();
    decorative.destroy();
    field.destroy();
  });
});
