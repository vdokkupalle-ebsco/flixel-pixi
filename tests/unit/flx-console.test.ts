import { describe, expect, it, vi } from 'vitest';

import { FlxConsole } from '../../src/debugger/flx-console';

describe('FlxConsole', () => {
  it('executes explicitly registered commands with parsed arguments', async () => {
    const console = new FlxConsole();
    const execute = vi.fn(({ args }) => args.join('|'));
    console.register({ aliases: ['say'], execute, name: 'echo' });

    await expect(console.execute('say "hello world" plain')).resolves.toEqual({
      command: 'echo',
      ok: true,
      output: 'hello world|plain',
    });
    expect(execute).toHaveBeenCalledWith({
      args: ['hello world', 'plain'],
      command: 'echo',
      input: 'say "hello world" plain',
    });
  });

  it('never evaluates unknown input and normalizes command failures', async () => {
    const console = new FlxConsole();
    await expect(console.execute('window.alert(1)')).resolves.toMatchObject({
      ok: false,
      output: 'Unknown command: window.alert(1)',
    });
    console.register({
      execute: () => {
        throw new Error('Mutation rejected');
      },
      name: 'set-health',
    });
    await expect(console.execute('set-health 10')).resolves.toEqual({
      command: 'set-health',
      ok: false,
      output: 'Mutation rejected',
    });
  });

  it('retains bounded, consecutively deduplicated history', async () => {
    const console = new FlxConsole({ maxHistory: 2 });
    await console.execute('missing one');
    await console.execute('missing one');
    await console.execute('missing two');
    await console.execute('missing three');
    expect(console.history).toEqual(['missing two', 'missing three']);
    console.clearHistory();
    expect(console.history).toEqual([]);
  });

  it('completes registered command names and aliases', () => {
    const console = new FlxConsole();
    console.register({
      aliases: ['tele'],
      execute: () => 'done',
      name: 'teleport',
    });
    console.register({ execute: () => 'done', name: 'time-scale' });
    expect(console.complete('te')).toEqual(['tele', 'teleport']);
    expect(console.complete('tele ')).toEqual([]);
  });

  it('rejects invalid or conflicting command names', () => {
    const console = new FlxConsole();
    console.register({
      aliases: ['r'],
      execute: () => 'done',
      name: 'reset',
    });
    expect(() =>
      console.register({ execute: () => 'done', name: 'R' }),
    ).toThrow('already registered');
    expect(() =>
      console.register({ execute: () => 'done', name: 'bad name' }),
    ).toThrow('Invalid console command name');
  });

  it('reports malformed quoted input without invoking a command', async () => {
    const console = new FlxConsole();
    const execute = vi.fn();
    console.register({ execute, name: 'echo' });
    await expect(console.execute('echo "unfinished')).resolves.toMatchObject({
      ok: false,
      output: 'Command contains an unterminated quote.',
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it('supports unregistering by alias and safe registration cleanup', () => {
    const console = new FlxConsole();
    const unregister = console.register({
      aliases: ['run'],
      execute: () => undefined,
      name: 'start',
    });

    expect(console.commands).toHaveLength(1);
    expect(console.unregister('RUN')).toBe(true);
    expect(console.unregister('start')).toBe(false);
    unregister();
    expect(console.commands).toEqual([]);

    const cleanup = console.register({
      execute: () => undefined,
      name: 'stop',
    });
    cleanup();
    cleanup();
    expect(console.commands).toEqual([]);
  });

  it('rejects duplicate aliases and collisions with existing aliases', () => {
    const console = new FlxConsole();
    expect(() =>
      console.register({
        aliases: ['go', 'GO'],
        execute: () => undefined,
        name: 'start',
      }),
    ).toThrow('duplicate name or alias');

    console.register({
      aliases: ['go'],
      execute: () => undefined,
      name: 'start',
    });
    expect(() =>
      console.register({ execute: () => undefined, name: 'go' }),
    ).toThrow('already registered');
  });

  it('handles empty input, disabled history, and invalid history limits', async () => {
    const console = new FlxConsole({ maxHistory: 0 });
    await expect(console.execute('   ')).resolves.toEqual({
      command: '',
      ok: false,
      output: 'Enter a command.',
    });
    await console.execute('missing');
    expect(console.history).toEqual([]);
    expect(() => new FlxConsole({ maxHistory: -1 })).toThrow('maxHistory');
  });

  it('tokenizes quotes, empty arguments, and escaped characters', async () => {
    const console = new FlxConsole();
    const execute = vi.fn(({ args }) => args);
    console.register({ execute, name: 'echo' });

    await expect(
      console.execute(`echo '' 'two words' escaped\\ value`),
    ).resolves.toMatchObject({
      ok: true,
      output: '["","two words","escaped value"]',
    });
    await expect(console.execute('echo trailing\\')).resolves.toMatchObject({
      ok: false,
      output: 'Command cannot end with an escape character.',
    });
  });

  it('formats all supported result values and non-Error failures', async () => {
    const console = new FlxConsole();
    console.register({ execute: () => undefined, name: 'empty' });
    console.register({ execute: () => 'ready', name: 'text' });
    console.register({ execute: () => 42, name: 'number' });
    console.register({ execute: () => Symbol('result'), name: 'symbol' });
    console.register({
      execute: () => {
        throw 'rejected';
      },
      name: 'reject',
    });

    await expect(console.execute('empty')).resolves.toMatchObject({
      output: '',
    });
    await expect(console.execute('text')).resolves.toMatchObject({
      output: 'ready',
    });
    await expect(console.execute('number')).resolves.toMatchObject({
      output: '42',
    });
    await expect(console.execute('symbol')).resolves.toMatchObject({
      output: 'Symbol(result)',
    });
    await expect(console.execute('reject')).resolves.toMatchObject({
      ok: false,
      output: 'rejected',
    });
  });
});
