// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { DebugChannel } from '../../src/debugger/debug-channel';
import { FlxLog } from '../../src/debugger/flx-log';
import { FlxWatch } from '../../src/debugger/flx-watch';
import { FlxPreloader } from '../../src/debugger/flx-preloader';
import { FlxLoadingError } from '../../src/loading/flx-loading';

// ─── DebugChannel ─────────────────────────────────────────────────────────────

describe('DebugChannel', () => {
  it('emits to registered listeners', () => {
    const ch = new DebugChannel();
    const handler = vi.fn();
    ch.on('step-complete', handler);
    ch.emit('step-complete', { frame: 1, updateMs: 2.5 });
    expect(handler).toHaveBeenCalledWith({ frame: 1, updateMs: 2.5 });
    ch.destroy();
  });

  it('does not emit to removed listeners', () => {
    const ch = new DebugChannel();
    const handler = vi.fn();
    ch.on('log', handler);
    ch.off('log', handler);
    ch.emit('log', { color: 0xffffff, message: 'hello', timestamp: 0 });
    expect(handler).not.toHaveBeenCalled();
    ch.destroy();
  });

  it('is a no-op when no listeners are registered', () => {
    const ch = new DebugChannel();
    expect(() => {
      ch.emit('step-complete', { frame: 42, updateMs: 1.0 });
    }).not.toThrow();
    ch.destroy();
  });

  it('clears all listeners on destroy', () => {
    const ch = new DebugChannel();
    const handler = vi.fn();
    ch.on('step-complete', handler);
    ch.destroy();
    ch.emit('step-complete', { frame: 1, updateMs: 0 });
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─── FlxLog ───────────────────────────────────────────────────────────────────

describe('FlxLog', () => {
  it('stores log entries', () => {
    const log = new FlxLog();
    log.add('hello', 0xff0000);
    expect(log.entries).toHaveLength(1);
    expect(log.entries[0]?.message).toBe('hello');
    expect(log.entries[0]?.color).toBe(0xff0000);
  });

  it('wraps at MAX_ENTRIES (ring buffer)', () => {
    const log = new FlxLog();
    for (let i = 0; i < FlxLog.MAX_ENTRIES + 10; i++) {
      log.add(`msg ${i}`);
    }
    expect(log.entries).toHaveLength(FlxLog.MAX_ENTRIES);
    // First entry should be msg 10 (oldest 10 dropped)
    expect(log.entries[0]?.message).toBe('msg 10');
  });

  it('clear() empties the buffer', () => {
    const log = new FlxLog();
    log.add('a');
    log.add('b');
    log.clear();
    expect(log.entries).toHaveLength(0);
  });

  it('error() and warn() add prefixed messages', () => {
    const log = new FlxLog();
    log.error('bad thing');
    log.warn('watch out');
    expect(log.entries[0]?.message).toMatch(/ERROR/);
    expect(log.entries[1]?.message).toMatch(/WARN/);
  });

  it('calls onChange callback when entries change', () => {
    const log = new FlxLog();
    const cb = vi.fn();
    log.setOnChange(cb);
    log.add('test');
    expect(cb).toHaveBeenCalledTimes(1);
    log.clear();
    expect(cb).toHaveBeenCalledTimes(2);
  });
});

// ─── FlxWatch ─────────────────────────────────────────────────────────────────

describe('FlxWatch', () => {
  it('snapshot() reads live field values', () => {
    const watch = new FlxWatch();
    const obj = { x: 42.5, y: 100.0 };
    watch.add(obj, 'x', 'player.x');
    watch.add(obj, 'y', 'player.y');

    const snap = watch.snapshot();
    expect(snap).toHaveLength(2);
    expect(snap[0]).toEqual({ name: 'player.x', value: '42.50' });
    expect(snap[1]).toEqual({ name: 'player.y', value: '100.00' });
  });

  it('reflects live changes', () => {
    const watch = new FlxWatch();
    const obj = { hp: 100 };
    watch.add(obj, 'hp');
    obj.hp = 55;
    expect(watch.snapshot()[0]?.value).toBe('55.00');
  });

  it('remove() stops watching a field', () => {
    const watch = new FlxWatch();
    const obj = { a: 1, b: 2 };
    watch.add(obj, 'a');
    watch.add(obj, 'b');
    watch.remove(obj, 'a');
    expect(watch.snapshot()).toHaveLength(1);
    expect(watch.snapshot()[0]?.name).toBe('b');
  });

  it('clear() removes all entries', () => {
    const watch = new FlxWatch();
    const obj = { x: 1 };
    watch.add(obj, 'x');
    watch.clear();
    expect(watch.snapshot()).toHaveLength(0);
  });

  it('handles inaccessible fields gracefully', () => {
    const watch = new FlxWatch();
    const obj = {} as Record<string, unknown>;
    watch.add(obj, 'nonexistent');
    expect(watch.snapshot()[0]?.value).toBe('undefined');
  });
});

// ─── FlxPreloader ─────────────────────────────────────────────────────────────

describe('FlxPreloader', () => {
  it('starts in loading state', () => {
    const container = document.createElement('div');
    const p = new FlxPreloader({ container, title: 'Test' });
    expect(p.state).toBe('loading');
    p.destroy();
  });

  it('transitions to ready state on complete()', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    const p = new FlxPreloader({ container });
    const completion = p.complete();
    expect(p.state).toBe('ready');
    await vi.runAllTimersAsync();
    await completion;
    expect(container.querySelector('[data-testid="flx-preloader"]')).toBeNull();
    vi.useRealTimers();
  });

  it('transitions to error state on showError()', () => {
    const container = document.createElement('div');
    const p = new FlxPreloader({ container });
    p.showError('Failed to load assets');
    expect(p.state).toBe('error');
    p.destroy();
  });

  it('setProgress clamps to 0–100', () => {
    const container = document.createElement('div');
    const p = new FlxPreloader({ container });
    expect(() => {
      p.setProgress(-50, 'test');
      p.setProgress(200, 'test');
    }).not.toThrow();
    p.destroy();
  });

  it('supports theme tokens, CSS hooks, slots, and host placement', () => {
    const container = document.createElement('div');
    const p = new FlxPreloader({
      className: 'branded-loader compact',
      container,
      footer: () => document.createElement('small'),
      header: () => document.createElement('strong'),
      placement: 'host',
      subtitle: 'Loading a tiny world',
      theme: {
        accent: '#ff00aa',
        background: '#010203',
        error: '#ff0000',
        mutedText: '#888888',
        text: '#ffffff',
      },
      title: 'Brand',
      transitionMs: 0,
    });

    const root = container.querySelector<HTMLElement>('.flx-preloader');
    expect(root?.classList.contains('branded-loader')).toBe(true);
    expect(root?.classList.contains('compact')).toBe(true);
    expect(root?.style.getPropertyValue('--flx-preloader-accent')).toBe(
      '#ff00aa',
    );
    expect(root?.querySelector('.flx-preloader__brand')).not.toBeNull();
    expect(root?.querySelector('.flx-preloader__footer')).not.toBeNull();
    expect(root?.textContent).toContain('Loading a tiny world');
    p.destroy();
  });

  it('does not mount when boot finishes before the show delay', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    const p = new FlxPreloader({ container, showDelayMs: 150 });
    expect(container.children).toHaveLength(0);
    await p.complete();
    await vi.runAllTimersAsync();
    expect(container.children).toHaveLength(0);
    vi.useRealTimers();
  });

  it('renders shared error snapshots and invokes retry', () => {
    const container = document.createElement('div');
    const retry = vi.fn();
    const p = new FlxPreloader({ container, transitionMs: 0 });
    p.update({
      error: new FlxLoadingError('assets', 'Could not load player atlas', true),
      message: 'Could not load player atlas',
      progress: null,
      retry,
      stage: 'assets',
      state: 'error',
    });

    expect(p.state).toBe('error');
    expect(container.textContent).toContain('Could not load player atlas');
    container
      .querySelector<HTMLButtonElement>('.flx-preloader__retry')
      ?.click();
    expect(retry).toHaveBeenCalledOnce();
    p.destroy();
  });

  it('mounts after a delay and honors minimum visibility', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    const p = new FlxPreloader({
      container,
      minimumVisibleMs: 200,
      showDelayMs: 100,
      transitionMs: 100,
    });

    await vi.advanceTimersByTimeAsync(99);
    expect(container.children).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(container.querySelector('.flx-preloader')).not.toBeNull();

    const completion = p.complete();
    await vi.runAllTimersAsync();
    await completion;
    expect(container.children).toHaveLength(0);
    vi.useRealTimers();
  });

  it('supports reduced-motion spinner and hidden-progress modes', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );
    const spinnerContainer = document.createElement('div');
    const spinner = new FlxPreloader({
      container: spinnerContainer,
      progress: 'spinner',
    });
    expect(
      spinnerContainer.querySelector<HTMLElement>('.flx-preloader__spinner')
        ?.style.animation,
    ).toBe('none');
    expect(
      spinnerContainer.querySelector<HTMLElement>('.flx-preloader__progress')
        ?.style.display,
    ).toBe('none');
    spinner.destroy();

    const hiddenContainer = document.createElement('div');
    const hidden = new FlxPreloader({
      container: hiddenContainer,
      progress: 'none',
    });
    expect(
      hiddenContainer.querySelector<HTMLElement>('.flx-preloader__progress')
        ?.style.display,
    ).toBe('none');
    hidden.destroy();
    vi.unstubAllGlobals();
  });

  it('renders indeterminate progress and removes itself on cancellation', () => {
    const container = document.createElement('div');
    const p = new FlxPreloader({ container });
    p.update({
      message: 'Starting renderer',
      progress: null,
      stage: 'renderer',
      state: 'loading',
    });
    expect(
      container
        .querySelector<HTMLProgressElement>('.flx-preloader__progress')
        ?.hasAttribute('value'),
    ).toBe(false);
    p.update({
      message: 'Halfway',
      progress: 0.5,
      stage: 'assets',
      state: 'loading',
    });
    expect(
      container.querySelector<HTMLProgressElement>('.flx-preloader__progress')
        ?.value,
    ).toBe(50);
    p.update({
      message: 'Cancelled',
      progress: 0.5,
      stage: 'assets',
      state: 'cancelled',
    });
    expect(p.state).toBe('cancelled');
    expect(container.children).toHaveLength(0);
  });

  it('retains the legacy retry registration and error flow', () => {
    const container = document.createElement('div');
    const retry = vi.fn();
    const p = new FlxPreloader({ container });
    p.onRetry(retry);
    const button = container.querySelector<HTMLButtonElement>(
      '.flx-preloader__retry',
    );
    expect(button?.style.display).toBe('none');
    p.showError('Legacy failure');
    expect(button?.style.display).toBe('block');
    button?.click();
    expect(retry).toHaveBeenCalledOnce();
    p.destroy();
  });

  it('supports a terminal legacy error without retry', () => {
    const container = document.createElement('div');
    const p = new FlxPreloader({ container });
    p.setProgress(25);
    p.showError('Terminal failure');
    const button = container.querySelector<HTMLButtonElement>(
      '.flx-preloader__retry',
    );
    expect(button?.style.display).toBe('none');
    expect(container.textContent).toContain('Terminal failure');
    p.destroy();
  });

  it('uses viewport placement by default when mounted to the document body', () => {
    const p = new FlxPreloader({ transitionMs: 0 });
    const root = document.body.querySelector<HTMLElement>('.flx-preloader');
    expect(root?.style.position).toBe('fixed');
    p.update({
      message: 'Ready from snapshot',
      progress: 1,
      stage: 'complete',
      state: 'ready',
    });
    expect(p.state).toBe('ready');
    p.destroy();
  });
});
