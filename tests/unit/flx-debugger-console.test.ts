// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FlxConsole } from '../../src/debugger/flx-console';
import { FlxDebugger } from '../../src/debugger/flx-debugger';

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
});
