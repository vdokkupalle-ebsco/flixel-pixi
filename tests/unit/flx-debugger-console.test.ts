// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FlxConsole } from '../../src/debugger/flx-console';
import { DebugChannel } from '../../src/debugger/debug-channel';
import { FlxDebugger } from '../../src/debugger/flx-debugger';
import { FlxLog } from '../../src/debugger/flx-log';
import { FlxWatch } from '../../src/debugger/flx-watch';

describe('FlxDebugger console panel', () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.head.querySelector('#flxdbg-style')?.remove();
  });

  it('minimizes to a launcher and restores the debugger', () => {
    const debugger_ = new FlxDebugger();
    const minimize = document.querySelector<HTMLButtonElement>(
      '[data-testid="flxdbg-close"]',
    );
    const launcher = document.querySelector<HTMLButtonElement>(
      '[data-testid="flxdbg-launcher"]',
    );
    if (minimize === null || launcher === null) {
      throw new Error('Expected debugger visibility controls.');
    }

    minimize.focus();
    minimize.click();
    expect(debugger_.visible).toBe(false);
    expect(launcher.hidden).toBe(false);
    expect(document.activeElement).toBe(launcher);
    launcher.click();
    expect(debugger_.visible).toBe(true);
    expect(launcher.hidden).toBe(true);
    expect(document.activeElement).toBe(minimize);
    debugger_.destroy();
  });

  it('toggles with Backquote but ignores editable fields', () => {
    const debugger_ = new FlxDebugger();
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'Backquote', key: '`' }),
    );
    expect(debugger_.visible).toBe(false);

    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'Backquote', key: '`' }),
    );
    expect(debugger_.visible).toBe(true);

    const input = document.querySelector<HTMLInputElement>(
      '[data-testid="flxdbg-console-input"]',
    );
    if (input === null) throw new Error('Expected a debugger console input.');
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        code: 'Backquote',
        key: '`',
      }),
    );
    expect(debugger_.visible).toBe(true);
    debugger_.destroy();
  });

  it('supports an initially minimized debugger and optional recovery controls', () => {
    const debugger_ = new FlxDebugger({
      initiallyVisible: false,
      showLauncherWhenHidden: false,
      toggleKey: false,
    });
    expect(debugger_.visible).toBe(false);
    expect(
      document.querySelector('[data-testid="flxdbg-launcher"]'),
    ).toBeNull();
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'Backquote', key: '`' }),
    );
    expect(debugger_.visible).toBe(false);
    debugger_.show();
    expect(debugger_.visible).toBe(true);
    debugger_.destroy();
  });

  it('executes submitted commands and renders their normalized output', async () => {
    const commandConsole = new FlxConsole();
    const execute = vi.fn(() => ({ x: 12, y: 34 }));
    commandConsole.register({ execute, name: 'player.position' });
    const debugger_ = new FlxDebugger({
      console: commandConsole,
      container: document.body,
    });

    const tab = document.querySelector<HTMLButtonElement>(
      '[data-testid="flxdbg-tab-console"]',
    );
    const input = document.querySelector<HTMLInputElement>(
      '[data-testid="flxdbg-console-input"]',
    );
    const output = document.querySelector<HTMLElement>(
      '[data-testid="flxdbg-console-output"]',
    );
    if (tab === null || input === null || output === null) {
      throw new Error('Expected the debugger console controls to be mounted.');
    }

    tab.click();
    input.value = 'player.position';
    input.form?.dispatchEvent(new Event('submit', { cancelable: true }));
    await vi.waitFor(() => {
      expect(output.textContent).toContain('{"x":12,"y":34}');
    });
    expect(execute).toHaveBeenCalledOnce();
    debugger_.destroy();
  });

  it('supports keyboard history recall and unique completion', async () => {
    const commandConsole = new FlxConsole();
    commandConsole.register({ execute: () => 'ok', name: 'teleport' });
    const debugger_ = new FlxDebugger({ console: commandConsole });
    const input = document.querySelector<HTMLInputElement>(
      '[data-testid="flxdbg-console-input"]',
    );
    if (input === null) throw new Error('Expected a debugger console input.');

    input.value = 'teleport';
    input.form?.dispatchEvent(new Event('submit', { cancelable: true }));
    await vi.waitFor(() => expect(commandConsole.history).toHaveLength(1));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(input.value).toBe('teleport');
    input.value = 'tel';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(input.value).toBe('teleport ');
    debugger_.destroy();
  });

  it('preserves editable watch drafts and applies guarded mutations', () => {
    const channel = new DebugChannel();
    const log = new FlxLog();
    const watch = new FlxWatch();
    const state = { health: 75 };
    watch.track({
      editor: {
        parse: (input) => Number(input),
        set: (value) => {
          state.health = value;
        },
        validate: (value) =>
          value >= 0 && value <= 100 ? null : 'Health must be 0–100.',
      },
      name: 'player.health',
      read: () => state.health,
    });
    const debugger_ = new FlxDebugger();
    debugger_.subscribeToChannel(channel, log, watch);
    document
      .querySelector<HTMLButtonElement>('[data-testid="flxdbg-tab-watch"]')
      ?.click();
    channel.emit('step-complete', { frame: 1, updateMs: 1 });
    log.add('diagnostic message');

    const input =
      document.querySelector<HTMLInputElement>('[data-watch-input]');
    const status = document.querySelector<HTMLElement>('.flxdbg-watch-status');
    if (input === null || status === null) {
      throw new Error('Expected an editable watch row.');
    }
    input.focus();
    input.value = 'draft';
    channel.emit('step-complete', { frame: 2, updateMs: 1 });
    expect(input.value).toBe('draft');

    input.value = '45';
    input.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }),
    );
    expect(state.health).toBe(45);
    expect(status.textContent).toBe('Updated');

    watch.setMutationGuard(() => 'Replay is locked.');
    input.value = '20';
    input.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }),
    );
    expect(state.health).toBe(45);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(status.textContent).toBe('Replay is locked.');
    const exported = debugger_.captureDiagnostics();
    expect(exported.schemaVersion).toBe(1);
    expect(exported.logs.at(-1)?.message).toBe('diagnostic message');
    expect(exported.performance.samples).toHaveLength(2);
    expect(
      exported.watches.some((entry) => entry.name === 'player.health'),
    ).toBe(true);
    expect(JSON.parse(debugger_.exportDiagnostics(false))).toMatchObject({
      schemaVersion: 1,
    });
    debugger_.destroy();
    channel.destroy();
  });

  it('keeps update-history coordinates stable when a slow frame arrives', () => {
    const channel = new DebugChannel();
    const debugger_ = new FlxDebugger();
    debugger_.subscribeToChannel(channel, new FlxLog(), new FlxWatch());
    document
      .querySelector<HTMLButtonElement>('[data-testid="flxdbg-tab-perf"]')
      ?.click();
    channel.emit('step-complete', { frame: 1, updateMs: 4 });
    channel.emit('step-complete', { frame: 2, updateMs: 4 });
    const line = document.querySelector<SVGPolylineElement>(
      '.flxdbg-graph polyline',
    );
    if (line === null) throw new Error('Expected an update-history graph.');
    const firstBeforeSpike = line.getAttribute('points')?.split(' ')[0];

    channel.emit('step-complete', { frame: 3, updateMs: 40 });

    expect(line.getAttribute('points')?.split(' ')[0]).toBe(firstBeforeSpike);
    expect(line.getAttribute('points')?.split(' ').at(-1)).toBe('180.00,0.00');
    debugger_.destroy();
    channel.destroy();
  });
});
