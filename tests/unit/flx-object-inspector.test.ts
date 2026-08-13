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
});
