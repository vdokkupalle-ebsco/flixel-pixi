// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FlxObjectInspector } from '../../src/debugger/flx-object-inspector';

describe('FlxObjectInspector DOM attachment', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('maps Alt+pointer input into logical coordinates without intercepting normal input', () => {
    const renderer = {
      pickObject: vi.fn(() => null),
      selectedObject: null,
    };
    const inspector = new FlxObjectInspector(renderer as never, {
      logicalHeight: 100,
      logicalWidth: 200,
    });
    const canvas = document.createElement('div');
    canvas.style.objectFit = 'fill';
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      bottom: 250,
      height: 200,
      left: 20,
      right: 420,
      top: 50,
      width: 400,
      x: 20,
      y: 50,
      toJSON: () => ({}),
    });
    document.body.appendChild(canvas);
    inspector.attach(canvas);

    canvas.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 220,
        clientY: 150,
      }),
    );
    expect(renderer.pickObject).not.toHaveBeenCalled();

    const debugEvent = new PointerEvent('pointerdown', {
      altKey: true,
      bubbles: true,
      button: 0,
      cancelable: true,
      clientX: 220,
      clientY: 150,
    });
    canvas.dispatchEvent(debugEvent);
    expect(debugEvent.defaultPrevented).toBe(true);
    expect(renderer.pickObject).toHaveBeenCalledWith({ x: 100, y: 50 });

    inspector.destroy();
    expect(() => inspector.selectAt({ x: 0, y: 0 })).toThrow(
      'Object inspector is destroyed.',
    );
  });

  it('validates logical dimensions', () => {
    const renderer = { pickObject: vi.fn(), selectedObject: null };
    expect(
      () =>
        new FlxObjectInspector(renderer as never, {
          logicalHeight: 100,
          logicalWidth: 0,
        }),
    ).toThrow('logicalWidth');
    expect(
      () =>
        new FlxObjectInspector(renderer as never, {
          logicalHeight: Number.NaN,
          logicalWidth: 100,
        }),
    ).toThrow('logicalHeight');
  });

  it.each([
    ['control', { ctrlKey: true }],
    ['meta', { metaKey: true }],
    ['shift', { shiftKey: true }],
    [false, {}],
  ] as const)('supports the %s selection modifier', (modifier, eventInit) => {
    const renderer = { pickObject: vi.fn(() => null), selectedObject: null };
    const inspector = new FlxObjectInspector(renderer as never, {
      logicalHeight: 100,
      logicalWidth: 100,
      modifier,
    });
    const target = document.createElement('div');
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      bottom: 100,
      height: 100,
      left: 0,
      right: 100,
      top: 0,
      width: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    inspector.attach(target);
    target.dispatchEvent(
      new PointerEvent('pointerdown', {
        ...eventInit,
        button: 0,
        clientX: 25,
        clientY: 30,
      }),
    );
    expect(renderer.pickObject).toHaveBeenCalledWith({ x: 25, y: 30 });
    inspector.destroy();
  });

  it('tracks selection changes and safely manages repeated attachment lifecycle', () => {
    const object = { height: 4, width: 3, x: 1, y: 2 };
    const camera = {};
    const selection = { camera, object };
    const removeTracked = vi.fn();
    const watch = { trackObject: vi.fn(() => removeTracked) };
    const onSelectionChange = vi.fn();
    const renderer = {
      pickObject: vi.fn(() => selection),
      selectedObject: null,
    };
    const inspector = new FlxObjectInspector(renderer as never, {
      logicalHeight: 100,
      logicalWidth: 100,
      onSelectionChange,
      watch: watch as never,
    });
    const target = document.createElement('div');

    const detach = inspector.attach(target);
    const detachDuplicate = inspector.attach(target);
    expect(inspector.selectAt({ x: 1, y: 2 })).toBe(selection);
    expect(inspector.selectedObject).toBe(object);
    expect(renderer.selectedObject).toBe(object);
    expect(watch.trackObject).toHaveBeenCalledWith('selection', object, [
      'x',
      'y',
      'width',
      'height',
    ]);

    inspector.selectAt({ x: 3, y: 4 });
    expect(removeTracked).not.toHaveBeenCalled();
    inspector.clear();
    expect(removeTracked).toHaveBeenCalledOnce();
    expect(inspector.selection).toBeNull();
    expect(inspector.selectedObject).toBeNull();
    expect(onSelectionChange).toHaveBeenLastCalledWith(null);

    detachDuplicate();
    detach();
    inspector.detach(target);
    inspector.destroy();
    inspector.destroy();
  });

  it('ignores disabled and non-primary pointer selection', () => {
    const renderer = { pickObject: vi.fn(), selectedObject: null };
    const inspector = new FlxObjectInspector(renderer as never, {
      logicalHeight: 100,
      logicalWidth: 100,
      modifier: false,
    });
    const target = document.createElement('div');
    inspector.attach(target);

    inspector.enabled = false;
    target.dispatchEvent(new PointerEvent('pointerdown', { button: 0 }));
    inspector.enabled = true;
    target.dispatchEvent(new PointerEvent('pointerdown', { button: 1 }));
    expect(renderer.pickObject).not.toHaveBeenCalled();
  });
});
