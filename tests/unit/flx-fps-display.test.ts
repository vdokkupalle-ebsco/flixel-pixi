// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { FlxFpsDisplay } from '../../src/debugger/flx-fps-display';

describe('FlxFpsDisplay', () => {
  it('mounts in the top-right and updates from rendered-frame intervals', () => {
    const container = document.createElement('div');
    container.style.position = 'static';
    const display = new FlxFpsDisplay({
      container,
      targetFramerate: 60,
      updateIntervalMs: 500,
    });

    const root = container.querySelector<HTMLElement>('.flx-fps-display');
    expect(root?.classList).toContain('flx-fps-display--top-right');
    expect(root?.textContent).toBe('— FPS');
    expect(container.style.position).toBe('relative');

    for (let frame = 0; frame < 30; frame += 1) {
      display.recordFrame(1000 / 60);
    }
    expect(root?.textContent).toBe('60 FPS');
    expect(root?.dataset.rating).toBe('good');
    expect(display.fps).toBeCloseTo(60);

    display.reset();
    expect(root?.textContent).toBe('— FPS');
    expect(root?.dataset.rating).toBeUndefined();
    expect(display.fps).toBe(0);

    display.destroy();
    expect(container.children).toHaveLength(0);
    expect(container.style.position).toBe('static');
  });

  it('supports position, classes, themes, and warning thresholds', () => {
    const container = document.createElement('div');
    const display = new FlxFpsDisplay({
      className: 'compact branded-fps',
      container,
      position: 'bottom-left',
      targetFramerate: 60,
      theme: {
        background: '#010203',
        critical: '#ff0000',
        good: '#00ff00',
        text: '#ffffff',
        warning: '#ffff00',
      },
      updateIntervalMs: 100,
    });
    const root = container.querySelector<HTMLElement>('.flx-fps-display');

    for (let frame = 0; frame < 4; frame += 1) display.recordFrame(25);
    expect(root?.dataset.rating).toBe('warning');
    expect(root?.classList).toContain('compact');
    expect(root?.classList).toContain('branded-fps');
    expect(root?.style.left).toBe('0.5rem');
    expect(root?.style.bottom).toBe('0.5rem');
    expect(root?.style.getPropertyValue('--flx-fps-background')).toBe(
      '#010203',
    );
    expect(root?.style.getPropertyValue('--flx-fps-text')).toBe('#ffffff');
    display.destroy();
  });

  it('ignores invalid samples and rejects invalid configuration', () => {
    const display = new FlxFpsDisplay({ updateIntervalMs: 100 });
    display.recordFrame(-1);
    display.recordFrame(Number.NaN);
    expect(display.fps).toBe(0);
    display.destroy();

    expect(() => new FlxFpsDisplay({ updateIntervalMs: 0 })).toThrow(
      RangeError,
    );
    expect(() => new FlxFpsDisplay({ targetFramerate: Infinity })).toThrow(
      'targetFramerate must be a positive finite number.',
    );
  });

  it('supports viewport placement without changing the container position', () => {
    const container = document.createElement('div');
    container.style.position = 'static';
    const display = new FlxFpsDisplay({
      container,
      placement: 'viewport',
      position: 'top-left',
    });
    const root = container.querySelector<HTMLElement>('.flx-fps-display');
    expect(root?.style.position).toBe('fixed');
    expect(container.style.position).toBe('static');
    display.destroy();
    display.destroy();
  });
});
