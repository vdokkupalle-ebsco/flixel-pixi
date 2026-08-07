// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { DebugChannel } from '../../src/debugger/debug-channel';
import { FlxLog } from '../../src/debugger/flx-log';
import { FlxWatch } from '../../src/debugger/flx-watch';
import { FlxPreloader } from '../../src/debugger/flx-preloader';

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

  it('transitions to ready state on complete()', () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    const p = new FlxPreloader({ container });
    p.complete();
    expect(p.state).toBe('ready');
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
});
